-- Migration 0014: Increase Message Character Limit to 100k
-- Allows messages (user and AI) up to 100000 chars
-- Date: 2026-01-16

-- =====================================================
-- 1. REMOVE OLD CONSTRAINT (15000 CHARS)
-- =====================================================

DO $$ 
BEGIN
  -- Drop the existing 15000 char constraint if it exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'chat_messages_content_max_length'
  ) THEN
    ALTER TABLE public.chat_messages 
    DROP CONSTRAINT chat_messages_content_max_length;
    
    RAISE NOTICE 'Removed old 15000 char constraint';
  ELSE
    RAISE NOTICE 'Old constraint does not exist, skipping';
  END IF;
END $$;

-- =====================================================
-- 2. ADD NEW CONSTRAINT (100000 CHARS)
-- =====================================================

DO $$ 
BEGIN
  -- Add new constraint allowing up to 100000 characters
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'chat_messages_content_max_length_100k'
  ) THEN
    ALTER TABLE public.chat_messages 
    ADD CONSTRAINT chat_messages_content_max_length_100k 
    CHECK (char_length(content) <= 100000);
    
    RAISE NOTICE 'Added new 100000 char constraint';
  ELSE
    RAISE NOTICE 'New constraint already exists';
  END IF;
END $$;

-- =====================================================
-- 3. UPDATE COMMENT
-- =====================================================

COMMENT ON CONSTRAINT chat_messages_content_max_length_100k ON public.chat_messages IS 
  'Limits message content to 100000 characters. Allows for very large context and meal plans.';
