const { ASSIGNMENT_REASON_CODES } = require('../../config/capabilitySchemas');
const { AssignmentTargetError } = require('./assignmentTargetService');

const CAPABILITY_DISABLED = 'CAPABILITY_DISABLED';

function isValidConfiguredTarget(target) {
  return target === 'human'
    || /^agent:[^:\s]+$/.test(target)
    || /^user:[^:\s]+$/.test(target)
    || ['team:agents', 'team:admins', 'team:humans'].includes(target);
}

function exposedAssignmentTargets(config) {
  if (!config || config.requiresReview === true) return [];
  const configured = Array.isArray(config.allowedTargets)
    ? config.allowedTargets.filter((target) => target !== 'human' && isValidConfiguredTarget(target))
    : [];
  if (configured.length === 0) return [];
  return [...new Set([
    ...configured,
    ...(config.allowUnassignedHuman === true ? ['human'] : [])
  ])];
}

function buildAssignmentArgumentSchema(config = {}) {
  const targets = exposedAssignmentTargets(config);
  if (targets.length === 0) return null;
  return {
    type: 'object',
    additionalProperties: false,
    required: ['target', 'reasonCode', 'reason'],
    properties: {
      target: {
        type: 'string',
        enum: targets
      },
      reasonCode: {
        type: 'string',
        enum: [...ASSIGNMENT_REASON_CODES]
      },
      reason: {
        type: 'string',
        minLength: 1,
        maxLength: 500
      }
    }
  };
}

async function authorizeAssignment(context, args, policyScope) {
  const targets = exposedAssignmentTargets(context.capability?.config);
  if (!targets.includes(args.target) || typeof policyScope?.resolveAssignmentTarget !== 'function') {
    return { allowed: false, code: CAPABILITY_DISABLED };
  }
  try {
    await policyScope.resolveAssignmentTarget({
      tenantId: context.tenantId,
      sourceAgentId: context.sourceAgentId,
      target: args.target,
      strategy: context.capability.config.teamStrategies?.[args.target] || 'round_robin'
    });
    return { allowed: true };
  } catch (error) {
    if (error instanceof AssignmentTargetError) {
      return { allowed: false, code: CAPABILITY_DISABLED };
    }
    throw error;
  }
}

module.exports = {
  authorizeAssignment,
  buildAssignmentArgumentSchema,
  exposedAssignmentTargets,
  isValidConfiguredTarget
};
