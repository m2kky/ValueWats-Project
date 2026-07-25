function identityConflict(message) {
  return Object.assign(new Error(message), { code: 'INBOUND_MESSAGE_IDENTITY_CONFLICT' });
}

function createAgentRunRepository(prisma) {
  if (!prisma) throw new Error('Prisma client is required');

  return {
    async createOrGet(data) {
      const {
        tenantId,
        conversationId,
        inboundMessageId,
        sourceAgentId = null,
        agentConfigVersion = null,
        status = 'pending'
      } = data;

      try {
        return await prisma.agentRun.create({
          data: {
            tenantId,
            conversationId,
            inboundMessageId,
            sourceAgentId,
            agentConfigVersion,
            status
          }
        });
      } catch (error) {
        if (error?.code !== 'P2002') throw error;

        const existing = await prisma.agentRun.findUnique({ where: { inboundMessageId } });
        if (!existing
          || existing.tenantId !== tenantId
          || existing.conversationId !== conversationId) {
          throw identityConflict('Inbound message identity already belongs to another context');
        }
        return existing;
      }
    }
  };
}

module.exports = { createAgentRunRepository };
