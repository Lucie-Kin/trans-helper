-- chat/db/schema.sql
-- SQLite schema for Chat microservice (DM, friends, blocks, invites, notifications)

PRAGMA foreign_keys = ON;

-- =========================================================
-- Snapshot of user public data (cached from auth)
-- =========================================================
CREATE TABLE IF NOT EXISTS users_snapshot (
  user_id       INTEGER PRIMARY KEY,
  login         TEXT NOT NULL,
  display_name  TEXT NOT NULL,
  avatar        TEXT,
  updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- Friends / relationship requests
-- =========================================================
CREATE TABLE IF NOT EXISTS relationships (
  user_id     INTEGER NOT NULL,
  target_id   INTEGER NOT NULL,
  status      TEXT NOT NULL CHECK (status IN ('requested', 'accepted')),
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, target_id),
  CHECK (user_id <> target_id)
);

CREATE INDEX IF NOT EXISTS idx_relationships_user
ON relationships(user_id, target_id);

-- =========================================================
-- Blocks
-- =========================================================
CREATE TABLE IF NOT EXISTS blocks (
  blocker_id  INTEGER NOT NULL,
  blocked_id  INTEGER NOT NULL,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (blocker_id, blocked_id),
  CHECK (blocker_id <> blocked_id)
);

CREATE INDEX IF NOT EXISTS idx_blocks_blocked
ON blocks(blocked_id);

-- =========================================================
-- Direct messages (DM)
-- =========================================================
CREATE TABLE IF NOT EXISTS direct_messages (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  sender_id    INTEGER NOT NULL,
  receiver_id  INTEGER NOT NULL,
  content      TEXT NOT NULL,
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  delivered    INTEGER NOT NULL DEFAULT 0 CHECK (delivered IN (0, 1)),
  CHECK (sender_id <> receiver_id),
  CHECK (length(content) > 0 AND length(content) <= 1000)
);

CREATE INDEX IF NOT EXISTS idx_dm_sender_receiver_time
  ON direct_messages(sender_id, receiver_id, created_at);

CREATE INDEX IF NOT EXISTS idx_dm_receiver_time
  ON direct_messages(receiver_id, created_at);

-- =========================================================
-- Game invites (Pong)
-- =========================================================
CREATE TABLE IF NOT EXISTS game_invites (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  from_user_id  INTEGER NOT NULL,
  to_user_id    INTEGER NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  CHECK (from_user_id <> to_user_id)
);

CREATE INDEX IF NOT EXISTS idx_game_invites_to_status_time
  ON game_invites(to_user_id, status, created_at);

-- =========================================================
-- Notifications (tournament/system)
-- =========================================================
CREATE TABLE IF NOT EXISTS notifications (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('tournament', 'system')),
  payload     TEXT NOT NULL,
  read        INTEGER NOT NULL DEFAULT 0 CHECK (read IN (0, 1)),
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read_time
  ON notifications(user_id, read, created_at);

-- =========================================================
-- Trigger: auto-update users_snapshot.updated_at
-- =========================================================
CREATE TRIGGER IF NOT EXISTS trg_users_snapshot_updated_at
AFTER UPDATE ON users_snapshot
FOR EACH ROW
BEGIN
  UPDATE users_snapshot
  SET updated_at = CURRENT_TIMESTAMP
  WHERE user_id = OLD.user_id;
END;
