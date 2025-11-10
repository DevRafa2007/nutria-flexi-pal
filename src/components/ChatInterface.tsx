import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Send, Sparkles, User } from "lucide-react";
import { toast } from "sonner";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Olá! 👋 Sou a myNutrIA, sua assistente de nutrição inteligente. Para começar, me conte: qual é seu objetivo principal? (Emagrecer, ganhar massa muscular, ou manter peso)"
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    // Simulate AI response (in production, this would call an AI API)
    setTimeout(() => {
      const responses = [
        "Entendi! Vou precisar de algumas informações para criar seu plano personalizado. Qual seu peso atual (em kg)?",
        "Perfeito! E qual sua altura em centímetros?",
        "Ótimo! Qual seu nível de atividade física? (Sedentário, Leve, Moderado, Intenso)",
        "Excelente! Baseado nas suas informações, calculei suas necessidades. Você precisa de aproximadamente 2000 kcal/dia para atingir seu objetivo. Vou montar um plano com os alimentos que você mencionou!",
        "Aqui está um exemplo de distribuição de macros para você:\n\n🍚 Carboidratos: 250g (50%)\n🥩 Proteínas: 150g (30%)\n🥑 Gorduras: 44g (20%)\n\nPosso ajustar essas quantidades. Tem alguma preferência?"
      ];
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      setMessages(prev => [...prev, { role: "assistant", content: randomResponse }]);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <section id="chat" className="py-12 sm:py-16 lg:py-20 px-4 bg-muted/30">
      <div className="container max-w-4xl mx-auto">
        <div className="text-center mb-8 sm:mb-10 lg:mb-12 space-y-3 sm:space-y-4">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold">
            <span className="text-gradient">Converse com a IA</span>
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-muted-foreground px-4">
            Inicie sua jornada para uma alimentação mais saudável agora
          </p>
        </div>

        <Card className="shadow-soft border-border/50">
          <CardHeader className="bg-gradient-primary rounded-t-xl p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 sm:gap-3 text-primary-foreground">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <div className="text-base sm:text-lg">myNutrIA Assistant</div>
                <div className="text-xs sm:text-sm font-normal opacity-90">Pronto para ajudar</div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-[400px] sm:h-[450px] lg:h-[500px] overflow-y-auto p-4 sm:p-6 space-y-3 sm:space-y-4">
              {messages.map((message, idx) => (
                <div
                  key={idx}
                  className={`flex gap-2 sm:gap-3 ${message.role === "user" ? "justify-end" : ""}`}
                >
                  {message.role === "assistant" && (
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-primary-foreground" />
                    </div>
                  )}
                  <div
                    className={`rounded-2xl p-3 sm:p-4 max-w-[85%] sm:max-w-[80%] whitespace-pre-wrap text-sm sm:text-base ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground rounded-tr-sm"
                        : "bg-muted rounded-tl-sm"
                    }`}
                  >
                    {message.content}
                  </div>
                  {message.role === "user" && (
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                      <User className="w-3 h-3 sm:w-4 sm:h-4 text-secondary-foreground" />
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-2 sm:gap-3">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-primary-foreground animate-pulse" />
                  </div>
                  <div className="bg-muted rounded-2xl rounded-tl-sm p-3 sm:p-4">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" />
                      <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0.1s" }} />
                      <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0.2s" }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-3 sm:p-4 border-t border-border/50">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Digite sua mensagem..."
                  className="flex-1 text-sm sm:text-base"
                  disabled={isLoading}
                />
                <Button
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  className="bg-primary hover:bg-primary-dark px-3 sm:px-4"
                  size="default"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs sm:text-sm text-muted-foreground mt-4 sm:mt-6 px-4">
          💡 Esta é uma demonstração. Em produção, a IA usaria modelos avançados para respostas reais.
        </p>
      </div>
    </section>
  );
};

export default ChatInterface;
