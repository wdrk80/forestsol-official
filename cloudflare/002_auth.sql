-- Forestsol account/auth migration
-- Run once against D1 database: forest-craft-db
-- Current users table already contains created_at / updated_at.

ALTER TABLE users ADD COLUMN password_hash TEXT;
ALTER TABLE users ADD COLUMN password_salt TEXT;
ALTER TABLE users ADD COLUMN bio TEXT NOT NULL DEFAULT '';

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_unique_ci ON users(lower(username));
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_visibility_status ON posts(visibility,status);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  user_agent TEXT,
  ip_hint TEXT,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- Remove the old test post from D1.
-- R2 test.png is separate and should be deleted once from the R2 dashboard.
DELETE FROM ratings WHERE post_id='post_test_001';
DELETE FROM comments WHERE post_id='post_test_001';
DELETE FROM download_daily WHERE post_id='post_test_001';
DELETE FROM post_files WHERE post_id='post_test_001';
DELETE FROM post_stats WHERE post_id='post_test_001';
DELETE FROM posts WHERE id='post_test_001';

-- Existing admin/test users may have no password_hash. They cannot log in with password
-- until a password is explicitly set. This is intentional.
