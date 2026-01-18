import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
    apiVersion: '2024-12-18.acacia',
    httpClient: Stripe.createFetchHttpClient(),
});

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Helper: Mapeia Nome do Produto Stripe para Enum do Banco
function mapProductToPlan(productName: string): string {
    const name = productName.toLowerCase();
    if (name.includes('premium')) return 'premium';
    if (name.includes('pro')) return 'pro';
    if (name.includes('basic') || name.includes('básico')) return 'basic';
    return 'free';
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) throw new Error('Missing Authorization header');

        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: authHeader } } }
        );

        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
        if (userError || !user) {
            console.error('[manage-subscription] Auth Error:', userError);
            throw new Error('Invalid Token: User not authenticated');
        }

        const { action, priceId } = await req.json();
        console.log(`[manage-subscription] Request - User: ${user.id}, Action: ${action}`);

        let result;

        // --- ACTION: LIST PLANS ---
        if (action === 'list_plans') {
            const prices = await stripe.prices.list({
                active: true,
                expand: ['data.product'],
                limit: 20,
            });

            const plans = prices.data
                .filter(p => (p.product as Stripe.Product).active)
                .map(p => {
                    const product = p.product as Stripe.Product;
                    return {
                        id: p.id,
                        name: product.name,
                        amount: p.unit_amount,
                        currency: p.currency,
                        interval: p.recurring?.interval,
                        metadata: product.metadata
                    };
                })
                .sort((a, b) => (a.amount || 0) - (b.amount || 0));

            return new Response(
                JSON.stringify({ success: true, data: plans }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            );
        }

        // --- FETCH PROFILE ---
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('stripe_customer_id, stripe_subscription_id, subscription_plan')
            .eq('id', user.id)
            .single();

        if (profileError) throw new Error(`DB Error: ${profileError.message}`);

        // Se pedir detalhes e não tiver sub, retorna vazio em vez de erro (para UI clean)
        if (action === 'get_details' && !profile?.stripe_subscription_id) {
            return new Response(
                JSON.stringify({ success: true, data: null }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            );
        }

        if (!profile?.stripe_subscription_id) throw new Error(`Nenhuma assinatura ativa encontrada.`);

        const subscriptionId = profile.stripe_subscription_id;

        // --- NEW ACTION: GET DETAILS (Card & Invoice) ---
        if (action === 'get_details') {
            // 1. Get Subscription with Payment Method
            const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
                expand: ['default_payment_method']
            });

            let paymentMethod = subscription.default_payment_method as Stripe.PaymentMethod;

            // Se não tiver na sub, pega do customer
            if (!paymentMethod) {
                const customer = await stripe.customers.retrieve(subscription.customer as string, {
                    expand: ['invoice_settings.default_payment_method']
                });
                if ((customer as Stripe.Customer).invoice_settings?.default_payment_method) {
                    paymentMethod = (customer as Stripe.Customer).invoice_settings.default_payment_method as Stripe.PaymentMethod;
                }
            }

            // 2. Get Upcoming Invoice
            let upcomingInvoice = null;
            try {
                upcomingInvoice = await stripe.invoices.retrieveUpcoming({
                    customer: subscription.customer as string,
                    subscription: subscriptionId,
                });
            } catch (e) {
                // Pode falhar se for cancelar ou outro estado
                console.log('No upcoming invoice found or error.');
            }

            const details = {
                plan_name: profile.subscription_plan,
                status: subscription.status,
                cancel_at_period_end: subscription.cancel_at_period_end,
                current_period_end: subscription.current_period_end,
                payment_method: paymentMethod ? {
                    brand: paymentMethod.card?.brand,
                    last4: paymentMethod.card?.last4,
                    exp_month: paymentMethod.card?.exp_month,
                    exp_year: paymentMethod.card?.exp_year,
                } : null,
                upcoming_invoice: upcomingInvoice ? {
                    amount_due: upcomingInvoice.amount_due,
                    currency: upcomingInvoice.currency,
                    next_payment_attempt: upcomingInvoice.next_payment_attempt,
                    period_end: upcomingInvoice.period_end,
                    lines: upcomingInvoice.lines.data.map((l: any) => ({
                        description: l.description,
                        amount: l.amount,
                        period: { start: l.period.start, end: l.period.end }
                    }))
                } : null
            };

            return new Response(
                JSON.stringify({ success: true, data: details }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            );
        }

        // --- EXECUTE MUTATION ACTIONS ---
        if (action === 'cancel') {
            result = await stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: true });
            await supabaseAdmin.from('profiles').update({
                subscription_status: 'canceled', // UI feedback immediato
            }).eq('id', user.id);

        } else if (action === 'resume') {
            result = await stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: false });
            await supabaseAdmin.from('profiles').update({
                subscription_status: result.status,
            }).eq('id', user.id);

        } else if (action === 'update_plan') {
            if (!priceId) throw new Error('Price ID is required');
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            const itemId = subscription.items.data[0]?.id;

            if (!itemId) throw new Error('Stripe Subscription Item not found.');

            result = await stripe.subscriptions.update(subscriptionId, {
                items: [{ id: itemId, price: priceId }],
                cancel_at_period_end: false,
                expand: ['items.data.price.product']
            });

            // Sync Database Imediato
            const product = result.items.data[0].price.product as Stripe.Product;
            const newPlanName = mapProductToPlan(product.name);

            // Tentar recalcular fatura futura? Não precisa, só salvar estado.
            await supabaseAdmin.from('profiles').update({
                subscription_plan: newPlanName,
                subscription_status: result.status,
                current_period_end: new Date(result.current_period_end * 1000).toISOString()
            }).eq('id', user.id);

            console.log(`[manage-subscription] Synced DB to plan: ${newPlanName}`);
        } else {
            throw new Error(`Invalid action: ${action}`);
        }

        return new Response(
            JSON.stringify({ success: true, data: result }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        );

    } catch (error) {
        console.error('[manage-subscription] Error:', error);
        return new Response(
            JSON.stringify({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown Error'
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            }
        );
    }
});
