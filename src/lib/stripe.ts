import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export interface PricingPlan {
    id: 'basic' | 'pro' | 'premium';
    name: string;
    price: string;
    stripePriceId: string;
    features: string[];
    highlighted?: boolean;
}

export const pricingPlans: PricingPlan[] = [
    {
        id: 'basic',
        name: 'Básico',
        price: 'R$ 15,00',
        stripePriceId: import.meta.env.VITE_STRIPE_PRICE_BASIC || '',
        features: [
            'IA Conversacional',
            'Planos personalizados',
            'Até 10 refeições salvas',
            'Acompanhamento básico',
            'Suporte por email'
        ]
    },
    {
        id: 'pro',
        name: 'Pro',
        price: 'R$ 25,00',
        stripePriceId: import.meta.env.VITE_STRIPE_PRICE_PRO || '',
        features: [
            'Tudo do Básico',
            'Refeições ilimitadas',
            'Ajustes automáticos',
            'Análise de progresso',
            'Suporte prioritário',
            'Export de planos (PDF)'
        ],
        highlighted: true
    },
    {
        id: 'premium',
        name: 'Premium',
        price: 'R$ 40,00',
        stripePriceId: import.meta.env.VITE_STRIPE_PRICE_PREMIUM || '',
        features: [
            'Tudo do Pro',
            'Consulta com nutricionista',
            'Planos pré-montados',
            'Análise de exames',
            'Suporte 24/7',
            'Acesso antecipado a features'
        ]
    }
];
