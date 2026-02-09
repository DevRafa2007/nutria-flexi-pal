import { Flame, Check } from "lucide-react";
import useConsumptionTracking from "@/hooks/useConsumptionTracking";
import { useConsumedFoods } from "@/context/ConsumedFoodsContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import StreakCelebration from "./StreakCelebration";

const StreakIndicator = () => {
  const { streak, loadStreak } = useConsumptionTracking();
  const { consumedFoods, getTotalMacrosForDate } = useConsumedFoods();
  const { profile } = useUserProfile();
  const [showCelebration, setShowCelebration] = useState(false);
  const prevConsumedCount = useRef(0);
  const celebrationShownToday = useRef(false);

  useEffect(() => {
    loadStreak();
    // Reset flag de celebração à meia-noite
    const today = new Date().toISOString().split('T')[0];
    const storedDate = localStorage.getItem('lastCelebrationDate');
    if (storedDate !== today) {
      celebrationShownToday.current = false;
    }
  }, [loadStreak]);

  // Detectar quando usuário marca primeira refeição do dia
  const todayConsumedCount = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return consumedFoods.filter(cf => cf.consumed_date === today).length;
  }, [consumedFoods]);

  // Animação de celebração quando marca primeira refeição do dia
  useEffect(() => {
    // Se passou de 0 para 1+ alimento hoje E ainda não mostrou celebração hoje
    if (prevConsumedCount.current === 0 && todayConsumedCount > 0 && !celebrationShownToday.current) {
      const today = new Date().toISOString().split('T')[0];
      const storedDate = localStorage.getItem('lastCelebrationDate');

      if (storedDate !== today) {
        setShowCelebration(true);
        celebrationShownToday.current = true;
        localStorage.setItem('lastCelebrationDate', today);
      }
    }
    prevConsumedCount.current = todayConsumedCount;
  }, [todayConsumedCount]);

  // Calcular porcentagem de macros atingidos hoje
  const todayProgress = useMemo(() => {
    const today = new Date();
    const todayMacros = getTotalMacrosForDate(today);
    const targetCalories = profile?.target_calories || 2000;

    if (targetCalories === 0) return 0;

    const percentage = Math.min(100, Math.round((todayMacros.calories / targetCalories) * 100));
    return percentage;
  }, [getTotalMacrosForDate, profile]);

  const currentStreak = streak?.current_streak || 0;
  const hasTodayActivity = todayConsumedCount > 0;

  // Cor do indicador baseada no streak
  const getStreakColor = () => {
    if (currentStreak >= 100) return 'text-purple-500';
    if (currentStreak >= 50) return 'text-red-500';
    return 'text-orange-500';
  };

  const getBorderColor = () => {
    if (currentStreak >= 100) return 'border-purple-500/30 from-purple-500/10 to-purple-600/10';
    if (currentStreak >= 50) return 'border-red-500/30 from-red-500/10 to-red-600/10';
    return 'border-orange-500/20 from-orange-500/10 to-red-500/10';
  };

  const handleCelebrationComplete = useCallback(() => {
    setShowCelebration(false);
  }, []);

  return (
    <>
      {/* Celebração em tela cheia */}
      <StreakCelebration
        show={showCelebration}
        streakCount={currentStreak + 1} // +1 porque acabou de marcar
        onComplete={handleCelebrationComplete}
      />

      <div className={`flex items-center gap-2 bg-gradient-to-r ${getBorderColor()} border rounded-full px-3 py-1.5 transition-all hover:scale-105`}>
        {/* Ícone de fogo com check de hoje */}
        <div className="relative">
          <Flame
            className={`w-5 h-5 ${hasTodayActivity ? getStreakColor() : 'text-muted-foreground/50'} ${hasTodayActivity ? 'animate-pulse' : ''}`}
          />
          {/* Check verde se já marcou algo hoje */}
          {hasTodayActivity && (
            <div className="absolute -bottom-0.5 -right-0.5 bg-green-500 rounded-full p-0.5">
              <Check className="w-2 h-2 text-white" strokeWidth={4} />
            </div>
          )}
        </div>

        {/* Desktop: Info completa */}
        <div className="hidden sm:flex flex-col min-w-[80px]">
          <div className="flex items-center gap-1">
            <span className={`text-xs font-bold ${hasTodayActivity ? getStreakColor() : 'text-muted-foreground'}`}>
              {currentStreak} dia{currentStreak !== 1 ? "s" : ""}
            </span>
            {currentStreak >= 100 && <span className="text-xs">💜</span>}
            {currentStreak >= 50 && currentStreak < 100 && <span className="text-xs">❤️</span>}
            {currentStreak >= 7 && currentStreak < 50 && <span className="text-xs">🔥</span>}
          </div>

          {/* Mini barra de progresso de hoje */}
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-12 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${currentStreak >= 100 ? 'bg-gradient-to-r from-purple-400 to-purple-600' :
                    currentStreak >= 50 ? 'bg-gradient-to-r from-red-400 to-red-600' :
                      hasTodayActivity ? 'bg-gradient-to-r from-green-400 to-green-600' : 'bg-muted-foreground/30'
                  }`}
                style={{ width: `${todayProgress}%` }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground font-medium">
              {todayProgress}%
            </span>
          </div>
        </div>

        {/* Mobile: Compacto */}
        <div className="sm:hidden flex items-center gap-1">
          <span className={`text-sm font-bold ${hasTodayActivity ? getStreakColor() : 'text-muted-foreground'}`}>
            {currentStreak}
          </span>
          {currentStreak >= 100 && <span className="text-xs">💜</span>}
          {currentStreak >= 50 && currentStreak < 100 && <span className="text-xs">❤️</span>}
          {currentStreak >= 7 && currentStreak < 50 && <span className="text-xs">🔥</span>}
        </div>
      </div>
    </>
  );
};

export default StreakIndicator;
