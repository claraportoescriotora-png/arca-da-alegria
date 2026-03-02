-- ========================================================
-- RLS AUDIT POLICIES
-- Garante que todas as tabelas com dados de usuários
-- estejam 100% protegidas e filtradas por user_id.
-- ========================================================

-- 1. user_mission_progress
ALTER TABLE public.user_mission_progress ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can view own mission progress" ON public.user_mission_progress;
    DROP POLICY IF EXISTS "Users can insert own mission progress" ON public.user_mission_progress;
    DROP POLICY IF EXISTS "Users can update own mission progress" ON public.user_mission_progress;
    DROP POLICY IF EXISTS "Users can delete own mission progress" ON public.user_mission_progress;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

CREATE POLICY "Users can view own mission progress" 
ON public.user_mission_progress FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own mission progress" 
ON public.user_mission_progress FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own mission progress" 
ON public.user_mission_progress FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own mission progress" 
ON public.user_mission_progress FOR DELETE 
USING (auth.uid() = user_id);

-- 2. user_mission_enrollments
ALTER TABLE public.user_mission_enrollments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can view own mission enrollments" ON public.user_mission_enrollments;
    DROP POLICY IF EXISTS "Users can insert own mission enrollments" ON public.user_mission_enrollments;
    DROP POLICY IF EXISTS "Users can update own mission enrollments" ON public.user_mission_enrollments;
    DROP POLICY IF EXISTS "Users can delete own mission enrollments" ON public.user_mission_enrollments;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

CREATE POLICY "Users can view own mission enrollments" 
ON public.user_mission_enrollments FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own mission enrollments" 
ON public.user_mission_enrollments FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own mission enrollments" 
ON public.user_mission_enrollments FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own mission enrollments" 
ON public.user_mission_enrollments FOR DELETE 
USING (auth.uid() = user_id);

-- 3. PROFILES (Reforçando segurança)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Manter select público (para ranks, mas caso queira privado, mude aqui futuramente)
-- Manter a policy existente para users alterarem o próprio perfil.
-- Apenas garantindo que RLS está habilitado.
