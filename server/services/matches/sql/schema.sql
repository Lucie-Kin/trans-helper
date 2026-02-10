CREATE TABLE match (
    id TEXT PRIMARY KEY,
    tournament_match_id TEXT,
    match_type TEXT NOT NULL
        CONSTRAINT match_type_check
        CHECK (match_type IN ('NORMAL', 'TOURNAMENT')),
    player_a_id TEXT NOT NULL,
    player_b_id TEXT NOT NULL,
    player_a_is_ai BOOLEAN DEFAULT FALSE,
    player_b_is_ai BOOLEAN DEFAULT FALSE,
    status TEXT NOT NULL DEFAULT 'PENDING'
        CONSTRAINT match_status_check
        CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
    score_a INTEGER DEFAULT 0,
    score_b INTEGER DEFAULT 0,
    winner_id TEXT,
    started_at DATETIME,
    completed_at DATETIME,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_match_player_a_id ON match(player_a_id);
CREATE INDEX idx_match_player_b_id ON match(player_b_id);

CREATE TABLE elo_history (
    id TEXT PRIMARY KEY,
    match_id INTEGER NOT NULL,
    player_id TEXT NOT NULL,
    elo_before INTEGER DEFAULT 1000,
    elo_after INTEGER,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (match_id) REFERENCES match(id)
);
CREATE INDEX idx_elo_player_id ON elo_history(player_id);
CREATE INDEX idx_elo_match_id ON elo_history(match_id);

CREATE TABLE queue_entry (
    id TEXT PRIMARY KEY,
    player_id TEXT NOT NULL UNIQUE,
    elo_rating INTEGER NOT NULL,
    joined_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status TEXT NOT NULL DEFAULT 'WAITING'
        CONSTRAINT queue_status_check
        CHECK (status IN ('WAITING', 'MATCHED', 'EXPIRED', 'CANCELLED')),
    expires_at DATETIME NOT NULL
);
CREATE INDEX idx_queue_status_mode ON queue_entry(status, mode);
CREATE INDEX idx_queue_elo_rating ON queue_entry(elo_rating);