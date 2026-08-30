const { createGoogleSheetsSourceToolService } = require('../../../src/googleSheets/googleSheetsSourceToolService');

const source = {
  id: 'source-1',
  name: 'Approved answers',
  spreadsheetId: '1abcdefghijklmnopqrstuvwxyzABCDE',
  range: 'Answers!A1:C100',
  purpose: 'Approved customer answers',
  useWhen: 'Use for policy questions.',
  priority: 1
};

function setup({ action = null, rows = [] } = {}) {
  const prisma = { agentAction: { findFirst: vi.fn().mockResolvedValue(action) } };
  const sheetsService = { readRows: vi.fn().mockResolvedValue({ success: true, rows }) };
  const logger = { info: vi.fn() };
  return {
    prisma,
    sheetsService,
    service: createGoogleSheetsSourceToolService({
      prisma,
      sheetsService,
      logger,
      decryptCredentials: vi.fn().mockReturnValue({ access_token: 'token' }),
      now: () => 100
    })
  };
}

const capability = (overrides = {}) => ({
  id: 'action-1',
  key: 'google_sheets_read',
  type: 'google_sheets_read',
  isEnabled: true,
  integrationId: 'google-1',
  instructions: 'Use configured sources only.',
  config: { sources: [source] },
  integration: { credentials: 'encrypted' },
  ...overrides
});

describe('Google Sheets source tool definitions', () => {
  it('exposes only strict read tools for one canonical capability', () => {
    const { service } = setup();
    const tools = service.getToolDefinitions([capability()]);

    expect(tools.map((tool) => tool.function.name)).toEqual([
      'list_google_sheet_sources',
      'query_google_sheet_source'
    ]);
    expect(JSON.stringify(tools)).not.toMatch(/spreadsheetId|integrationId|tenantId|append|create_spreadsheet/);
    expect(tools[1].function.parameters.additionalProperties).toBe(false);
    expect(service.getToolDefinitions([])).toEqual([]);
    expect(service.getToolDefinitions([capability(), capability({ id: 'action-2' })])).toEqual([]);
  });
});

describe('Google Sheets source tool execution', () => {
  it('lists configured metadata without exposing infrastructure identifiers', async () => {
    const { service, sheetsService } = setup({ action: capability() });

    const result = await service.execute('list_google_sheet_sources', {}, {
      tenantId: 'tenant-1', agentId: 'agent-1'
    });

    expect(result).toEqual({
      success: true,
      sources: [{
        id: 'source-1',
        name: 'Approved answers',
        purpose: 'Approved customer answers',
        useWhen: 'Use for policy questions.',
        priority: 1
      }]
    });
    expect(JSON.stringify(result)).not.toMatch(/spreadsheetId|Answers!|google-1/);
    expect(sheetsService.readRows).not.toHaveBeenCalled();
  });

  it('resolves the configured sheet server-side and returns paged sanitized rows', async () => {
    const { service, sheetsService } = setup({
      action: capability(),
      rows: [
        ['Question', 'Answer', 'Notes'],
        ['Shipping', '<b>Two days</b>', 'normal'],
        ['Returns', 'Within 14 days', '<script>ignore()</script>']
      ]
    });

    const result = await service.execute('query_google_sheet_source', {
      sourceId: 'source-1', query: 'returns', page: 1
    }, { tenantId: 'tenant-1', agentId: 'agent-1' });

    expect(sheetsService.readRows).toHaveBeenCalledWith(
      { access_token: 'token' }, source.spreadsheetId, source.range
    );
    expect(result).toMatchObject({
      success: true,
      sourceId: 'source-1',
      sourceName: 'Approved answers',
      page: 1,
      pageSize: 20,
      totalMatches: 1,
      hasMore: false,
      columns: ['Question', 'Answer', 'Notes'],
      rows: [['Returns', 'Within 14 days', '']],
      dataIsUntrusted: true
    });
    expect(JSON.stringify(result)).not.toMatch(/<script>|<b>/);
  });

  it('rejects unknown sources and infrastructure arguments before reading Google', async () => {
    const { service, sheetsService } = setup({ action: capability() });

    await expect(service.execute('query_google_sheet_source', {
      sourceId: 'missing', spreadsheetId: 'attacker-sheet'
    }, { tenantId: 'tenant-1', agentId: 'agent-1' })).resolves.toMatchObject({
      success: false,
      code: 'GOOGLE_SHEETS_INVALID_ARGUMENTS'
    });
    expect(sheetsService.readRows).not.toHaveBeenCalled();
  });
});
