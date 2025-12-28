import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabaseClient";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Loader2, ArrowLeft } from "lucide-react";

export function ResetPasswordPage() {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isValidSession, setIsValidSession] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        // Verificar se há uma sessão de recuperação válida
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                setIsValidSession(true);
            } else {
                toast.error("Link de recuperação inválido ou expirado");
                setTimeout(() => navigate("/login"), 2000);
            }
        });
    }, [navigate]);

    const handleResetPassword = async () => {
        if (!password || !confirmPassword) {
            toast.error("Por favor, preencha todos os campos");
            return;
        }

        if (password.length < 8) {
            toast.error("A senha deve ter no mínimo 8 caracteres");
            return;
        }

        if (password !== confirmPassword) {
            toast.error("As senhas não coincidem");
            return;
        }

        setIsLoading(true);

        try {
            const { error } = await supabase.auth.updateUser({
                password: password,
            });

            if (error) {
                toast.error(error.message);
            } else {
                toast.success("Senha redefinida com sucesso!");
                setTimeout(() => navigate("/login"), 1500);
            }
        } catch (error) {
            toast.error("Erro ao redefinir senha");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isValidSession) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-950">
                <Card className="w-full max-w-sm">
                    <CardHeader>
                        <CardTitle className="text-2xl">Verificando...</CardTitle>
                        <CardDescription>
                            Aguarde enquanto verificamos seu link de recuperação.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-950">
            <div className="absolute top-4 left-4">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate("/login")}
                    className="gap-2"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Voltar
                </Button>
            </div>
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle className="text-2xl">Redefinir senha</CardTitle>
                    <CardDescription>
                        Digite sua nova senha abaixo. Ela deve ter no mínimo 8 caracteres.
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="password">Nova senha</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="confirm-password">Confirmar senha</Label>
                        <Input
                            id="confirm-password"
                            type="password"
                            placeholder="••••••••"
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !isLoading) {
                                    handleResetPassword();
                                }
                            }}
                            disabled={isLoading}
                        />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button
                        className="w-full"
                        onClick={handleResetPassword}
                        disabled={isLoading}
                    >
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Redefinir senha
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
