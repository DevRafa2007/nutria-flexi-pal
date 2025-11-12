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
   * Carrega todas as mensagens do usuário
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

      const { data, error: fetchError } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;

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
   * Limpa todas as mensagens (usuário decidiu resetar)
   */
  const clearMessages = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error('Usuário não autenticado');

      // Primeiro limpar o estado local
      setMessages([]);

      // Depois deletar do banco com tratamento robusto
      const { error: deleteError } = await supabase
        .from('chat_messages')
        .delete()
        .eq('user_id', user.id);

      if (deleteError) {
        console.error('Erro ao deletar do Supabase:', deleteError);
        // Mesmo com erro, o estado local já foi limpo
        throw deleteError;
      }

      console.log('✅ Chat limpo com sucesso');
    } catch (err) {
      console.error('Erro ao limpar mensagens:', err);
      // Recarregar para sincronizar estado
      await loadMessages();
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
