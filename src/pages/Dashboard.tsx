import { useState } from "react";
import ChatAI from "@/components/ChatAI";
import MealsList from "@/components/MealsList";
import StreakCalendar from "@/components/StreakCalendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardHeader from "@/components/DashboardHeader";

export function DashboardPage() {
  const [currentTab, setCurrentTab] = useState("meals");

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-primary/5">
      <DashboardHeader currentTab={currentTab} onTabChange={setCurrentTab} />
      
      <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-7xl">
        <div className="mb-6 space-y-2">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Seu Dashboard Nutricional
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Crie planos de refeição personalizados com IA e acompanhe seu progresso
          </p>
        </div>

        <div className="space-y-4">
          {/* Aba de Refeições */}
          {currentTab === "meals" && (
            <div className="space-y-4 animate-fade-in">
              <MealsList />
            </div>
          )}

          {/* Aba de Chat */}
          {currentTab === "chat" && (
            <div className="space-y-4 animate-fade-in">
              <ChatAI />
              <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
                <CardHeader>
                  <CardTitle className="text-sm">💡 Dicas de Uso</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-2">
                  <p>
                    • Comece fornecendo informações sobre seu objetivo (emagrecer, ganhar massa ou
                    manter)
                  </p>
                  <p>• Mencione suas preferências alimentares e alergias</p>
                  <p>• Peça planos de refeição personalizados para cada objetivo</p>
                  <p>• Refeições aparecem automaticamente em "Minhas Refeições" para acompanhar</p>
                </CardContent>
              </Card>
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
            <div className="space-y-4 animate-fade-in">
              <Card>
                <CardHeader>
                  <CardTitle>Seu Perfil Nutricional</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Configure suas informações para recomendações mais precisas da IA.
                  </p>
                  {/* TODO: Implementar formulário de perfil */}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
