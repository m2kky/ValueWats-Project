const { redactForLog, sanitizeError } = require('../../../src/logging/redaction');
const fs = require('fs');
const path = require('path');

describe('log redaction', () => {
  it('redacts secrets, identity data, prompts, tool arguments, and webhook payloads without mutating input', () => {
    const input = {
      Authorization: 'Bearer top-secret',
      cookie: 'session=top-secret',
      accessToken: 'provider-token',
      customerPhone: '+20 100 123 4567',
      email: 'person@example.com',
      systemPrompt: 'private system instructions',
      toolArguments: { query: 'private customer query' },
      rawWebhookPayload: { messages: [{ text: 'private inbound text' }] },
      nested: {
        authorizationHeader: 'Bearer nested-secret',
        providerTokenValue: 'nested-token',
        promptText: 'private prompt',
        toolCallArguments: { query: 'private query' },
        rawWebhookBody: { message: 'private message' }
      },
      safe: 'keep this'
    };

    expect(redactForLog(input)).toEqual({
      Authorization: '[REDACTED]',
      cookie: '[REDACTED]',
      accessToken: '[REDACTED]',
      customerPhone: '[REDACTED]',
      email: '[REDACTED]',
      systemPrompt: '[REDACTED]',
      toolArguments: '[REDACTED]',
      rawWebhookPayload: '[REDACTED]',
      nested: {
        authorizationHeader: '[REDACTED]',
        providerTokenValue: '[REDACTED]',
        promptText: '[REDACTED]',
        toolCallArguments: '[REDACTED]',
        rawWebhookBody: '[REDACTED]'
      },
      safe: 'keep this'
    });
    expect(input.toolArguments).toEqual({ query: 'private customer query' });
  });

  it('redacts phone and email values embedded in strings and sanitizes error details', () => {
    expect(redactForLog('Contact person@example.com at +201001234567')).toBe(
      'Contact [REDACTED_EMAIL] at [REDACTED_PHONE]'
    );

    const sanitized = sanitizeError({
      code: 'PROVIDER_FAILED',
      message: 'Failed for person@example.com using token=secret-value',
      response: { data: { phone: '+201001234567' } }
    });

    expect(sanitized).toEqual({
      code: 'PROVIDER_FAILED',
      message: 'Failed for [REDACTED_EMAIL] using token=[REDACTED]'
    });
  });

  it('does not log raw tool arguments or Meta webhook payloads', () => {
    const toolService = fs.readFileSync(
      path.join(__dirname, '../../../src/services/toolService.js'),
      'utf8'
    );
    const metaWebhook = fs.readFileSync(
      path.join(__dirname, '../../../src/controllers/metaWebhookController.js'),
      'utf8'
    );

    expect(toolService).not.toMatch(/Executing tool:[^\n]+,\s*args/);
    expect(toolService).not.toContain('error: error.message');
    expect(toolService).not.toContain('error.response?.data');
    expect(metaWebhook).not.toContain('Received payload:');
    expect(metaWebhook).not.toContain("error.response?.data || error.message");
  });
});
