-- 1. Add fields to crm_leads
ALTER TABLE public.crm_leads 
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS value NUMERIC(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS social_id TEXT;

-- Index for fast lookup by social_id (Webhook incoming)
CREATE INDEX IF NOT EXISTS idx_crm_leads_social_id ON public.crm_leads(social_id);

-- 2. Create crm_messages table
CREATE TABLE IF NOT EXISTS public.crm_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES public.crm_leads(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_from_user BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS for crm_messages
ALTER TABLE public.crm_messages ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Admins can view and edit crm_messages." ON public.crm_messages;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

CREATE POLICY "Admins can view and edit crm_messages."
ON public.crm_messages
FOR ALL
USING ( public.is_admin() )
WITH CHECK ( public.is_admin() );
