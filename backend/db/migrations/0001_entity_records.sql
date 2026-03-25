CREATE TABLE IF NOT EXISTS entity_records (
  entity TEXT NOT NULL,
  id TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY(entity, id)
);

CREATE INDEX IF NOT EXISTS idx_entity_records_entity_updated_at
  ON entity_records(entity, updated_at DESC);
