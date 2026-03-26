-- Create Enum for CRM Stages
DO $$ BEGIN
    CREATE TYPE crm_stage AS ENUM ('Novo lead', 'Em contato', 'Trial 5d', 'Usando', 'Negociação', 'Ganho', 'Perdido', 'Remarketing');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create CRM Leads table
CREATE TABLE IF NOT EXISTS public.crm_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) DEFAULT NULL,
    email TEXT,
    stage crm_stage DEFAULT 'Novo lead',
    notes TEXT DEFAULT '',
    reminder_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    tasks JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS
ALTER TABLE public.crm_leads ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Admins can view and edit CRM leads." ON public.crm_leads;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

CREATE POLICY "Admins can view and edit CRM leads."
ON public.crm_leads
FOR ALL
USING ( public.is_admin() )
WITH CHECK ( public.is_admin() );

-- Function to sync trial users to CRM
CREATE OR REPLACE FUNCTION public.sync_trial_users_to_crm()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Insert users who have subscription_status = 'pending' and are not yet in crm_leads
    INSERT INTO public.crm_leads (user_id, email, stage)
    SELECT p.id, au.email, 'Novo lead'::crm_stage
    FROM public.profiles p
    JOIN auth.users au ON p.id = au.id
    WHERE p.subscription_status = 'pending'
      AND p.id NOT IN (SELECT user_id FROM public.crm_leads WHERE user_id IS NOT NULL);
END;
$$;
