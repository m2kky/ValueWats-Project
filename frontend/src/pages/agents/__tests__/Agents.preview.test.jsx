import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import Agents from '../../Agents';
import api from '../../../api/client';

vi.mock('../../../api/client', () => ({ default: { get: vi.fn(), post: vi.fn() } }));

afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.clearAllMocks(); });

it('keeps a provider error out of the conversation when the user retries', async () => {
  Element.prototype.scrollIntoView = vi.fn();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  const savedAgent = {
    id: 'agent-1', name: 'Support', isActive: true, isPublished: false,
    instructions: 'Help customers.', actions: [], configVersion: 1,
  };
  api.get.mockImplementation(async (path) => ({
    data: path === '/agents' ? [savedAgent] : path === '/agents/agent-1' ? savedAgent : []
  }));
  api.post.mockRejectedValueOnce({ response: { status: 402, data: {
    error: 'Failed to get test response', response: 'AI Error: Insufficient credits'
  } } }).mockResolvedValueOnce({ data: { response: 'Working now' } });
  const user = userEvent.setup();
  render(<MemoryRouter><Agents /></MemoryRouter>);
  await user.click(await screen.findByTitle('RECONFIGURE'));
  const input = await screen.findByPlaceholderText('SEND COMMAND...');
  await user.type(input, 'hello{Enter}');
  expect(await screen.findByRole('alert')).toHaveTextContent('AI Error: Insufficient credits');
  expect(screen.queryByText('No response')).not.toBeInTheDocument();
  await waitFor(() => expect(input).toBeEnabled());
  await user.type(input, 'retry{Enter}');
  expect(await screen.findByText('Working now')).toBeInTheDocument();
  expect(api.post).toHaveBeenLastCalledWith('/agents/agent-1/test', {
    message: 'retry', history: [{ role: 'user', content: 'hello' }]
  });
});
