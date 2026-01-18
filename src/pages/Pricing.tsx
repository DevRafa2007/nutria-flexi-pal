import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Check, ArrowLeft, Sparkles } from "lucide-react";
import { pricingPlans } from "@/lib/stripe";
import { toast } from "sonner";
import PageTransition from "@/components/PageTransition";
import CheckoutModal from "@/components/CheckoutModal";

export function PricingPage() {
    const navigate = useNavigate();
    const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
    const [checkoutData, setCheckoutData] = useState<{ clientSecret: string | null, isOpen: boolean }>({
        clientSecret: null,
        isOpen: false
    });

    // Scroll to top on mount
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const handleSubscribe = async (planId: string, stripePriceId: string) => {
        if (!stripePriceId) {
            toast.error("Price ID não configurado. Verifique o arquivo .env");
            return;
        }

        // Prevent subscribing to free plan via Stripe
        if (planId === 'free') {
            toast.info("O plano gratuito já está ativo.");
            return;
        }

        setLoadingPlan(planId);

        try {
            toast.info("Iniciando checkout seguro...");

            // Obter token de sessão atual do usuário
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                toast.error("Você precisa estar logado para assinar.");
                navigate('/auth');
                return;
            }

            // Call Supabase Edge Function to create checkout session
            const response = await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session.access_token}`, // USAR TOKEN DE USUÁRIO
                    },
                    // Request embedded mode
                    body: JSON.stringify({
                        priceId: stripePriceId,
                        embedded: true
                    }),
                }
            );

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Falha ao criar sessão de checkout');
            }

            const { clientSecret } = await response.json();

            if (clientSecret) {
                setCheckoutData({ clientSecret, isOpen: true });
            } else {
                throw new Error('Erro: Client Secret não recebido do servidor.');
            }

        } catch (error) {
            console.error('Erro:', error);
            toast.error(error instanceof Error ? error.message : "Erro ao processar pagamento");
        } finally {
            setLoadingPlan(null);
        }
    };

    return (
        <PageTransition>
            <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 relative z-50">
                {/* Header */}
                <div className="container mx-auto px-4 py-8">
                    <Button
                        variant="ghost"
                        onClick={() => navigate("/")}
                        className="mb-8"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Voltar
                    </Button>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-16 space-y-4"
                    >
                        <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-4">
                            <Sparkles className="w-4 h-4 text-primary" />
                            <span className="text-sm font-medium text-primary">Planos e Preços</span>
                        </div>

                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold">
                            <span className="text-gradient">Escolha Seu Plano</span>
                        </h1>

                        <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
                            Comece sua jornada de saúde hoje. Cancele quando quiser.
                        </p>
                    </motion.div>

                    {/* Pricing Cards */}
                    <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-7xl mx-auto">
                        {pricingPlans.map((plan, idx) => (
                            <motion.div
                                key={plan.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                            >
                                <Card
                                    className={`relative h-full transition-all duration-300 hover:shadow-lg flex flex-col ${plan.highlighted
                                        ? "border-primary shadow-glow md:scale-105 z-10"
                                        : "border-border/50"
                                        }`}
                                >
                                    {plan.highlighted && (
                                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                                            <span className="bg-primary text-primary-foreground text-xs font-semibold px-4 py-1 rounded-full">
                                                MAIS POPULAR
                                            </span>
                                        </div>
                                    )}

                                    <CardHeader className={plan.highlighted ? "bg-gradient-primary text-primary-foreground rounded-t-lg" : ""}>
                                        <CardTitle className={plan.highlighted ? "text-primary-foreground" : ""}>
                                            {plan.name}
                                        </CardTitle>
                                        <CardDescription className={plan.highlighted ? "text-primary-foreground/90" : ""}>
                                            <span className="mt-4 flex items-baseline gap-1">
                                                <span className="text-4xl font-bold">{plan.price}</span>
                                                <span className="text-sm">/mês</span>
                                            </span>
                                        </CardDescription>
                                    </CardHeader>

                                    <CardContent className="flex-1 flex flex-col pt-6">
                                        <ul className="space-y-3 mb-6 flex-1">
                                            {plan.features.map((feature, i) => (
                                                <li key={i} className="flex items-start gap-3">
                                                    <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                                                    <span className="text-sm">{feature}</span>
                                                </li>
                                            ))}
                                        </ul>

                                        <Button
                                            className="w-full relative z-50"
                                            variant={plan.highlighted ? "default" : "outline"}
                                            onClick={() => handleSubscribe(plan.id, plan.stripePriceId)}
                                            disabled={loadingPlan === plan.id}
                                        >
                                            {loadingPlan === plan.id ? "Carregando..." : "Assinar Agora"}
                                        </Button>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>

                    {/* FAQ Section */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="mt-16 max-w-3xl mx-auto"
                    >
                        <h2 className="text-2xl font-bold text-center mb-8">Perguntas Frequentes</h2>
                        <div className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Posso cancelar a qualquer momento?</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">
                                        Sim! Você pode cancelar sua assinatura a qualquer momento sem taxas ou multas.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Quais formas de pagamento aceitam?</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">
                                        Aceitamos cartões de crédito, PIX e boleto bancário através do Stripe. (Agora com checkout no site!)
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Posso mudar de plano depois?</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">
                                        Sim! Você pode fazer upgrade ou downgrade do seu plano a qualquer momento.
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </motion.div>
                </div>

                <CheckoutModal
                    isOpen={checkoutData.isOpen}
                    onClose={() => setCheckoutData(prev => ({ ...prev, isOpen: false }))}
                    clientSecret={checkoutData.clientSecret}
                />
            </div>
        </PageTransition >
    );
}
