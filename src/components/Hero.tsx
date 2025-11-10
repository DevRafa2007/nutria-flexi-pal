import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 py-12 sm:py-20">
      {/* Animated Background Blobs */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 left-10 w-48 h-48 sm:w-72 sm:h-72 bg-primary/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-64 h-64 sm:w-96 sm:h-96 bg-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
      </div>

      <div className="container max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-6 sm:space-y-8 animate-slide-up">
            <div className="inline-flex items-center gap-2 bg-primary/10 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full">
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
              <span className="text-xs sm:text-sm font-medium text-primary">Powered by AI</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold leading-tight">
              <span className="text-gradient">myNutrIA</span>
              <br />
              <span className="text-foreground">Seu Nutricionista</span>
              <br />
              <span className="text-foreground">Inteligente</span>
            </h1>

            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-lg">
              Converse com a IA que entende sua rotina e transforma sua alimentação. 
              Dietas personalizadas baseadas nos alimentos que você já come.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Button 
                size="lg" 
                className="bg-primary hover:bg-primary-dark shadow-soft hover:shadow-glow transition-all duration-300 group w-full sm:w-auto"
                onClick={() => document.getElementById('chat')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Iniciar Conversa
                <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="border-primary/30 hover:bg-primary/5 w-full sm:w-auto"
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Ver Como Funciona
              </Button>
            </div>

            <div className="flex gap-6 sm:gap-8 pt-4 sm:pt-8">
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-primary">10K+</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Planos Criados</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-primary">98%</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Satisfação</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-primary">24/7</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Disponível</div>
              </div>
            </div>
          </div>

          {/* Right Content - Chat Preview */}
          <div className="relative animate-slide-up mt-8 lg:mt-0" style={{ animationDelay: "0.2s" }}>
            <div className="bg-card rounded-2xl sm:rounded-3xl shadow-card border border-border/50 overflow-hidden backdrop-blur-sm">
              <div className="bg-gradient-primary p-4 sm:p-6 text-primary-foreground">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm sm:text-base">myNutrIA Assistant</h3>
                    <p className="text-xs sm:text-sm opacity-90">Online agora</p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 sm:p-6 space-y-3 sm:space-y-4 h-[300px] sm:h-[400px] overflow-y-auto">
                <div className="flex gap-2 sm:gap-3">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-primary-foreground" />
                  </div>
                  <div className="bg-muted rounded-2xl rounded-tl-sm p-3 sm:p-4 max-w-[85%] sm:max-w-[80%]">
                    <p className="text-xs sm:text-sm">Olá! 👋 Sou a myNutrIA. Posso criar sua dieta personalizada com base nos seus gostos e objetivos.</p>
                  </div>
                </div>

                <div className="flex gap-2 sm:gap-3 justify-end">
                  <div className="bg-primary rounded-2xl rounded-tr-sm p-3 sm:p-4 max-w-[85%] sm:max-w-[80%]">
                    <p className="text-xs sm:text-sm text-primary-foreground">Quero emagrecer mas sem parar de comer arroz e feijão</p>
                  </div>
                </div>

                <div className="flex gap-2 sm:gap-3">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-primary-foreground" />
                  </div>
                  <div className="bg-muted rounded-2xl rounded-tl-sm p-3 sm:p-4 max-w-[85%] sm:max-w-[80%]">
                    <p className="text-xs sm:text-sm">Perfeito! Vou criar um plano com arroz e feijão ajustando as porções. Me diga:</p>
                    <ul className="text-xs sm:text-sm mt-2 space-y-1">
                      <li>• Qual seu peso atual?</li>
                      <li>• Altura?</li>
                      <li>• Nível de atividade física?</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
