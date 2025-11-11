import { Flame } from "lucide-react";
import useConsumptionTracking from "@/hooks/useConsumptionTracking";
import { useEffect } from "react";

const StreakIndicator = () => {
  const { streak, loadStreak } = useConsumptionTracking();

  useEffect(() => {
    loadStreak();
  }, [loadStreak]);

  return (
    <div className="flex items-center gap-2 bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-full px-3 py-1.5">
      <div className="relative">
        <Flame className="w-5 h-5 text-orange-500" />
        <span className="absolute inset-0 flex items-center justify-center text-white font-bold text-xs">
          {streak?.current_streak || 0}
        </span>
      </div>
      <div className="hidden sm:flex flex-col">
        <span className="text-xs font-bold text-orange-700 dark:text-orange-300">
          {streak?.current_streak || 0} dia{streak?.current_streak !== 1 ? "s" : ""}
        </span>
        <span className="text-[10px] text-muted-foreground">
          Recorde: {streak?.best_streak || 0}
        </span>
      </div>
      <div className="sm:hidden">
        <span className="text-sm font-bold text-orange-700 dark:text-orange-300">
          {streak?.current_streak || 0}
        </span>
      </div>
    </div>
  );
};

export default StreakIndicator;
