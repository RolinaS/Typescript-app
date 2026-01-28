CREATE TABLE IF NOT EXISTS market_quotes (
  symbol TEXT PRIMARY KEY,

  price NUMERIC(12,4) NOT NULL,
  previous_close NUMERIC(12,4),
  change NUMERIC(12,4),
  change_percent NUMERIC(8,4),

  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_market_quotes_fetched
  ON market_quotes(fetched_at);
