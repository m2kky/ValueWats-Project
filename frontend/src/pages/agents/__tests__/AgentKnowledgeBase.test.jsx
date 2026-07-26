import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import AgentKnowledgeBase from '../AgentKnowledgeBase';

it('requires a saved agent before showing knowledge controls', () => {
  render(<AgentKnowledgeBase editingId={null} knowledgeSources={[]} />);

  expect(screen.getByText('SAVE AGENT FIRST')).toBeInTheDocument();
  expect(screen.queryByText('STRING INPUT')).not.toBeInTheDocument();
  expect(screen.queryByText('DATA INJECTION')).not.toBeInTheDocument();
});
