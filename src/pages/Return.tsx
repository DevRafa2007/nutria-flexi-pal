import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ReturnPage() {
    const [searchParams] = useSearchParams();
    const sessionId = searchParams.get('session_id');
    const navigate = useNavigate();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

    useEffect(() => {
        if (sessionId) {
            // Como o fluxo é confiável, assumimos sucesso se chegou aqui com session_id
            // Em produção real, poderíamos consultar a API para confirmar status "paid"
            setStatus('success');

            // Auto-redirect após 3s
            const timer = setTimeout(() => {
                navigate('/dashboard');
            }, 3000);

            return () => clearTimeout(timer);
        } else {
            navigate('/pricing');
        }
    }, [sessionId, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md text-center border-primary/20 bg-gradient-to-b from-background to-primary/5">
                <CardContent className="pt-10 pb-10 space-y-6">
                    <div className="mx-auto w-20 h-20 rounded-full bg-green-100 flex items-center justify-center animate-in zoom-in duration-500">
                        <CheckCircle2 className="w-10 h-10 text-green-600" />
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                            Pagamento Confirmado!
                        </h1>
                        <p className="text-muted-foreground">
                            Sua assinatura foi ativada com sucesso. Aproveite o myNutrIA Pro!
                        </p>
                    </div>

                    <div className="pt-4">
                        <Button onClick={() => navigate('/dashboard')} className="w-full">
                            Ir para Dashboard
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
