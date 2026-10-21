CREATE TABLE IF NOT EXISTS sessions (
 token_hash TEXT PRIMARY KEY,
 board TEXT NOT NULL,
 state_json TEXT NOT NULL,
 revision INTEGER NOT NULL DEFAULT 0,
 expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS session_expiry ON sessions(expires_at);
CREATE TABLE IF NOT EXISTS scores (
 run_hash TEXT PRIMARY KEY,
 board TEXT NOT NULL,
 nickname TEXT NOT NULL,
 score REAL NOT NULL,
 time_ms INTEGER NOT NULL,
 created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS score_ranking ON scores(board,score DESC,time_ms,created_at);
CREATE TABLE IF NOT EXISTS request_limits (
 bucket TEXT PRIMARY KEY,
 count INTEGER NOT NULL,
 expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS limit_expiry ON request_limits(expires_at);
