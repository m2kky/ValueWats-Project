import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import api from '../../api/client';
import ChannelManage from '../ChannelManage';
import ConnectChannel from '../ConnectChannel';

vi.mock('../../api/client', () => ({
  default: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), put: vi.fn(), delete: vi.fn() }
}));

let instance;

function renderChannels(entry = '/channels/manage/channel-1') {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/channels/manage/:instanceId" element={<ChannelManage />} />
        <Route path="/channels/connect/:type" element={<ConnectChannel />} />
        <Route path="/channels" element={<div>Channels list</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('Reconnect an existing Meta channel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('VITE_META_APP_ID', 'meta-app');
    instance = {
      id: 'channel-1', instanceName: 'NASA Instagram', channelType: 'instagram',
      phoneNumberId: 'instagram-1', phoneNumber: 'page-1', status: 'disconnected',
      primaryAgentId: 'agent-1', primaryAgent: { id: 'agent-1', name: 'NASA Agent' }
    };
    api.get.mockImplementation(async (url) => {
      if (url === '/instances/channel-1/details') return { data: { instance } };
      if (url === '/instances/channel-1/channel-config') return { data: { config: {} } };
      if (url === '/agents') return { data: [{ ...instance.primaryAgent, isActive: true, isPublished: true }] };
      throw new Error(`Unexpected GET ${url}`);
    });
    api.post.mockResolvedValue({ data: { instance: { ...instance, status: 'connected' }, commentPermissionsReady: true } });
    window.FB = {
      init: vi.fn(),
      login: vi.fn((callback) => callback({ authResponse: { accessToken: 'fresh-user-token' } }))
    };
  });

  afterEach(() => {
    cleanup();
    document.getElementById('facebook-jssdk')?.remove();
    delete window.fbAsyncInit;
    vi.unstubAllEnvs();
    delete window.FB;
  });

  it.each(['instagram', 'messenger'])('reconnects %s from configuration and returns to the same channel', async (type) => {
    instance = { ...instance, channelType: type, phoneNumberId: type === 'messenger' ? 'page-1' : 'instagram-1' };
    const user = userEvent.setup();
    renderChannels();
    await user.click(await screen.findByRole('button', { name: 'Reconnect with Meta' }));
    expect(await screen.findByRole('heading', { name: type === 'instagram' ? 'Reconnect Instagram' : 'Reconnect Facebook Messenger' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(`e.g., My ${type === 'instagram' ? 'Instagram' : 'Facebook Messenger'} Channel`)).toHaveValue('NASA Instagram');
    await user.click(screen.getByRole('button', { name: 'Reconnect with Meta' }));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/instances/meta/embedded', expect.objectContaining({
      channelType: type, userAccessToken: 'fresh-user-token', reconnectInstanceId: 'channel-1', selectedPageId: 'page-1'
    })));
    expect(window.FB.login.mock.calls[0][1]).toMatchObject({ auth_type: 'rerequest' });
    expect(await screen.findByText(/Channel reconnected successfully/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Primary AI Agent' })).toBeInTheDocument();
    expect(api.delete).not.toHaveBeenCalled();
  });

  it('makes the Troubleshoot refresh action open reconnect for this channel', async () => {
    const user = userEvent.setup();
    renderChannels();
    await user.click(await screen.findByRole('button', { name: 'Troubleshoot' }));
    await user.click(screen.getByRole('button', { name: 'Refresh Permission' }));
    expect(await screen.findByRole('heading', { name: 'Reconnect Instagram' })).toBeInTheDocument();
  });

  it('keeps a cancelled login on the reconnect screen without changing the channel', async () => {
    window.FB.login.mockImplementation((callback) => callback({}));
    const user = userEvent.setup();
    renderChannels('/channels/connect/instagram?reconnect=channel-1');
    await screen.findByDisplayValue('NASA Instagram');
    await user.click(screen.getByRole('button', { name: 'Reconnect with Meta' }));
    expect(await screen.findByText(/Meta login was cancelled/i)).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });

  it('shows the server error without turning reconnect into channel creation', async () => {
    api.post.mockRejectedValue({ response: { status: 409, data: { error: 'Sign in to the Meta account that owns this channel.' } } });
    const user = userEvent.setup();
    renderChannels('/channels/connect/instagram?reconnect=channel-1');
    await screen.findByDisplayValue('NASA Instagram');
    await user.click(screen.getByRole('button', { name: 'Reconnect with Meta' }));
    expect(await screen.findByText('Sign in to the Meta account that owns this channel.')).toBeInTheDocument();
    expect(api.post).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('heading', { name: 'Reconnect Instagram' })).toBeInTheDocument();
  });

  it('blocks reconnect if the requested channel cannot be loaded', async () => {
    api.get.mockRejectedValue({ response: { data: { error: 'Instance not found' } } });
    renderChannels('/channels/connect/instagram?reconnect=channel-1');
    expect(await screen.findByText('Instance not found')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reconnect with Meta' })).toBeDisabled();
    expect(api.post).not.toHaveBeenCalled();
  });

  it('prepares Meta before enabling the button so the login popup opens from a click', async () => {
    delete window.FB;
    renderChannels('/channels/connect/instagram?reconnect=channel-1');
    await screen.findByDisplayValue('NASA Instagram');
    expect(await screen.findByRole('button', { name: /Preparing Meta/i })).toBeDisabled();
    expect(document.getElementById('facebook-jssdk')).toBeInTheDocument();
    // Simulate a blocked SDK, rather than leaving a pending network load in the test.
    document.getElementById('facebook-jssdk').dispatchEvent(new Event('error'));
    expect(await screen.findByRole('alert')).toHaveTextContent('Failed to load Facebook SDK');
    expect(api.post).not.toHaveBeenCalled();
  });

  it('warns when credentials refresh but comment permissions still need attention', async () => {
    api.post.mockResolvedValue({ data: { instance, commentPermissionsReady: false } });
    const user = userEvent.setup();
    renderChannels('/channels/connect/instagram?reconnect=channel-1');
    await screen.findByDisplayValue('NASA Instagram');
    await user.click(screen.getByRole('button', { name: 'Reconnect with Meta' }));
    expect(await screen.findByText(/comment permissions still need attention/i)).toBeInTheDocument();
  });
});
