import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import AgentTestChat from '../AgentTestChat';

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
});
afterEach(cleanup);

it('shows failed preview requests as alerts rather than agent messages', () => {
  render(<AgentTestChat
    form={{ name: 'Support' }} previewTab="chat" setPreviewTab={vi.fn()}
    chatMessages={[{ role: 'error', content: 'AI Error: Insufficient credits' }]}
    setChatMessages={vi.fn()} chatInput="" setChatInput={vi.fn()}
    chatLoading={false} handleSendTest={vi.fn()}
    mockContact={{ tags: [] }} setMockContact={vi.fn()} editingId="agent-1"
  />);
  expect(screen.getByRole('alert')).toHaveTextContent('AI Error: Insufficient credits');
});
