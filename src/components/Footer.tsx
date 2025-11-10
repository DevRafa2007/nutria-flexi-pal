import { Heart } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-border/50 py-6 sm:py-8 px-4">
      <div className="container max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-3 sm:gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-2 text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
            <span>© 2025 myNutrIA</span>
            <span className="hidden sm:inline">•</span>
            <span className="flex items-center gap-1">
              Feito com <Heart className="w-3 h-3 sm:w-4 sm:h-4 text-primary fill-primary" /> e IA
            </span>
          </div>
          
          <div className="flex gap-4 sm:gap-6 text-xs sm:text-sm text-muted-foreground">
            <a href="#" className="hover:text-primary transition-colors">Privacidade</a>
            <a href="#" className="hover:text-primary transition-colors">Termos</a>
            <a href="#" className="hover:text-primary transition-colors">Contato</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
