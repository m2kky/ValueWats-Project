INSERT INTO "AgentAction" (
  id, "agentId", key, type, "isEnabled", config, instructions, "createdAt", "updatedAt"
)
SELECT
  gen_random_uuid(),
  agent.id,
  capability.key,
  capability.key,
  COALESCE((agent."actionConfig" -> capability.legacy_key ->> 'enabled')::boolean, false),
  '{}'::jsonb,
  COALESCE(agent."actionConfig" -> capability.legacy_key ->> 'instructions', ''),
  NOW(),
  NOW()
FROM "AIAgent" agent
CROSS JOIN (
  VALUES
    ('update_contact', 'updateFields'),
    ('update_lifecycle', 'updateLifecycle'),
    ('modify_tags', 'updateTags'),
    ('add_internal_comment', 'addComment')
) AS capability(key, legacy_key)
WHERE agent."deletedAt" IS NULL
  AND NOT EXISTS (
    SELECT 1
    FROM "AgentAction" existing
    WHERE existing."agentId" = agent.id
      AND existing.key = capability.key
  );
