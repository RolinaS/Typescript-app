CREATE TABLE portfolio_holdings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    code TEXT NOT NULL,              -- ENGI, AAPL…
    name TEXT NOT NULL,              -- Engie, Apple…
    symbol TEXT NOT NULL,            -- symbole API (ENGI.PA, AAPL)
    currency TEXT NOT NULL DEFAULT 'EUR',

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE(symbol)
);

CREATE INDEX idx_portfolio_holdings_symbol
ON portfolio_holdings(symbol);
