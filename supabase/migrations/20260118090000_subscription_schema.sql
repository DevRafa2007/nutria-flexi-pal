-- Migration: Subscription Schema & Security
-- Description: Adds subscription fields to profiles and secures them via RLS
-- Date: 2026-01-18

-- 1. Create Enums for Plan and Status
DO $$ BEGIN
    CREATE TYPE public.subscription_plan AS ENUM ('free', 'basic', 'pro', 'premium');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.subscription_status AS ENUM ('active', 'canceled', 'incomplete', 'incomplete_expired', 'past_due', 'trialing', 'unpaid');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Add columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS stripe_customer_id text,
ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
ADD COLUMN IF NOT EXISTS subscription_plan public.subscription_plan DEFAULT 'free'::public.subscription_plan,
ADD COLUMN IF NOT EXISTS subscription_status public.subscription_status,
ADD COLUMN IF NOT EXISTS current_period_end timestamp with time zone;

-- Index for performance on plan lookups
CREATE INDEX IF NOT EXISTS profiles_subscription_plan_idx ON public.profiles(subscription_plan);

-- 3. Security (RLS) - Protect Subscription Fields
-- Only service_role (webhooks/admin) can UPDATE subscription fields.
-- Users can READ their own subscription fields but CANNOT update them.

-- First, ensure RLS is enabled (should already be, but good practice)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing update policy if it allows too much
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;

-- Create a more restrictive update policy for users
-- This allows updating first_name, last_name, but NOT subscription fields
-- PostgreSQL RLS doesn't support column-level granularity directly in USING/WITH CHECK easily for updates 
-- without complex 'OLD' checks or separate function. 
-- SIMPLER APPROACH: Use a Trigger to prevent user updates to specific columns if the user is not service_role.

CREATE OR REPLACE FUNCTION public.protect_subscription_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- If the user is NOT a service_role (i.e., is a normal authenticated user)
  IF (auth.jwt() ->> 'role') != 'service_role' THEN
    -- Check if restricted columns are being modified
    IF (NEW.subscription_plan IS DISTINCT FROM OLD.subscription_plan) OR
       (NEW.subscription_status IS DISTINCT FROM OLD.subscription_status) OR
       (NEW.stripe_customer_id IS DISTINCT FROM OLD.stripe_customer_id) OR
       (NEW.stripe_subscription_id IS DISTINCT FROM OLD.stripe_subscription_id) OR
       (NEW.current_period_end IS DISTINCT FROM OLD.current_period_end) THEN
       
       RAISE EXCEPTION 'You are not authorized to modify subscription details directly.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create Trigger
DROP TRIGGER IF EXISTS protect_subscription_fields_trigger ON public.profiles;
CREATE TRIGGER protect_subscription_fields_trigger
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.protect_subscription_fields();

-- Re-create the general update policy allowing users to update their own row (but trigger will filter columns)
CREATE POLICY "Users can update own profile."
  ON public.profiles FOR UPDATE
  USING ( auth.uid() = id );
