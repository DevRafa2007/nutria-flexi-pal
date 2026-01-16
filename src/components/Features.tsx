import { Brain, Calculator, Salad, TrendingUp, Clock, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { motion, useTransform, MotionValue } from "framer-motion";
import { useSectionAnimation } from "@/components/ImmersiveScroll";

const features = [
  {
    icon: Brain,
    title: "IA Conversacional",
    description: "Converse naturalmente com uma IA que entende suas preferências e restrições alimentares."
  },
  {
    icon: Calculator,
    title: "Cálculo Automático",
    description: "Macros e calorias calculados automaticamente baseados no seu TDEE e objetivo."
  },
  {
    icon: Salad,
    title: "Alimentos Reais",
    description: "Planos baseados nos alimentos que você já come no dia a dia, nada de receitas complexas."
  },
  {
    icon: TrendingUp,
    title: "Ajustes Dinâmicos",
    description: "Adapta suas refeições conforme você progride e suas necessidades mudam."
  },
  {
    icon: Clock,
    title: "Disponível 24/7",
    description: "Tire dúvidas e ajuste seu plano a qualquer hora, de qualquer lugar."
  },
  {
    icon: Shield,
    title: "Base Científica",
    description: "Recomendações baseadas em evidências nutricionais e guidelines atualizadas."
  }
];

const Features = () => {
  const { enterProgress } = useSectionAnimation();

  // TIMELINE CONFIGURATION
  // 0.0 - 0.1: Header
  // 0.1 - 0.25: Steps
  // 0.25 - 0.8: Cards
  // 0.8 - 0.9: Hold
  // 0.9 - 1.0: Blur Bottom Cards

  const headerOpacity = useTransform(enterProgress, [0, 0.1], [0, 1]);
  const headerY = useTransform(enterProgress, [0, 0.1], [30, 0]);

  // Steps Animation (0.1 - 0.25)
  const useStepAnimation = (index: number) => {
    const start = 0.1 + (index * 0.05);
    const end = start + 0.05;
    return {
      opacity: useTransform(enterProgress, [start, end], [0, 1]),
      y: useTransform(enterProgress, [start, end], [20, 0]),
    };
  };

  // Cards Animation (0.25 - 0.8)
  const useCardAnimation = (index: number, total: number) => {
    // Stagger cards over the 0.25-0.8 range
    const range = 0.55;
    const step = range / total;
    const start = 0.25 + (index * step);
    const end = start + step; // rapid entrance

    // Blur Effect for bottom row (indices 3, 4, 5)
    // Removed blur at the end to ensure readability
    const isBottomRow = index >= 3;
    const blur = "blur(0px)";

    const scale = isBottomRow
      ? useTransform(enterProgress, [0.9, 1.0], [1, 0.95])
      : 1;

    return {
      opacity: useTransform(enterProgress, [start, end], [0, 1]),
      y: useTransform(enterProgress, [start, end], [50, 0]),
      filter: blur,
      scale: scale
    };
  };

  return (
    <section id="features" className="min-h-screen py-12 sm:py-16 lg:py-20 px-4 bg-background flex flex-col justify-center">
      <div className="container max-w-6xl mx-auto">
        <motion.div
          style={{ opacity: headerOpacity, y: headerY }}
          className="text-center mb-10 sm:mb-12 lg:mb-16 space-y-3 sm:space-y-4"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold">
            <span className="text-gradient">Como Funciona</span>
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
            Três passos simples para sua dieta personalizada com inteligência artificial
          </p>
        </motion.div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-6 sm:gap-8 mb-12 sm:mb-16 lg:mb-20">
          {[
            { num: "01", title: "Converse", desc: "Diga seus objetivos e preferências alimentares" },
            { num: "02", title: "IA Analisa", desc: "Entende sua rotina e calcula suas necessidades" },
            { num: "03", title: "Receba", desc: "Dieta flexível com macros ajustados para você" }
          ].map((step, idx) => {
            const styles = useStepAnimation(idx);

            return (
              <motion.div
                key={idx}
                style={styles}
                className="relative"
              >
                <div className="text-5xl sm:text-6xl font-bold text-primary/20 mb-3 sm:mb-4">{step.num}</div>
                <h3 className="text-xl sm:text-2xl font-semibold mb-2">{step.title}</h3>
                <p className="text-sm sm:text-base text-muted-foreground">{step.desc}</p>
                {idx < 2 && (
                  <div className="hidden md:block absolute top-8 -right-4 w-8 h-0.5 bg-primary/30" />
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Feature Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {features.map((feature, idx) => {
            const styles = useCardAnimation(idx, features.length);

            return (
              <motion.div
                key={idx}
                style={{
                  opacity: styles.opacity,
                  y: styles.y,
                  filter: styles.filter,
                  scale: styles.scale
                }}
              >
                <Card
                  className="group hover:shadow-soft transition-all duration-300 border-border/50 hover:border-primary/30 h-full"
                >
                  <CardContent className="p-5 sm:p-6 space-y-3 sm:space-y-4">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <feature.icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold">{feature.title}</h3>
                    <p className="text-sm sm:text-base text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Features;
