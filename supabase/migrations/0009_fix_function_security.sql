-- Fix Function Search Path vulnerability
-- This migration adds secure search_path to functions to prevent schema injection attacks

-- Step 1: Drop the trigger first (to remove dependency)
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;

-- Step 2: Now we can safely drop the function
DROP FUNCTION IF EXISTS public.update_profiles_updated_at();

-- Step 3: Recreate the function with secure search_path
CREATE OR REPLACE FUNCTION public.update_profiles_updated_at()
RETURNS trigger 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  new.updated_at = timezone('utc'::text, now());
  RETURN new;
END;
$$;

-- Step 4: Recreate the trigger
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_profiles_updated_at();

-- Check if there's an update_updated_at_column function and fix it too
-- This is a common pattern in Supabase projects
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  new.updated_at = timezone('utc'::text, now());
  RETURN new;
END;
$$;

-- Comment to document the security fix
COMMENT ON FUNCTION public.update_profiles_updated_at() IS 
  'Auto-updates updated_at timestamp. SECURITY DEFINER with search_path set to prevent injection attacks.';

COMMENT ON FUNCTION public.update_updated_at_column() IS 
  'Generic function to auto-update updated_at timestamp. SECURITY DEFINER with search_path set to prevent injection attacks.';
