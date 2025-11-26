/**
 * Utilitário para formatar e mascarar mensagens do chat
 * Remove JSON e outros dados técnicos, deixando apenas mensagens legíveis
 */

export interface MessageMetadata {
  hasJSON: boolean;
  mealCreated?: string;
  mealType?: string;
  jsonContent?: any;
}

/**
 * Extrai JSON de uma string
 * Procura por padrões { ... } no texto
 */
export const extractJSON = (text: string): any | null => {
  if (!text) return null;

  // Encontrar todos os possíveis blocos JSON (objetos e arrays)
  const candidates: string[] = [];
  const objectMatches = text.match(/\{[\s\S]*?\}/g);
  const arrayMatches = text.match(/\[[\s\S]*?\]/g);

  if (objectMatches) candidates.push(...objectMatches);
  if (arrayMatches) candidates.push(...arrayMatches);

  // Tentar parsear cada candidato (do último para o primeiro, pois o JSON relevante costuma vir por último)
  for (let i = candidates.length - 1; i >= 0; i--) {
    const candidate = candidates[i];
    try {
      const parsed = JSON.parse(candidate);
      return parsed;
    } catch (err) {
      // tentar sanear vírgulas finais comuns e reparsear
      try {
        const cleaned = candidate.replace(/,\s*([}\]])/g, "$1");
        const parsed2 = JSON.parse(cleaned);
        return parsed2;
      } catch (err2) {
        // ignora e continua
      }
    }
  }

  return null;
};

/**
 * Remove JSON de uma mensagem, mantendo apenas o texto legível
 * Exemplo: "Fiz seu café da manhã { "name": "café" }" → "Fiz seu café da manhã"
 */
export const stripJSONFromMessage = (content: string): string => {
  if (!content) return content;

  // Remover blocos de código (```...```) primeiro
  let cleaned = content.replace(/```[\s\S]*?```/g, "");

  // Iterativamente remover objetos/arrays JSON (blocos grandes)
  let prev = null;
  while (prev !== cleaned) {
    prev = cleaned;
    cleaned = cleaned.replace(/\{[\s\S]*\}/g, "");
    cleaned = cleaned.replace(/\[[\s\S]*\]/g, "");
  }

  // Remover fragmentos sobrando de JSON, como ',]' ou ',}' ou ',"totals":}'
  cleaned = cleaned.replace(/,\s*([\]}])/g, "$1");
  cleaned = cleaned.replace(/\s*\"?\w+\"?:\s*\}?\}?\]?/g, "");

  // Substituir múltiplas quebras de linha por uma
  cleaned = cleaned.replace(/\n\s*\n/g, "\n");

  // Trim e fallback
  cleaned = cleaned.trim();
  if (!cleaned) return content;
  return cleaned;
};

/**
 * Processa uma mensagem da IA e retorna versão formatada + metadata
 */
export const processAssistantMessage = (
  content: string
): {
  displayContent: string;
  metadata: MessageMetadata;
} => {
  const jsonData = extractJSON(content);
  const displayContent = stripJSONFromMessage(content);

  const metadata: MessageMetadata = {
    hasJSON: jsonData !== null,
    jsonContent: jsonData,
  };

  if (jsonData) {
    // Tentar extrair informações úteis
    if (typeof jsonData === "object") {
      if (jsonData.name) metadata.mealCreated = jsonData.name;
      metadata.mealType = jsonData.meal_type || jsonData.type || metadata.mealType;

      // Totais podem vir em diferentes chaves
      const totals = jsonData.totals || jsonData.total || jsonData.total_macros || null;
      if (totals && typeof totals === "object") {
        metadata.jsonContent = { ...jsonData, totals };
      }
    }
  }

  return {
    displayContent,
    metadata,
  };
};

/**
 * Formata uma mensagem para exibição no chat
 * - Para mensagens do usuário: retorna como está
 * - Para mensagens da IA: remove JSON se houver
 */
export const formatMessageForDisplay = (
  role: "user" | "assistant",
  content: string
): string => {
  if (role === "user") {
    return content;
  }

  // Para assistant, remover JSON e retornar texto legível
  return stripJSONFromMessage(content);
};

/**
 * Gera um resumo visual de uma ação realizada
 * Exemplo: "Criou café da manhã: Ovos e Aveia"
 */
export const generateActionSummary = (metadata: MessageMetadata): string => {
  if (metadata.mealCreated && metadata.mealType) {
    return `${metadata.mealType.charAt(0).toUpperCase() + metadata.mealType.slice(1)}: ${metadata.mealCreated}`;
  }

  // Caso tenha apenas nome
  if (metadata.mealCreated) return `Ref: ${metadata.mealCreated}`;

  return "";
};
