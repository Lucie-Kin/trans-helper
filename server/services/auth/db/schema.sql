-- server/services/auth/db/schema.sql
CREATE TABLE IF NOT EXISTS user (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  login TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE,
  image TEXT DEFAULT '/default-avatar.png',
  --online INTEGER NOT NULL DEFAULT 0,

  -- public profile
  display_name TEXT UNIQUE,

  -- auth
  auth_provider TEXT NOT NULL CHECK(auth_provider IN ('intra','local')),
  intra_id INTEGER UNIQUE,
  password_hash TEXT,

  -- 2FA
  is_2fa_enabled INTEGER NOT NULL DEFAULT 0,
  twofa_secret TEXT,

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
