import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { ChatMessage } from '@/lib/types';

/**
 * Hook para gerenciar mensagens de chat com persistência no Supabase
 * Carrega histórico ao montar e salva novas mensagens automaticamente
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
   * Carrega todas as mensagens do usuário (que não foram deletadas)
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

      // Buscar apenas mensagens NÃO deletadas (deleted_at IS NULL)
      const query = supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: true });

      // Executar query e capturar resultado
      let data: any = null;
      let fetchError: any = null;

      try {
        const res = await query;
        data = (res as any).data;
        fetchError = (res as any).error;
      } catch (err) {
        fetchError = err;
      }

      // Se houve erro (ex: coluna deleted_at não existe), tentar fallback sem o filtro `.is`
      if (fetchError) {
        console.warn('[useChatMessages] Erro na query com .is filter, tentando fallback:', fetchError);
        try {
          const res2 = await supabase
            .from('chat_messages')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: true });

          data = (res2 as any).data;
          fetchError = (res2 as any).error;

          if (fetchError) {
            console.error('[useChatMessages] Fallback também falhou:', fetchError);
            throw fetchError;
          }
        } catch (err2) {
          console.error('[useChatMessages] Fallback falhou com erro:', err2);
          throw err2;
        }
      }

      // Converter para ChatMessage[]
      const chatMessages: ChatMessage[] = (data || []).map((msg) => ({
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
   * Adiciona nova mensagem ao estado e salva no banco
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
   * Limpa todas as mensagens (Hard Delete)
   * Remove permanentemente do banco de dados
   */
  const clearMessages = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error('Usuário não autenticado');

      console.log('[useChatMessages] Iniciando limpeza de mensagens (Soft Delete)');

      // Soft delete: marcar como deletado
      const { error: updateError } = await supabase
        .from('chat_messages')
        .update({ deleted_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .is('deleted_at', null); // Apenas as que ainda não foram deletadas

      if (updateError) {
        console.error('[useChatMessages] Erro ao deletar mensagens:', updateError);
        throw updateError;
      }

      console.log('[useChatMessages] Mensagens marcadas como deletadas no banco');

      // Limpar estado local
      setMessages([]);
      setError(null);

      console.log('✅ Chat limpo com sucesso');
    } catch (err) {
      console.error('Erro ao limpar mensagens:', err);
      setError('Erro ao limpar histórico. Tente novamente.');
      throw err;
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
