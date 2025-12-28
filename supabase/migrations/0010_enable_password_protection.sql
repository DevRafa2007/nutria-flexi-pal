-- Enable Leaked Password Protection for Auth
-- This helps prevent users from using passwords that have been compromised in data breaches

-- Note: This setting is typically managed through Supabase Dashboard or auth config
-- If running locally, ensure your supabase/config.toml has:
-- [auth]
-- enable_signup = true
-- [auth.password]
-- enable_leaked_password_protection = true

-- This SQL updates the auth configuration if supported
-- Some auth settings may require Dashboard configuration

-- Enable additional password security measures
DO $$
BEGIN
  -- Try to enable leaked password protection via auth schema
  -- This may require superuser privileges or be Dashboard-only
  
  -- Log that this migration ran
  RAISE NOTICE 'Leaked password protection should be enabled via Supabase Dashboard';
  RAISE NOTICE 'Go to: Project Settings > Authentication > Password Protection';
  RAISE NOTICE 'Enable: "Leaked Password Protection"';
END $$;

-- Create a table to track password policy compliance (optional)
CREATE TABLE IF NOT EXISTS public.password_policy_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE,
  event_type text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Enable RLS on password policy log
ALTER TABLE public.password_policy_log ENABLE ROW LEVEL SECURITY;

-- Drop policy if it exists
DROP POLICY IF EXISTS "Only service role can access password policy logs" ON public.password_policy_log;

-- Only admins can view password policy logs
CREATE POLICY "Only service role can access password policy logs"
  ON public.password_policy_log
  FOR ALL
  USING (auth.role() = 'service_role');

COMMENT ON TABLE public.password_policy_log IS 
  'Logs password policy events. Access restricted to service role only.';
