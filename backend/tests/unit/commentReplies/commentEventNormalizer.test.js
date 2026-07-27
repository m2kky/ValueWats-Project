const {
  normalizeFacebookComment,
  normalizeInstagramComment
} = require('../../../src/commentReplies/commentEventNormalizer');

describe('comment event normalizers', () => {
  it('normalizes Facebook Page feed comments', () => {
    const events = normalizeFacebookComment({
      id: 'page-1',
      changes: [{
        field: 'feed',
        value: {
          item: 'comment',
          verb: 'add',
          comment_id: 'comment-1',
          post_id: 'page-1_post-1',
          parent_id: 'parent-1',
          message: 'What is the price?',
          from: { id: 'person-1', name: 'Mina' },
          created_time: 1785146400,
          post: { name: 'Summer launch' }
        }
      }]
    });

    expect(events).toEqual([{
      provider: 'facebook',
      externalAccountId: 'page-1',
      externalCommentId: 'comment-1',
      externalPostId: 'page-1_post-1',
      parentCommentId: 'parent-1',
      text: 'What is the price?',
      commenterId: 'person-1',
      commenterName: 'Mina',
      postName: 'Summer launch',
      createdAt: new Date('2026-07-27T10:00:00.000Z'),
      isSelf: false
    }]);
  });

  it('normalizes Instagram comments and detects own-account comments by ID', () => {
    const events = normalizeInstagramComment({
      id: 'ig-1',
      time: 1785146400,
      changes: [{
        field: 'comments',
        value: {
          id: 'ig-comment-1',
          text: 'Available?',
          from: { id: 'ig-1', username: 'valuechat' },
          media: { id: 'media-1', caption: 'Launch reel' },
          parent_id: 'ig-parent-1'
        }
      }]
    });

    expect(events).toEqual([{
      provider: 'instagram',
      externalAccountId: 'ig-1',
      externalCommentId: 'ig-comment-1',
      externalPostId: 'media-1',
      parentCommentId: 'ig-parent-1',
      text: 'Available?',
      commenterId: 'ig-1',
      commenterName: 'valuechat',
      postName: 'Launch reel',
      createdAt: new Date('2026-07-27T10:00:00.000Z'),
      isSelf: true
    }]);
  });

  it('ignores unsupported changes and events missing provider identities', () => {
    expect(normalizeFacebookComment({
      id: 'page-1',
      changes: [{ field: 'feed', value: { item: 'post', verb: 'add', post_id: 'post-1' } }]
    })).toEqual([]);
    expect(normalizeInstagramComment({
      id: 'ig-1',
      changes: [{ field: 'comments', value: { id: 'comment-1', text: 'Missing media' } }]
    })).toEqual([]);
  });
});
