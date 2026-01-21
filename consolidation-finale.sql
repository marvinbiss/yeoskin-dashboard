-- ============================================================
-- CONSOLIDATION FINALE YEOSKIN - PRODUCTION READY
-- https://supabase.com/dashboard/project/juqlogfujiagtpvxmeux/sql/new
-- ============================================================

-- ============================================================
-- PARTIE 1 : TRIGGERS & AUTOMATIONS ESSENTIELS
-- ============================================================

-- 1.1 Trigger recalcul balance automatique
CREATE OR REPLACE FUNCTION recalculate_balance_after()
RETURNS TRIGGER AS $$
DECLARE
  previous_balance DECIMAL(10,2);
BEGIN
  -- Recuperer la derniere balance du createur
  SELECT COALESCE(balance_after, 0) INTO previous_balance
  FROM financial_ledger
  WHERE creator_id = NEW.creator_id
    AND created_at < NEW.created_at
  ORDER BY created_at DESC
  LIMIT 1;

  -- Si pas de balance precedente, partir de 0
  IF previous_balance IS NULL THEN
    previous_balance := 0;
  END IF;

  -- Calculer nouvelle balance
  NEW.balance_after := previous_balance + NEW.amount;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Creer le trigger
DROP TRIGGER IF EXISTS trigger_recalculate_balance ON financial_ledger;
CREATE TRIGGER trigger_recalculate_balance
  BEFORE INSERT ON financial_ledger
  FOR EACH ROW
  EXECUTE FUNCTION recalculate_balance_after();

COMMENT ON FUNCTION recalculate_balance_after IS 'Recalcule automatiquement balance_after lors d une nouvelle entree ledger';

-- 1.2 Trigger mise a jour tier apres commission
CREATE OR REPLACE FUNCTION check_tier_upgrade_after_commission()
RETURNS TRIGGER AS $$
DECLARE
  creator_monthly_revenue DECIMAL(10,2);
  new_tier_id UUID;
  current_tier_id_val UUID;
  tier_name TEXT;
BEGIN
  -- Calculer revenus du mois en cours
  SELECT COALESCE(SUM(commission_amount), 0) INTO creator_monthly_revenue
  FROM commissions
  WHERE creator_id = NEW.creator_id
    AND created_at >= DATE_TRUNC('month', NOW())
    AND status IN ('locked', 'payable', 'paid');

  -- Recuperer tier actuel
  SELECT c.current_tier_id INTO current_tier_id_val
  FROM creators c
  WHERE c.id = NEW.creator_id;

  -- Determiner nouveau tier approprie
  SELECT id, name INTO new_tier_id, tier_name
  FROM creator_tiers
  WHERE min_monthly_revenue <= creator_monthly_revenue
  ORDER BY min_monthly_revenue DESC
  LIMIT 1;

  -- Si changement de tier
  IF new_tier_id IS DISTINCT FROM current_tier_id_val THEN
    -- Cloturer ancien tier
    UPDATE creator_tier_history
    SET ended_at = NOW()
    WHERE creator_id = NEW.creator_id
      AND ended_at IS NULL;

    -- Creer nouvelle entree historique
    INSERT INTO creator_tier_history (creator_id, tier_id, monthly_revenue)
    VALUES (NEW.creator_id, new_tier_id, creator_monthly_revenue);

    -- Mettre a jour createur
    UPDATE creators
    SET
      current_tier_id = new_tier_id,
      commission_rate = (SELECT commission_rate FROM creator_tiers WHERE id = new_tier_id)
    WHERE id = NEW.creator_id;

    -- Notification
    INSERT INTO creator_notifications (creator_id, type, title, message, read)
    VALUES (
      NEW.creator_id,
      'tier_upgrade',
      'Felicitations ! Nouveau niveau : ' || tier_name,
      'Tu as atteint le tier ' || tier_name || ' avec ' || creator_monthly_revenue::TEXT || ' EUR ce mois-ci !',
      false
    );

    RAISE NOTICE 'Creator % upgraded to tier %', NEW.creator_id, tier_name;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Creer le trigger
DROP TRIGGER IF EXISTS trigger_check_tier_upgrade ON commissions;
CREATE TRIGGER trigger_check_tier_upgrade
  AFTER INSERT OR UPDATE ON commissions
  FOR EACH ROW
  WHEN (NEW.status IN ('locked', 'payable', 'paid'))
  EXECUTE FUNCTION check_tier_upgrade_after_commission();

COMMENT ON FUNCTION check_tier_upgrade_after_commission IS 'Verifie et met a jour le tier du createur apres chaque commission';

-- 1.3 Fonction initialisation tiers pour tous les createurs
CREATE OR REPLACE FUNCTION initialize_all_creator_tiers()
RETURNS void AS $$
DECLARE
  creator_record RECORD;
  silver_tier_id UUID;
BEGIN
  -- Recuperer l ID du tier Silver
  SELECT id INTO silver_tier_id
  FROM creator_tiers
  WHERE name = 'Silver';

  IF silver_tier_id IS NULL THEN
    RAISE EXCEPTION 'Silver tier not found';
  END IF;

  -- Pour chaque createur sans tier
  FOR creator_record IN
    SELECT id, email
    FROM creators
    WHERE current_tier_id IS NULL
  LOOP
    -- Assigner tier Silver
    UPDATE creators
    SET current_tier_id = silver_tier_id
    WHERE id = creator_record.id;

    -- Creer entree historique
    INSERT INTO creator_tier_history (creator_id, tier_id, monthly_revenue)
    VALUES (creator_record.id, silver_tier_id, 0)
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Initialized tier for %', creator_record.email;
  END LOOP;

  RAISE NOTICE 'All creator tiers initialized';
END;
$$ LANGUAGE plpgsql;

-- 1.4 Fonction pour recalculer tous les balance_after
CREATE OR REPLACE FUNCTION recalculate_all_balance_after()
RETURNS void AS $$
DECLARE
  creator_rec RECORD;
BEGIN
  -- Pour chaque createur
  FOR creator_rec IN
    SELECT DISTINCT creator_id FROM financial_ledger ORDER BY creator_id
  LOOP
    -- Mettre a jour les balance_after dans l ordre chronologique
    UPDATE financial_ledger fl
    SET balance_after = sub.new_balance
    FROM (
      SELECT
        id,
        SUM(amount) OVER (ORDER BY created_at, id) as new_balance
      FROM financial_ledger
      WHERE creator_id = creator_rec.creator_id
    ) sub
    WHERE fl.id = sub.id;

    RAISE NOTICE 'Recalculated balances for creator %', creator_rec.creator_id;
  END LOOP;

  RAISE NOTICE 'All balances recalculated';
END;
$$ LANGUAGE plpgsql;

-- 1.5 Fonction update_creator_tiers
CREATE OR REPLACE FUNCTION update_creator_tiers()
RETURNS void AS $$
DECLARE
  creator_rec RECORD;
  creator_monthly_revenue DECIMAL(10,2);
  new_tier_id UUID;
  tier_name TEXT;
BEGIN
  FOR creator_rec IN SELECT id, email, current_tier_id FROM creators LOOP
    -- Calculer revenus du mois
    SELECT COALESCE(SUM(commission_amount), 0) INTO creator_monthly_revenue
    FROM commissions
    WHERE creator_id = creator_rec.id
      AND created_at >= DATE_TRUNC('month', NOW())
      AND status IN ('locked', 'payable', 'paid');

    -- Trouver tier approprie
    SELECT id, name INTO new_tier_id, tier_name
    FROM creator_tiers
    WHERE min_monthly_revenue <= creator_monthly_revenue
    ORDER BY min_monthly_revenue DESC
    LIMIT 1;

    -- Mettre a jour si different
    IF new_tier_id IS DISTINCT FROM creator_rec.current_tier_id THEN
      UPDATE creators
      SET
        current_tier_id = new_tier_id,
        commission_rate = (SELECT commission_rate FROM creator_tiers WHERE id = new_tier_id)
      WHERE id = creator_rec.id;

      RAISE NOTICE 'Updated % to tier %', creator_rec.email, tier_name;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Executer l initialisation
SELECT initialize_all_creator_tiers();

-- ============================================================
-- PARTIE 2 : VALIDATIONS & CONTRAINTES
-- ============================================================

-- 2.1 Contraintes sur commissions
ALTER TABLE commissions
  DROP CONSTRAINT IF EXISTS check_commission_positive;
ALTER TABLE commissions
  ADD CONSTRAINT check_commission_positive
    CHECK (commission_amount >= 0);

ALTER TABLE commissions
  DROP CONSTRAINT IF EXISTS check_commission_rate_valid;
ALTER TABLE commissions
  ADD CONSTRAINT check_commission_rate_valid
    CHECK (commission_rate >= 0.10 AND commission_rate <= 0.30);

-- 2.2 Contraintes sur financial_ledger
ALTER TABLE financial_ledger
  DROP CONSTRAINT IF EXISTS check_amount_reasonable;
ALTER TABLE financial_ledger
  ADD CONSTRAINT check_amount_reasonable
    CHECK (ABS(amount) <= 100000);

-- 2.3 Contraintes sur payout_batch_items (si exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payout_batch_items') THEN
    ALTER TABLE payout_batch_items DROP CONSTRAINT IF EXISTS check_payout_minimum;
    ALTER TABLE payout_batch_items ADD CONSTRAINT check_payout_minimum CHECK (amount >= 50.00);
  END IF;
END $$;

-- 2.4 Fonction validation IBAN (basique)
CREATE OR REPLACE FUNCTION is_valid_iban(iban_value TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Retirer espaces
  iban_value := REPLACE(iban_value, ' ', '');

  -- Verifications basiques
  IF LENGTH(iban_value) < 15 OR LENGTH(iban_value) > 34 THEN
    RETURN FALSE;
  END IF;

  -- Doit commencer par 2 lettres (code pays)
  IF NOT SUBSTRING(iban_value FROM 1 FOR 2) ~ '^[A-Z]{2}$' THEN
    RETURN FALSE;
  END IF;

  -- Puis 2 chiffres (cle de controle)
  IF NOT SUBSTRING(iban_value FROM 3 FOR 2) ~ '^[0-9]{2}$' THEN
    RETURN FALSE;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION is_valid_iban IS 'Validation basique format IBAN';

-- 2.5 Fonction detection doublons commissions
CREATE OR REPLACE FUNCTION detect_duplicate_commissions()
RETURNS TABLE (
  creator_email TEXT,
  order_total_val DECIMAL,
  commission_amount_val DECIMAL,
  duplicate_count BIGINT,
  created_at_first TIMESTAMPTZ,
  created_at_last TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.email,
    co.order_total,
    co.commission_amount,
    COUNT(*) as duplicate_count,
    MIN(co.created_at) as created_at_first,
    MAX(co.created_at) as created_at_last
  FROM commissions co
  JOIN creators c ON c.id = co.creator_id
  WHERE co.status != 'canceled'
  GROUP BY c.email, co.order_total, co.commission_amount
  HAVING COUNT(*) > 1
  ORDER BY COUNT(*) DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- PARTIE 3 : GESTION DES ERREURS
-- ============================================================

-- 3.1 Table de logs d erreurs
CREATE TABLE IF NOT EXISTS error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  error_type TEXT NOT NULL,
  error_source TEXT NOT NULL,
  error_message TEXT NOT NULL,
  error_details JSONB,
  user_id UUID,
  creator_id UUID REFERENCES creators(id),
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON error_logs(severity, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_resolved ON error_logs(resolved, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_source ON error_logs(error_source, created_at DESC);

-- Enable RLS
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Admin can read errors" ON error_logs FOR SELECT USING (true);

COMMENT ON TABLE error_logs IS 'Logs de toutes les erreurs systeme pour monitoring';

-- 3.2 Fonction pour logger une erreur
CREATE OR REPLACE FUNCTION log_error(
  p_error_type TEXT,
  p_error_source TEXT,
  p_error_message TEXT,
  p_error_details JSONB DEFAULT NULL,
  p_severity TEXT DEFAULT 'medium',
  p_creator_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  error_id UUID;
BEGIN
  INSERT INTO error_logs (
    error_type,
    error_source,
    error_message,
    error_details,
    severity,
    creator_id
  ) VALUES (
    p_error_type,
    p_error_source,
    p_error_message,
    p_error_details,
    p_severity,
    p_creator_id
  )
  RETURNING id INTO error_id;

  -- Si erreur critique, log
  IF p_severity = 'critical' THEN
    RAISE NOTICE 'CRITICAL ERROR: % - %', p_error_type, p_error_message;
  END IF;

  RETURN error_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3.3 Fonction gestion echecs paiements
CREATE OR REPLACE FUNCTION handle_payout_failure(
  p_payout_item_id UUID,
  p_error_message TEXT,
  p_wise_error_details JSONB DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  v_creator_id UUID;
  v_amount DECIMAL;
BEGIN
  -- Recuperer infos paiement
  SELECT creator_id, amount INTO v_creator_id, v_amount
  FROM payout_batch_items
  WHERE id = p_payout_item_id;

  IF v_creator_id IS NULL THEN
    RAISE EXCEPTION 'Payout item not found: %', p_payout_item_id;
  END IF;

  -- Mettre a jour statut
  UPDATE payout_batch_items
  SET
    status = 'failed',
    error_message = p_error_message,
    completed_at = NOW()
  WHERE id = p_payout_item_id;

  -- Logger l erreur
  PERFORM log_error(
    'payout_failure',
    'wise',
    'Echec paiement: ' || p_error_message,
    jsonb_build_object(
      'payout_item_id', p_payout_item_id,
      'creator_id', v_creator_id,
      'amount', v_amount,
      'wise_error', p_wise_error_details
    ),
    'high',
    v_creator_id
  );

  -- Notifier createur
  INSERT INTO creator_notifications (creator_id, type, title, message, read)
  VALUES (
    v_creator_id,
    'payout_failed',
    'Probleme avec ton paiement',
    'Ton paiement de ' || v_amount::TEXT || ' EUR a rencontre un probleme. Notre equipe a ete notifiee.',
    false
  );

  RAISE NOTICE 'Payout failure handled for item %', p_payout_item_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3.4 Vue monitoring sante systeme
DROP VIEW IF EXISTS system_health;
CREATE VIEW system_health AS
SELECT
  -- Erreurs critiques non resolues
  (SELECT COUNT(*) FROM error_logs WHERE severity = 'critical' AND NOT resolved) as critical_errors,

  -- Erreurs des dernieres 24h
  (SELECT COUNT(*) FROM error_logs WHERE created_at >= NOW() - INTERVAL '24 hours') as errors_24h,

  -- Paiements en echec
  (SELECT COUNT(*) FROM payout_batch_items WHERE status = 'failed') as failed_payouts,

  -- Paiements en attente > 48h
  (SELECT COUNT(*) FROM payout_batch_items
   WHERE status = 'processing'
     AND created_at < NOW() - INTERVAL '48 hours') as stuck_payouts,

  -- Createurs sans IBAN
  (SELECT COUNT(*) FROM creators c
   WHERE NOT EXISTS (
     SELECT 1 FROM creator_bank_accounts
     WHERE creator_id = c.id AND iban IS NOT NULL
   )) as creators_without_iban,

  -- Statut global
  CASE
    WHEN (SELECT COUNT(*) FROM error_logs WHERE severity = 'critical' AND NOT resolved) > 0 THEN 'CRITICAL'
    WHEN (SELECT COUNT(*) FROM error_logs WHERE created_at >= NOW() - INTERVAL '1 hour') > 5 THEN 'WARNING'
    ELSE 'HEALTHY'
  END as overall_status;

COMMENT ON VIEW system_health IS 'Vue monitoring sante systeme pour dashboard admin';

-- ============================================================
-- PARTIE 4 : DONNEES REALISTES
-- ============================================================

-- 4.1 Fonction pour generer des donnees realistes
CREATE OR REPLACE FUNCTION generate_realistic_data()
RETURNS void AS $$
DECLARE
  creator_record RECORD;
  month_offset INT;
  commission_count INT;
  v_commission_amount DECIMAL;
  v_order_total DECIMAL;
  v_commission_rate DECIMAL;
  commission_status TEXT;
  lock_date TIMESTAMPTZ;
  i INT;
BEGIN
  -- Pour chaque createur sans donnees
  FOR creator_record IN
    SELECT c.id, c.email, COALESCE(c.commission_rate, 0.15) as commission_rate
    FROM creators c
    LEFT JOIN commissions co ON c.id = co.creator_id
    GROUP BY c.id, c.email, c.commission_rate
    HAVING COUNT(co.id) = 0
  LOOP
    RAISE NOTICE 'Generating data for %', creator_record.email;

    -- Generer 3-8 commissions sur les 3 derniers mois
    commission_count := 3 + floor(random() * 6)::INT;

    FOR i IN 1..commission_count LOOP
      -- Date aleatoire dans les 90 derniers jours
      month_offset := floor(random() * 90)::INT;

      -- Montant commande aleatoire 50-500 EUR
      v_order_total := 50 + (random() * 450)::NUMERIC;
      v_commission_rate := creator_record.commission_rate;
      v_commission_amount := ROUND((v_order_total * v_commission_rate)::NUMERIC, 2);

      -- Statut selon anciennete
      IF month_offset < 14 THEN
        commission_status := 'pending';
        lock_date := NULL;
      ELSIF month_offset < 28 THEN
        commission_status := 'locked';
        lock_date := NOW() - (month_offset || ' days')::INTERVAL + INTERVAL '14 days';
      ELSIF month_offset < 60 THEN
        commission_status := 'payable';
        lock_date := NOW() - (month_offset || ' days')::INTERVAL;
      ELSE
        commission_status := 'paid';
        lock_date := NOW() - (month_offset || ' days')::INTERVAL;
      END IF;

      -- Inserer commission
      INSERT INTO commissions (
        creator_id,
        order_total,
        commission_rate,
        commission_amount,
        status,
        lock_until,
        paid_at,
        created_at
      ) VALUES (
        creator_record.id,
        v_order_total,
        v_commission_rate,
        v_commission_amount,
        commission_status,
        lock_date,
        CASE WHEN commission_status = 'paid' THEN NOW() - ((month_offset - 30)::TEXT || ' days')::INTERVAL ELSE NULL END,
        NOW() - (month_offset || ' days')::INTERVAL
      );

      -- Si payee ou payable, creer entree ledger
      IF commission_status IN ('paid', 'payable', 'locked') THEN
        INSERT INTO financial_ledger (
          transaction_type,
          creator_id,
          amount,
          balance_after,
          description,
          created_at
        ) VALUES (
          'commission_earned',
          creator_record.id,
          v_commission_amount,
          0,
          'Commission gagnee - ' || v_commission_amount::TEXT || ' EUR',
          NOW() - (month_offset || ' days')::INTERVAL
        );
      END IF;
    END LOOP;

    RAISE NOTICE 'Generated % commissions for %', commission_count, creator_record.email;
  END LOOP;

  -- Recalculer toutes les balances
  PERFORM recalculate_all_balance_after();

  -- Mettre a jour les tiers
  PERFORM update_creator_tiers();

  RAISE NOTICE 'Realistic data generation complete';
END;
$$ LANGUAGE plpgsql;

-- Executer la generation de donnees
SELECT generate_realistic_data();

-- ============================================================
-- VERIFICATION FINALE
-- ============================================================

-- Verifier les createurs et leurs tiers
SELECT
  c.email,
  ct.name as tier,
  c.commission_rate,
  (SELECT COUNT(*) FROM commissions WHERE creator_id = c.id) as commission_count,
  (SELECT COALESCE(SUM(commission_amount), 0) FROM commissions WHERE creator_id = c.id AND status != 'canceled') as total_earned
FROM creators c
LEFT JOIN creator_tiers ct ON c.current_tier_id = ct.id
ORDER BY total_earned DESC;

-- Verifier la sante du systeme
SELECT * FROM system_health;

-- Done!
SELECT 'CONSOLIDATION FINALE COMPLETE!' as status;
