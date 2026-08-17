ALTER TABLE "AIAgent"
  ALTER COLUMN "aiProvider" SET DEFAULT 'openrouter',
  ALTER COLUMN "aiModel" SET DEFAULT 'qwen/qwen3.5-flash-02-23',
  ALTER COLUMN "temperature" SET DEFAULT 0.4,
  ALTER COLUMN "maxTokens" SET DEFAULT 500;

UPDATE "AIAgent"
SET
  "aiProvider" = 'openrouter',
  "aiModel" = 'qwen/qwen3.5-flash-02-23',
  "temperature" = 0.4,
  "maxTokens" = 500;
