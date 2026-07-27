import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ContactSidebar from '../ContactSidebar';

vi.mock('../../../api/client', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: {} }),
    put: vi.fn()
  }
}));

const conversation = {
  id: 'conversation-1',
  contactName: 'Customer',
  contactNumber: '123',
  channelType: 'messenger',
  currentAgentId: 'agent-1',
  assignedUserId: null,
  aiEnabled: true,
  escalated: false,
  labels: [],
  contactFields: [],
  contact: { notes: [] }
};

afterEach(cleanup);

function openAssignmentMenu() {
  render(<ContactSidebar
    conversation={conversation}
    agents={[{ id: 'agent-1', name: 'Greens' }]}
    users={[
      { id: 'owner-1', email: 'owner@example.com', role: 'owner', isActive: true },
      { id: 'viewer-1', email: 'viewer@example.com', role: 'viewer', isActive: true }
    ]}
    onToggle={vi.fn()}
    onUpdate={vi.fn()}
  />);
  fireEvent.click(screen.getByRole('button', { name: /Greens/i }));
}

describe('conversation assignment menu', () => {
  it('shows eligible owners but not viewers', () => {
    openAssignmentMenu();

    expect(screen.getByText(/owner/)).toBeInTheDocument();
    expect(screen.queryByText(/viewer/)).not.toBeInTheDocument();
  });

  it('disables the agent that already owns the conversation', () => {
    openAssignmentMenu();

    expect(screen.getAllByRole('button', { name: /Greens/i })[1]).toBeDisabled();
  });
});
