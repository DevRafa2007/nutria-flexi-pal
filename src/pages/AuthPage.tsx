import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { ForgotPasswordModal } from "@/components/ForgotPasswordModal";
import { motion, AnimatePresence } from "framer-motion";
import PageTransition from "@/components/PageTransition";

export function AuthPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const redirectTo = searchParams.get("redirectTo");
    const [mode, setMode] = useState<"login" | "register">("login");

    // Form State
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

    // Sync mode with URL
    useEffect(() => {
        if (location.pathname === "/register") {
            setMode("register");
        } else {
            setMode("login");
        }
    }, [location.pathname]);

    const handleModeSwitch = (newMode: "login" | "register") => {
        setMode(newMode);
        navigate(newMode === "login" ? "/login" : "/register");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            if (mode === "login") {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                if (error) throw error;
                toast.success("Login realizado com sucesso!");
                navigate(redirectTo || "/dashboard");
            } else {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: name,
                        },
                    },
                });
                if (error) throw error;
                if (error) throw error;
                toast.success("Conta criada! Verifique seu email.");
                // Se o supabase fizer auto-login, podemos redirecionar.
                // Mas geralmente email confirm é required. Vamos mandar pro dashboard/origem de qualquer forma se sucesso.
                navigate(redirectTo || "/dashboard");
            }
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <PageTransition>
            <div className="flex items-center justify-center min-h-screen bg-background relative overflow-hidden">
                {/* Background Blobs */}
                <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-accent/5 rounded-full blur-[100px] pointer-events-none" />

                <div className="absolute top-6 left-6 z-10">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate("/")}
                        className="gap-2 hover:bg-background/80 backdrop-blur-sm"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Voltar
                    </Button>
                </div>

                <div className="w-full max-w-sm mx-4 relative z-10">
                    <motion.div
                        layout
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        className="bg-card/50 backdrop-blur-xl border border-white/10 shadow-2xl rounded-3xl p-6 sm:p-8"
                    >
                        {/* Header & Switch */}
                        <div className="flex flex-col items-center mb-8">
                            <h1 className="text-2xl font-bold mb-6 text-center">
                                {mode === "login" ? "Bem-vindo de volta" : "Crie sua conta"}
                            </h1>

                            {/* Animated Switch */}
                            <div className="relative flex w-full bg-muted/50 p-1 rounded-full cursor-pointer">
                                {/* Rolling Background */}
                                <motion.div
                                    layout
                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                    className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-background shadow-sm rounded-full`}
                                    style={{
                                        left: mode === "login" ? "4px" : "calc(50%)"
                                    }}
                                />

                                <button
                                    onClick={() => handleModeSwitch("login")}
                                    className={`flex-1 relative z-10 py-2.5 text-sm font-medium transition-colors duration-200 ${mode === "login" ? "text-foreground" : "text-muted-foreground"
                                        }`}
                                >
                                    Entrar
                                </button>
                                <button
                                    onClick={() => handleModeSwitch("register")}
                                    className={`flex-1 relative z-10 py-2.5 text-sm font-medium transition-colors duration-200 ${mode === "register" ? "text-foreground" : "text-muted-foreground"
                                        }`}
                                >
                                    Cadastrar
                                </button>
                            </div>
                        </div>

                        {/* Form with Layout Animation */}
                        <motion.form
                            layout
                            initial={false}
                            onSubmit={handleSubmit}
                            className="space-y-4 overflow-hidden"
                        >
                            <AnimatePresence mode="popLayout" initial={false}>
                                {mode === "register" && (
                                    <motion.div
                                        key="name-field"
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Nome Completo</Label>
                                            <Input
                                                id="name"
                                                type="text"
                                                placeholder="Seu nome"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                required={mode === "register"}
                                                className="bg-background/50 border-white/10 focus:bg-background transition-all"
                                            />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="seu@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="bg-background/50 border-white/10 focus:bg-background transition-all"
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <Label htmlFor="password">Senha</Label>
                                    {mode === "login" && (
                                        <button
                                            type="button"
                                            onClick={() => setIsForgotPasswordOpen(true)}
                                            className="text-xs text-primary hover:underline"
                                        >
                                            Esqueceu a senha?
                                        </button>
                                    )}
                                </div>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="bg-background/50 border-white/10 focus:bg-background transition-all"
                                />
                            </div>

                            <Button
                                type="submit"
                                className="w-full mt-6 bg-gradient-to-r from-primary to-primary/80 hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    mode === "login" ? "Entrar" : "Criar Conta"
                                )}
                            </Button>
                        </motion.form>

                        <motion.div
                            layout
                            className="mt-6 text-center text-sm text-muted-foreground"
                        >
                            {mode === "login" ? (
                                <>
                                    Ainda não tem conta?{" "}
                                    <button onClick={() => handleModeSwitch("register")} className="text-primary hover:underline font-medium">
                                        Começe agora
                                    </button>
                                </>
                            ) : (
                                <>
                                    Já tem uma conta?{" "}
                                    <button onClick={() => handleModeSwitch("login")} className="text-primary hover:underline font-medium">
                                        Fazer Login
                                    </button>
                                </>
                            )}
                        </motion.div>
                    </motion.div>
                </div>

                <ForgotPasswordModal
                    open={isForgotPasswordOpen}
                    onOpenChange={setIsForgotPasswordOpen}
                />
            </div>
        </PageTransition >
    );
}
