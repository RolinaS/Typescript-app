-- Holdings
INSERT INTO portfolio_holdings (code, name, symbol)
VALUES
('ENGI', 'Engie', 'ENGI.PA'),
('ESE', 'BNP Paribas Easy S&P 500', 'ESE.PA'),
('AI', 'Air Liquide', 'AI.PA');

-- Lots Engie
INSERT INTO portfolio_lots (holding_id, buy_date, buy_price, quantity)
SELECT id, '2026-01-01', 28.80, 5 FROM portfolio_holdings WHERE symbol = 'ENGI.PA';

-- Lots BNP S&P500
INSERT INTO portfolio_lots (holding_id, buy_date, buy_price, quantity)
SELECT id, '2025-01-13', 28.38, 5 FROM portfolio_holdings WHERE symbol = 'ESE.PA';

-- Quotes (mock Finnhub)
INSERT INTO market_quotes (symbol, price, previous_close, change, change_percent)
VALUES
  ('ENGI.PA', 29.80, 28.80, 1.00, 3.47),
  ('ESE.PA', 29.50, 29.44, 0.06, 0.22),
  ('AI.PA', 156.40, 155.20, 1.20, 0.77);

