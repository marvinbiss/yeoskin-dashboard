-- ============================================================================
-- YEOSKIN DASHBOARD - ENTERPRISE FEATURES SQL
-- ============================================================================
-- Exécutez ce script dans Supabase SQL Editor
-- https://supabase.com/dashboard/project/juqlogfujiagtpvxmeux/sql/new
-- ============================================================================

-- ============================================================================
-- 1. AJOUTER COLONNES 2FA À admin_profiles
-- ============================================================================
ALTER TABLE admin_profiles
ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS two_factor_secret TEXT,
ADD COLUMN IF NOT EXISTS two_factor_backup_codes TEXT[],
ADD COLUMN IF NOT EXISTS two_factor_enabled_at TIMESTAMPTZ;

-- Index pour 2FA
CREATE INDEX IF NOT EXISTS idx_admin_profiles_2fa ON admin_profiles(two_factor_enabled);

-- ============================================================================
-- 2. TABLE: notifications - Notifications utilisateur
-- ============================================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error', 'payment', 'user', 'batch')),
  title TEXT NOT NULL,
  message TEXT,
  link TEXT,
  read BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own notifications" ON notifications
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can insert notifications" ON notifications
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- ============================================================================
-- 3. FONCTION: Créer notification
-- ============================================================================
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT DEFAULT NULL,
  p_link TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO notifications (user_id, type, title, message, link, metadata)
  VALUES (p_user_id, p_type, p_title, p_message, p_link, p_metadata)
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 4. FONCTION: Notifier tous les super_admin
-- ============================================================================
CREATE OR REPLACE FUNCTION notify_super_admins(
  p_type TEXT,
  p_title TEXT,
  p_message TEXT DEFAULT NULL,
  p_link TEXT DEFAULT NULL
)
RETURNS INT AS $$
DECLARE
  v_count INT := 0;
  v_admin RECORD;
BEGIN
  FOR v_admin IN
    SELECT id FROM admin_profiles
    WHERE role = 'super_admin' AND is_active = true
  LOOP
    PERFORM create_notification(v_admin.id, p_type, p_title, p_message, p_link);
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 5. TRIGGER: Notification sur nouveau batch
-- ============================================================================
CREATE OR REPLACE FUNCTION notify_on_batch_created()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM notify_super_admins(
    'batch',
    'Nouveau batch créé',
    'Un nouveau batch de paiement a été créé',
    '/payouts'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_notify_batch_created ON payout_batches;
CREATE TRIGGER tr_notify_batch_created
  AFTER INSERT ON payout_batches
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_batch_created();

-- ============================================================================
-- 6. TRIGGER: Notification sur échec de transfert
-- ============================================================================
CREATE OR REPLACE FUNCTION notify_on_transfer_failed()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'failed' AND (OLD.status IS NULL OR OLD.status != 'failed') THEN
    PERFORM notify_super_admins(
      'error',
      'Échec de transfert',
      'Un transfert Wise a échoué',
      '/payouts'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_notify_transfer_failed ON wise_transfers;
CREATE TRIGGER tr_notify_transfer_failed
  AFTER INSERT OR UPDATE ON wise_transfers
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_transfer_failed();

-- ============================================================================
-- 7. TRIGGER: Notification sur nouvel admin
-- ============================================================================
CREATE OR REPLACE FUNCTION notify_on_admin_created()
RETURNS TRIGGER AS $$
BEGIN
  -- Notifier les autres super_admins
  PERFORM notify_super_admins(
    'user',
    'Nouvel administrateur',
    format('Un nouvel admin a été créé: %s', NEW.email),
    '/admins'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_notify_admin_created ON admin_profiles;
CREATE TRIGGER tr_notify_admin_created
  AFTER INSERT ON admin_profiles
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_admin_created();

-- ============================================================================
-- 8. TABLE: system_settings - Paramètres système
-- ============================================================================
CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- RLS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Settings viewable by authenticated" ON system_settings
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Settings editable by super_admin" ON system_settings
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_profiles
      WHERE admin_profiles.id = auth.uid()
      AND admin_profiles.role = 'super_admin'
    )
  );

-- Insert default settings
INSERT INTO system_settings (key, value, description) VALUES
  ('session_timeout', '1800', 'Session timeout in seconds'),
  ('max_login_attempts', '5', 'Maximum failed login attempts before lockout'),
  ('lockout_duration', '1800', 'Account lockout duration in seconds'),
  ('require_2fa_for_admins', 'false', 'Require 2FA for admin users'),
  ('notification_email_enabled', 'true', 'Enable email notifications')
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- 9. ACTIVER REALTIME
-- ============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- ============================================================================
-- 10. VÉRIFICATION
-- ============================================================================
SELECT
  'Enterprise features installed!' AS status,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'admin_profiles' AND column_name = 'two_factor_enabled') AS has_2fa_column,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'notifications') AS has_notifications_table,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'system_settings') AS has_settings_table;

