CREATE TABLE tournament (
  id TEXT PRIMARY KEY,
  organizer_id TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'WAITING_FOR_PLAYERS'
    CONSTRAINT tournament_status_check
    CHECK (status IN ('WAITING_FOR_PLAYERS', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
  best_of INTEGER DEFAULT 1,
  max_players INTEGER DEFAULT 8,
  current_round INTEGER DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  started_at DATETIME,
  completed_at DATETIME
);
CREATE INDEX idx_tournament_organizer_id ON tournament(organizer_id);
CREATE INDEX idx_tournament_status ON tournament(status);

CREATE TABLE tournament_invitation (
  id TEXT PRIMARY KEY,
  tournament_id TEXT NOT NULL,
  invitee_id TEXT NOT NULL,
  inviter_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING'
    CONSTRAINT invitation_status_check
    CHECK (status IN ('PENDING', 'ACCEPTED', 'DECLINED')),
  invited_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  responded_at DATETIME,
  UNIQUE (tournament_id, invitee_id),
  FOREIGN KEY (tournament_id) REFERENCES tournament(id)
);
CREATE INDEX idx_tournament_invitee_id ON tournament_invitation(invitee_id);

CREATE TABLE tournament_participant (
  id TEXT PRIMARY KEY,
  tournament_id TEXT NOT NULL,
  player_id TEXT NOT NULL,
  is_ai BOOLEAN DEFAULT FALSE,
  ai_level INTEGER DEFAULT 0,
  seed INTEGER,
  status TEXT NOT NULL DEFAULT 'WAITING'
    CONSTRAINT participant_status_check
    CHECK (status IN ('WAITING', 'READY', 'PLAYING', 'ELIMINATED', 'WINNER')),
  joined_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (tournament_id, player_id),
  FOREIGN KEY (tournament_id) REFERENCES tournament(id)
);
CREATE INDEX idx_participant_tournament_id ON tournament_participant(tournament_id);

CREATE TABLE tournament_match (
  id TEXT PRIMARY KEY,
  tournament_id TEXT NOT NULL,
  round_index INTEGER,
  bracket_position INTEGER,
  player_a_id TEXT,
  player_b_id TEXT,
  winner_id TEXT,
  status TEXT NOT NULL DEFAULT 'SCHEDULED'
    CONSTRAINT match_status_check
    CHECK (status IN ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED')),
  score_a INTEGER DEFAULT 0,
  score_b INTEGER DEFAULT 0,
  scheduled_at DATETIME,
  completed_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (tournament_id, round_index, bracket_position),
  FOREIGN KEY (tournament_id) REFERENCES tournament(id),
  FOREIGN KEY (player_a_id) REFERENCES tournament_participant(id),
  FOREIGN KEY (player_b_id) REFERENCES tournament_participant(id),
  FOREIGN KEY (winner_id) REFERENCES tournament_participant(id)
);
CREATE INDEX idx_match_tournament_id ON tournament_match(tournament_id);
CREATE INDEX idx_round ON tournament_match(round_index);
