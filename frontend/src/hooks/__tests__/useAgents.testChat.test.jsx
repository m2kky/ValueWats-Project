import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import useAgents from '../useAgents';
import api from '../../api/client';

vi.mock('../../api/client', () => ({ default: { post: vi.fn() } }));

describe('agent preview requests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => vi.restoreAllMocks());

  it('shows the provider failure instead of inventing an assistant reply', async () => {
    api.post.mockRejectedValue({ response: { status: 402, data: {
      error: 'Failed to get test response', response: 'AI Error: Insufficient credits'
    } } });
    const { result } = renderHook(() => useAgents());
    let reply;
    await act(async () => { reply = await result.current.testChat('agent-1', 'hello'); });
    expect(reply.error).toBe('AI Error: Insufficient credits');
    expect(reply).not.toHaveProperty('response');
  });

  it('preserves agent lookup failures', async () => {
    api.post.mockRejectedValue({ response: { status: 404, data: { error: 'Agent not found' } } });
    const { result } = renderHook(() => useAgents());
    let reply;
    await act(async () => { reply = await result.current.testChat('agent-1', 'hello'); });
    expect(reply.error).toBe('Agent not found');
  });

  it('explains when the API cannot be reached', async () => {
    api.post.mockRejectedValue({ code: 'ERR_NETWORK', message: 'Network Error' });
    const { result } = renderHook(() => useAgents());
    let reply;
    await act(async () => { reply = await result.current.testChat('agent-1', 'hello'); });
    expect(reply.error).toMatch(/backend|connection/i);
    expect(reply).not.toHaveProperty('response');
  });

  it('excludes failed requests from the next model history', async () => {
    api.post.mockResolvedValue({ data: { response: 'Hello' } });
    const { result } = renderHook(() => useAgents());
    await act(async () => {
      await result.current.testChat('agent-1', 'retry', [
        { role: 'user', content: 'hello' },
        { role: 'error', content: 'AI Error: Insufficient credits' },
        { role: 'assistant', content: 'Hi' },
      ]);
    });
    expect(api.post).toHaveBeenCalledWith('/agents/agent-1/test', {
      message: 'retry', history: [
        { role: 'user', content: 'hello' },
        { role: 'assistant', content: 'Hi' },
      ]
    });
  });
});
