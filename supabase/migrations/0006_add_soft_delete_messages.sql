-- Adicionar coluna deleted_at para soft delete de mensagens de chat
-- Soft delete permite manter histórico para auditoria enquanto esconde dados do usuário

ALTER TABLE public.chat_messages
ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone DEFAULT NULL;

-- Criar index para performance ao filtrar mensagens não deletadas
CREATE INDEX IF NOT EXISTS idx_chat_messages_deleted_at 
ON public.chat_messages(user_id, deleted_at) 
WHERE deleted_at IS NULL;
