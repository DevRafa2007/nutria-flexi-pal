import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
    apiVersion: '2024-12-18.acacia',
    httpClient: Stripe.createFetchHttpClient(),
});

// Webhook Secret (Set this in Supabase Secrets!)
const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') as string;

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } });
    }

    try {
        const signature = req.headers.get('Stripe-Signature');
        if (!signature || !endpointSecret) {
            throw new Error('Missing Stripe signature or secret');
        }

        const body = await req.text();
        const event = await stripe.webhooks.constructEventAsync(body, signature, endpointSecret);

        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // Handle the event
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;
                const userId = session.client_reference_id;
                const subscriptionId = session.subscription as string;
                const customerId = session.customer as string;

                if (userId && subscriptionId) {
                    // Get subscription details to determine plan
                    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
                    const priceId = subscription.items.data[0].price.id;

                    // Map Price ID to Plan Enum
                    const plan = mapPriceToPlan(priceId);

                    // Update Profile
                    // We use upsert/update
                    await supabaseAdmin
                        .from('profiles')
                        .update({
                            stripe_customer_id: customerId,
                            stripe_subscription_id: subscriptionId,
                            subscription_plan: plan,
                            subscription_status: 'active',
                            current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
                        })
                        .eq('id', userId);

                    console.log(`Updated user ${userId} to plan ${plan}`);
                }
                break;
            }

            case 'customer.subscription.updated': {
                const subscription = event.data.object as Stripe.Subscription;
                const customerId = subscription.customer as string;

                const priceId = subscription.items.data[0].price.id;
                const plan = mapPriceToPlan(priceId);

                await supabaseAdmin
                    .from('profiles')
                    .update({
                        subscription_plan: plan,
                        subscription_status: subscription.status,
                        current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
                    })
                    .eq('stripe_customer_id', customerId);

                console.log(`Updated subscription for customer ${customerId}`);
                break;
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription;
                const customerId = subscription.customer as string;

                // Revert to FREE
                await supabaseAdmin
                    .from('profiles')
                    .update({
                        subscription_status: 'canceled',
                        subscription_plan: 'free',
                        current_period_end: null
                    })
                    .eq('stripe_customer_id', customerId);

                console.log(`Canceled subscription for customer ${customerId}`);
                break;
            }
        }

        return new Response(JSON.stringify({ received: true }), {
            headers: { 'Content-Type': 'application/json' },
            status: 200,
        });
    } catch (err) {
        console.error(`Webhook Error: ${err.message}`);
        return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }
});

function mapPriceToPlan(priceId: string): string {
    const envBasic = Deno.env.get('VITE_STRIPE_PRICE_BASIC');
    const envPro = Deno.env.get('VITE_STRIPE_PRICE_PRO');
    const envPremium = Deno.env.get('VITE_STRIPE_PRICE_PREMIUM');

    if (priceId === envBasic) return 'basic';
    if (priceId === envPro) return 'pro';
    if (priceId === envPremium) return 'premium';

    // Fallback or unknown
    return 'free';
}
