DROP INDEX IF EXISTS agent_knowledge_embedding_idx;

-- Existing vectors cannot be converted safely; source content remains for re-indexing.
UPDATE "AgentKnowledge" SET embedding = NULL WHERE embedding IS NOT NULL;

ALTER TABLE "AgentKnowledge"
  ALTER COLUMN embedding TYPE vector(768)
  USING NULL::vector(768);

CREATE INDEX agent_knowledge_embedding_idx
  ON "AgentKnowledge"
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
