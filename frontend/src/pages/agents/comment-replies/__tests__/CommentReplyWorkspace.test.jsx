import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import api from '../../../../api/client';
import CommentReplyWorkspace from '../CommentReplyWorkspace';

vi.mock('../../../../api/client', () => ({
  default: {
    delete: vi.fn(),
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn()
  }
}));
vi.mock('react-hot-toast', () => ({
  default: { error: vi.fn(), success: vi.fn() },
  Toaster: () => null
}));

describe('CommentReplyWorkspace', () => {
  afterEach(cleanup);
  beforeEach(() => {
    vi.clearAllMocks();
    let workspaceReads = 0;
    api.get.mockImplementation(async (url) => {
      if (url === '/instances') return { data: { instances: [] } };
      workspaceReads += 1;
      const persisted = workspaceReads > 1;
      return {
        data: {
          agent: { id: 'agent-a', name: 'Greens' },
          profile: {
            id: persisted ? 'profile-a' : null,
            agentId: 'agent-a',
            isEnabled: false,
            configVersion: persisted ? 1 : 0
          },
          bindings: [],
          rules: [],
          overrides: [],
          configVersion: persisted ? 1 : 0
        }
      };
    });
    api.put.mockResolvedValue({ data: { configVersion: 1 } });
    api.post.mockResolvedValue({ data: { id: 'rule-a', configVersion: 2 } });
  });

  it('initializes an empty profile before saving the first rule', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/agents/agent-a/comment-replies']}>
        <Routes>
          <Route path="/agents/:agentId/comment-replies" element={<CommentReplyWorkspace />} />
        </Routes>
      </MemoryRouter>
    );

    await screen.findByRole('heading', { name: 'Comment Replies' });
    await user.click(screen.getByRole('button', { name: 'Reply Rules' }));
    await user.type(screen.getByPlaceholderText('Rule name'), 'Price');
    await user.type(screen.getByPlaceholderText(/Keywords or phrases/i), 'price');
    await user.type(screen.getByPlaceholderText(/Shared replies/i), 'Our current price is available in store.');
    await user.click(screen.getByRole('button', { name: 'Save Rule' }));

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith('/agents/agent-a/comment-replies', {
        expectedConfigVersion: 0,
        isEnabled: false
      });
      expect(api.post).toHaveBeenCalledWith(
        '/agents/agent-a/comment-replies/rules',
        expect.objectContaining({ expectedConfigVersion: 1, name: 'Price' })
      );
    });
  });

  it('saves Comment AI controls and runs a side-effect-free server preview', async () => {
    api.get.mockImplementation(async (url) => {
      if (url === '/instances') return { data: { instances: [] } };
      return {
        data: {
          agent: { id: 'agent-a', name: 'Greens' },
          profile: {
            id: 'profile-a', agentId: 'agent-a', isEnabled: true, configVersion: 4,
            aiMode: 'rules_then_ai', commentAiInstructions: '', privateReplyEnabled: false,
            privateReplyInstructions: '', publicAfterPrivateSuccess: true
          },
          bindings: [{
            id: 'binding-a', instanceId: 'instance-a', provider: 'facebook', isEnabled: true,
            permissionState: 'ready', instance: { id: 'instance-a', instanceName: 'Greens Facebook' }
          }],
          rules: [], overrides: [], activity: [], configVersion: 4
        }
      };
    });
    api.put.mockResolvedValue({ data: { configVersion: 5 } });
    api.post.mockResolvedValue({
      data: {
        route: 'ai', agent: { id: 'agent-a', name: 'Greens' },
        decision: {
          action: 'reply_and_dm', reasonCode: 'sales_question',
          publicReply: 'بعتنالك التفاصيل على الخاص.', privateReply: 'أهلاً! تحب تعرف أنهي منتج؟'
        }
      }
    });
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/agents/agent-a/comment-replies']}>
        <Routes><Route path="/agents/:agentId/comment-replies" element={<CommentReplyWorkspace />} /></Routes>
      </MemoryRouter>
    );

    await screen.findByRole('heading', { name: 'Comment Replies' });
    await user.click(screen.getByRole('button', { name: 'Comment AI' }));
    await user.selectOptions(screen.getByLabelText('AI mode'), 'ai_only');
    await user.type(screen.getByLabelText('Public comment instructions'), 'Reply in Egyptian Arabic.');
    await user.click(screen.getByLabelText('Enable private message'));
    await user.type(screen.getByLabelText('Private message instructions'), 'Ask one qualifying question.');
    await user.click(screen.getByRole('button', { name: 'Save Comment AI' }));

    await waitFor(() => expect(api.put).toHaveBeenCalledWith('/agents/agent-a/comment-replies', expect.objectContaining({
      expectedConfigVersion: 4,
      aiMode: 'ai_only',
      privateReplyEnabled: true,
      publicAfterPrivateSuccess: true
    })));

    await user.click(screen.getByRole('button', { name: 'Test Lab' }));
    await user.type(screen.getByPlaceholderText('Write a sample customer comment...'), 'السعر كام؟');
    await user.click(screen.getByRole('button', { name: 'Run Safe Preview' }));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/agents/agent-a/comment-replies/preview', {
      platform: 'facebook', commentText: 'السعر كام؟', instanceId: 'instance-a', postName: ''
    }));
    expect(await screen.findByText('بعتنالك التفاصيل على الخاص.')).toBeInTheDocument();
    expect(screen.getByText('أهلاً! تحب تعرف أنهي منتج؟')).toBeInTheDocument();
  });
});
