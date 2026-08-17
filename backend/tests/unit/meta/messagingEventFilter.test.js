const { shouldIgnoreMessagingEvent } = require('../../../src/meta/messagingEventFilter');

describe('shouldIgnoreMessagingEvent', () => {
  it('ignores a Meta echo so an agent never replies to its own message', () => {
    expect(shouldIgnoreMessagingEvent({
      sender: { id: 'page-1' },
      recipient: { id: 'parent-1' },
      message: { mid: 'echo-1', is_echo: true }
    }, 'page-1')).toBe(true);
  });
});
