-- Allow admin to manage creator bank accounts
DROP POLICY IF EXISTS "Admin manage bank accounts" ON creator_bank_accounts;
CREATE POLICY "Admin manage bank accounts"
  ON creator_bank_accounts FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_profiles WHERE user_id = auth.uid() AND is_active = true)
    OR creator_id IN (SELECT id FROM creators WHERE user_id = auth.uid())
  );
