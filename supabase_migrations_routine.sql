-- 1. Create children table
CREATE TABLE public.children (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    avatar_url TEXT,
    talent_points INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Add columns to profiles for the Moreh Filter (PIN) and system hygiene
ALTER TABLE public.profiles
ADD COLUMN moreh_pin TEXT,
ADD COLUMN hygiene_days INTEGER DEFAULT 30;

-- 3. Create routine_templates table (The tasks defined by the parents)
CREATE TABLE public.routine_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    child_id UUID REFERENCES public.children(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    requires_photo BOOLEAN DEFAULT false,
    is_mandatory BOOLEAN DEFAULT true,
    linked_content_url TEXT,
    schedule_type TEXT NOT NULL, -- 'daily', 'weekly', 'specific_date'
    schedule_days JSONB, -- [1,2,3,4,5] for weekdays etc.
    schedule_time TIME,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create daily_tasks table (The instances of tasks for a specific day)
CREATE TABLE public.daily_tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    template_id UUID REFERENCES public.routine_templates(id) ON DELETE CASCADE,
    child_id UUID REFERENCES public.children(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed_pending_review', 'approved', 'grace_approved', 'failed')),
    evidence_url TEXT,
    justification TEXT,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(template_id, date, child_id)
);

-- 5. Enable RLS
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routine_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_tasks ENABLE ROW LEVEL SECURITY;

-- 6. Create Policies

-- Children policies
CREATE POLICY "Users can view their own children" 
ON public.children FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own children" 
ON public.children FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own children" 
ON public.children FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own children" 
ON public.children FOR DELETE 
USING (auth.uid() = user_id);

-- Routine Templates policies
CREATE POLICY "Users can view their own routine templates" 
ON public.routine_templates FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own routine templates" 
ON public.routine_templates FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own routine templates" 
ON public.routine_templates FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own routine templates" 
ON public.routine_templates FOR DELETE 
USING (auth.uid() = user_id);

-- Daily Tasks policies
CREATE POLICY "Users can view their children's tasks" 
ON public.daily_tasks FOR SELECT 
USING (
    child_id IN (SELECT id FROM public.children WHERE user_id = auth.uid())
);

CREATE POLICY "Users can insert their children's tasks" 
ON public.daily_tasks FOR INSERT 
WITH CHECK (
    child_id IN (SELECT id FROM public.children WHERE user_id = auth.uid())
);

CREATE POLICY "Users can update their children's tasks" 
ON public.daily_tasks FOR UPDATE 
USING (
    child_id IN (SELECT id FROM public.children WHERE user_id = auth.uid())
);

CREATE POLICY "Users can delete their children's tasks" 
ON public.daily_tasks FOR DELETE 
USING (
    child_id IN (SELECT id FROM public.children WHERE user_id = auth.uid())
);

-- 7. Create Storage Bucket for Evidences
INSERT INTO storage.buckets (id, name, public) VALUES ('evidences', 'evidences', false);

-- Storage Policies for Evidences
CREATE POLICY "Users can upload evidences"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'evidences' AND auth.uid() = (SELECT user_id FROM public.children WHERE id::text = (storage.foldername(name))[1])
);

CREATE POLICY "Users can view their evidences"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'evidences' AND auth.uid() = (SELECT user_id FROM public.children WHERE id::text = (storage.foldername(name))[1])
);

CREATE POLICY "Users can delete their evidences"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'evidences' AND auth.uid() = (SELECT user_id FROM public.children WHERE id::text = (storage.foldername(name))[1])
);
