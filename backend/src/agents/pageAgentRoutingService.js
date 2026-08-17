const PAGE_AGENT_ROUTING_ERROR_CODES = Object.freeze({
  INPUT_INVALID: 'PAGE_AGENT_ROUTING_INPUT_INVALID',
  INSTANCE_NOT_FOUND: 'PAGE_AGENT_ROUTING_INSTANCE_NOT_FOUND',
  PRIMARY_AGENT_INELIGIBLE: 'PAGE_AGENT_ROUTING_PRIMARY_AGENT_INELIGIBLE'
});

class PageAgentRoutingError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'PageAgentRoutingError';
    this.code = code;
  }
}

function routingError(code, message) {
  return new PageAgentRoutingError(PAGE_AGENT_ROUTING_ERROR_CODES[code], message);
}

function createPageAgentRoutingService({ prisma } = {}) {
  if (!prisma) throw new Error('Prisma client is required');

  async function assignPrimaryAgent({ tenantId, instanceId, primaryAgentId }) {
    if (typeof prisma.$transaction !== 'function') {
      throw new Error('Prisma transaction support is required');
    }
    const scopedTenantId = String(tenantId || '').trim();
    const scopedInstanceId = String(instanceId || '').trim();
    const selectedAgentId = primaryAgentId == null
      ? null
      : String(primaryAgentId).trim();

    if (!scopedTenantId || !scopedInstanceId || primaryAgentId !== null && !selectedAgentId) {
      throw routingError('INPUT_INVALID', 'Tenant, Instance, and Primary Agent identity are invalid');
    }

    return prisma.$transaction(async (tx) => {
      const instance = await tx.instance.findFirst({
        where: { id: scopedInstanceId, tenantId: scopedTenantId }
      });
      if (!instance) {
        throw routingError('INSTANCE_NOT_FOUND', 'Connected account was not found');
      }

      const binding = await tx.commentChannelBinding.findFirst({
        where: { tenantId: scopedTenantId, instanceId: scopedInstanceId }
      });

      if (!selectedAgentId) {
        if (binding) {
          await tx.commentChannelBinding.updateMany({
            where: { id: binding.id, tenantId: scopedTenantId },
            data: { isEnabled: false }
          });
          await tx.commentReplyProfile.updateMany({
            where: { id: binding.profileId, tenantId: scopedTenantId },
            data: { configVersion: { increment: 1 } }
          });
        }
        return tx.instance.update({
          where: { id: scopedInstanceId },
          data: { primaryAgentId: null },
          include: {
            primaryAgent: { select: { id: true, name: true, isActive: true, isPublished: true } }
          }
        });
      }

      const agent = await tx.aIAgent.findFirst({
        where: {
          id: selectedAgentId,
          tenantId: scopedTenantId,
          isActive: true,
          isPublished: true,
          deletedAt: null
        }
      });
      if (!agent) {
        throw routingError('PRIMARY_AGENT_INELIGIBLE', 'Primary Agent must be active, published, and belong to this workspace');
      }

      let profile = await tx.commentReplyProfile.findUnique({
        where: {
          tenantId_agentId: { tenantId: scopedTenantId, agentId: selectedAgentId }
        }
      });
      if (!profile) {
        profile = await tx.commentReplyProfile.create({
          data: {
            tenantId: scopedTenantId,
            agentId: selectedAgentId,
            isEnabled: false
          }
        });
      }

      if (binding && binding.profileId !== profile.id) {
        await tx.commentChannelBinding.update({
          where: { id: binding.id },
          data: { profileId: profile.id }
        });
        await tx.commentReplyProfile.updateMany({
          where: { id: binding.profileId, tenantId: scopedTenantId },
          data: { configVersion: { increment: 1 } }
        });
        await tx.commentReplyProfile.updateMany({
          where: { id: profile.id, tenantId: scopedTenantId },
          data: { configVersion: { increment: 1 } }
        });
      }

      return tx.instance.update({
        where: { id: scopedInstanceId },
        data: { primaryAgentId: selectedAgentId },
        include: {
          primaryAgent: { select: { id: true, name: true, isActive: true, isPublished: true } }
        }
      });
    });
  }

  return { assignPrimaryAgent };
}

module.exports = {
  PAGE_AGENT_ROUTING_ERROR_CODES,
  PageAgentRoutingError,
  createPageAgentRoutingService
};
