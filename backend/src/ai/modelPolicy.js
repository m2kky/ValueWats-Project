const DEFAULT_CHAT_MODEL = 'qwen/qwen3.5-flash-02-23';
const FALLBACK_CHAT_MODEL = 'deepseek/deepseek-v3.2';
const DEFAULT_TEMPERATURE = 0.4;
const DEFAULT_MAX_TOKENS = 500;
const COMMENT_MAX_TOKENS = 300;

function resolveChatModel(model) {
  const candidate = String(model || '').trim();
  return !candidate || candidate === 'deepseek-chat'
    ? DEFAULT_CHAT_MODEL
    : candidate;
}

function buildChatModelChain(model) {
  const primary = resolveChatModel(model);
  return primary === FALLBACK_CHAT_MODEL
    ? [primary]
    : [primary, FALLBACK_CHAT_MODEL];
}

module.exports = {
  DEFAULT_CHAT_MODEL,
  FALLBACK_CHAT_MODEL,
  DEFAULT_TEMPERATURE,
  DEFAULT_MAX_TOKENS,
  COMMENT_MAX_TOKENS,
  resolveChatModel,
  buildChatModelChain
};
