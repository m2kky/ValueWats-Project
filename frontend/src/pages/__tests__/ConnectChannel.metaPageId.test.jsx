import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import api from '../../api/client';
import ConnectChannel from '../ConnectChannel';

vi.mock('../../api/client', () => ({
  default: { post: vi.fn() }
}));

describe('ConnectChannel Meta Page ID fallback', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_META_APP_ID', 'value-chat-app');
    api.post.mockResolvedValue({ data: {} });
    window.FB = {
      init: vi.fn(),
      login: vi.fn((callback) => callback({
        authResponse: { accessToken: 'user-access-token' }
      }))
    };
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    delete window.FB;
    vi.clearAllMocks();
  });

  it('sends an optional Facebook Page ID with Embedded Signup', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/channels/connect/messenger']}>
        <Routes>
          <Route path="/channels/connect/:type" element={<ConnectChannel />} />
          <Route path="/channels" element={<div>Channels</div>} />
        </Routes>
      </MemoryRouter>
    );

    await user.type(screen.getByPlaceholderText('e.g., My Facebook Messenger Channel'), 'NASA Messenger');
    await user.type(screen.getByLabelText('Facebook Page ID (optional)'), '359509670571259');
    await user.click(screen.getByRole('button', { name: /Connect with Meta/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/instances/meta/embedded', expect.objectContaining({
        channelType: 'messenger',
        userAccessToken: 'user-access-token',
        selectedPageId: '359509670571259'
      }));
    });
  });
});
