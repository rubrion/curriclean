-- Remove leftovers from the FastAPI/OpenRouter era.

-- Analyses used to be stored as { analysis, metrics }; keep only the analysis.
UPDATE applications
SET analysis = json_extract(analysis, '$.analysis')
WHERE analysis IS NOT NULL AND json_type(analysis, '$.analysis') = 'object';

-- Per-model USD cost tracking went away with OpenRouter.
ALTER TABLE token_usage DROP COLUMN cost_usd;
