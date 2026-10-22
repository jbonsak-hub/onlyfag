-- Keep all scores and active sessions; only remove language from their ranking key.
-- Repeatable: rows whose key already has no language are left unchanged.
UPDATE scores
SET board = 'v1:' || json_remove(substr(board, 4), '$.language')
WHERE board LIKE 'v1:%' AND json_valid(substr(board, 4))
  AND json_type(substr(board, 4), '$.language') IS NOT NULL;

UPDATE sessions
SET board = 'v1:' || json_remove(substr(board, 4), '$.language')
WHERE board LIKE 'v1:%' AND json_valid(substr(board, 4))
  AND json_type(substr(board, 4), '$.language') IS NOT NULL;
