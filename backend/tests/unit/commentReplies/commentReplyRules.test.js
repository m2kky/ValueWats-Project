const {
  getVariantPool,
  matchCommentRule,
  normalizeCommentText,
  renderCommentTemplate
} = require('../../../src/commentReplies/commentReplyRules');

describe('comment reply rules', () => {
  it('normalizes Unicode Arabic diacritics and tatweel', () => {
    expect(normalizeCommentText('السِّــعر')).toBe('السعر');
  });

  it('matches Arabic regardless of diacritics and tatweel', () => {
    const rules = [{ id: 'r1', priority: 1, matchMode: 'contains_any', keywords: ['السعر'], isEnabled: true }];
    expect(matchCommentRule({ text: 'ما هو السِّــعر؟', rules })?.id).toBe('r1');
  });

  it('uses priority 1 before priority 2', () => {
    const rules = [
      { id: 'r2', priority: 2, matchMode: 'contains_any', keywords: ['سعر'], isEnabled: true },
      { id: 'r1', priority: 1, matchMode: 'contains_any', keywords: ['سعر'], isEnabled: true }
    ];
    expect(matchCommentRule({ text: 'سعر المنتج', rules })?.id).toBe('r1');
  });

  it('orders ties by creation time and then id without changing the input array', () => {
    const rules = [
      { id: 'z', priority: 1, createdAt: '2026-01-02T00:00:00.000Z', matchMode: 'exact', keywords: ['hello'], isEnabled: true },
      { id: 'b', priority: 1, createdAt: '2026-01-01T00:00:00.000Z', matchMode: 'exact', keywords: ['hello'], isEnabled: true },
      { id: 'a', priority: 1, createdAt: '2026-01-01T00:00:00.000Z', matchMode: 'exact', keywords: ['hello'], isEnabled: true }
    ];
    const original = [...rules];

    expect(matchCommentRule({ text: 'hello', rules })?.id).toBe('a');
    expect(rules).toEqual(original);
  });

  it('supports contains_all and exact matching', () => {
    const rules = [
      { id: 'all', priority: 1, matchMode: 'contains_all', keywords: ['price', 'shipping'], isEnabled: true },
      { id: 'exact', priority: 2, matchMode: 'exact', keywords: ['price'], isEnabled: true }
    ];

    expect(matchCommentRule({ text: 'What is the price and shipping?', rules })?.id).toBe('all');
    expect(matchCommentRule({ text: 'price', rules: [rules[1]] })?.id).toBe('exact');
    expect(matchCommentRule({ text: 'price please', rules: [rules[1]] })).toBeNull();
  });

  it('skips disabled, deleted, and unknown-mode rules', () => {
    const rules = [
      { id: 'disabled', priority: 1, matchMode: 'contains_any', keywords: ['price'], isEnabled: false },
      { id: 'deleted', priority: 1, matchMode: 'contains_any', keywords: ['price'], isEnabled: true, deletedAt: '2026-01-01T00:00:00.000Z' },
      { id: 'unknown', priority: 1, matchMode: 'starts_with', keywords: ['price'], isEnabled: true },
      { id: 'valid', priority: 2, matchMode: 'contains_any', keywords: ['price'], isEnabled: true }
    ];

    expect(matchCommentRule({ text: 'price', rules })?.id).toBe('valid');
  });

  it('selects enabled platform variants before shared variants', () => {
    const variants = [
      { id: 'shared', platform: null, orderIndex: 1, isEnabled: true, deletedAt: null },
      { id: 'facebook-disabled', platform: 'facebook', orderIndex: 0, isEnabled: false, deletedAt: null },
      { id: 'facebook', platform: 'facebook', orderIndex: 2, isEnabled: true, deletedAt: null },
      { id: 'deleted-shared', platform: null, orderIndex: 0, isEnabled: true, deletedAt: '2026-01-01T00:00:00.000Z' }
    ];

    expect(getVariantPool({ variants, platform: 'facebook' })).toEqual({
      pool: [variants[2]],
      cursorField: 'facebookRotationCursor'
    });
    expect(getVariantPool({ variants, platform: 'instagram' })).toEqual({
      pool: [variants[0]],
      cursorField: 'instagramRotationCursor'
    });
  });

  it('orders a selected variant pool by order index, creation time, and id', () => {
    const variants = [
      { id: 'z', platform: null, orderIndex: 1, createdAt: '2026-01-02T00:00:00.000Z', isEnabled: true },
      { id: 'b', platform: null, orderIndex: 0, createdAt: '2026-01-01T00:00:00.000Z', isEnabled: true },
      { id: 'a', platform: null, orderIndex: 0, createdAt: '2026-01-01T00:00:00.000Z', isEnabled: true }
    ];

    expect(getVariantPool({ variants, platform: 'instagram' }).pool.map(({ id }) => id)).toEqual(['a', 'b', 'z']);
  });

  it('renders allowed variables and rejects unknown variables', () => {
    expect(renderCommentTemplate('Hi {{ customer_name }} from {{page_name}} on {{platform}}', {
      customer_name: 'Mina',
      page_name: 'ValueUp',
      platform: 'facebook'
    })).toBe('Hi Mina from ValueUp on facebook');
    expect(() => renderCommentTemplate('Hi {{email}}', {})).toThrow(/UNKNOWN_TEMPLATE_VARIABLE/);
  });
});
