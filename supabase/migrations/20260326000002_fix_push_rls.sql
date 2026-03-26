-- Fix for push_subscriptions RLS when multiple users login on the same browser
-- The old policy expected auth.uid() to match the OLD row's user_id.
-- This changes it to allow updating the row as long as the new user_id matches the logged-in user.

DROP POLICY IF EXISTS "Users can update own push subscriptions" ON public.push_subscriptions;

CREATE POLICY "Users can update own push subscriptions"
  ON public.push_subscriptions FOR UPDATE
  USING (true)
  WITH CHECK (auth.uid() = user_id);
