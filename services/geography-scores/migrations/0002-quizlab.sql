-- Additive Quizlab storage. Existing geography sessions and scores are untouched.
CREATE TABLE IF NOT EXISTS quizlab_quizzes (
 slug TEXT PRIMARY KEY,
 current_version TEXT NOT NULL,
 admin_hash TEXT NOT NULL,
 created_at INTEGER NOT NULL,
 updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS quizlab_versions (
 id TEXT PRIMARY KEY,
 slug TEXT NOT NULL,
 config_json TEXT NOT NULL,
 created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS quizlab_version_slug ON quizlab_versions(slug,created_at);
CREATE TABLE IF NOT EXISTS quizlab_sessions (
 token_hash TEXT PRIMARY KEY,
 slug TEXT NOT NULL,
 version TEXT NOT NULL,
 state_json TEXT NOT NULL,
 revision INTEGER NOT NULL DEFAULT 0,
 expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS quizlab_session_expiry ON quizlab_sessions(expires_at);
CREATE TABLE IF NOT EXISTS quizlab_scores (
 run_hash TEXT PRIMARY KEY,
 slug TEXT NOT NULL,
 version TEXT NOT NULL,
 nickname TEXT NOT NULL,
 correct INTEGER NOT NULL,
 answered INTEGER NOT NULL,
 accuracy REAL NOT NULL,
 time_ms INTEGER NOT NULL,
 created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS quizlab_ranking ON quizlab_scores(slug,version,accuracy DESC,correct DESC,time_ms,created_at);
