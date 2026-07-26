const {
  createTestDatabase,
  resetDatabase
} = require('../../helpers/database');
const {
  createTerminalCapabilityService
} = require('../../../src/agents/config/terminalCapabilityService');

const prisma = createTestDatabase(process.env.DATABASE_URL);
const service = createTerminalCapabilityService({ prisma });

describe('terminal capability setup', () => {
  beforeEach(async () => {
    await resetDatabase(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('stores reviewed assignment and close settings as canonical AgentAction rows', async () => {
    const tenant = await prisma.tenant.create({
      data: { name: 'Capability Tenant', email: 'capability@example.test' }
    });
    const agent = await prisma.aIAgent.create({
      data: {
        tenantId: tenant.id,
        name: 'Capability Agent',
        instructions: 'Handle transfers.'
      }
    });

    const updated = await service.update({
      tenantId: tenant.id,
      agentId: agent.id,
      expectedConfigVersion: 1,
      capabilities: {
        assignConversation: {
          enabled: true,
          instructions: 'Transfer specialist requests.',
          allowedTargets: ['@team:agents', '@agent:target-agent'],
          allowUnassignedHuman: false,
          teamStrategies: { 'team:agents': 'least_open' },
          handoffMessage: 'Transferring you now.'
        },
        closeConversation: {
          enabled: true,
          instructions: 'Close only resolved conversations.'
        }
      }
    });

    expect(updated.configVersion).toBe(2);
    const assignment = updated.actions.find((action) => action.key === 'assign_conversation');
    expect(assignment).toMatchObject({
      isEnabled: true,
      instructions: 'Transfer specialist requests.',
      config: {
        allowedTargets: ['team:agents', 'agent:target-agent'],
        allowUnassignedHuman: false,
        teamStrategies: { 'team:agents': 'least_open' },
        handoffMessage: 'Transferring you now.',
        requiresReview: false
      }
    });
    expect(updated.actionConfig).toMatchObject({
      assignAgent: {
        enabled: true,
        instructions: 'Transfer specialist requests.'
      },
      closeConversation: {
        enabled: true,
        instructions: 'Close only resolved conversations.'
      }
    });
  });

  it('keeps enabled assignment fail-closed when no target was reviewed', async () => {
    const tenant = await prisma.tenant.create({
      data: { name: 'Review Tenant', email: 'review@example.test' }
    });
    const agent = await prisma.aIAgent.create({
      data: {
        tenantId: tenant.id,
        name: 'Review Agent',
        instructions: 'Wait for review.'
      }
    });

    const updated = await service.update({
      tenantId: tenant.id,
      agentId: agent.id,
      expectedConfigVersion: 1,
      capabilities: {
        assignConversation: {
          enabled: true,
          instructions: 'Transfer when needed.',
          allowedTargets: [],
          handoffMessage: 'Transferring you now.'
        }
      }
    });

    const assignment = updated.actions.find((action) => action.key === 'assign_conversation');
    expect(assignment.config).toMatchObject({
      allowedTargets: [],
      allowUnassignedHuman: false,
      requiresReview: true
    });
  });

  it('cannot update another tenant agent', async () => {
    const [tenant, foreignTenant] = await Promise.all([
      prisma.tenant.create({
        data: { name: 'Local Tenant', email: 'local-cap@example.test' }
      }),
      prisma.tenant.create({
        data: { name: 'Foreign Tenant', email: 'foreign-cap@example.test' }
      })
    ]);
    const agent = await prisma.aIAgent.create({
      data: {
        tenantId: foreignTenant.id,
        name: 'Foreign Agent',
        instructions: 'Foreign.'
      }
    });

    await expect(service.update({
      tenantId: tenant.id,
      agentId: agent.id,
      expectedConfigVersion: 1,
      capabilities: {}
    })).rejects.toMatchObject({ code: 'AGENT_NOT_FOUND' });
    expect(await prisma.agentAction.count()).toBe(0);
  });
});
