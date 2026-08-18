-- Forestsol email login migration
-- Run once against D1 database: forest-craft-db

ALTER TABLE users ADD COLUMN email TEXT;
ALTER TABLE users ADD COLUMN email_verified INTEGER NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique_ci
ON users(lower(email))
WHERE email IS NOT NULL;

-- Existing users remain valid records, but accounts without an email cannot use
-- the new email/password login until an email is assigned explicitly.
