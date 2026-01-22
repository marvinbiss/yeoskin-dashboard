-- ============================================================================
-- Migration 015: Admin RLS policy for creator_routines
-- Allows admin users to manage routine assignments via browser client
-- ============================================================================

-- Admin can manage all creator_routines
DROP POLICY IF EXISTS "admin_write_creator_routines" ON public.creator_routines;
CREATE POLICY "admin_write_creator_routines" ON public.creator_routines
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid() AND is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid() AND is_active = true
    )
  );
