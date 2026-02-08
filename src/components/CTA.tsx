import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Check, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  period: string;
  features: { name: string; included: boolean }[];
  highlighted: boolean;
  cta: string;
}

const plans: Plan[] = [
  {
    id: "basic", name: "Básico", description: "Perfeito para começar sua jornada",
    price: 15, period: "mês", highlighted: false, cta: "Começar Grátis",
    features: [
      { name: "Análise básica de nutrição", included: true },
      { name: "Até 5 planos de refeição/mês", included: true },
      { name: "Chat com IA limitado", included: true },
      { name: "Histórico de 30 dias", included: false },
      { name: "Planos personalizados avançados", included: false },
      { name: "Suporte prioritário", included: false },
    ],
  },
  {
    id: "pro", name: "Pro", description: "O mais popular entre nossos usuários",
    price: 25, period: "mês", highlighted: true, cta: "Comece Agora",
    features: [
      { name: "Análise completa de nutrição", included: true },
      { name: "Planos ilimitados de refeição", included: true },
      { name: "Chat com IA sem limites", included: true },
      { name: "Histórico completo", included: true },
      { name: "Planos personalizados avançados", included: true },
      { name: "Suporte por email", included: false },
    ],
  },
  {
    id: "premium", name: "Premium", description: "Para resultados máximos",
    price: 40, period: "mês", highlighted: false, cta: "Explorar",
    features: [
      { name: "Tudo do plano Pro", included: true },
      { name: "Análise genômica de nutrição", included: true },
      { name: "Consultoria 1-on-1 mensal", included: true },
      { name: "Acompanhamento personalizado", included: true },
      { name: "Integração com wearables", included: true },
      { name: "Suporte prioritário 24/7", included: true },
    ],
  },
];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] as const },
});

const CTA = () => {
  const navigate = useNavigate();

  const handleSelectPlan = async (planName: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    navigate(session ? "/pricing" : "/register?redirectTo=/pricing");
  };

  return (
    <section className="py-16 sm:py-24 px-4 bg-gradient-to-b from-background to-muted/30">
      <div className="container max-w-6xl mx-auto space-y-10 sm:space-y-16">
        <motion.div {...fadeUp()} className="text-center space-y-4">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold">
            <span className="text-gradient">Planos de Assinatura</span>
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto">
            Escolha o plano perfeito para sua jornada de saúde e bem-estar
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {plans.map((plan, idx) => (
            <motion.div key={plan.id} {...fadeUp(idx * 0.1)} className="h-full">
              <Card
                className={`bg-card/80 backdrop-blur w-full relative h-full transition-all duration-300 hover:shadow-lg flex flex-col ${
                  plan.highlighted ? "border-primary shadow-glow md:scale-105 z-10" : "border-border/50"
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
                  <CardTitle className={plan.highlighted ? "text-primary-foreground" : ""}>{plan.name}</CardTitle>
                  <CardDescription className={plan.highlighted ? "text-primary-foreground/90" : ""}>
                    {plan.description}
                  </CardDescription>
                  <div className="mt-4 pt-4 border-t border-current/20">
                    <span className={`text-4xl font-bold ${plan.highlighted ? "text-primary-foreground" : ""}`}>
                      R${plan.price}
                    </span>
                    <span className={`text-sm ${plan.highlighted ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                      /{plan.period}
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col pt-6">
                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((feature, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-3">
                        {feature.included ? (
                          <Check className={`w-5 h-5 flex-shrink-0 mt-0.5 ${plan.highlighted ? "text-primary" : "text-primary"}`} />
                        ) : (
                          <div className="w-5 h-5 rounded-full border border-muted-foreground/30 flex-shrink-0 mt-0.5" />
                        )}
                        <span className={`text-sm ${feature.included ? "" : "text-muted-foreground line-through opacity-50"}`}>
                          {feature.name}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => handleSelectPlan(plan.name)}
                    size="lg"
                    className={`w-full group ${
                      plan.highlighted
                        ? "bg-primary hover:bg-primary-dark"
                        : "bg-muted hover:bg-muted-foreground/20 text-foreground"
                    }`}
                  >
                    {plan.cta}
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="text-center">
          <p className="text-muted-foreground text-sm sm:text-base">
            ✨ Todos os planos incluem período de teste de 7 dias. Sem necessidade de cartão de crédito.
          </p>
        </div>
      </div>
    </section>
  );
};

export default CTA;
