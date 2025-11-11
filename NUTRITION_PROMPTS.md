# 🎯 Exemplos de Prompts para Nutrição

Use esses prompts como referência ao conversar com a IA.

---

## ℹ️ Fornecer Informações Pessoais

### Básico
```
"Oi, meu nome é João, tenho 25 anos, peso 80kg e altura 1.80m"
"Sou homem e treino na academia 4 vezes por semana"
```

### Com Detalhes
```
"Tenho 30 anos, mulher, peso 65kg, altura 1.65m. 
Trabalho em escritório (sedentário) mas caminho 30min 3x por semana.
Quero perder 5kg nos próximos 3 meses."
```

### Com Restrições
```
"Tenho alergia a amendoim e sou intolerante a lactose.
Não como carne vermelha por questões pessoais.
Prefiro alimentos práticos que posso levar para o trabalho."
```

---

## 🎯 Solicitações de Objetivos

### Perda de Peso
```
"Quero emagrecer 10kg"
"Preciso perder peso para melhorar minha saúde"
"Tenho sobrepeso e quero voltar ao peso ideal"
```

### Ganho de Massa Muscular
```
"Quero ganhar massa muscular e definição"
"Estou tentando aumentar meu peso de forma saudável"
"Preciso de um plano de refeição para hipertrofia"
```

### Manutenção
```
"Quero manter meu peso atual mas melhorar composição corporal"
"Já estou satisfeito com meu corpo, só quero otimizar saúde"
```

---

## 🍽️ Solicitações de Refeições

### Para um Dia Completo
```
"Crie um plano de refeição completo para amanhã
Com café da manhã, lanche, almoço, lanche e jantar"
```

### Refeição Específica
```
"Quero uma opção de café da manhã rápida para fazer em 5 minutos"
"Crie um almoço saudável que posso congelar"
"Preciso de um lanche pós-treino com bom custo-benefício"
```

### Com Preferências
```
"Refeição vegetariana com 40g de proteína"
"Almoço sem carboidratos refinados"
"Jantar usando apenas ingredientes que tenho em casa"
```

---

## 📊 Solicitações de Análise

### TDEE e Macros
```
"Qual é meu TDEE?"
"Qual deve ser minha ingestão de proteína?"
"Como distribuir macros para ganhar massa?"
```

### Detalhes
```
"Quantas calorias devo comer para perder 1kg por semana?"
"Qual a proporção ideal de carboidratos para meu objetivo?"
"Preciso de mais proteína?"
```

---

## 🔄 Conversações Completas

### Exemplo 1: Iniciante Sedentário
```
Usuário: "Oi, sou iniciante em nutrição"

IA: "Bem-vindo! Para criar um plano personalizado, preciso saber:
1. Qual seu objetivo?
2. Qual sua idade, peso, altura?"

Usuário: "Tenho 28 anos, peso 85kg, altura 1.75m, sou homem.
Quero emagrecer 10kg nos próximos 6 meses"

IA: "Ótimo! Mais algumas informações:
3. Qual seu nível de atividade? (sedentário, leve, moderado)
4. Tem alguma alergia ou restrição alimentar?"

Usuário: "Sou sedentário, trabalho em escritório.
Não tenho alergias, como tudo"

IA: "Perfeito! Calculei seu TDEE em ~2500 kcal/dia.
Para perder 1kg por semana, você precisa de ~1800 kcal/dia.
Recomendo: 150g proteína, 180g carbos, 50g gordura

Quer que eu crie um plano de refeição para amanhã?"

Usuário: "Sim! Com café, almoço e jantar"

IA: [Retorna 3 refeições em JSON com macros]
```

### Exemplo 2: Atleta em Fase de Bulking
```
Usuário: "Treino musculação há 3 anos, tenho 165 libras"

IA: "Excelente! Para fase de bulking:
Qual seu TDEE aproximado?
Quantas vezes por semana treina?"

Usuário: "Treino 5x por semana, meu TDEE é 2700"

IA: "Para ganho de massa limpa, recomendo +300 a 500 calorias acima do TDEE
Isso significa ~3000-3200 kcal/dia
Macros: 220g proteína, 350g carbos, 80g gordura

Quer refeições focadas em ganho de massa?"

Usuário: "Sim, com muita proteína"

IA: [Retorna refeições altas em proteína]
```

---

## 📋 Checklist de Informações

Use este checklist ao descrever seu perfil:

- [ ] Idade
- [ ] Peso (em kg)
- [ ] Altura (em cm ou metros)
- [ ] Sexo (masculino/feminino)
- [ ] Objetivo (emagrecer/ganhar/manter)
- [ ] Nível de atividade
- [ ] Alergias
- [ ] Preferências alimentares
- [ ] Restrições dietéticas
- [ ] Tempo disponível para cozinhar

---

## 🎨 Dicas para Melhores Resultados

### 1. Seja Específico
❌ "Preciso de um plano"
✅ "Preciso de 3 refeições com ~600 kcal cada, sem glúten"

### 2. Forneça Contexto
❌ "Qual é meu TDEE?"
✅ "Tenho 80kg, 1.80m, 28 anos, homem, sedentário. Qual é meu TDEE?"

### 3. Use Unidades Consistentes
❌ "Peso 170 (em libras?), altura 5'10\""
✅ "Peso 77kg, altura 1.78m"

### 4. Descreva Seu Estilo de Vida
❌ "Sedentário"
✅ "Trabalho em casa, não treino, caminho 30min por dia"

### 5. Mencione Limitações
❌ "Sou vegetariano"
✅ "Sou ovo-lacto vegetariano, como ovos e queijo mas não carne"

---

## 💡 Dúvidas Comuns

### "Como faço para obter as medidas em colheres?"
```
"Pode reformatar essas medidas em colheres de sopa?"
ou
Na tela, clique no dropdown de unidade e escolha "colheres"
```

### "Qual alimento posso usar como substituto?"
```
"Qual é um substituto bom para [alimento]?"
"Posso trocar frango por peixe?"
```

### "Como aumentar proteína mas reduzir calorias?"
```
"Recomende refeições com 40g de proteína mas apenas 400 kcal"
```

### "Meu plano é muito caro"
```
"Crie um plano econômico com ingredientes baratos"
"Use ingredientes que custam menos de R$2 por porção"
```

---

## 🚀 Prompts Avançados

### Análise de Refeição Existente
```
"Analisei meu café hoje: 2 ovos fritos, 2 fatias pão, 1 copo leite
Qual foi meu macros? É balanceado para meu objetivo?"
```

### Plano de 30 Dias
```
"Crie um plano de refeição variado para 30 dias
Com 2000 kcal diárias, sem repetir refeição na mesma semana"
```

### Adaptação para Ingredientes Disponíveis
```
"Tenho na geladeira: frango, arroz, brócolis, ovos, banana, iogurte
Crie 3 refeições com esses ingredientes"
```

### Otimização de Custo
```
"Quero ganhar massa mas com orçamento de R$50/dia
Qual o melhor plano de refeição?"
```

---

## 📱 Usando no App

### 1. Abra o Chat
Vá para Dashboard → Chat IA

### 2. Inicie a Conversa
Copie um prompt acima ou crie o seu

### 3. Forneça Informações Gradualmente
Não precisa de tudo de uma vez

### 4. Peça Ajustes
"Pode aumentar a proteína?"
"Pode usar frango ao invés de peixe?"

### 5. Salve a Refeição
Clique em "Salvar" quando gostar

---

Bom uso! 🚀
