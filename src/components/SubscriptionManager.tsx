import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Zap, Calendar, CreditCard, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

interface UsageStats {
    plan: 'free' | 'basic' | 'pro' | 'premium';
    subscription_status?: string;
    current_period_end: string | null;
}

interface StripePlan {
    id: string;
    name: string;
    amount: number;
    currency: string;
    interval: string;
}

interface SubscriptionDetails {
    payment_method: {
        brand: string;
        last4: string;
        exp_month: number;
        exp_year: number;
    } | null;
    upcoming_invoice: {
        amount_due: number;
        currency: string;
        next_payment_attempt: number;
        period_end: number;
        lines: { description: string; amount: number }[];
    } | null;
    cancel_at_period_end: boolean;
}

export default function SubscriptionManager() {
    const [stats, setStats] = useState<UsageStats | null>(null);
    const [details, setDetails] = useState<SubscriptionDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [portalLoading, setPortalLoading] = useState(false);
    const [selectedPlanId, setSelectedPlanId] = useState<string>("");
    const [availablePlans, setAvailablePlans] = useState<StripePlan[]>([]);
    const [loadingPlans, setLoadingPlans] = useState(false);
    const navigate = useNavigate();

    const fetchStatus = async () => {
        try {
            const { data, error } = await supabase.rpc('get_user_usage');
            if (error) throw error;
            setStats(data as UsageStats);
        } catch (err) {
            console.error("Error fetching status:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchDetails = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-subscription`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
                body: JSON.stringify({ action: 'get_details' }),
            });
            const json = await response.json();
            if (json.success) setDetails(json.data);
        } catch (e) {
            console.error("Failed to fetch details", e);
        }
    };

    const fetchPlans = async () => {
        setLoadingPlans(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const response = await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-subscription`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session.access_token}`,
                    },
                    body: JSON.stringify({ action: 'list_plans' }),
                }
            );

            if (!response.ok) throw new Error("Falha ao carregar planos");
            const json = await response.json();
            if (json.success && Array.isArray(json.data)) {
                setAvailablePlans(json.data);
            }
        } catch (error) {
            console.error("Error loading plans:", error);
        } finally {
            setLoadingPlans(false);
        }
    };

    useEffect(() => {
        fetchStatus();
        fetchPlans();
        fetchDetails();
    }, []);

    const handleUpdatePlan = async () => {
        if (!selectedPlanId) return;
        setActionLoading(true);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                toast.error("Sessão expirada. Faça login novamente.");
                return;
            }

            const response = await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-subscription`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session.access_token}`,
                    },
                    body: JSON.stringify({ action: 'update_plan', priceId: selectedPlanId }),
                }
            );

            if (!response.ok) {
                let errorMessage = "Falha ao atualizar plano";
                try {
                    const errData = await response.json();
                    errorMessage = errData.error || errorMessage;
                } catch (e) { errorMessage = "Erro de conexão."; }
                throw new Error(errorMessage);
            }

            const data = await response.json();
            if (!data.success) throw new Error(data.error);

            toast.success("Plano atualizado com sucesso!");
            setSelectedPlanId("");
            setTimeout(() => { fetchStatus(); fetchDetails(); }, 1000);
        } catch (error: any) {
            console.error("Update Plan Error:", error);
            toast.error(error.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleCancel = async () => {
        setActionLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const response = await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-subscription`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session.access_token}`,
                    },
                    body: JSON.stringify({ action: 'cancel' }),
                }
            );

            if (!response.ok) throw new Error("Erro ao cancelar");

            toast.success("Assinatura cancelada.");
            setTimeout(() => { fetchStatus(); fetchDetails(); }, 1000);
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handlePortal = async () => {
        setPortalLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-portal-session`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
            });
            const { url } = await response.json();
            if (url) window.location.href = url;
        } catch (e) {
            toast.error("Erro ao abrir portal");
        } finally {
            setPortalLoading(false);
        }
    };

    if (loading) return <div className="p-4 flex items-center gap-2"><Loader2 className="animate-spin text-primary" />Carregando assinatura...</div>;
    if (!stats) return null;

    const isFree = stats.plan === 'free';

    const formatPrice = (amount: number, currency: string) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: currency.toUpperCase() }).format(amount / 100);
    };

    const formatDate = (dateString: string | null | number | undefined) => {
        if (!dateString) return "-";
        const d = typeof dateString === 'number' ? new Date(dateString * 1000) : new Date(dateString);
        return d.toLocaleDateString('pt-BR');
    };

    return (
        <Card className="shadow-none border-0 sm:border">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-primary" />
                    Gerenciar Assinatura
                </CardTitle>
                <CardDescription>Cobrança segura via Stripe</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

                {/* Status Card */}
                <div className="p-4 bg-muted/50 border rounded-lg space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-bold text-lg capitalize flex items-center gap-2">
                                {stats.plan}
                                {stats.plan === 'premium' && <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                {isFree ? "Plano Gratuito" : details?.upcoming_invoice ?
                                    `Renovação: ${formatPrice(details.upcoming_invoice.amount_due, details.upcoming_invoice.currency)}`
                                    : "Verificando detalhes..."}
                            </p>
                        </div>
                        <Badge variant={stats.subscription_status === 'active' ? 'default' : 'secondary'}>
                            {details?.cancel_at_period_end ? 'Encerra em breve' : (stats.subscription_status === 'active' ? 'Ativo' : 'Inativo')}
                        </Badge>
                    </div>

                    {/* Payment Details */}
                    {details?.payment_method && (
                        <div className="flex items-center justify-between pt-3 border-t">
                            <div className="flex items-center gap-3">
                                <div className="bg-white p-1 rounded border">
                                    <CreditCard className="w-6 h-6 text-slate-700" />
                                </div>
                                <div className="text-sm">
                                    <p className="font-medium capitalize">{details.payment_method.brand} **** {details.payment_method.last4}</p>
                                    <p className="text-muted-foreground text-xs">Vence em {details.payment_method.exp_month}/{details.payment_method.exp_year}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {!isFree && details?.upcoming_invoice && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground pt-3 border-t">
                            <Calendar className="w-4 h-4" />
                            <span>
                                Próxima fatura em <b>{formatDate(details.upcoming_invoice.period_end)}</b>
                            </span>
                        </div>
                    )}

                    {!isFree && details?.upcoming_invoice?.lines && details.upcoming_invoice.lines.length > 0 && (
                        <div className="pt-2 text-xs text-muted-foreground flex justify-end">
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="link" className="h-auto p-0 text-xs">Ver detalhes da cobrança</Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Detalhamento da Fatura</DialogTitle>
                                        <DialogDescription>Valores referentes ao próximo ciclo.</DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-2 mt-2">
                                        {details.upcoming_invoice.lines.map((line: any, idx: number) => (
                                            <div key={idx} className="flex justify-between text-sm py-2 border-b last:border-0">
                                                <span className="flex-1 mr-4">{line.description}</span>
                                                <span className="font-mono">{formatPrice(line.amount, details.upcoming_invoice!.currency)}</span>
                                            </div>
                                        ))}
                                        <div className="flex justify-between font-bold pt-2 text-lg">
                                            <span>Total</span>
                                            <span>{formatPrice(details.upcoming_invoice.amount_due, details.upcoming_invoice.currency)}</span>
                                        </div>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>
                    )}

                    {isFree && (
                        <div className="pt-2">
                            <Button onClick={() => navigate('/pricing')} className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
                                Ver Planos Assinatura 🚀
                            </Button>
                        </div>
                    )}
                </div>

                {!isFree && (
                    <div className="space-y-4 pt-4 border-t">
                        {/* Actions Row */}
                        <div className="flex flex-col gap-3">
                            <div className="flex gap-2 items-center flex-col sm:flex-row">
                                {loadingPlans ? (
                                    <div className="text-xs text-muted-foreground flex items-center gap-1 h-10">
                                        <Loader2 className="w-3 h-3 animate-spin" /> Carregando opções...
                                    </div>
                                ) : (
                                    <Select value={selectedPlanId} onValueChange={setSelectedPlanId} disabled={actionLoading}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Trocar de Plano" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availablePlans
                                                .map((plan) => (
                                                    <SelectItem key={plan.id} value={plan.id}>
                                                        {plan.name} - {formatPrice(plan.amount, plan.currency)}/{plan.interval}
                                                    </SelectItem>
                                                ))}
                                        </SelectContent>
                                    </Select>
                                )}

                                <Button
                                    className="w-full sm:w-auto"
                                    onClick={handleUpdatePlan}
                                    disabled={!selectedPlanId || actionLoading}
                                >
                                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Atualizar"}
                                </Button>
                            </div>

                            {/* Hybrid Link to Portal */}
                            <Button
                                variant="outline"
                                onClick={handlePortal}
                                disabled={portalLoading}
                                className="w-full flex items-center gap-2"
                            >
                                {portalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
                                Faturas e Configurações Avançadas
                            </Button>
                        </div>

                        <div className="pt-2 flex justify-end">
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="link" className="text-red-500 text-xs h-auto p-0 hover:no-underline opacity-80 hover:opacity-100">
                                        Cancelar Assinatura
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Cancelar Assinatura?</DialogTitle>
                                        <DialogDescription>
                                            Sua assinatura permanecerá ativa até o final do ciclo atual ({stats.current_period_end ? formatDate(stats.current_period_end) : 'hoje'}).
                                        </DialogDescription>
                                    </DialogHeader>
                                    <DialogFooter>
                                        <Button variant="outline">Voltar</Button>
                                        <Button variant="destructive" onClick={handleCancel} disabled={actionLoading}>
                                            Confirmar Cancelamento
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
