import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ChatAI from "@/components/ChatAI";
import MealsList from "@/components/MealsList";
import StreakCalendar from "@/components/StreakCalendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function DashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-primary/5">
      <div className="p-4 md:p-8">
        <div className="mb-8 space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
            Seu Dashboard Nutricional
          </h1>
          <p className="text-muted-foreground">
            Crie planos de refeição personalizados com IA e acompanhe seu progresso
          </p>
        </div>

        <Tabs defaultValue="chat" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-4">
            <TabsTrigger value="chat">💬 Chat IA</TabsTrigger>
            <TabsTrigger value="meals">🍽️ Minhas Refeições</TabsTrigger>
            <TabsTrigger value="progress">📊 Progresso</TabsTrigger>
            <TabsTrigger value="profile">👤 Perfil</TabsTrigger>
          </TabsList>

          {/* Aba de Chat */}
          <TabsContent value="chat" className="space-y-4">
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
          </TabsContent>

          {/* Aba de Refeições */}
          <TabsContent value="meals" className="space-y-4">
            <MealsList />
          </TabsContent>

          {/* Aba de Progresso com Calendário de Streak */}
          <TabsContent value="progress" className="space-y-4">
            <StreakCalendar />
          </TabsContent>

          {/* Aba de Perfil */}
          <TabsContent value="profile" className="space-y-4">
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
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
