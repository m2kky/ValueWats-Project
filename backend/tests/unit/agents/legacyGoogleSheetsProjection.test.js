const { buildLegacyActionConfigProjection } = require('../../../src/agents/config/legacyActionConfigProjection');

it('removes legacy Google Sheets write tools when canonical read sources are managed', () => {
  const projection = buildLegacyActionConfigProjection({
    existingActionConfig: {
      google_sheets: { enabled: true, integrationId: 'legacy-write-connection' },
      httpRequests: { enabled: false, actions: [] }
    },
    canonicalActions: [{
      key: 'google_sheets_read',
      type: 'google_sheets_read',
      isEnabled: true,
      instructions: '',
      config: { sources: [] }
    }]
  });

  expect(projection.google_sheets).toBeUndefined();
  expect(projection.httpRequests).toEqual({ enabled: false, actions: [] });
});
