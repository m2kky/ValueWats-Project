import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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
});
