function envFlag(name) {
  return String(process.env[name] || '').trim().toLowerCase() === 'true';
}

function resolveAgentRuntimeMode(tenant) {
  if (envFlag('AGENT_RUNTIME_KILL_SWITCH')) return 'legacy';
  const mode = tenant?.agentRuntimeMode || 'legacy';
  return ['legacy', 'shadow', 'v2'].includes(mode) ? mode : 'legacy';
}

function areAgentMutationsEnabled() {
  return !envFlag('AGENT_MUTATIONS_KILL_SWITCH');
}

module.exports = { resolveAgentRuntimeMode, areAgentMutationsEnabled };
