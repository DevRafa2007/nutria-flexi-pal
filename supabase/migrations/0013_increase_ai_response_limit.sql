-- Migration 0013: Increase Message Character Limit
-- Allows messages (user and AI) up to 15000 chars
-- Date: 2025-12-28

-- =====================================================
-- CONTEXT
-- =====================================================
-- Increased limit to 15000 characters to allow:
-- 1. User messages with more context
-- 2. AI responses with multiple meal JSONs and explanations
-- 3. Flexibility for complex interactions
--
-- System prompt (NUTRITION_SYSTEM_PROMPT ~13.5KB) is NOT saved in database.

-- =====================================================
-- 1. REMOVE OLD CONSTRAINT
-- =====================================================

DO $$ 
BEGIN
  -- Drop the existing 2000 char constraint if it exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'chat_messages_content_length_check'
  ) THEN
    ALTER TABLE public.chat_messages 
    DROP CONSTRAINT chat_messages_content_length_check;
    
    RAISE NOTICE 'Removed old 2000 char constraint';
  ELSE
    RAISE NOTICE 'Old constraint does not exist, skipping';
  END IF;
END $$;

-- =====================================================
-- 2. ADD NEW CONSTRAINT (4000 CHARS)
-- =====================================================

DO $$ 
BEGIN
  -- Add new constraint allowing up to 15000 characters
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'chat_messages_content_max_length'
  ) THEN
    ALTER TABLE public.chat_messages 
    ADD CONSTRAINT chat_messages_content_max_length 
    CHECK (char_length(content) <= 15000);
    
    RAISE NOTICE 'Added new 15000 char constraint';
  ELSE
    RAISE NOTICE 'New constraint already exists';
  END IF;
END $$;

-- =====================================================
-- 3. UPDATE COMMENT
-- =====================================================

COMMENT ON CONSTRAINT chat_messages_content_max_length ON public.chat_messages IS 
  'Limits message content to 15000 characters. Allows both user messages and AI responses to be longer for complex interactions.';

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check constraint was applied correctly
DO $$ 
DECLARE
  constraint_def text;
BEGIN
  SELECT pg_get_constraintdef(oid) INTO constraint_def
  FROM pg_constraint
  WHERE conname = 'chat_messages_content_max_length';
  
  RAISE NOTICE 'New constraint definition: %', constraint_def;
END $$;
