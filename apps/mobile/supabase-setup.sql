-- ============================================================
-- RUN THIS IN SUPABASE SQL EDITOR (Dashboard > SQL Editor)
-- This sets up permissions + encryption for user profiles
-- ============================================================

-- 1. Enable pgcrypto extension
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- 2. Grant usage on public schema
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- 3. Enable RLS on tables
ALTER TABLE "Role" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;

-- 4. Create policies (drop first to avoid duplicates)
DROP POLICY IF EXISTS "Allow read roles" ON "Role";
CREATE POLICY "Allow read roles" ON "Role"
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can read own profile" ON "User";
CREATE POLICY "Users can read own profile" ON "User"
  FOR SELECT USING (auth.uid()::text = "userID");

-- 5. Private config table for encryption key
CREATE TABLE IF NOT EXISTS _app_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
ALTER TABLE _app_config ENABLE ROW LEVEL SECURITY;

-- 6. Generate and store a random encryption key automatically
INSERT INTO _app_config (key, value)
VALUES ('ENCRYPTION_KEY', encode(extensions.gen_random_bytes(32), 'hex'))
ON CONFLICT (key) DO NOTHING;

-- 7. Drop old function if exists
DROP FUNCTION IF EXISTS create_user_profile(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);

-- 8. Create RPC function with server-side encryption
CREATE OR REPLACE FUNCTION create_user_profile(
  p_user_id TEXT,
  p_role_name TEXT,
  p_first_name TEXT,
  p_last_name TEXT,
  p_phone_no TEXT,
  p_phone_no_hash TEXT,
  p_email TEXT,
  p_email_hash TEXT,
  p_password TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_role_id INT;
  v_key TEXT;
BEGIN
  -- Get encryption key from private config
  SELECT value INTO v_key FROM _app_config WHERE key = 'ENCRYPTION_KEY';

  IF v_key IS NULL THEN
    RAISE EXCEPTION 'Encryption key not configured';
  END IF;

  -- Look up role ID
  SELECT "roleID" INTO v_role_id FROM "Role" WHERE "roleName" = p_role_name;

  -- Insert user with:
  --   AES-256 encrypted PII (firstName, lastName, email, phoneNo)
  --   bcrypt hashed password
  --   SHA-256 hashes for indexed lookups
  INSERT INTO "User" (
    "userID", "roleID", "firstName", "lastName",
    "phoneNo", "phoneNoHash", "email", "emailHash",
    "password", "isOrg"
  ) VALUES (
    p_user_id,
    v_role_id,
    encode(pgp_sym_encrypt(p_first_name, v_key), 'hex'),
    encode(pgp_sym_encrypt(p_last_name, v_key), 'hex'),
    encode(pgp_sym_encrypt(p_phone_no, v_key), 'hex'),
    p_phone_no_hash,
    encode(pgp_sym_encrypt(p_email, v_key), 'hex'),
    p_email_hash,
    crypt(p_password, gen_salt('bf', 10)),
    false
  );
END;
$$;

-- 9. Grant execute permission
GRANT EXECUTE ON FUNCTION create_user_profile TO authenticated;

-- 10. Helper function to decrypt a field (for server/admin use)
CREATE OR REPLACE FUNCTION decrypt_user_field(encrypted_hex TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_key TEXT;
BEGIN
  SELECT value INTO v_key FROM _app_config WHERE key = 'ENCRYPTION_KEY';
  RETURN pgp_sym_decrypt(decode(encrypted_hex, 'hex'), v_key);
END;
$$;

GRANT EXECUTE ON FUNCTION decrypt_user_field TO authenticated;
