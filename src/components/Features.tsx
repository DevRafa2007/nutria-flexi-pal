import { Brain, Calculator, Salad, TrendingUp, Clock, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

const features = [
  { icon: Brain, title: "IA Conversacional", description: "Converse naturalmente com uma IA que entende suas preferências e restrições alimentares." },
  { icon: Calculator, title: "Cálculo Automático", description: "Macros e calorias calculados automaticamente baseados no seu TDEE e objetivo." },
  { icon: Salad, title: "Alimentos Reais", description: "Planos baseados nos alimentos que você já come no dia a dia, nada de receitas complexas." },
  { icon: TrendingUp, title: "Ajustes Dinâmicos", description: "Adapta suas refeições conforme você progride e suas necessidades mudam." },
  { icon: Clock, title: "Disponível 24/7", description: "Tire dúvidas e ajuste seu plano a qualquer hora, de qualquer lugar." },
  { icon: Shield, title: "Base Científica", description: "Recomendações baseadas em evidências nutricionais e guidelines atualizadas." },
];

const steps = [
  { num: "01", title: "Converse", desc: "Diga seus objetivos e preferências" },
  { num: "02", title: "IA Analisa", desc: "Entende sua rotina e necessidades" },
  { num: "03", title: "Receba", desc: "Dieta flexível ajustada para você" },
];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.3 },
  transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] as const },
});

const Features = () => {
  return (
    <section id="features" className="py-16 sm:py-24 px-4 bg-background">
      <div className="container max-w-6xl mx-auto space-y-12 sm:space-y-20">
        {/* Header */}
        <motion.div {...fadeUp()} className="text-center space-y-4">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold">
            <span className="text-gradient">Como Funciona</span>
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto">
            Três passos simples para sua dieta personalizada
          </p>
        </motion.div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
          {steps.map((step, idx) => (
            <motion.div
              key={idx}
              {...fadeUp(idx * 0.1)}
              className="relative p-6 bg-card/50 backdrop-blur-sm rounded-xl border border-border/50 text-center md:text-left"
            >
              <div className="text-6xl font-bold text-primary/20 mb-4">{step.num}</div>
              <h3 className="text-2xl font-semibold mb-2">{step.title}</h3>
              <p className="text-base text-muted-foreground">{step.desc}</p>
              {idx < 2 && (
                <div className="hidden md:block absolute top-8 -right-4 w-8 h-0.5 bg-primary/30" />
              )}
            </motion.div>
          ))}
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          {features.map((feature, idx) => (
            <motion.div key={idx} {...fadeUp(idx * 0.05)} className="h-full">
              <Card className="group hover:shadow-soft transition-all duration-300 border-border/50 hover:border-primary/30 h-full bg-card/40">
                <CardContent className="p-4 sm:p-6 space-y-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold">{feature.title}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
