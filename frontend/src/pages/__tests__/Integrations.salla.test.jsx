import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import api from '../../api/client';
import Integrations from '../Integrations';

vi.mock('../../api/client', () => ({
  default: { get: vi.fn(), post: vi.fn(), delete: vi.fn() }
}));

describe('Integrations Salla card', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('starts Salla OAuth without asking for client secrets', async () => {
    api.get.mockResolvedValueOnce({ data: { integrations: [] } });
    api.post.mockResolvedValueOnce({ data: {} });
    render(<Integrations />);
    const sallaCard = await screen.findByRole('button', { name: /Salla/i });
    expect(sallaCard.tagName).toBe('BUTTON');
    await userEvent.setup().click(sallaCard);
    expect(api.post).toHaveBeenCalledWith('/integrations/salla/auth-url');
    expect(screen.queryByLabelText(/Client Secret/i)).not.toBeInTheDocument();
  });

  it('shows and copies the Easy Mode pairing code before opening Salla', async () => {
    api.get.mockResolvedValueOnce({ data: { integrations: [] } });
    api.post.mockResolvedValueOnce({
      data: {
        mode: 'easy',
        integrationId: 's1',
        pairingCode: 'PAIR-CODE-123',
        installUrl: 'https://s.salla.sa/apps/install/946600964'
      }
    });
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);

    render(<Integrations />);
    await user.click(await screen.findByRole('button', { name: /Salla/i }));

    expect(await screen.findByRole('dialog', { name: /Connect Salla/i })).toBeInTheDocument();
    expect(screen.getByText('PAIR-CODE-123')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Copy code/i }));
    expect(writeText).toHaveBeenCalledWith('PAIR-CODE-123');
    await user.click(screen.getByRole('button', { name: /Open Salla/i }));
    expect(open).toHaveBeenCalledWith(
      'https://s.salla.sa/apps/install/946600964', '_blank', 'noopener,noreferrer'
    );
    await user.click(screen.getByRole('button', { name: /Close/i }));
    expect(screen.queryByText('PAIR-CODE-123')).not.toBeInTheDocument();
  });

  it('shows a replacement Easy Mode code when continuing pending setup', async () => {
    api.get.mockResolvedValue({
      data: { integrations: [{ id: 's1', type: 'store_salla', name: 'Salla Store', status: 'pending', metadata: null }] }
    });
    api.post.mockResolvedValueOnce({
      data: {
        mode: 'easy', integrationId: 's1', pairingCode: 'REPLACEMENT-CODE',
        installUrl: 'https://s.salla.sa/apps/install/946600964'
      }
    });

    render(<Integrations />);
    await userEvent.setup().click(await screen.findByRole('button', { name: /Continue setup/i }));

    expect(await screen.findByText('REPLACEMENT-CODE')).toBeInTheDocument();
    expect(api.post).toHaveBeenCalledWith('/integrations/salla/s1/reconnect');
  });

  it('renders Salla sync status and sends Sync now', async () => {
    api.get
      .mockResolvedValueOnce({ data: { integrations: [{ id: 's1', type: 'store_salla', name: 'Greens', status: 'active', metadata: { lastSyncedAt: '2026-08-26T10:00:00Z' } }] } })
      .mockResolvedValue({ data: { integrations: [] } });
    api.post.mockResolvedValueOnce({ data: { success: true } });
    render(<Integrations />);
    await userEvent.setup().click(await screen.findByRole('button', { name: /Sync now/i }));
    expect(api.post).toHaveBeenCalledWith('/integrations/salla/s1/sync');
  });

  it('continues pending Salla setup without offering an invalid sync', async () => {
    api.get.mockResolvedValue({
      data: { integrations: [{ id: 's1', type: 'store_salla', name: 'Salla Store', status: 'pending', metadata: null }] }
    });
    api.post.mockResolvedValueOnce({ data: {} });

    render(<Integrations />);

    expect(await screen.findByRole('button', { name: /Continue setup/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Sync now/i })).not.toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole('button', { name: /Continue setup/i }));
    expect(api.post).toHaveBeenCalledWith('/integrations/salla/s1/reconnect');
  });
});
