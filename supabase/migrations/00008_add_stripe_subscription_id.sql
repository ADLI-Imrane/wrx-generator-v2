-- Add stripe_subscription_id column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_subscription_id ON public.profiles(stripe_subscription_id);
