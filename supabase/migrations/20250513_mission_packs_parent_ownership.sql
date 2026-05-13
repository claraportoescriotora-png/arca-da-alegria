-- ================================================================
-- Migration: add_parent_ownership_to_mission_packs_v2
-- Aplicado em: 2026-05-13
-- Projeto: gypzrzsmxgjtkidznstd (Meu Amiguito)
-- ================================================================
-- CONTEXTO:
--   mission_packs já tinha RLS com is_admin() referenciando tabela admins.
--   Esta migration adiciona suporte a trilhas criadas pelo pai (Moreh),
--   preservando todas as políticas existentes do Admin.
-- ================================================================

-- 1. Adicionar colunas de propriedade do pai
ALTER TABLE mission_packs
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS child_id UUID REFERENCES children(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS start_date DATE;

-- 2. mission_packs SELECT: admin packs (globais) OU pack do próprio pai
DROP POLICY IF EXISTS "Packs are viewable by everyone" ON mission_packs;
CREATE POLICY "Packs are viewable by everyone" ON mission_packs
  FOR SELECT USING (
    (user_id IS NULL AND is_active = true)
    OR user_id = auth.uid()
    OR is_admin()
  );

-- 3. mission_packs: pai gerencia somente os seus
DROP POLICY IF EXISTS "Parents can insert own packs" ON mission_packs;
CREATE POLICY "Parents can insert own packs" ON mission_packs
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Parents can update own packs" ON mission_packs;
CREATE POLICY "Parents can update own packs" ON mission_packs
  FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Parents can delete own packs" ON mission_packs;
CREATE POLICY "Parents can delete own packs" ON mission_packs
  FOR DELETE USING (user_id = auth.uid());

-- 4. missions SELECT: via pack visível
DROP POLICY IF EXISTS "Missions are viewable by everyone" ON missions;
CREATE POLICY "Missions are viewable by everyone" ON missions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM mission_packs mp WHERE mp.id = missions.pack_id
        AND ((mp.user_id IS NULL AND mp.is_active = true) OR mp.user_id = auth.uid() OR is_admin())
    )
  );

-- 5. missions: pai gerencia dias das suas trilhas
DROP POLICY IF EXISTS "Parents can insert missions in own packs" ON missions;
CREATE POLICY "Parents can insert missions in own packs" ON missions
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM mission_packs mp WHERE mp.id = missions.pack_id AND mp.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Parents can update missions in own packs" ON missions;
CREATE POLICY "Parents can update missions in own packs" ON missions
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM mission_packs mp WHERE mp.id = missions.pack_id AND mp.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Parents can delete missions in own packs" ON missions;
CREATE POLICY "Parents can delete missions in own packs" ON missions
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM mission_packs mp WHERE mp.id = missions.pack_id AND mp.user_id = auth.uid())
  );

-- 6. mission_tasks SELECT: via missions -> pack visível
DROP POLICY IF EXISTS "Tasks are viewable by everyone" ON mission_tasks;
CREATE POLICY "Tasks are viewable by everyone" ON mission_tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM missions m JOIN mission_packs mp ON mp.id = m.pack_id
      WHERE m.id = mission_tasks.mission_id
        AND ((mp.user_id IS NULL AND mp.is_active = true) OR mp.user_id = auth.uid() OR is_admin())
    )
  );

-- 7. mission_tasks: pai gerencia tarefas das suas trilhas
DROP POLICY IF EXISTS "Parents can insert tasks in own packs" ON mission_tasks;
CREATE POLICY "Parents can insert tasks in own packs" ON mission_tasks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM missions m JOIN mission_packs mp ON mp.id = m.pack_id
      WHERE m.id = mission_tasks.mission_id AND mp.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Parents can update tasks in own packs" ON mission_tasks;
CREATE POLICY "Parents can update tasks in own packs" ON mission_tasks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM missions m JOIN mission_packs mp ON mp.id = m.pack_id
      WHERE m.id = mission_tasks.mission_id AND mp.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Parents can delete tasks in own packs" ON mission_tasks;
CREATE POLICY "Parents can delete tasks in own packs" ON mission_tasks
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM missions m JOIN mission_packs mp ON mp.id = m.pack_id
      WHERE m.id = mission_tasks.mission_id AND mp.user_id = auth.uid()
    )
  );
