import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import api from '../../api/client';
import Integrations from '../Integrations';

vi.mock('../../api/client', () => ({
  default: { get: vi.fn(), post: vi.fn(), delete: vi.fn() }
}));

describe('Integrations Salla card', () => {
  afterEach(() => vi.clearAllMocks());

  it('starts Salla OAuth without asking for client secrets', async () => {
    api.get.mockResolvedValueOnce({ data: { integrations: [] } });
    api.post.mockResolvedValueOnce({ data: {} });
    render(<Integrations />);
    await userEvent.setup().click(await screen.findByRole('heading', { name: 'Salla' }));
    expect(api.post).toHaveBeenCalledWith('/integrations/salla/auth-url');
    expect(screen.queryByLabelText(/Client Secret/i)).not.toBeInTheDocument();
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
});
