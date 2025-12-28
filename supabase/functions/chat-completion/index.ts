import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// 🔄 Fallback configuration
const PRIMARY_KEY = Deno.env.get('GROQ_API_KEY');
const FALLBACK_KEY = Deno.env.get('GROQ_API_KEY2');
const PRIMARY_MODEL = 'llama-3.1-8b-instant'; // Modelo muito rápido e com limites maiores
const FALLBACK_MODEL = 'mixtral-8x7b-32768'; // Modelo alternativo robusto

Deno.serve(async (req) => {
    console.log(`--- Request Received: ${req.method} ---`);

    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        console.log('Handling OPTIONS request');
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const body = await req.json()
        const { messages, model, temperature, max_tokens, top_p } = body

        if (!PRIMARY_KEY) {
            console.error('GROQ_API_KEY is not set');
            return new Response(JSON.stringify({ error: 'Configuração do servidor: GROQ_API_KEY ausente' }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // 🛡️ Validate message size (max 15000 chars)
        const MAX_MESSAGE_LENGTH = 15000;
        const MAX_MESSAGES_COUNT = 10; // max messages in request

        if (!messages || !Array.isArray(messages)) {
            console.error('Invalid messages format');
            return new Response(JSON.stringify({ error: 'Formato de mensagens inválido' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // Check number of messages
        if (messages.length > MAX_MESSAGES_COUNT) {
            console.error(`Too many messages: ${messages.length}`);
            return new Response(JSON.stringify({
                error: `Limite excedido: máximo ${MAX_MESSAGES_COUNT} mensagens por requisição`
            }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // Check each message size
        for (const msg of messages) {
            if (msg.content && msg.content.length > MAX_MESSAGE_LENGTH) {
                console.error(`Message too long: ${msg.content.length} chars`);
                return new Response(JSON.stringify({
                    error: `Mensagem muito longa: máximo ${MAX_MESSAGE_LENGTH} caracteres`
                }), {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                })
            }
        }

        // 🔄 TRY PRIMARY KEY FIRST
        console.log('Attempting with PRIMARY key + model:', PRIMARY_MODEL);
        const primaryResponse = await callGroqAPI(
            messages,
            PRIMARY_KEY,
            model || PRIMARY_MODEL,
            temperature,
            max_tokens,
            top_p
        );

        // If primary succeeded, return
        if (primaryResponse.ok) {
            const data = await primaryResponse.json();
            console.log('✅ PRIMARY key success!');
            return new Response(JSON.stringify(data), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // If primary failed with 429 (rate limit), try fallback
        if (primaryResponse.status === 429 && FALLBACK_KEY) {
            console.warn('⚠️ PRIMARY key rate limited (429). Trying FALLBACK...');

            const fallbackResponse = await callGroqAPI(
                messages,
                FALLBACK_KEY,
                FALLBACK_MODEL, // Use cheaper model
                temperature,
                max_tokens,
                top_p
            );

            if (fallbackResponse.ok) {
                const data = await fallbackResponse.json();
                console.log('✅ FALLBACK key success with model:', FALLBACK_MODEL);

                // Add metadata to indicate fallback was used
                return new Response(JSON.stringify({
                    ...data,
                    _meta: { fallback: true, model: FALLBACK_MODEL }
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                })
            }

            // Both failed
            const fallbackError = await fallbackResponse.text();
            console.error('❌ FALLBACK also failed:', fallbackError);

            return new Response(JSON.stringify({
                error: 'Ambas as chaves de API esgotaram o limite. Tente novamente mais tarde.',
                source: 'groq-fallback'
            }), {
                status: 429,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // Primary failed for reason other than rate limit
        const errorText = await primaryResponse.text();
        console.error('PRIMARY API Error:', errorText);
        let error;
        try { error = JSON.parse(errorText); } catch { error = errorText; }

        return new Response(JSON.stringify({ error, source: 'groq' }), {
            status: primaryResponse.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error) {
        console.error('Internal Error:', error)
        return new Response(JSON.stringify({
            error: error.message || 'Internal Server Error',
            source: 'edge-function'
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})

// Helper function to call Groq API
async function callGroqAPI(
    messages: any[],
    apiKey: string,
    model: string,
    temperature?: number,
    max_tokens?: number,
    top_p?: number
): Promise<Response> {
    return await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model,
            messages,
            temperature: temperature ?? 0.5,
            max_tokens: max_tokens ?? 1024,
            top_p: top_p ?? 0.9,
        }),
    });
}
