function shouldIgnoreMessagingEvent(payload, ownAccountId) {
  if (!payload || payload.read || payload.delivery) return true;
  if (payload.message?.is_echo) return true;

  const senderId = String(payload.sender?.id || '');
  return Boolean(ownAccountId && senderId && senderId === String(ownAccountId));
}

module.exports = { shouldIgnoreMessagingEvent };
