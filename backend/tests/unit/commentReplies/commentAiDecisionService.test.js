const { createCommentAiDecisionService } = require('../../../src/commentReplies/commentAiDecisionService');

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
    await service.decide(input);

    expect(knowledgeService.searchKnowledge).toHaveBeenCalledWith('How can I apply?', 'agent-a', 5);
    expect(modelGateway.generate).toHaveBeenCalledWith(expect.objectContaining({
      tools: [],
      responseFormat: 'json'
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
