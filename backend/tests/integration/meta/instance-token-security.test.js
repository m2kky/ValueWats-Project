const { toSafeInstanceDto } = require('../../../src/meta/metaInstanceDto');

describe('Instance token security', () => {
  it('never serializes accessToken', () => {
    expect(toSafeInstanceDto({ id: 'i1', instanceName: 'Page', accessToken: 'secret' }))
      .toEqual({ id: 'i1', instanceName: 'Page' });
  });
});
