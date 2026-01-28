CREATE TABLE user (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    provider TEXT NOT NULL,
    provider_id TEXT,
    avatar_url TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_user_provider_provider_id ON user(provider, provider_id);

CREATE TABLE player_stats (
    id TEXT PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL,
    player_level TEXT NOT NULL DEFAULT 'NOOB'
        CONSTRAINT player_level_check
        CHECK (player_level IN ('NOOB', 'MIDS', 'PRO')),
    elo_rating INTEGER DEFAULT 1000,
    matches_played INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    cumulative_points INTEGER DEFAULT 0,
    last_active_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES user(id)
);

CREATE TABLE friendship (
    id TEXT PRIMARY KEY,
    requester_id TEXT NOT NULL,
    addressee_id TEXT NOT NULL,
    friendship_status TEXT NOT NULL DEFAULT 'PENDING'
        CONSTRAINT friendship_status_check
        CHECK (friendship_status IN ('PENDING', 'ACCEPTED', 'BLOCKED')),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_at DATETIME,
    UNIQUE (requester_id, addressee_id),
    FOREIGN KEY (requester_id) REFERENCES user(id),
    FOREIGN KEY (addressee_id) REFERENCES user(id)
);
CREATE INDEX idx_friendship_addressee_id ON friendship(addressee_id);
