import { Button } from "@/components/ui/button";
import { ArrowRight, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useState } from "react";

const CTA = () => {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      toast.success("Obrigado! Entraremos em contato em breve.");
      setEmail("");
    }
  };

  return (
    <section className="py-20 px-4">
      <div className="container max-w-4xl mx-auto">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-primary p-12 shadow-glow">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30" />
          
          <div className="relative text-center space-y-6">
            <h2 className="text-4xl lg:text-5xl font-bold text-primary-foreground">
              Pronto para transformar sua alimentação?
            </h2>
            <p className="text-xl text-primary-foreground/90 max-w-2xl mx-auto">
              Entre em contato e descubra como a myNutrIA pode ajudar você a alcançar seus objetivos de forma personalizada.
            </p>

            <form onSubmit={handleSubmit} className="max-w-md mx-auto flex flex-col sm:flex-row gap-3 pt-4">
              <Input
                type="email"
                placeholder="seu.email@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/60"
                required
              />
              <Button 
                type="submit"
                size="lg"
                className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 shadow-soft group"
              >
                Começar
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </form>

            <div className="flex items-center justify-center gap-2 text-primary-foreground/80 text-sm pt-4">
              <Mail className="w-4 h-4" />
              <span>Resposta em até 24 horas</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
