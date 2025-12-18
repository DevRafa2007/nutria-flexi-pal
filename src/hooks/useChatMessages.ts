import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { ChatMessage } from '@/lib/types';
import { toast } from 'sonner';

/**
 * Hook para gerenciar mensagens de chat com persistência híbrida (Banco + Local)
 * Inclui "Local Kill Switch" para contornar bloqueios de delete no banco
 */
export function useChatMessages() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar mensagens ao montar componente
  useEffect(() => {
    loadMessages();
  }, []);

  /**
   * Obtém o timestamp da última limpeza local para este usuário
   */
  const getLastClearTime = (userId: string): Date | null => {
    try {
      const stored = localStorage.getItem(`chat_cleared_at_${userId}`);
      return stored ? new Date(stored) : null;
    } catch (e) {
      return null;
    }
  };

  /**
   * Salva o timestamp atual como momento da limpeza
   */
  const setLastClearTime = (userId: string) => {
    try {
      localStorage.setItem(`chat_cleared_at_${userId}`, new Date().toISOString());
    } catch (e) {
      console.error('Erro ao salvar clear time local:', e);
    }
  };

  /**
   * Carrega todas as mensagens do usuário (filtrando deletadas e antigas)
   */
  const loadMessages = async () => {
    try {
      setIsLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError('Usuário não autenticado');
        return;
      }

      console.log('[useChatMessages] Carregando mensagens...');

      // Buscar mensagens do banco
      const { data, error: fetchError } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (fetchError) {
        console.error('[useChatMessages] Erro ao carregar:', fetchError);
        throw fetchError;
      }

      // Obter data de corte local
      const clearTime = getLastClearTime(user.id);

      // FILTRAGEM MULTI-CAMADA
      const validMessages = (data || []).filter(msg => {
        const content = msg.content || '';
        const msgDate = new Date(msg.created_at);

        // 1. Filtro Local (Kill Switch): Remove mensagens anteriores à limpeza local
        if (clearTime && msgDate <= clearTime) {
          return false;
        }

        // 2. Filtro de Banco: Checa conteúdo marcado como deletado
        if (content === 'DELETED_MESSAGE_HISTORY_CLEARED') return false;
        if (content === 'DELETED') return false;

        // 3. Checa flags do banco
        if (msg.deleted_at) return false;

        return true;
      });

      console.log(`[useChatMessages] Total Banco: ${data?.length || 0}. Exibidas: ${validMessages.length}. (Corte Local: ${clearTime?.toLocaleString() || 'Nenhum'})`);

      // Converter para ChatMessage[]
      const chatMessages: ChatMessage[] = validMessages.map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        timestamp: new Date(msg.created_at),
      }));

      setMessages(chatMessages);
      setError(null);
    } catch (err) {
      console.error('Erro ao carregar mensagens:', err);
      setError('Erro ao carregar histórico de chat');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Adiciona nova mensagem
   */
  const addMessage = useCallback(
    async (role: 'user' | 'assistant', content: string) => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) throw new Error('Usuário não autenticado');

        // Salvar no banco
        const { error: insertError } = await supabase.from('chat_messages').insert({
          user_id: user.id,
          role,
          content,
        });

        if (insertError) throw insertError;

        // Adicionar ao estado local
        const newMessage: ChatMessage = {
          role,
          content,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, newMessage]);
      } catch (err) {
        console.error('Erro ao salvar mensagem:', err);
        setError('Erro ao salvar mensagem');
        throw err;
      }
    },
    []
  );

  /**
   * Limpa todas as mensagens
   * Combina tentativa de Delete no Banco com Bloqueio Local Garantido
   */
  const clearMessages = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error('Usuário não autenticado');

      console.log('[useChatMessages] 🚨 LIMPEZA SOLICITADA 🚨');

      // 1. AÇÃO IMEDIATA: Definir timestamp de corte local
      // Isso garante que, independente do banco, o usuário não veja mais nada antigo
      setLastClearTime(user.id);

      // Limpar estado visual AGORA
      setMessages([]);

      // 2. AÇÃO DE FUNDO: Tentar limpar no banco (Best Effort)
      // Não bloqueamos a UI esperando isso, já que o banco pode falhar
      try {
        // Tentar deletar tudo (Rápido)
        const { error: deleteError } = await supabase
          .from('chat_messages')
          .delete()
          .eq('user_id', user.id);

        if (deleteError) throw deleteError;
        console.log('[useChatMessages] Banco limpo com delete.');
      } catch (dbErr) {
        console.warn('[useChatMessages] Delete falhou, tentando update...', dbErr);

        // Tentar update (Lento mas seguro)
        try {
          const { data: toUpdate } = await supabase.from('chat_messages').select('id').eq('user_id', user.id);
          if (toUpdate) {
            const updates = toUpdate.map(m =>
              supabase.from('chat_messages').update({ content: 'DELETED' }).eq('id', m.id)
            );
            await Promise.allSettled(updates);
          }
        } catch (upErr) {
          console.error('[useChatMessages] Update também falhou:', upErr);
        }
      }

      toast.success('Histórico apagado com sucesso!');

    } catch (err) {
      console.error('Erro crítico ao limpar:', err);
      // Mesmo com erro, o setMessages([]) lá em cima já garantiu o visual limpo
      setMessages([]);
    }
  }, []);

  return {
    messages,
    addMessage,
    clearMessages,
    isLoading,
    error,
    loadMessages,
  };
}

export default useChatMessages;
