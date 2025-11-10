import { Brain, Calculator, Salad, TrendingUp, Clock, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

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
  return (
    <section id="features" className="py-20 px-4">
      <div className="container max-w-6xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl lg:text-5xl font-bold">
            <span className="text-gradient">Como Funciona</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Três passos simples para sua dieta personalizada com inteligência artificial
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          {[
            { num: "01", title: "Converse", desc: "Diga seus objetivos e preferências alimentares" },
            { num: "02", title: "IA Analisa", desc: "Entende sua rotina e calcula suas necessidades" },
            { num: "03", title: "Receba", desc: "Dieta flexível com macros ajustados para você" }
          ].map((step, idx) => (
            <div key={idx} className="relative">
              <div className="text-6xl font-bold text-primary/20 mb-4">{step.num}</div>
              <h3 className="text-2xl font-semibold mb-2">{step.title}</h3>
              <p className="text-muted-foreground">{step.desc}</p>
              {idx < 2 && (
                <div className="hidden md:block absolute top-8 -right-4 w-8 h-0.5 bg-primary/30" />
              )}
            </div>
          ))}
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, idx) => (
            <Card 
              key={idx}
              className="group hover:shadow-soft transition-all duration-300 border-border/50 hover:border-primary/30"
            >
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
