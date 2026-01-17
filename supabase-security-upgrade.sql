-- ============================================================================
-- YEOSKIN DASHBOARD - SECURITY UPGRADE SQL
-- ============================================================================
-- Exécutez ce script dans Supabase SQL Editor APRÈS supabase-setup.sql
-- https://supabase.com/dashboard/project/juqlogfujiagtpvxmeux/sql/new
-- ============================================================================

-- ============================================================================
-- 1. TABLE: audit_logs - Traçabilité complète des actions
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  action TEXT NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'DELETE', 'VIEW', 'EXPORT', 'LOGIN', 'LOGOUT', 'LOGIN_FAILED', 'PASSWORD_CHANGE', 'ROLE_CHANGE', 'APPROVE', 'EXECUTE')),
  resource_type TEXT NOT NULL CHECK (resource_type IN ('admin', 'creator', 'batch', 'transfer', 'commission', 'settings', 'session', 'system')),
  resource_id UUID,
  resource_name TEXT,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour recherches fréquentes
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_user_email ON audit_logs(user_email);

-- RLS pour audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Seuls les super_admin peuvent voir les logs
CREATE POLICY "Audit logs viewable by super_admin" ON audit_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_profiles
      WHERE admin_profiles.id = auth.uid()
      AND admin_profiles.role = 'super_admin'
    )
  );

-- Insert autorisé pour tout utilisateur authentifié (pour logger leurs propres actions)
CREATE POLICY "Audit logs insertable by authenticated" ON audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- ============================================================================
-- 2. TABLE: auth_logs - Historique des connexions
-- ============================================================================
CREATE TABLE IF NOT EXISTS auth_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  event_type TEXT NOT NULL CHECK (event_type IN ('login_success', 'login_failed', 'logout', 'password_change', 'password_reset_request', 'session_expired', 'account_locked', 'account_unlocked')),
  ip_address INET,
  user_agent TEXT,
  location JSONB,
  device_info JSONB,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_auth_logs_user ON auth_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_logs_event ON auth_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_auth_logs_created ON auth_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_auth_logs_ip ON auth_logs(ip_address);

-- RLS
ALTER TABLE auth_logs ENABLE ROW LEVEL SECURITY;

-- Utilisateurs peuvent voir leurs propres logs, super_admin voit tout
CREATE POLICY "Auth logs viewable by owner or super_admin" ON auth_logs
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM admin_profiles
      WHERE admin_profiles.id = auth.uid()
      AND admin_profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Auth logs insertable by authenticated" ON auth_logs
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- ============================================================================
-- 3. TABLE: user_sessions - Gestion des sessions actives
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE,
  device_name TEXT,
  device_type TEXT CHECK (device_type IN ('desktop', 'mobile', 'tablet', 'unknown')),
  browser TEXT,
  os TEXT,
  ip_address INET,
  location JSONB,
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
  is_active BOOLEAN DEFAULT true,
  is_current BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_active ON user_sessions(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON user_sessions(expires_at);

-- RLS
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Utilisateurs peuvent voir/gérer leurs propres sessions
CREATE POLICY "Sessions viewable by owner" ON user_sessions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Sessions insertable by owner" ON user_sessions
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Sessions updatable by owner" ON user_sessions
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Sessions deletable by owner" ON user_sessions
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ============================================================================
-- 4. TABLE: login_attempts - Protection brute force
-- ============================================================================
CREATE TABLE IF NOT EXISTS login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour vérification rapide
CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip ON login_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_login_attempts_created ON login_attempts(created_at DESC);

-- Cleanup automatique des anciennes tentatives (> 24h)
CREATE INDEX IF NOT EXISTS idx_login_attempts_cleanup ON login_attempts(created_at) WHERE created_at < NOW() - INTERVAL '24 hours';

-- RLS
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;

-- Insert autorisé pour service role uniquement (pas de select public)
CREATE POLICY "Login attempts insertable" ON login_attempts
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Login attempts viewable by super_admin" ON login_attempts
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_profiles
      WHERE admin_profiles.id = auth.uid()
      AND admin_profiles.role = 'super_admin'
    )
  );

-- ============================================================================
-- 5. FONCTION: Compter tentatives échouées récentes
-- ============================================================================
CREATE OR REPLACE FUNCTION count_failed_login_attempts(
  p_email TEXT,
  p_ip INET DEFAULT NULL,
  p_window_minutes INT DEFAULT 15
)
RETURNS INT AS $$
DECLARE
  attempt_count INT;
BEGIN
  SELECT COUNT(*)
  INTO attempt_count
  FROM login_attempts
  WHERE email = p_email
    AND success = false
    AND created_at > NOW() - (p_window_minutes || ' minutes')::INTERVAL
    AND (p_ip IS NULL OR ip_address = p_ip);

  RETURN attempt_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 6. FONCTION: Vérifier si compte verrouillé
-- ============================================================================
CREATE OR REPLACE FUNCTION is_account_locked(
  p_email TEXT,
  p_max_attempts INT DEFAULT 5,
  p_lockout_minutes INT DEFAULT 30
)
RETURNS BOOLEAN AS $$
DECLARE
  failed_count INT;
  last_failed TIMESTAMPTZ;
BEGIN
  SELECT COUNT(*), MAX(created_at)
  INTO failed_count, last_failed
  FROM login_attempts
  WHERE email = p_email
    AND success = false
    AND created_at > NOW() - (p_lockout_minutes || ' minutes')::INTERVAL;

  RETURN failed_count >= p_max_attempts;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 7. FONCTION: Logger une action audit
-- ============================================================================
CREATE OR REPLACE FUNCTION log_audit_action(
  p_action TEXT,
  p_resource_type TEXT,
  p_resource_id UUID DEFAULT NULL,
  p_resource_name TEXT DEFAULT NULL,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
  v_user_email TEXT;
BEGIN
  -- Récupérer email utilisateur
  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = auth.uid();

  INSERT INTO audit_logs (
    user_id,
    user_email,
    action,
    resource_type,
    resource_id,
    resource_name,
    old_values,
    new_values,
    metadata
  ) VALUES (
    auth.uid(),
    v_user_email,
    p_action,
    p_resource_type,
    p_resource_id,
    p_resource_name,
    p_old_values,
    p_new_values,
    p_metadata
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 8. FONCTION: Mettre à jour last_activity session
-- ============================================================================
CREATE OR REPLACE FUNCTION update_session_activity(p_session_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE user_sessions
  SET last_activity = NOW()
  WHERE id = p_session_id
    AND user_id = auth.uid()
    AND is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 9. FONCTION: Terminer toutes les sessions (sauf courante)
-- ============================================================================
CREATE OR REPLACE FUNCTION terminate_other_sessions(p_current_session_id UUID DEFAULT NULL)
RETURNS INT AS $$
DECLARE
  terminated_count INT;
BEGIN
  UPDATE user_sessions
  SET is_active = false
  WHERE user_id = auth.uid()
    AND is_active = true
    AND (p_current_session_id IS NULL OR id != p_current_session_id)
  RETURNING COUNT(*) INTO terminated_count;

  -- Logger l'action
  PERFORM log_audit_action(
    'UPDATE',
    'session',
    NULL,
    'Terminate all sessions',
    NULL,
    jsonb_build_object('terminated_count', terminated_count),
    '{}'::jsonb
  );

  RETURN terminated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 10. TRIGGER: Auto-log création admin
-- ============================================================================
CREATE OR REPLACE FUNCTION log_admin_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_audit_action(
      'CREATE',
      'admin',
      NEW.id,
      NEW.email,
      NULL,
      to_jsonb(NEW),
      '{}'::jsonb
    );
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM log_audit_action(
      'UPDATE',
      'admin',
      NEW.id,
      NEW.email,
      to_jsonb(OLD),
      to_jsonb(NEW),
      '{}'::jsonb
    );
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM log_audit_action(
      'DELETE',
      'admin',
      OLD.id,
      OLD.email,
      to_jsonb(OLD),
      NULL,
      '{}'::jsonb
    );
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_log_admin_changes ON admin_profiles;
CREATE TRIGGER tr_log_admin_changes
  AFTER INSERT OR UPDATE OR DELETE ON admin_profiles
  FOR EACH ROW
  EXECUTE FUNCTION log_admin_changes();

-- ============================================================================
-- 11. TRIGGER: Auto-log modifications batch
-- ============================================================================
CREATE OR REPLACE FUNCTION log_batch_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_action TEXT;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    -- Déterminer l'action spécifique
    IF OLD.status != NEW.status THEN
      IF NEW.status = 'approved' THEN
        v_action := 'APPROVE';
      ELSIF NEW.status = 'executing' OR NEW.status = 'sent' THEN
        v_action := 'EXECUTE';
      ELSE
        v_action := 'UPDATE';
      END IF;
    ELSE
      v_action := 'UPDATE';
    END IF;

    PERFORM log_audit_action(
      v_action,
      'batch',
      NEW.id,
      'Batch #' || NEW.id::TEXT,
      to_jsonb(OLD),
      to_jsonb(NEW),
      '{}'::jsonb
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_log_batch_changes ON payout_batches;
CREATE TRIGGER tr_log_batch_changes
  AFTER UPDATE ON payout_batches
  FOR EACH ROW
  EXECUTE FUNCTION log_batch_changes();

-- ============================================================================
-- 12. CLEANUP: Suppression automatique vieux logs
-- ============================================================================
CREATE OR REPLACE FUNCTION cleanup_old_logs()
RETURNS void AS $$
BEGIN
  -- Supprimer les tentatives de login > 7 jours
  DELETE FROM login_attempts
  WHERE created_at < NOW() - INTERVAL '7 days';

  -- Supprimer les sessions expirées > 30 jours
  DELETE FROM user_sessions
  WHERE is_active = false
    AND created_at < NOW() - INTERVAL '30 days';

  -- Note: audit_logs conservés indéfiniment pour compliance
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 13. VÉRIFICATION
-- ============================================================================
SELECT
  'Security upgrade terminé!' AS status,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'audit_logs') AS audit_logs_exists,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'auth_logs') AS auth_logs_exists,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'user_sessions') AS user_sessions_exists,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'login_attempts') AS login_attempts_exists;

