import { motion } from "framer-motion";
import { XCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import PageTransition from "@/components/PageTransition";

export function CancelPage() {
    const navigate = useNavigate();

    return (
        <PageTransition>
            <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-md"
                >
                    <Card>
                        <CardContent className="p-8 text-center space-y-6">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2, type: "spring" }}
                            >
                                <XCircle className="w-16 h-16 text-muted-foreground mx-auto" />
                            </motion.div>

                            <div className="space-y-2">
                                <h1 className="text-2xl font-bold">
                                    Pagamento Cancelado
                                </h1>
                                <p className="text-muted-foreground">
                                    Não se preocupe, nenhuma cobrança foi realizada.
                                </p>
                            </div>

                            <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
                                Você pode tentar novamente quando quiser. Estamos aqui para ajudar!
                            </div>

                            <div className="flex flex-col gap-3">
                                <Button
                                    className="w-full"
                                    onClick={() => navigate("/pricing")}
                                >
                                    Ver Planos Novamente
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => navigate("/")}
                                >
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Voltar para Home
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </PageTransition>
    );
}
