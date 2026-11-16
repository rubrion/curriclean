-- Daily free credit (like Rubry): track credits spent per user per UTC day
-- instead of a count of runs. Each action's price comes out of today's free
-- credit first, then the wallet.
ALTER TABLE token_usage RENAME COLUMN runs TO credits_used;
