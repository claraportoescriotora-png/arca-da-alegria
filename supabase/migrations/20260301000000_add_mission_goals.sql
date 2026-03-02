ALTER TABLE user_mission_enrollments
ADD COLUMN IF NOT EXISTS goal_reward TEXT,
ADD COLUMN IF NOT EXISTS goal_target_percentage INTEGER DEFAULT 80;
