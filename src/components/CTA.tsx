import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Check, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, useTransform, MotionValue } from "framer-motion";
import { useSectionAnimation } from "@/components/ImmersiveScroll";

interface PlanFeature {
  name: string;
  included: boolean;
}

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  period: string;
  features: PlanFeature[];
  highlighted: boolean;
  cta: string;
}

// Helper for staggered animations
const StaggeredItem = ({
  children,
  index,
  total,
  enterProgress
}: {
  children: React.ReactNode;
  index: number;
  total: number;
  enterProgress: MotionValue<number>;
}) => {
  // Calculate specific window for this item
  const step = 1 / total;
  const start = index * step;
  const end = start + step;

  // Mapped transforms
  const opacity = useTransform(enterProgress, [start, end], [0, 1]);
  const y = useTransform(enterProgress, [start, end], [50, 0]);
  const scale = useTransform(enterProgress, [start, end], [0.8, 1]);

  return (
    <motion.div style={{ opacity, y, scale }} className="h-full">
      {children}
    </motion.div>
  );
};

const CTA = () => {
  const navigate = useNavigate();
  const { enterProgress } = useSectionAnimation();

  // Define plans
  const basicPlan: Plan = {
    id: "basic",
    name: "Básico",
    description: "Perfeito para começar sua jornada",
    price: 15,
    period: "mês",
    highlighted: false,
    cta: "Começar Grátis",
    features: [
      { name: "Análise básica de nutrição", included: true },
      { name: "Até 5 planos de refeição/mês", included: true },
      { name: "Chat com IA limitado", included: true },
      { name: "Histórico de 30 dias", included: false },
      { name: "Planos personalizados avançados", included: false },
      { name: "Suporte prioritário", included: false }
    ]
  };

  const proPlan: Plan = {
    id: "pro",
    name: "Pro",
    description: "O mais popular entre nossos usuários",
    price: 25,
    period: "mês",
    highlighted: true,
    cta: "Comece Agora",
    features: [
      { name: "Análise completa de nutrição", included: true },
      { name: "Planos ilimitados de refeição", included: true },
      { name: "Chat com IA sem limites", included: true },
      { name: "Histórico completo", included: true },
      { name: "Planos personalizados avançados", included: true },
      { name: "Suporte por email", included: false }
    ]
  };

  const premiumPlan: Plan = {
    id: "premium",
    name: "Premium",
    description: "Para resultados máximos",
    price: 40,
    period: "mês",
    highlighted: false,
    cta: "Explorar",
    features: [
      { name: "Tudo do plano Pro", included: true },
      { name: "Análise genômica de nutrição", included: true },
      { name: "Consultoria 1-on-1 mensal", included: true },
      { name: "Acompanhamento personalizado", included: true },
      { name: "Integração com wearables", included: true },
      { name: "Suporte prioritário 24/7", included: true }
    ]
  };

  // Visual Order: Basic (Cheap), Pro (Middle), Premium (Expensive)
  const visualPlans = [basicPlan, proPlan, premiumPlan];

  // Specific animation indices for each plan ID
  // Premium (Expensive) -> 1st (0)
  // Basic (Cheap) -> 2nd (1)
  // Pro (Middle) -> 3rd (2)
  const animationIndices: Record<string, number> = {
    premium: 0,
    basic: 1,
    pro: 2
  };

  const handleSelectPlan = (planName: string) => {
    navigate("/register", { state: { plan: planName } });
  };

  // Header Animation (0.0 - 0.1)
  const headerOpacity = useTransform(enterProgress, [0, 0.1], [0, 1]);
  const headerY = useTransform(enterProgress, [0, 0.1], [30, 0]);

  // Card Entrance (0.2 - 0.8)
  // Compressed to finish before price reveal
  const useCardEntrance = (index: number, total: number) => {
    const range = 0.6; // 0.8 - 0.2
    const step = range / total;
    const start = 0.2 + (index * step);
    const end = start + step;

    return {
      opacity: useTransform(enterProgress, [start, end], [0, 1]),
      y: useTransform(enterProgress, [start, end], [50, 0]),
      scale: useTransform(enterProgress, [start, end], [0.8, 1]),
    };
  };

  // Price Reveal (0.85 - 0.95)
  // Happens AFTER all cards are in
  const priceOpacity = useTransform(enterProgress, [0.85, 0.95], [0, 1]);
  const priceBlur = useTransform(enterProgress, [0.85, 0.95], ["blur(10px)", "blur(0px)"]);
  const priceScale = useTransform(enterProgress, [0.85, 0.95], [1.5, 1]);

  return (
    <section className="min-h-screen py-12 sm:py-16 lg:py-20 px-4 bg-gradient-to-b from-background to-muted/30 flex flex-col justify-center">
      <div className="container max-w-6xl mx-auto">
        <motion.div
          style={{ opacity: headerOpacity, y: headerY }}
          className="text-center mb-10 sm:mb-12 lg:mb-16 space-y-3 sm:space-y-4"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold">
            <span className="text-gradient">Planos de Assinatura</span>
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
            Escolha o plano perfeito para sua jornada de saúde e bem-estar
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {visualPlans.map((plan) => {
            const animIndex = animationIndices[plan.id];
            const cardStyle = useCardEntrance(animIndex, 3);

            return (
              <motion.div
                key={plan.id}
                className="h-full"
                style={cardStyle}
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
                    <CardTitle className={plan.highlighted ? "text-primary-foreground" : ""}>{plan.name}</CardTitle>
                    <CardDescription className={plan.highlighted ? "text-primary-foreground/90" : ""}>
                      {plan.description}
                    </CardDescription>

                    {/* Price Section with Independent Animation */}
                    <div className="mt-4 pt-4 border-t border-current border-opacity-20 h-16 flex flex-col justify-center">
                      <motion.div
                        style={{
                          opacity: priceOpacity,
                          filter: priceBlur,
                          scale: priceScale,
                          originX: 0
                        }}
                      >
                        <span className={`text-4xl font-bold ${plan.highlighted ? "text-primary-foreground" : ""}`}>
                          R${plan.price}
                        </span>
                        <span className={`text-sm ${plan.highlighted ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                          /{plan.period}
                        </span>
                      </motion.div>
                    </div>
                  </CardHeader>

                  <CardContent className="flex-1 flex flex-col pt-6">
                    <ul className="space-y-3 mb-8 flex-1">
                      {plan.features.map((feature, fIdx) => (
                        <li key={fIdx} className="flex items-start gap-3">
                          {feature.included ? (
                            <Check className={`w-5 h-5 flex-shrink-0 mt-0.5 ${plan.highlighted ? "text-primary" : "text-green-500"
                              }`} />
                          ) : (
                            <div className="w-5 h-5 rounded-full border border-muted-foreground/30 flex-shrink-0 mt-0.5" />
                          )}
                          <span className={`text-sm ${feature.included
                              ? ""
                              : "text-muted-foreground line-through opacity-50"
                            }`}>
                            {feature.name}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      onClick={() => handleSelectPlan(plan.name)}
                      size="lg"
                      className={`w-full group ${plan.highlighted
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
            );
          })}
        </div>

        <div className="text-center mt-12 sm:mt-14 lg:mt-16">
          <p className="text-muted-foreground text-sm sm:text-base">
            ✨ Todos os planos incluem período de teste de 7 dias. Sem necessidade de cartão de crédito.
          </p>
        </div>
      </div>
    </section>
  );
};

export default CTA;
