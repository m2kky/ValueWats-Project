const {
  createCommentAiDecisionService,
  createDefaultModelGateway
} = require('../../../src/commentReplies/commentAiDecisionService');

function subject(output, overrides = {}) {
  const modelGateway = { generate: vi.fn().mockResolvedValue(output) };
  const knowledgeService = { searchKnowledge: vi.fn().mockResolvedValue([{ content: 'Admissions are open.' }]) };
  const service = createCommentAiDecisionService({ modelGateway, knowledgeService });
  const input = {
    execution: { tenantId: 'tenant-a', platform: 'instagram', commentText: 'How can I apply?', postName: 'Admissions' },
    agent: {
      id: 'agent-a', tenantId: 'tenant-a', name: 'NASA Agent', instructions: 'Answer school questions.',
      aiModel: 'test-model', temperature: 0.2, maxTokens: 300
    },
    profile: {
      commentAiInstructions: 'Be concise.', privateReplyEnabled: true,
      privateReplyInstructions: 'Ask for a phone number privately.'
    },
    binding: { externalAccountId: 'page-a', instance: { instanceName: 'NASA' } },
    post: { name: 'Admissions' },
    ...overrides
  };
  return { input, knowledgeService, modelGateway, service };
}

describe('read-only Comment AI decisions', () => {
  it('forwards JSON response enforcement to the shared chat gateway', async () => {
    const chatGateway = {
      chat: vi.fn().mockResolvedValue({ content: '{"action":"skip"}' })
    };
    const gateway = createDefaultModelGateway(chatGateway);

    await gateway.generate({
      messages: [{ role: 'user', content: 'Test' }],
      model: 'openai/gpt-4o-mini',
      temperature: 0.2,
      maxTokens: 300,
      responseFormat: 'json'
    });

    expect(chatGateway.chat).toHaveBeenCalledWith(expect.objectContaining({
      response_format: { type: 'json_object' }
    }));
  });

  it.each([
    [{ action: 'skip', publicReply: null, privateReply: null, reasonCode: 'not_actionable' }, 'skip'],
    [{ action: 'human_review', publicReply: null, privateReply: null, reasonCode: 'needs_staff' }, 'human_review'],
    [{ action: 'reply_only', publicReply: 'Admissions are open.', privateReply: null, reasonCode: 'answered' }, 'reply_only'],
    [{ action: 'reply_and_dm', publicReply: 'We sent the details privately.', privateReply: 'Welcome! Which grade?', reasonCode: 'collect_details' }, 'reply_and_dm']
  ])('accepts the %s action with its required text shape', async (modelOutput, action) => {
    const { input, service } = subject(modelOutput);
    await expect(service.decide(input)).resolves.toMatchObject({ action });
  });

  it('retrieves knowledge only with the selected Agent and calls a model with no tools', async () => {
    const { input, knowledgeService, modelGateway, service } = subject({
      action: 'reply_only', publicReply: 'Applications are open.', privateReply: null, reasonCode: 'kb_answer'
    });
    input.agent.aiModel = 'deepseek-chat';
    input.agent.maxTokens = 500;
    await service.decide(input);

    expect(knowledgeService.searchKnowledge).toHaveBeenCalledWith('How can I apply?', 'agent-a', 5);
    expect(modelGateway.generate).toHaveBeenCalledWith(expect.objectContaining({
      model: 'qwen/qwen3.5-flash-02-23',
      maxTokens: 300,
      tools: [],
      responseFormat: expect.objectContaining({ type: 'json_schema' })
    }));
  });

  it.each([
    ['not json'],
    [{ action: 'reply_and_dm', publicReply: 'Done', privateReply: null, reasonCode: 'missing_dm' }],
    [{ action: 'reply_only', publicReply: '[ACTION: delete]', privateReply: null, reasonCode: 'unsafe' }],
    [{ action: 'reply_only', publicReply: 'x'.repeat(2201), privateReply: null, reasonCode: 'too_long' }],
    [{ action: 'invented', publicReply: null, privateReply: null, reasonCode: 'bad_action' }]
  ])('fails closed to human review for invalid or unsafe model output', async (modelOutput) => {
    const { input, service } = subject(modelOutput);
    await expect(service.decide(input)).resolves.toEqual({
      action: 'human_review',
      publicReply: null,
      privateReply: null,
      reasonCode: 'invalid_ai_output'
    });
  });

  it('requests a schema that rejects unknown actions and non-ASCII reason codes', async () => {
    const { input, modelGateway, service } = subject({
      action: 'reply_only', publicReply: 'التقديم متاح.', privateReply: null, reasonCode: 'answered'
    });
    await service.decide(input);
    const format = modelGateway.generate.mock.calls[0][0].responseFormat;
    expect(format.type).toBe('json_schema');
    expect(format.json_schema.strict).toBe(true);
    const validate = new (require('ajv'))().compile(format.json_schema.schema);
    expect(validate({ action: 'reply_only', publicReply: 'التقديم متاح.', privateReply: null, reasonCode: 'answered' })).toBe(true);
    expect(validate({ action: 'reply', publicReply: 'التقديم متاح.', privateReply: null, reasonCode: 'answered' })).toBe(false);
    expect(validate({ action: 'reply_only', publicReply: 'التقديم متاح.', privateReply: null, reasonCode: 'تم الرد' })).toBe(false);
    expect(validate({ action: 'reply_only', publicReply: 'التقديم متاح.', privateReply: null })).toBe(false);
  });

  it('excludes private-message decisions from the requested schema when DM is disabled', async () => {
    const { input, modelGateway, service } = subject({
      action: 'reply_only', publicReply: 'Hello', privateReply: null, reasonCode: 'answered'
    });
    input.profile.privateReplyEnabled = false;
    await service.decide(input);
    const format = modelGateway.generate.mock.calls[0][0].responseFormat;
    expect(format.type).toBe('json_schema');
    const validate = new (require('ajv'))().compile(format.json_schema.schema);
    expect(validate({ action: 'reply_and_dm', publicReply: 'Hello', privateReply: 'Details', reasonCode: 'answered' })).toBe(false);
  });

  it.each([
    { action: 'reply', publicReply: 'Hello', privateReply: null, reasonCode: 'answered' },
    { action: 'reply_only', publicReply: 'Hello', privateReply: null, reasonCode: 'تم الرد' },
    'not JSON',
  ])('recovers a malformed decision with one validated correction: %j', async (invalid) => {
    const { input, modelGateway, service } = subject(invalid);
    modelGateway.generate.mockResolvedValueOnce(invalid).mockResolvedValueOnce({
      action: 'reply_only', publicReply: 'التقديم متاح.', privateReply: null, reasonCode: 'answered'
    });
    await expect(service.decide(input)).resolves.toEqual({
      action: 'reply_only', publicReply: 'التقديم متاح.', privateReply: null, reasonCode: 'answered'
    });
    expect(modelGateway.generate).toHaveBeenCalledTimes(2);
  });

  it('stops after one correction when the decision remains invalid', async () => {
    const { input, modelGateway, service } = subject({
      action: 'reply', publicReply: 'Hello', privateReply: null, reasonCode: 'answered'
    });
    await expect(service.decide(input)).resolves.toMatchObject({ action: 'human_review', reasonCode: 'invalid_ai_output' });
    expect(modelGateway.generate).toHaveBeenCalledTimes(2);
  });

  it('does not retry model transport failures as malformed output', async () => {
    const { input, modelGateway, service } = subject(null);
    modelGateway.generate.mockRejectedValue(new Error('Invalid API credentials'));
    await expect(service.decide(input)).resolves.toMatchObject({ action: 'human_review', reasonCode: 'ai_unavailable' });
    expect(modelGateway.generate).toHaveBeenCalledTimes(1);
  });

  it('fails closed when DM is disabled or the model call fails', async () => {
    const dm = subject({ action: 'reply_and_dm', publicReply: 'DM sent.', privateReply: 'Hello', reasonCode: 'dm' });
    dm.input.profile.privateReplyEnabled = false;
    await expect(dm.service.decide(dm.input)).resolves.toMatchObject({ action: 'human_review' });

    const failed = subject(null);
    failed.modelGateway.generate.mockRejectedValue(new Error('provider unavailable'));
    await expect(failed.service.decide(failed.input)).resolves.toMatchObject({
      action: 'human_review', reasonCode: 'ai_unavailable'
    });
  });
});
