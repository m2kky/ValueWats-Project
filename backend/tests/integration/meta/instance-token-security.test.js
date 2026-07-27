const { toSafeCampaignInstances, toSafeInstanceDto } = require('../../../src/meta/metaInstanceDto');

describe('Instance token security', () => {
  it('never serializes accessToken', () => {
    expect(toSafeInstanceDto({ id: 'i1', instanceName: 'Page', accessToken: 'secret' }))
      .toEqual({ id: 'i1', instanceName: 'Page' });
  });

  it('never serializes nested campaign instance tokens', () => {
    expect(toSafeCampaignInstances({
      id: 'c1',
      instance: { id: 'i1', accessToken: 'secret-1' },
      campaignInstances: [{ id: 'ci1', instance: { id: 'i2', accessToken: 'secret-2' } }]
    })).toEqual({
      id: 'c1',
      instance: { id: 'i1' },
      campaignInstances: [{ id: 'ci1', instance: { id: 'i2' } }]
    });
  });
});
