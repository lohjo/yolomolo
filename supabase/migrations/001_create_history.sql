CREATE TABLE history (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     text NOT NULL,
  latex       text NOT NULL,
  raw_response text,
  elapsed_ms  integer NOT NULL,
  source_tab  text NOT NULL DEFAULT 'upload',
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_history_user_created ON history (user_id, created_at DESC);
