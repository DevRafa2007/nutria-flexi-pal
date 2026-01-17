import { Brain, Calculator, Salad, TrendingUp, Clock, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { motion, useTransform, MotionValue } from "framer-motion";
import { useSectionAnimation } from "@/components/ImmersiveScroll";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const isMobile = useIsMobile();

  // TIMELINE CONFIGURATION (0 -> 1)
  // 0.00 - 0.15: Header
  // 0.15 - 0.35: Step 1
  // 0.35 - 0.55: Step 2
  // 0.55 - 0.75: Step 3
  // 0.75 - 1.00: Feature Cards

  // Header Animation
  // Header Animation
  const headerOpacity = useTransform(enterProgress, isMobile ? [0, 0.1] : [0, 0.1], isMobile ? [1, 1] : [0, 1]);
  const headerY = useTransform(enterProgress, [0, 0.1], [30, 0]);
  const headerScale = useTransform(enterProgress, [0.15, 0.2], [1, 0.9]);
  // Virtual Scroll Animation (Mobile)
  // Moves the entire content stack upwards as user "scrolls" the fixed section.
  const useVirtualScroll = () => {
    // Mobile: Translate Y upwards to reveal lower content
    // Estimate: We have ~1200px of content. Viewport is ~800px (with header).
    // We need to move up by ~400px-600px.
    // Let's use percentage: 0% -> -30%.
    const yInput = isMobile ? [0, 1] : [0, 1];
    const yOutput = isMobile ? ["0%", "-55%"] : ["0%", "0%"];

    return useTransform(enterProgress, yInput, yOutput);
  };

  const virtualY = useVirtualScroll();

  // Steps Animation
  const useStepAnimation = (index: number) => {
    // Mobile: Fade in as they approach/enter the virtual viewport
    // The content moves UP. Items lower down need to appear later.
    const mStart = 0.1 + (index * 0.15);

    // Desktop: Staggered entrance
    const dStart = 0.1 + (index * 0.05);

    // Opacity
    // Mobile: simple fade in and stay visible
    const opacityInput = isMobile ? [mStart, mStart + 0.1] : [dStart, dStart + 0.05];
    const opacityOutput = isMobile ? [0.7, 1] : [0, 1];

    // Y Position (Local)
    // Mobile: maybe small local float up?
    const yInput = isMobile ? [mStart, mStart + 0.1] : [dStart, dStart + 0.05];
    const yOutput = isMobile ? [20, 0] : [20, 0];

    // Display
    const displayTransform = (v: number) => "block"; // Always block in the list

    const opacity = useTransform(enterProgress, opacityInput, opacityOutput);
    const y = useTransform(enterProgress, yInput, yOutput);
    const display = useTransform(enterProgress, displayTransform);

    return { opacity, y, display };
  };

  // Cards Animation Hook
  const useCardContainerAnimation = () => {
    // Mobile: Appears last
    const mStart = 0.55;

    const opacity = useTransform(enterProgress, isMobile ? [mStart, mStart + 0.15] : [0, 1], isMobile ? [0, 1] : [1, 1]);
    const y = useTransform(enterProgress, isMobile ? [mStart, mStart + 0.15] : [0, 1], isMobile ? [30, 0] : [0, 0]);

    return { opacity, y };
  };

  const cardContainerAnimation = useCardContainerAnimation();

  return (
    <section id="features" className="min-h-screen py-0 sm:py-20 px-4 bg-background flex flex-col justify-center relative overflow-hidden">
      {/* VIRTUAL SCROLL CONTAINER WRAPPER */}
      <motion.div
        style={{ y: virtualY }}
        className="container max-w-6xl mx-auto h-full flex flex-col justify-center"
      >

        {/* HEADER */}
        <motion.div
          style={{
            opacity: headerOpacity,
            y: headerY,
            scale: isMobile ? headerScale : 1
          }}
          className="text-center mb-8 sm:mb-16 space-y-4 shrink-0 relative w-full pt-20 sm:pt-0"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold">
            <span className="text-gradient">Como Funciona</span>
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
            Três passos simples para sua dieta personalizada
          </p>
        </motion.div>

        {/* CONTENT STACK (Mobile: Vertical List | Desktop: Grid) */}
        <div className="flex flex-col gap-8 sm:gap-12">

          {/* STEPS CONTAINER */}
          <div className={`
              ${isMobile
              ? "flex flex-col gap-6" // Simple vertical stack
              : "grid md:grid-cols-3 gap-8"
            }
          `}>
            {[
              { num: "01", title: "Converse", desc: "Diga seus objetivos e preferências" },
              { num: "02", title: "IA Analisa", desc: "Entende sua rotina e necessidades" },
              { num: "03", title: "Receba", desc: "Dieta flexível ajustada para você" }
            ].map((step, idx) => {
              const styles = useStepAnimation(idx);

              return (
                <motion.div
                  key={idx}
                  style={{
                    opacity: styles.opacity,
                    y: styles.y,
                    // Remove desktop-specific display prop if it causes issues, but "block" is fine.
                  }}
                  className={`${isMobile ? "w-full p-6 bg-card/50 backdrop-blur-sm rounded-xl border border-border/50 text-center relative" : "relative"}`}
                >
                  <div className="text-6xl font-bold text-primary/20 mb-4">{step.num}</div>
                  <h3 className="text-2xl font-semibold mb-2">{step.title}</h3>
                  <p className="text-base text-muted-foreground">{step.desc}</p>
                  {!isMobile && idx < 2 && (
                    <div className="hidden md:block absolute top-8 -right-4 w-8 h-0.5 bg-primary/30" />
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* CARDS GRID */}
          <motion.div
            style={cardContainerAnimation}
            className={`
              ${isMobile
                ? "grid grid-cols-2 gap-4 pb-20" // Add padding bottom for scroll clearance
                : "grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6"
              }
            `}
          >
            {features.map((feature, idx) => {
              // Simplify card animation for mobile (group entrance)
              // On mobile, just enter immediately or small stagger
              const delay = isMobile ? idx * 0.1 : idx * 0.05;

              return (
                <motion.div
                  key={idx}
                  initial={isMobile ? { opacity: 0, y: 20 } : { opacity: 0, y: 20 }}
                  whileInView={isMobile ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay }}
                  className="h-full"
                >
                  <Card
                    className="group hover:shadow-soft transition-all duration-300 border-border/50 hover:border-primary/30 h-full bg-card/40"
                  >
                    <CardContent className="p-4 sm:p-6 space-y-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <feature.icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                      </div>
                      <h3 className="text-base sm:text-lg font-semibold">{feature.title}</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
};

export default Features;
