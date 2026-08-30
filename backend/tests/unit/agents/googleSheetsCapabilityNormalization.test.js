const { normalizeCapabilities } = require('../../../src/agents/config/agentCapabilityService');

const sheetSource = (overrides = {}) => ({
  name: 'Reference answers',
  spreadsheetId: '1abcdefghijklmnopqrstuvwxyzABCDE',
  range: 'Answers!A1:D100',
  purpose: 'Approved reference answers',
  useWhen: 'Use when the customer asks about shipping.',
  priority: 1,
  ...overrides
});

describe('Google Sheets capability normalization', () => {
  it('normalizes read-only sources with server identifiers', () => {
    const normalized = normalizeCapabilities({
      googleSheets: {
        enabled: true,
        integrationId: ' google-1 ',
        instructions: ' Check approved sources. ',
        sources: [sheetSource()]
      }
    }).google_sheets_read;

    expect(normalized).toMatchObject({
      isEnabled: true,
      integrationId: 'google-1',
      instructions: 'Check approved sources.'
    });
    expect(normalized.config.sources[0]).toMatchObject(sheetSource());
    expect(normalized.config.sources[0].id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('extracts a spreadsheet ID from a configured Google Sheets URL', () => {
    const spreadsheetId = '1abcdefghijklmnopqrstuvwxyzABCDE';
    const normalized = normalizeCapabilities({
      googleSheets: {
        enabled: true,
        integrationId: 'google-1',
        sources: [sheetSource({ spreadsheetId: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit` })]
      }
    });
    expect(normalized.google_sheets_read.config.sources[0].spreadsheetId).toBe(spreadsheetId);
  });

  it.each([
    ['unbounded range', sheetSource({ range: 'Answers!A:Z' })],
    ['too many rows', sheetSource({ range: 'Answers!A1:D5001' })],
    ['too many columns', sheetSource({ range: 'Answers!A1:AE100' })]
  ])('rejects %s', (_label, invalidSource) => {
    expect(() => normalizeCapabilities({
      googleSheets: { enabled: true, integrationId: 'google-1', sources: [invalidSource] }
    })).toThrow(expect.objectContaining({ code: 'CAPABILITY_CONFIG_INVALID' }));
  });
});
