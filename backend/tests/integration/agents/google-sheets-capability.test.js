const { randomUUID } = require('crypto');
const { createTestDatabase, resetDatabase } = require('../../helpers/database');
const {
  createAgentCapabilityService
} = require('../../../src/agents/config/agentCapabilityService');

const prisma = createTestDatabase(process.env.DATABASE_URL);
const service = createAgentCapabilityService({ prisma });

const sheetSource = (overrides = {}) => ({
  name: 'Reference answers',
  spreadsheetId: '1abcdefghijklmnopqrstuvwxyzABCDE',
  range: 'Answers!A1:D100',
  purpose: 'Approved reference answers',
  useWhen: 'Use when the customer asks about shipping.',
  priority: 1,
  ...overrides
});

describe('Google Sheets read capability', () => {
  beforeEach(async () => resetDatabase(prisma));
  afterAll(async () => prisma.$disconnect());

  it('persists one tenant-owned active Google Sheets OAuth connection', async () => {
    const tenant = await prisma.tenant.create({
      data: { name: 'Sheets Tenant', email: 'sheets@example.test' }
    });
    const agent = await prisma.aIAgent.create({
      data: { tenantId: tenant.id, name: 'Sheets Agent', instructions: 'Answer safely.' }
    });
    const integration = await prisma.integration.create({
      data: {
        tenantId: tenant.id,
        type: 'google_sheets_oauth',
        name: 'Google Sheets',
        credentials: 'encrypted',
        status: 'active'
      }
    });

    const updated = await service.update({
      tenantId: tenant.id,
      agentId: agent.id,
      expectedConfigVersion: 1,
      capabilities: {
        googleSheets: {
          enabled: true,
          integrationId: integration.id,
          instructions: 'Use for approved answers.',
          sources: [sheetSource({ id: randomUUID() })]
        }
      }
    });

    expect(updated.actions.find((row) => row.key === 'google_sheets_read')).toMatchObject({
      type: 'google_sheets_read',
      integrationId: integration.id,
      isEnabled: true,
      instructions: 'Use for approved answers.',
      config: { sources: [expect.objectContaining({ name: 'Reference answers' })] }
    });
    expect(updated.actionConfig?.google_sheets).toBeUndefined();
  });
});
