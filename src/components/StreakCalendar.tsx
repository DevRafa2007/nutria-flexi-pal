import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import useConsumptionTracking from "@/hooks/useConsumptionTracking";

const StreakCalendar = () => {
  const { streak, consumptions, hasDayActivity, loadStreak, loadConsumptions } =
    useConsumptionTracking();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<(Date | null)[]>([]);

  // Carregar dados ao montar
  useEffect(() => {
    loadStreak();
    loadConsumptions();
  }, [loadStreak, loadConsumptions]);

  // Calcular dias do calendário
  useEffect(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Primeiro dia do mês
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    // Montar array de dias (com null para dias de meses anteriores)
    const days: (Date | null)[] = [];

    // Adicionar dias vazios do mês anterior
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Adicionar dias do mês atual
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    setCalendarDays(days);
  }, [currentDate]);

  const getDayColor = (date: Date | null): string => {
    if (!date) return "bg-transparent";

    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();

    if (hasDayActivity(date)) {
      return isToday
        ? "bg-gradient-to-br from-orange-400 to-red-500 text-white font-bold"
        : "bg-orange-300 text-white";
    }

    if (isToday) {
      return "bg-primary text-white";
    }

    // Dias passados sem atividade
    if (date < today) {
      return "bg-muted-foreground/20 text-muted-foreground";
    }

    // Dias futuros
    return "bg-muted";
  };

  const monthName = currentDate.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  const goToPreviousMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1)
    );
  };

  const goToNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1)
    );
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  return (
    <div className="w-full space-y-4">
      {/* Streak Info */}
      <Card className="border-primary/20 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Flame className="w-12 h-12 text-orange-500 animate-bounce" />
                <span className="absolute inset-0 flex items-center justify-center text-white font-bold text-lg">
                  {streak?.current_streak || 0}
                </span>
              </div>
              <div>
                <p className="text-lg font-bold text-orange-700">
                  Sua sequência: {streak?.current_streak || 0} dia{streak?.current_streak !== 1 ? "s" : ""}
                </p>
                <p className="text-sm text-muted-foreground">
                  Melhor: {streak?.best_streak || 0} dias 🏆
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Começou em</p>
              <p className="font-semibold">
                {streak?.start_date
                  ? new Date(streak.start_date).toLocaleDateString("pt-BR")
                  : "Hoje"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendário */}
      <Card className="border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="capitalize">{monthName}</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPreviousMonth}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={goToToday}
                className="text-xs h-8 px-2"
              >
                Hoje
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextMonth}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Dias da semana */}
          <div className="grid grid-cols-7 gap-2 mb-3">
            {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"].map((day) => (
              <div key={day} className="text-center text-xs font-semibold text-muted-foreground">
                {day}
              </div>
            ))}
          </div>

          {/* Dias */}
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((date, idx) => (
              <div
                key={idx}
                className={`aspect-square flex items-center justify-center rounded-lg text-sm font-semibold transition-all cursor-pointer ${getDayColor(date)} ${
                  date && hasDayActivity(date)
                    ? "ring-2 ring-orange-400 shadow-lg hover:scale-110"
                    : "hover:scale-105"
                }`}
                title={date ? date.toLocaleDateString("pt-BR") : ""}
              >
                {date ? (
                  <div className="relative">
                    {date.getDate()}
                    {hasDayActivity(date) && (
                      <Flame className="w-3 h-3 absolute -top-1 -right-1 text-orange-500" />
                    )}
                  </div>
                ) : null}
              </div>
            ))}
          </div>

          {/* Legenda */}
          <div className="mt-6 pt-4 border-t flex gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gradient-to-br from-orange-400 to-red-500" />
              <span>Dia completado 🔥</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-muted-foreground/20" />
              <span>Dia perdido</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-primary" />
              <span>Hoje</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dicas */}
      <Card className="bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900">
        <CardContent className="pt-6">
          <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
            ℹ️ Como funciona o streak:
          </p>
          <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
            <li>🔥 Complete as refeições do dia para acender o fogo</li>
            <li>⚡ Seu streak reseta se você pular um dia</li>
            <li>🏆 Tente bater seu recorde!</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default StreakCalendar;
