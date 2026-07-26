const prisma = require('../src/config/database');

const modeArg = process.argv.find((value) => value.startsWith('--mode='));
const mode = modeArg?.split('=')[1] || 'dry-run';
const validModes = new Set(['dry-run', 'apply', 'verify']);

function terminalRows(agent) {
  const rows = [];
  const assignment = agent.actionConfig?.assignAgent;
  const close = agent.actionConfig?.closeConversation;
  if (assignment) {
    rows.push({
      key: 'assign_conversation',
      type: 'assign_conversation',
      isEnabled: assignment.enabled === true,
      instructions: String(assignment.instructions || ''),
      config: {
        allowedTargets: [],
        allowUnassignedHuman: false,
        teamStrategies: {},
        handoffMessage: 'I am transferring this conversation to the right specialist.',
        requiresReview: true
      }
    });
  }
  if (close) {
    rows.push({
      key: 'close_conversation',
      type: 'close_conversation',
      isEnabled: close.enabled === true,
      instructions: String(close.instructions || ''),
      config: {}
    });
  }
  return rows;
}

async function inspect() {
  const agents = await prisma.aIAgent.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      actionConfig: true,
      actions: {
        select: { id: true, key: true, type: true, isEnabled: true }
      }
    }
  });
  const nullKeyActions = await prisma.agentAction.findMany({
    where: { key: null },
    select: { id: true, type: true }
  });
  const creates = [];
  for (const agent of agents) {
    for (const row of terminalRows(agent)) {
      if (!agent.actions.some((action) => action.key === row.key)) {
        creates.push({ agentId: agent.id, ...row });
      }
    }
  }
  return { agents, nullKeyActions, creates };
}

async function verify() {
  const state = await inspect();
  const keyed = await prisma.agentAction.findMany({
    where: { key: { not: null } },
    select: { agentId: true, key: true }
  });
  const seen = new Set();
  const duplicates = [];
  for (const row of keyed) {
    const identity = `${row.agentId}:${row.key}`;
    if (seen.has(identity)) duplicates.push(identity);
    seen.add(identity);
  }
  const result = {
    nullKeys: state.nullKeyActions.length,
    duplicateKeys: duplicates.length,
    unmappedTerminalSettings: state.creates.length
  };
  console.log(JSON.stringify({ mode: 'verify', ...result }));
  if (Object.values(result).some((count) => count !== 0)) process.exitCode = 1;
}

async function apply() {
  const state = await inspect();
  await prisma.$transaction(async (transaction) => {
    for (const action of state.nullKeyActions) {
      await transaction.agentAction.update({
        where: { id: action.id },
        data: { key: `legacy:${action.type}:${action.id}` }
      });
    }
    for (const row of state.creates) {
      await transaction.agentAction.create({ data: row });
    }
  }, { isolationLevel: 'Serializable' });
  console.log(JSON.stringify({
    mode: 'apply',
    legacyKeysAdded: state.nullKeyActions.length,
    terminalCapabilitiesAdded: state.creates.length
  }));
}

async function main() {
  if (!validModes.has(mode)) {
    throw new Error('Mode must be dry-run, apply, or verify');
  }
  if (mode === 'verify') return verify();
  const state = await inspect();
  if (mode === 'dry-run') {
    console.log(JSON.stringify({
      mode,
      legacyKeysToAdd: state.nullKeyActions.length,
      terminalCapabilitiesToAdd: state.creates.length
    }));
    return;
  }
  return apply();
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
