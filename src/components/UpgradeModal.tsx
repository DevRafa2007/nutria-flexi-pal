import { useState, useEffect } from "react";
import { useSubscription } from "@/hooks/useSubscription";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function UpgradeModal() {
    const { isFree, loading } = useSubscription();
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        // Só abrir se carregou, é free, e ainda não foi verificado nesta sessão/reload
        if (!loading && isFree) {
            // Pequeno delay para não ser invasivo imediatamente ao carregar
            const timer = setTimeout(() => {
                setIsOpen(true);
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [loading, isFree]);

    const handleUpgrade = () => {
        setIsOpen(false);
        // Redireciona para a tab de planos
        navigate('/dashboard?tab=profile&action=upgrade');
    };

    const handleClose = () => {
        setIsOpen(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-md bg-gradient-to-br from-background to-primary/5 border-primary/20">
                <DialogHeader>
                    <div className="mx-auto bg-primary/10 p-3 rounded-full mb-4 w-fit">
                        <Sparkles className="w-8 h-8 text-primary" />
                    </div>
                    <DialogTitle className="text-center text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                        Desbloqueie todo o potencial!
                    </DialogTitle>
                    <DialogDescription className="text-center pt-2">
                        Você está usando o plano Gratuito. Faça o upgrade para remover limites e acessar recursos exclusivos.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-3 py-4">
                    <div className="flex items-center gap-3 text-sm">
                        <div className="bg-green-100 dark:bg-green-900/30 p-1 rounded-full">
                            <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                        </div>
                        <span>Acesso ilimitado à IA Nutricionista</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                        <div className="bg-green-100 dark:bg-green-900/30 p-1 rounded-full">
                            <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                        </div>
                        <span>Histórico completo de refeições</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                        <div className="bg-green-100 dark:bg-green-900/30 p-1 rounded-full">
                            <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                        </div>
                        <span>Análises avançadas de progresso</span>
                    </div>
                </div>

                <DialogFooter className="flex-col sm:flex-col gap-2">
                    <Button
                        onClick={handleUpgrade}
                        className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 text-white font-bold py-5 text-lg shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]"
                    >
                        Ver Planos Premium 🚀
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={handleClose}
                        className="w-full text-muted-foreground hover:text-foreground"
                    >
                        Agora não, continuar com Free
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
