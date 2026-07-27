const LIMITS = {
  accountId: 255,
  commentId: 512,
  postId: 512,
  text: 10_000,
  name: 255,
  postName: 500
};

function bounded(value, limit) {
  if (value == null) return null;
  const result = String(value).trim();
  return result ? result.slice(0, limit) : null;
}

function boundedText(value) {
  if (value == null) return '';
  return String(value).slice(0, LIMITS.text);
}

function providerDate(value) {
  if (value == null || value === '') return null;
  const numeric = Number(value);
  const date = Number.isFinite(numeric)
    ? new Date(numeric < 10_000_000_000 ? numeric * 1000 : numeric)
    : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function normalizeFacebookComment(entry) {
  const externalAccountId = bounded(entry?.id, LIMITS.accountId);
  if (!externalAccountId) return [];

  return (Array.isArray(entry.changes) ? entry.changes : []).flatMap((change) => {
    const value = change?.value || {};
    const item = String(value.item || '').toLowerCase();
    const verb = String(value.verb || '').toLowerCase();
    if (change?.field !== 'feed' || verb !== 'add' || (item && item !== 'comment')) return [];

    const externalCommentId = bounded(value.comment_id || value.id, LIMITS.commentId);
    const externalPostId = bounded(value.post_id || value.post?.id, LIMITS.postId);
    if (!externalCommentId || !externalPostId) return [];

    const commenterId = bounded(value.from?.id, LIMITS.accountId);
    return [{
      provider: 'facebook',
      externalAccountId,
      externalCommentId,
      externalPostId,
      parentCommentId: bounded(value.parent_id || value.parent?.id, LIMITS.commentId),
      text: boundedText(value.message),
      commenterId,
      commenterName: bounded(value.from?.name, LIMITS.name),
      postName: bounded(value.post?.name || value.post?.message, LIMITS.postName),
      createdAt: providerDate(value.created_time || entry.time),
      isSelf: commenterId === externalAccountId
    }];
  });
}

function normalizeInstagramComment(entry) {
  const externalAccountId = bounded(entry?.id, LIMITS.accountId);
  if (!externalAccountId) return [];

  return (Array.isArray(entry.changes) ? entry.changes : []).flatMap((change) => {
    if (change?.field !== 'comments') return [];
    const value = change.value || {};
    const externalCommentId = bounded(value.id || value.comment_id, LIMITS.commentId);
    const externalPostId = bounded(value.media?.id || value.media_id || value.post_id, LIMITS.postId);
    if (!externalCommentId || !externalPostId) return [];

    const commenterId = bounded(value.from?.id, LIMITS.accountId);
    return [{
      provider: 'instagram',
      externalAccountId,
      externalCommentId,
      externalPostId,
      parentCommentId: bounded(value.parent_id || value.parent?.id, LIMITS.commentId),
      text: boundedText(value.text),
      commenterId,
      commenterName: bounded(value.from?.username || value.from?.name, LIMITS.name),
      postName: bounded(value.media?.caption || value.media?.name, LIMITS.postName),
      createdAt: providerDate(value.created_time || value.timestamp || entry.time),
      isSelf: commenterId === externalAccountId
    }];
  });
}

module.exports = {
  normalizeFacebookComment,
  normalizeInstagramComment
};
