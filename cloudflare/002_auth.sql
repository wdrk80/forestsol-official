-- Forestsol account/auth migration
-- Run once against D1 database: forest-craft-db

ALTER TABLE users ADD COLUMN password_hash TEXT;
ALTER TABLE users ADD COLUMN password_salt TEXT;
ALTER TABLE users ADD COLUMN bio TEXT NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN created_at TEXT;
ALTER TABLE users ADD COLUMN updated_at TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_unique ON users(username);
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

-- 以前の動作確認用投稿をD1から削除。
-- R2の test.png はD1とは別なので、Cloudflare R2画面から1回だけ削除してください。
DELETE FROM ratings WHERE post_id='post_test_001';
DELETE FROM comments WHERE post_id='post_test_001';
DELETE FROM download_daily WHERE post_id='post_test_001';
DELETE FROM post_files WHERE post_id='post_test_001';
DELETE FROM post_stats WHERE post_id='post_test_001';
DELETE FROM posts WHERE id='post_test_001';

-- Existing admin/test users may have no password_hash. They cannot log in with password
-- until a password is explicitly set. This is intentional.
