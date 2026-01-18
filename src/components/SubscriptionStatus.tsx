import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Zap, Lock, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface UsageStats {
    plan: 'free' | 'basic' | 'pro' | 'premium';
    usage_count: number;
    usage_limit: number;
    subscription_status?: string;
    current_period_end: string | null;
}

interface SubscriptionStatusProps {
    hideManage?: boolean;
}

export default function SubscriptionStatus({ hideManage = false }: SubscriptionStatusProps) {
    const [stats, setStats] = useState<UsageStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [portalLoading, setPortalLoading] = useState(false);
    const navigate = useNavigate();

    const fetchUsage = async () => {
        try {
            const { data, error } = await supabase.rpc('get_user_usage');
            if (error) {
                console.warn('Erro ao carregar status da assinatura:', error);
                return;
            }
            setStats(data as UsageStats);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsage();
        // Atualiza a cada 30 segundos para manter sync
        const interval = setInterval(fetchUsage, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleManageSubscription = async () => {
        setPortalLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const response = await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-portal-session`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session.access_token}`,
                    },
                }
            );

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Falha ao abrir portal');
            }

            const { url } = await response.json();
            if (url) {
                window.location.href = url; // Redireciona para Stripe Customer Portal
            }
        } catch (error) {
            toast.error("Erro ao abrir portal de assinatura.");
            console.error(error);
        } finally {
            setPortalLoading(false);
        }
    };

    if (loading || !stats) return null;

    const isUnlimited = stats.usage_limit === -1;
    const percent = isUnlimited ? 0 : Math.min(100, (stats.usage_count / stats.usage_limit) * 100);
    const isFree = stats.plan === 'free';
    const showUpgrade = true; // Sempre pode fazer upgrade/mudança

    // Lógica principal: showManage somente se não for Free E se hideManage for false
    const showManage = !isFree && !hideManage;

    const planColors: Record<string, string> = {
        free: "bg-slate-500",
        basic: "bg-blue-500",
        pro: "bg-purple-500",
        premium: "bg-amber-500"
    };

    const planNames: Record<string, string> = {
        free: "Gratuito",
        basic: "Básico",
        pro: "Pro",
        premium: "Premium"
    };

    return (
        <Card className="border-primary/20 bg-gradient-to-r from-background to-primary/5 mb-6 overflow-hidden relative animate-in fade-in slide-in-from-top-2">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                <Sparkles className="w-24 h-24" />
            </div>

            <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">

                <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${planColors[stats.plan] || "bg-gray-500"} text-white shadow-lg`}>
                        {isUnlimited ? <Zap className="w-6 h-6" /> : <Lock className="w-5 h-5" />}
                    </div>

                    <div className="space-y-1 w-full">
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-lg">Plano {planNames[stats.plan] || "Gratuito"}</h3>
                            {stats.plan !== 'free' && (
                                <Badge variant="outline" className="text-xs bg-background/50">
                                    Ativo
                                </Badge>
                            )}
                        </div>

                        {isUnlimited ? (
                            <p className="text-sm text-muted-foreground">Você tem acesso ilimitado à IA! 🚀</p>
                        ) : (
                            <div className="space-y-1 max-w-[200px] sm:max-w-xs">
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>Mensagens usadas</span>
                                    <span className={percent > 90 ? "text-red-500 font-bold" : ""}>
                                        {stats.usage_count} / {stats.usage_limit}
                                    </span>
                                </div>
                                <Progress value={percent} className="h-2" />
                                <p className="text-xs text-muted-foreground">
                                    {stats.plan === 'basic' ? 'Limite renova diariamente' : 'Limite mensal'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                    {showManage && (
                        <Button variant="outline" onClick={handleManageSubscription} disabled={portalLoading} className="flex-1 sm:flex-none">
                            <Settings className="w-4 h-4 mr-2" />
                            {portalLoading ? "Carregando..." : "Gerenciar"}
                        </Button>
                    )}

                    {showUpgrade && (
                        <Button
                            onClick={() => navigate('/dashboard?tab=profile&action=upgrade')}
                            className={`flex-1 sm:flex-none shadow-md transition-all hover:scale-105 ${isFree
                                ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0"
                                : "bg-primary text-primary-foreground"
                                }`}
                        >
                            {isFree ? "Desbloquear Pro ✨" : "Fazer Upgrade 🚀"}
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
