CREATE TABLE portfolio_lots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    holding_id UUID NOT NULL REFERENCES portfolio_holdings(id) ON DELETE CASCADE,

    buy_date DATE NOT NULL,
    buy_price NUMERIC(12,4) NOT NULL CHECK (buy_price > 0),
    quantity NUMERIC(14,4) NOT NULL CHECK (quantity > 0),

    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_portfolio_lots_holding
ON portfolio_lots(holding_id);
