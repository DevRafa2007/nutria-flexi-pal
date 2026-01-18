import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import ChatAI from "@/components/ChatAI";
import MealsList from "@/components/MealsList";
import StreakCalendar from "@/components/StreakCalendar";
import ProfileForm from "@/components/ProfileForm";
import OnboardingTutorial from "@/components/OnboardingTutorial";
import MealCreationTutorial from "@/components/MealCreationTutorial";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardHeader from "@/components/DashboardHeader";
import MacroProgress from "@/components/MacroProgress";
import { useUserProfile } from "@/hooks/useUserProfile";
import { supabase } from "@/lib/supabaseClient";
import SubscriptionStatus from "@/components/SubscriptionStatus";
import SubscriptionManager from "@/components/SubscriptionManager";

export function DashboardPage() {
  // Ler tab da URL se existir
  // Ler tab e action da URL
  const [searchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const actionFromUrl = searchParams.get('action');

  const [currentTab, setCurrentTab] = useState(tabFromUrl || "meals");

  // Sincronizar estado com URL e fazer scroll se necessário
  useEffect(() => {
    if (tabFromUrl) {
      setCurrentTab(tabFromUrl);
    }

    // Se houver ação de upgrade, rolar para a seção de assinatura após renderização
    if (actionFromUrl === 'upgrade' && tabFromUrl === 'profile') {
      setTimeout(() => {
        const element = document.getElementById('subscription-section');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500); // Delay pequeno para garantir que a aba trocou e o elemento renderizou
    }
  }, [tabFromUrl, actionFromUrl]);
  const { profile, loadProfile } = useUserProfile();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [showMealCreationTutorial, setShowMealCreationTutorial] = useState(false);
  const [hasCompletedMealTutorial, setHasCompletedMealTutorial] = useState(false);
  const [hasMeals, setHasMeals] = useState(false);
  const [hasLoadedInitialCheck, setHasLoadedInitialCheck] = useState(false);

  // Mostrar onboarding apenas se perfil estiver vazio
  const isProfileEmpty = !profile || (
    !profile.weight ||
    !profile.height ||
    !profile.age ||
    !profile.gender ||
    !profile.activity_level ||
    !profile.goal
  );

  // Verificar refeições na primeira renderização E quando onboarding é completo
  useEffect(() => {
    const checkMeals = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          console.log("[Dashboard] Verificando refeições para usuário:", user.id);

          const { data, error } = await supabase
            .from("meals")
            .select("id")
            .eq("user_id", user.id)
            .limit(1);

          console.log("[Dashboard] Resultado da query meals:", { data, error, count: data?.length });

          if (!error) {
            const mealsExist = data && data.length > 0;
            console.log("[Dashboard] Meals exist:", mealsExist, "hasCompletedMealTutorial:", hasCompletedMealTutorial);

            setHasMeals(mealsExist);

            // Mostrar tutorial de refeição se não houver refeições E não tiver completado
            if (!mealsExist && !hasCompletedMealTutorial) {
              console.log("[Dashboard] Mostrando tutorial de refeição");
              setShowMealCreationTutorial(true);
            }
          }
        }
      } catch (err) {
        console.error("Erro ao verificar refeições:", err);
      }
    };

    // Verificar se deve fazer check inicial
    if (profile && !isProfileEmpty && !hasLoadedInitialCheck) {
      console.log("[Dashboard] Fazendo check inicial de refeições");
      setHasLoadedInitialCheck(true);
      checkMeals();
    } else if (hasCompletedOnboarding) {
      console.log("[Dashboard] Fazendo check após onboarding");
      checkMeals();
    }
  }, [hasCompletedOnboarding, hasCompletedMealTutorial, profile, isProfileEmpty, hasLoadedInitialCheck]);

  const handleOnboardingComplete = async () => {
    console.log("[Dashboard] Onboarding completo");
    setShowOnboarding(false);
    setHasCompletedOnboarding(true);

    // Recarregar o perfil após completar
    await loadProfile();
  };

  const handleMealCreationTutorialComplete = () => {
    console.log("[Dashboard] Tutorial de refeição completo");
    setShowMealCreationTutorial(false);
    setHasCompletedMealTutorial(true);
    // Levar ao chat para criar primeira refeição
    setCurrentTab("chat");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-primary/5">
      <DashboardHeader currentTab={currentTab} onTabChange={setCurrentTab} />

      {/* Onboarding Modal */}
      {isProfileEmpty && !hasCompletedOnboarding && !showOnboarding && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md animate-in zoom-in">
            <CardContent className="p-8 text-center space-y-6">
              <div className="text-5xl">👋</div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">Bem-vindo ao myNutrIA!</h2>
                <p className="text-muted-foreground">
                  Vamos configurar seu perfil para personalizar sua experiência. Serão apenas 4 passos rápidos!
                </p>
              </div>

              <button
                onClick={() => setShowOnboarding(true)}
                className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-semibold py-3 rounded-lg transition-all"
              >
                Começar Configuração 🚀
              </button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Onboarding Tutorial */}
      {showOnboarding && (
        <OnboardingTutorial onComplete={handleOnboardingComplete} />
      )}

      {/* Meal Creation Tutorial */}
      {showMealCreationTutorial && (
        <MealCreationTutorial onComplete={handleMealCreationTutorialComplete} />
      )}

      {/* Chat em tela cheia no celular */}
      {currentTab === "chat" ? (
        <div className="fixed inset-0 top-16 flex flex-col bg-background">
          <ChatAI fullscreen={true} />
        </div>
      ) : (
        <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-7xl">
          <div className="mb-6 space-y-2">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Seu Dashboard Nutricional
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Crie planos de refeição personalizados com IA e acompanhe seu progresso
            </p>
          </div>



          <div className="space-y-6">
            {/* Status da Assinatura (Topo - Sem Gerenciar) */}
            <SubscriptionStatus hideManage={true} />

            {/* Barras de Progresso de Macros */}
            <div className="animate-in slide-in-from-top-4 duration-500">
              <MacroProgress />
            </div>

            <div className="space-y-4">
              {/* Aba de Refeições */}
              {currentTab === "meals" && (
                <div className="space-y-4 animate-fade-in">
                  <MealsList
                    onRequestTutorial={() => {
                      console.log("[Dashboard] Usuário clicou para ver tutorial");
                      setShowMealCreationTutorial(true);
                    }}
                  />
                </div>
              )}

              {/* Aba de Progresso com Calendário de Streak */}
              {currentTab === "progress" && (
                <div className="space-y-4 animate-fade-in">
                  <StreakCalendar />
                </div>
              )}

              {/* Aba de Perfil */}
              {currentTab === "profile" && (
                <div className="space-y-6 animate-fade-in">
                  <div className="space-y-2" id="subscription-section">
                    {/* Componente de Gestão In-App */}
                    <SubscriptionManager />
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-xl font-bold">Dados do Perfil</h2>
                    <ProfileForm />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
