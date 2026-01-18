import { motion } from "framer-motion";
import { CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import PageTransition from "@/components/PageTransition";

export function SuccessPage() {
    const navigate = useNavigate();

    return (
        <PageTransition>
            <div className="min-h-screen bg-gradient-to-b from-background to-primary/5 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-md"
                >
                    <Card className="shadow-glow border-primary/20">
                        <CardContent className="p-8 text-center space-y-6">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2, type: "spring" }}
                                className="flex justify-center"
                            >
                                <div className="relative">
                                    <CheckCircle className="w-20 h-20 text-primary" />
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: [0, 1.2, 1] }}
                                        transition={{ delay: 0.4, duration: 0.5 }}
                                        className="absolute inset-0 bg-primary/20 rounded-full blur-xl"
                                    />
                                </div>
                            </motion.div>

                            <div className="space-y-2">
                                <h1 className="text-3xl font-bold text-gradient">
                                    Pagamento Confirmado! 🎉
                                </h1>
                                <p className="text-muted-foreground">
                                    Bem-vindo ao myNutrIA! Sua jornada de saúde começa agora.
                                </p>
                            </div>

                            <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
                                <p className="font-semibold">O que acontece agora:</p>
                                <ul className="text-left space-y-1 text-muted-foreground">
                                    <li>✓ Você receberá um email de confirmação</li>
                                    <li>✓ Seu plano está ativo imediatamente</li>
                                    <li>✓ Acesso completo a todas as funcionalidades</li>
                                </ul>
                            </div>

                            <Button
                                className="w-full"
                                onClick={() => navigate("/dashboard")}
                            >
                                Ir para Dashboard
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </PageTransition>
    );
}
