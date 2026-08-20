-- Forest Craft community features: 5-star ratings + favorites
-- Run once against D1 database: forest-craft-db before deploying the community Worker.

CREATE TABLE IF NOT EXISTS post_ratings_v2 (
  post_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (post_id, user_id),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_post_ratings_v2_post ON post_ratings_v2(post_id);
CREATE INDEX IF NOT EXISTS idx_post_ratings_v2_user ON post_ratings_v2(user_id);

CREATE TABLE IF NOT EXISTS post_favorites (
  post_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (post_id, user_id),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_post_favorites_post ON post_favorites(post_id);
CREATE INDEX IF NOT EXISTS idx_post_favorites_user ON post_favorites(user_id, created_at DESC);

-- Keep the existing post_stats.favorite_count column in sync with current favorites.
UPDATE post_stats
SET favorite_count = (
  SELECT COUNT(*) FROM post_favorites f WHERE f.post_id = post_stats.post_id
);
