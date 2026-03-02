-- Corrigindo as políticas de segurança RLS (Row Level Security) 
-- para as tabelas mission_packs e missions permitirem cadastro via Painel Admin

-- Habilitar RLS nas tabelas (por segurança)
ALTER TABLE public.mission_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;

-- ======== MISSION_PACKS ========
-- 1. Qualquer um pode ler os pacotes de missões
DROP POLICY IF EXISTS "Packs are viewable by everyone" ON public.mission_packs;
CREATE POLICY "Packs are viewable by everyone" ON public.mission_packs FOR SELECT USING (true);

-- 2. Permitir Inserção
DROP POLICY IF EXISTS "Packs can be inserted" ON public.mission_packs;
CREATE POLICY "Packs can be inserted" ON public.mission_packs FOR INSERT WITH CHECK (true);

-- 3. Permitir Edição
DROP POLICY IF EXISTS "Packs can be updated" ON public.mission_packs;
CREATE POLICY "Packs can be updated" ON public.mission_packs FOR UPDATE USING (true);

-- 4. Permitir Exclusão
DROP POLICY IF EXISTS "Packs can be deleted" ON public.mission_packs;
CREATE POLICY "Packs can be deleted" ON public.mission_packs FOR DELETE USING (true);


-- ======== MISSIONS ========
-- 1. Qualquer um pode ler as missões
DROP POLICY IF EXISTS "Missions are viewable by everyone" ON public.missions;
CREATE POLICY "Missions are viewable by everyone" ON public.missions FOR SELECT USING (true);

-- 2. Permitir Inserção
DROP POLICY IF EXISTS "Missions can be inserted" ON public.missions;
CREATE POLICY "Missions can be inserted" ON public.missions FOR INSERT WITH CHECK (true);

-- 3. Permitir Edição
DROP POLICY IF EXISTS "Missions can be updated" ON public.missions;
CREATE POLICY "Missions can be updated" ON public.missions FOR UPDATE USING (true);

-- 4. Permitir Exclusão
DROP POLICY IF EXISTS "Missions can be deleted" ON public.missions;
CREATE POLICY "Missions can be deleted" ON public.missions FOR DELETE USING (true);


-- ======== MISSION_TASKS ========
ALTER TABLE public.mission_tasks ENABLE ROW LEVEL SECURITY;

-- 1. Qualquer um pode ler as tarefas
DROP POLICY IF EXISTS "Tasks are viewable by everyone" ON public.mission_tasks;
CREATE POLICY "Tasks are viewable by everyone" ON public.mission_tasks FOR SELECT USING (true);

-- 2. Permitir Inserção
DROP POLICY IF EXISTS "Tasks can be inserted" ON public.mission_tasks;
CREATE POLICY "Tasks can be inserted" ON public.mission_tasks FOR INSERT WITH CHECK (true);

-- 3. Permitir Edição
DROP POLICY IF EXISTS "Tasks can be updated" ON public.mission_tasks;
CREATE POLICY "Tasks can be updated" ON public.mission_tasks FOR UPDATE USING (true);

-- 4. Permitir Exclusão
DROP POLICY IF EXISTS "Tasks can be deleted" ON public.mission_tasks;
CREATE POLICY "Tasks can be deleted" ON public.mission_tasks FOR DELETE USING (true);
