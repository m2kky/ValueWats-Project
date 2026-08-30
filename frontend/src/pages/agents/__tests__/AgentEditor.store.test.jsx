import { useState } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import AgentEditor from '../AgentEditor';

const form = {
  name: 'Support', description: '', greeting: '', templateType: 'custom', instructions: 'Help customers.', isPublished: false,
  followUpEnabled: false, followUpDelay: 300, followUpMessage: '', workingHoursEnabled: false, workingHours: {}, outOfHoursMessage: '',
  aiProvider: 'deepseek', aiModel: 'deepseek-chat', temperature: 0.7, maxTokens: 500, tone: 'professional', responseStyle: 'concise',
  useHistory: true, historyLength: 10, actionConfig: {}, allowGroupResponse: false, allowedGroups: []
};

afterEach(cleanup);

it('requires exactly one active Store connection when enabled', async () => {
  const user = userEvent.setup();
  function Wrapper() {
    const [state, setState] = useState(form);
    return <AgentEditor
      form={state} setForm={setState} editingId={null} saving={false} handleSave={vi.fn()} setView={vi.fn()} fetchAgents={vi.fn()}
      instructionCharacters={form.instructions.length} instructionOverLimit={false} instructionChecklist={[]} missingInstructionSections={[]}
      mentionTargets={[]} availableTags={[]} availableVariables={[]} availableLifecycleStages={[]}
      availableIntegrations={[{ id: 's1', type: 'store_salla', name: 'Greens', status: 'active' }, { id: 's2', type: 'store_salla', name: 'Inactive', status: 'error' }]}
      setHttpActionToEdit={vi.fn()} setIsHttpSheetOpen={vi.fn()} setEditingHttpIndex={vi.fn()}
      kbMode="text" setKbMode={vi.fn()} kbTitle="" setKbTitle={vi.fn()} kbContent="" setKbContent={vi.fn()} kbFile={null} setKbFile={vi.fn()}
      knowledgeSources={[]} knowledgeLoading={false} fetchKnowledge={vi.fn()} addTextKnowledge={vi.fn()} uploadFileKnowledge={vi.fn()} deleteKnowledge={vi.fn()}
    />;
  }

  render(<Wrapper />);
  await user.click(screen.getByRole('button', { name: 'Enable Store' }));
  expect(screen.getByText(/Select one active Store connection/i)).toBeInTheDocument();
  await user.selectOptions(screen.getByLabelText(/Linked Store/i), 's1');
  expect(screen.getByDisplayValue('Greens')).toBeInTheDocument();
  expect(screen.queryByRole('option', { name: 'Inactive' })).not.toBeInTheDocument();
});

it('configures a read-only named Google Sheets source', async () => {
  const user = userEvent.setup();
  function Wrapper() {
    const [state, setState] = useState(form);
    return <AgentEditor
      form={state} setForm={setState} editingId={null} saving={false} handleSave={vi.fn()} setView={vi.fn()} fetchAgents={vi.fn()}
      instructionCharacters={form.instructions.length} instructionOverLimit={false} instructionChecklist={[]} missingInstructionSections={[]}
      mentionTargets={[]} availableTags={[]} availableVariables={[]} availableLifecycleStages={[]}
      availableIntegrations={[{ id: 'g1', type: 'google_sheets_oauth', name: 'Greens Sheets', status: 'active' }]}
      setHttpActionToEdit={vi.fn()} setIsHttpSheetOpen={vi.fn()} setEditingHttpIndex={vi.fn()}
      kbMode="text" setKbMode={vi.fn()} kbTitle="" setKbTitle={vi.fn()} kbContent="" setKbContent={vi.fn()} kbFile={null} setKbFile={vi.fn()}
      knowledgeSources={[]} knowledgeLoading={false} fetchKnowledge={vi.fn()} addTextKnowledge={vi.fn()} uploadFileKnowledge={vi.fn()} deleteKnowledge={vi.fn()}
    />;
  }

  render(<Wrapper />);
  await user.click(screen.getByRole('button', { name: 'Enable Google Sheets Sources' }));
  await user.selectOptions(screen.getByLabelText(/Google Sheets Connection/i), 'g1');
  await user.click(screen.getByRole('button', { name: /Add Sheet Source/i }));
  expect(screen.getByDisplayValue('Sheet1!A1:Z500')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /append/i })).not.toBeInTheDocument();
});
