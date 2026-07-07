-- 1. Add columns for CNIC verification to the user table
ALTER TABLE public.user 
ADD COLUMN IF NOT EXISTS cnic_number TEXT,
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'unverified';

-- 2. Update the public_user_profiles view to include verification_status (if needed by UI)
DROP VIEW IF EXISTS public.public_user_profiles;
CREATE OR REPLACE VIEW public.public_user_profiles AS
SELECT 
    id,
    name,
    image,
    last_seen,
    verification_status
FROM public.user;
