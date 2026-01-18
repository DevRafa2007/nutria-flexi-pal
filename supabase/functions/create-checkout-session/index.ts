import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
    apiVersion: '2024-12-18.acacia',
    httpClient: Stripe.createFetchHttpClient(),
});

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // 1. Authenticate User with Supabase
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            throw new Error('Missing Authorization header');
        }

        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: authHeader } } }
        );

        const { data: { user }, error: userError } = await supabaseClient.auth.getUser();

        if (userError || !user) {
            throw new Error('Invalid Token');
        }

        // 2. Parse Request Body
        const { priceId, embedded } = await req.json();

        if (!priceId) {
            throw new Error('Price ID is required');
        }

        const appUrl = Deno.env.get('VITE_APP_URL') ?? 'http://localhost:3000';

        // 3. Create Stripe Checkout Session
        // Define params based on mode (Embedded vs Hosted)
        let sessionParams: any = {
            mode: 'subscription',
            payment_method_types: ['card'],
            client_reference_id: user.id,
            line_items: [{ price: priceId, quantity: 1 }],
            metadata: {
                user_id: user.id,
                created_from: embedded ? 'embedded_checkout' : 'hosted_checkout'
            }
        };

        if (embedded) {
            sessionParams = {
                ...sessionParams,
                ui_mode: 'embedded',
                return_url: `${appUrl}/return?session_id={CHECKOUT_SESSION_ID}`,
            };
        } else {
            sessionParams = {
                ...sessionParams,
                success_url: `${appUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${appUrl}/cancel`,
            };
        }

        const session = await stripe.checkout.sessions.create(sessionParams);

        // 4. Return Response
        // For embedded, we need clientSecret
        // For hosted, we need url/sessionId
        return new Response(
            JSON.stringify({
                sessionId: session.id,
                url: session.url,
                clientSecret: session.client_secret // Crucial for Embedded
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        );

    } catch (error) {
        console.error('Error creating checkout session:', error);
        return new Response(
            JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown Error' }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            }
        );
    }
});
