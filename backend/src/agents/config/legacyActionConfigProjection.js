function cloneJson(value) {
  if (value === null || value === undefined) return value;
  return JSON.parse(JSON.stringify(value));
}

function buildLegacyActionConfigProjection({ existingActionConfig, canonicalActions = [] } = {}) {
  const projection = cloneJson(existingActionConfig) || {};
  const legacyKeys = {
    assign_conversation: 'assignAgent',
    close_conversation: 'closeConversation'
  };

  for (const action of canonicalActions) {
    if (!action || !action.key) continue;
    projection[legacyKeys[action.key] || action.key] = {
      enabled: Boolean(action.isEnabled),
      instructions: action.instructions,
      config: cloneJson(action.config) || {}
    };
  }

  return Object.keys(projection).length ? projection : null;
}

module.exports = { buildLegacyActionConfigProjection };
