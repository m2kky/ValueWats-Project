-- Fix 3.4: Setup pgvector HNSW Indexing for the AgentKnowledge embedding column
-- This index significantly improves similarity search performance for RAG from O(N) to O(log N).

CREATE INDEX IF NOT EXISTS agent_knowledge_embedding_idx 
ON "AgentKnowledge" 
USING hnsw (embedding vector_cosine_ops) 
WITH (m = 16, ef_construction = 64);
