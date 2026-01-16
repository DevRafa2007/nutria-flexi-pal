import { Heart } from "lucide-react";

const Footer = () => {
  return (
    <footer className="fixed bottom-0 left-0 w-full z-50 border-t border-border/10 py-3 px-4 bg-background/60 backdrop-blur-md flex items-center justify-center">
      <div className="container max-w-6xl mx-auto">
        <div className="flex justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-[10px] sm:text-xs text-muted-foreground/60">
            <span>© 2025 myNutrIA</span>
            <span className="hidden sm:inline">•</span>
            <span className="flex items-center gap-1">
              Feito com <Heart className="w-3 h-3 text-primary/60 fill-primary/40" />
            </span>
          </div>

          <div className="flex gap-4 text-[10px] sm:text-xs text-muted-foreground/60">
            <a href="#" className="hover:text-primary transition-colors">Termos</a>
            <a href="#" className="hover:text-primary transition-colors">Contato</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
