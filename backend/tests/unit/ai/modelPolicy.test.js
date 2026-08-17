const fs = require('node:fs');
const path = require('node:path');
const {
  DEFAULT_CHAT_MODEL,
  FALLBACK_CHAT_MODEL,
  DEFAULT_TEMPERATURE,
  COMMENT_MAX_TOKENS,
  resolveChatModel,
  buildChatModelChain
} = require('../../../src/ai/modelPolicy');

describe('shared AI model policy', () => {
  it('normalizes legacy and empty model values to the global default', () => {
    expect(DEFAULT_CHAT_MODEL).toBe('qwen/qwen3.5-flash-02-23');
    expect(resolveChatModel()).toBe(DEFAULT_CHAT_MODEL);
    expect(resolveChatModel('deepseek-chat')).toBe(DEFAULT_CHAT_MODEL);
    expect(resolveChatModel('  ')).toBe(DEFAULT_CHAT_MODEL);
    expect(resolveChatModel('anthropic/claude-sonnet-4')).toBe('anthropic/claude-sonnet-4');
  });

  it('uses DeepSeek V3.2 once as the fallback for every primary model', () => {
    expect(FALLBACK_CHAT_MODEL).toBe('deepseek/deepseek-v3.2');
    expect(buildChatModelChain()).toEqual([DEFAULT_CHAT_MODEL, FALLBACK_CHAT_MODEL]);
    expect(buildChatModelChain(FALLBACK_CHAT_MODEL)).toEqual([FALLBACK_CHAT_MODEL]);
  });

  it('defines the global customer-reply generation limits', () => {
    expect(DEFAULT_TEMPERATURE).toBe(0.4);
    expect(COMMENT_MAX_TOKENS).toBe(300);
  });

  it('defines Qwen defaults and migrates every existing Agent to the shared policy', () => {
    const schema = fs.readFileSync(path.resolve(__dirname, '../../../prisma/schema.prisma'), 'utf8');
    const migrationPath = path.resolve(
      __dirname,
      '../../../prisma/migrations/20260817030000_standardize_agent_model_policy/migration.sql'
    );

    expect(schema).toContain('aiProvider  String @default("openrouter")');
    expect(schema).toContain('aiModel     String @default("qwen/qwen3.5-flash-02-23")');
    expect(schema).toContain('temperature Float  @default(0.4)');
    expect(fs.existsSync(migrationPath)).toBe(true);

    const migration = fs.readFileSync(migrationPath, 'utf8');
    expect(migration).toContain('ALTER COLUMN "aiProvider" SET DEFAULT \'openrouter\'');
    expect(migration).toContain('ALTER COLUMN "aiModel" SET DEFAULT \'qwen/qwen3.5-flash-02-23\'');
    expect(migration).toContain('UPDATE "AIAgent"');
    expect(migration).toContain('"aiModel" = \'qwen/qwen3.5-flash-02-23\'');
    expect(migration).toContain('"temperature" = 0.4');
    expect(migration).toContain('"maxTokens" = 500');
  });
});
