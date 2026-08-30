function cloneJson(value) {
  if (value === null || value === undefined) return value;
  return JSON.parse(JSON.stringify(value));
}

function buildLegacyActionConfigProjection({ existingActionConfig, canonicalActions = [] } = {}) {
  const projection = cloneJson(existingActionConfig) || {};
  const legacyKeys = {
    assign_conversation: 'assignAgent',
    close_conversation: 'closeConversation',
    update_contact: 'updateFields',
    update_lifecycle: 'updateLifecycle',
    modify_tags: 'updateTags',
    add_internal_comment: 'addComment',
    store_catalog_read: 'store'
  };

  if (canonicalActions.some((action) => action?.key === 'google_sheets_read')) {
    delete projection.google_sheets;
    delete projection.googleSheetsRead;
  }

  for (const action of canonicalActions) {
    if (!action || !action.key) continue;
    const legacyKey = legacyKeys[action.key];
    if (!legacyKey) continue;
    projection[legacyKey] = {
      enabled: Boolean(action.isEnabled),
      instructions: action.instructions,
      config: cloneJson(action.config) || {}
    };
  }

  return Object.keys(projection).length ? projection : null;
}

module.exports = { buildLegacyActionConfigProjection };
