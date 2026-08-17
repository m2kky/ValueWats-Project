import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import AgentList from '../AgentList';

describe('AgentList lifecycle feedback', () => {
  it('shows lifecycle operation errors instead of failing silently', () => {
    render(
      <MemoryRouter>
        <AgentList
          agents={[]}
          loading={false}
          error="Agent config version is stale"
          handleCreateNew={vi.fn()}
          handleEdit={vi.fn()}
          handleDelete={vi.fn()}
          handleToggle={vi.fn()}
        />
      </MemoryRouter>
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Agent config version is stale');
  });
});
