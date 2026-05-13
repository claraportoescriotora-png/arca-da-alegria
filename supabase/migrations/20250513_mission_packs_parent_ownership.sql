-- ============================================================
-- Migration: Unify Mission Packs — add parent ownership
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Add ownership + scheduling columns to mission_packs
ALTER TABLE mission_packs
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS child_id UUID REFERENCES children(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS start_date DATE;

-- 2. Enable RLS
ALTER TABLE mission_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mission_tasks ENABLE ROW LEVEL SECURITY;

-- 3. Drop old policies
DROP POLICY IF EXISTS "mission_packs_select" ON mission_packs;
DROP POLICY IF EXISTS "mission_packs_insert" ON mission_packs;
DROP POLICY IF EXISTS "mission_packs_update" ON mission_packs;
DROP POLICY IF EXISTS "mission_packs_delete" ON mission_packs;
DROP POLICY IF EXISTS "missions_select" ON missions;
DROP POLICY IF EXISTS "missions_insert" ON missions;
DROP POLICY IF EXISTS "missions_update" ON missions;
DROP POLICY IF EXISTS "missions_delete" ON missions;
DROP POLICY IF EXISTS "mission_tasks_select" ON mission_tasks;
DROP POLICY IF EXISTS "mission_tasks_insert" ON mission_tasks;
DROP POLICY IF EXISTS "mission_tasks_update" ON mission_tasks;
DROP POLICY IF EXISTS "mission_tasks_delete" ON mission_tasks;

-- 4. mission_packs policies
--    SELECT: admin packs (user_id IS NULL, is_active) OR own packs OR superadmin
CREATE POLICY "mission_packs_select" ON mission_packs FOR SELECT USING (
  (user_id IS NULL AND is_active = true)
  OR user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "mission_packs_insert" ON mission_packs FOR INSERT WITH CHECK (
  user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "mission_packs_update" ON mission_packs FOR UPDATE USING (
  user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "mission_packs_delete" ON mission_packs FOR DELETE USING (
  user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- 5. missions (days) — scoped through pack ownership
CREATE POLICY "missions_select" ON missions FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM mission_packs mp WHERE mp.id = missions.pack_id
    AND ((mp.user_id IS NULL AND mp.is_active = true) OR mp.user_id = auth.uid()
         OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true))
  )
);
CREATE POLICY "missions_insert" ON missions FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM mission_packs mp WHERE mp.id = missions.pack_id
    AND (mp.user_id = auth.uid()
         OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true))
  )
);
CREATE POLICY "missions_update" ON missions FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM mission_packs mp WHERE mp.id = missions.pack_id
    AND (mp.user_id = auth.uid()
         OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true))
  )
);
CREATE POLICY "missions_delete" ON missions FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM mission_packs mp WHERE mp.id = missions.pack_id
    AND (mp.user_id = auth.uid()
         OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true))
  )
);

-- 6. mission_tasks — scoped through mission → pack ownership
CREATE POLICY "mission_tasks_select" ON mission_tasks FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM missions m JOIN mission_packs mp ON mp.id = m.pack_id
    WHERE m.id = mission_tasks.mission_id
    AND ((mp.user_id IS NULL AND mp.is_active = true) OR mp.user_id = auth.uid()
         OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true))
  )
);
CREATE POLICY "mission_tasks_insert" ON mission_tasks FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM missions m JOIN mission_packs mp ON mp.id = m.pack_id
    WHERE m.id = mission_tasks.mission_id
    AND (mp.user_id = auth.uid()
         OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true))
  )
);
CREATE POLICY "mission_tasks_update" ON mission_tasks FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM missions m JOIN mission_packs mp ON mp.id = m.pack_id
    WHERE m.id = mission_tasks.mission_id
    AND (mp.user_id = auth.uid()
         OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true))
  )
);
CREATE POLICY "mission_tasks_delete" ON mission_tasks FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM missions m JOIN mission_packs mp ON mp.id = m.pack_id
    WHERE m.id = mission_tasks.mission_id
    AND (mp.user_id = auth.uid()
         OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true))
  )
);
