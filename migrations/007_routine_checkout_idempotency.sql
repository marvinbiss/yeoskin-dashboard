-- ============================================================================
-- MIGRATION: routine_checkout_idempotency
-- Ajoute le support d'idempotency pour les checkouts de routine
-- ============================================================================

-- 1. Ajouter slug aux creators si absent
ALTER TABLE public.creators ADD COLUMN IF NOT EXISTS slug TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_creators_slug_unique
  ON public.creators(slug)
  WHERE slug IS NOT NULL;

-- 2. Ajouter les colonnes d'idempotency à routine_checkouts
ALTER TABLE public.routine_checkouts
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

ALTER TABLE public.routine_checkouts
  ADD COLUMN IF NOT EXISTS payload_hash TEXT;

ALTER TABLE public.routine_checkouts
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'creating';

ALTER TABLE public.routine_checkouts
  ADD COLUMN IF NOT EXISTS last_error TEXT;

-- 3. S'assurer que created_at et updated_at existent
ALTER TABLE public.routine_checkouts
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.routine_checkouts
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 4. Rendre checkout_url nullable (sera vide pendant création)
ALTER TABLE public.routine_checkouts
  ALTER COLUMN checkout_url DROP NOT NULL;

-- 5. Index unique sur idempotency_key
CREATE UNIQUE INDEX IF NOT EXISTS idx_routine_checkouts_idempotency
  ON public.routine_checkouts(idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- 6. Index sur payload_hash pour debug/audit
CREATE INDEX IF NOT EXISTS idx_routine_checkouts_payload_hash
  ON public.routine_checkouts(payload_hash);

-- 7. Index sur status pour requêtes de cleanup
CREATE INDEX IF NOT EXISTS idx_routine_checkouts_status
  ON public.routine_checkouts(status);

-- 8. Contrainte de check sur status (si pas déjà existante)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'routine_checkouts_status_check'
  ) THEN
    ALTER TABLE public.routine_checkouts
      ADD CONSTRAINT routine_checkouts_status_check
      CHECK (status IN ('creating', 'completed', 'failed'));
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 9. Trigger pour updated_at
CREATE OR REPLACE FUNCTION public.routine_checkouts_set_updated_at()
RETURNS TRIGGER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS routine_checkouts_updated_at ON public.routine_checkouts;
CREATE TRIGGER routine_checkouts_updated_at
  BEFORE UPDATE ON public.routine_checkouts
  FOR EACH ROW
  EXECUTE FUNCTION public.routine_checkouts_set_updated_at();

-- 10. Comments pour documentation
COMMENT ON COLUMN public.routine_checkouts.status IS
  'creating: reservation lock, completed: checkout ready, failed: shopify error or timeout - NEVER DELETE failed rows (audit)';

COMMENT ON COLUMN public.routine_checkouts.cart_id IS
  'pending-{idempotency_key} during creation, shopify cart_id after completion';

COMMENT ON COLUMN public.routine_checkouts.created_at IS
  'CRITICAL: Used for stale lock detection (> 2 minutes in creating status). Immutable timestamp of lock creation.';

COMMENT ON COLUMN public.routine_checkouts.updated_at IS
  'Last modification timestamp for audit. Auto-updated by trigger. NOT used for stale detection.';

COMMENT ON COLUMN public.routine_checkouts.payload_hash IS
  'SHA256 hash of creator_id|routine_id|variant|variant_ids for conflict detection';

COMMENT ON COLUMN public.routine_checkouts.idempotency_key IS
  'SHA256 hash (32 chars) of creator_slug|variant|routine_id|variant_ids for deduplication';

-- 11. Policy pour anon INSERT (nécessaire pour la route publique)
DROP POLICY IF EXISTS "anon_insert_checkouts" ON public.routine_checkouts;
CREATE POLICY "anon_insert_checkouts" ON public.routine_checkouts
  FOR INSERT TO anon
  WITH CHECK (true);

DROP POLICY IF EXISTS "anon_select_checkouts" ON public.routine_checkouts;
CREATE POLICY "anon_select_checkouts" ON public.routine_checkouts
  FOR SELECT TO anon
  USING (true);

DROP POLICY IF EXISTS "anon_update_checkouts" ON public.routine_checkouts;
CREATE POLICY "anon_update_checkouts" ON public.routine_checkouts
  FOR UPDATE TO anon
  USING (true)
  WITH CHECK (true);

-- 12. Verification
SELECT
  'Migration 007 terminée!' AS status,
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_name = 'routine_checkouts' AND column_name = 'idempotency_key') AS has_idempotency_key,
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_name = 'creators' AND column_name = 'slug') AS has_creator_slug;
