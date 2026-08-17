import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from '../../api/client';
import ChannelManage from '../ChannelManage';

vi.mock('../../api/client', () => ({
  default: {
    delete: vi.fn(),
    get: vi.fn(),
    patch: vi.fn(),
    post: vi.fn(),
    put: vi.fn()
  }
}));

describe('ChannelManage Primary Agent routing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockImplementation(async (url) => {
      if (url === '/instances/instance-1/details') {
        return {
          data: {
            instance: {
              id: 'instance-1',
              instanceName: 'Greens Facebook',
              channelType: 'messenger',
              phoneNumberId: 'page-1',
              status: 'connected',
              primaryAgentId: null,
              primaryAgent: null
            }
          }
        };
      }
      if (url === '/instances/instance-1/channel-config') {
        return { data: { config: {} } };
      }
      if (url === '/agents') {
        return {
          data: [{
            id: 'agent-greens',
            name: 'Greens Agent',
            isActive: true,
            isPublished: true,
            deletedAt: null
          }]
        };
      }
      throw new Error(`Unexpected GET ${url}`);
    });
    api.put.mockResolvedValue({
      data: {
        instance: {
          id: 'instance-1',
          instanceName: 'Greens Facebook',
          channelType: 'messenger',
          status: 'connected',
          primaryAgentId: 'agent-greens',
          primaryAgent: { id: 'agent-greens', name: 'Greens Agent' }
        }
      }
    });
  });

  it('shows blocked automation while unassigned and uses the atomic assignment endpoint', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/channels/manage/instance-1']}>
        <Routes>
          <Route path="/channels/manage/:instanceId" element={<ChannelManage />} />
        </Routes>
      </MemoryRouter>
    );

    await screen.findByRole('heading', { name: 'Primary AI Agent' });
    expect(screen.getByText(/Automation blocked/i)).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Primary AI Agent'), 'agent-greens');
    await user.click(screen.getByRole('button', { name: 'Save Agent Routing' }));

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith('/instances/instance-1/primary-agent', {
        primaryAgentId: 'agent-greens'
      });
    });
    expect(await screen.findByText(/Greens Agent owns new inbox conversations/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Open Comment Replies/i })).toHaveAttribute(
      'href',
      '/agents/agent-greens/comment-replies'
    );
  });
});
