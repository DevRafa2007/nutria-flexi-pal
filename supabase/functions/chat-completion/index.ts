import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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
        const apiKey = Deno.env.get('GROQ_API_KEY')

        console.log('Model:', model);
        if (apiKey) {
            console.log('API Key length:', apiKey.length);
            console.log('API Key starts with:', apiKey.substring(0, 3) + '...');
            console.log('API Key ends with:', '...' + apiKey.substring(apiKey.length - 3));
        } else {
            console.log('API Key is EMPTY or UNDEFINED');
        }

        if (!apiKey) {
            console.error('GROQ_API_KEY is not set');
            return new Response(JSON.stringify({ error: 'Configuração do servidor: GROQ_API_KEY ausente' }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // 🛡️ ANTI-SPAM: Validate message size (prevent abuse)
        const MAX_MESSAGE_LENGTH = 2000;
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

        console.log('Calling Groq API...');
        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: model || 'llama-3.3-70b-versatile',
                messages,
                temperature: temperature ?? 0.5,
                max_tokens: max_tokens ?? 1024,
                top_p: top_p ?? 0.9,
            }),
        })

        console.log('Groq Response Status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Groq API Error Raw:', errorText);
            let error;
            try { error = JSON.parse(errorText); } catch { error = errorText; }

            return new Response(JSON.stringify({ error, source: 'groq' }), {
                status: response.status,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        const data = await response.json()
        console.log('Groq Success!');

        return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    } catch (error) {
        console.error('Internal Error:', error)
        return new Response(JSON.stringify({ error: error.message || 'Internal Server Error', source: 'edge-function' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
