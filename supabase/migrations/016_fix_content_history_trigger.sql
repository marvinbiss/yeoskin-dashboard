-- ============================================================================
-- Migration 016: Fix page_content_history trigger permissions
-- Problem: save_content_history trigger references auth.users via FK constraint
-- on changed_by column, causing "permission denied for table users" errors
-- when using service_role key (API routes).
-- Fix: Remove FK constraints on auth.users references, make trigger SECURITY DEFINER
-- ============================================================================

-- 1. Drop FK constraints that reference auth.users (cause permission errors)
-- page_content_history.changed_by
DO $$
BEGIN
  ALTER TABLE page_content_history DROP CONSTRAINT IF EXISTS page_content_history_changed_by_fkey;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

-- page_content.created_by
DO $$
BEGIN
  ALTER TABLE page_content DROP CONSTRAINT IF EXISTS page_content_created_by_fkey;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

-- page_content.updated_by
DO $$
BEGIN
  ALTER TABLE page_content DROP CONSTRAINT IF EXISTS page_content_updated_by_fkey;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

-- page_images.uploaded_by
DO $$
BEGIN
  ALTER TABLE page_images DROP CONSTRAINT IF EXISTS page_images_uploaded_by_fkey;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

-- 2. Recreate the trigger function with SECURITY DEFINER and NULL-safe auth.uid()
CREATE OR REPLACE FUNCTION save_content_history()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid UUID;
BEGIN
  IF OLD.content IS DISTINCT FROM NEW.content THEN
    -- Safely get current user (NULL in service_role context)
    BEGIN
      _uid := auth.uid();
    EXCEPTION WHEN OTHERS THEN
      _uid := NULL;
    END;

    INSERT INTO page_content_history (page_content_id, content, changed_by)
    VALUES (OLD.id, OLD.content, _uid);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Recreate the trigger (same as before, just ensuring it's up to date)
DROP TRIGGER IF EXISTS trigger_save_content_history ON page_content;
CREATE TRIGGER trigger_save_content_history
  BEFORE UPDATE ON page_content
  FOR EACH ROW
  EXECUTE FUNCTION save_content_history();

-- 4. Ensure routines table has proper RLS policies for admin CRUD
-- (Only applies if RLS is enabled on routines table)
DO $$
BEGIN
  -- Public read for active routines
  DROP POLICY IF EXISTS "public_read_routines" ON public.routines;
  CREATE POLICY "public_read_routines" ON public.routines
    FOR SELECT USING (is_active = true);

  -- Authenticated users (admins) can do everything
  DROP POLICY IF EXISTS "auth_all_routines" ON public.routines;
  CREATE POLICY "auth_all_routines" ON public.routines
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN undefined_table THEN
  -- routines table doesn't exist yet, skip
  NULL;
END $$;

-- 5. Ensure creator_routines has SELECT policy for reads
DO $$
BEGIN
  DROP POLICY IF EXISTS "public_read_creator_routines" ON public.creator_routines;
  CREATE POLICY "public_read_creator_routines" ON public.creator_routines
    FOR SELECT USING (true);
EXCEPTION WHEN undefined_table THEN
  NULL;
END $$;

-- ============================================================================
SELECT 'Migration 016: Fix content history trigger + RLS - Complete!' as status;
