import { render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import AgentEditor from '../AgentEditor';

const form = {
  name: 'Support', description: '', greeting: '', templateType: 'custom', instructions: 'Help customers.', isPublished: false,
  followUpEnabled: false, followUpDelay: 300, followUpMessage: '', workingHoursEnabled: false, workingHours: {}, outOfHoursMessage: '',
  aiProvider: 'deepseek', aiModel: 'deepseek-chat', temperature: 0.7, maxTokens: 500, tone: 'professional', responseStyle: 'concise',
  useHistory: true, historyLength: 10, actionConfig: {}, allowGroupResponse: false, allowedGroups: []
};

it('renders the editor without network access', () => {
  render(<AgentEditor
    form={form} setForm={vi.fn()} editingId={null} saving={false} handleSave={vi.fn()} setView={vi.fn()} fetchAgents={vi.fn()}
    instructionCharacters={form.instructions.length} instructionOverLimit={false} instructionChecklist={[]} missingInstructionSections={[]}
    mentionTargets={[]} availableTags={[]} availableVariables={[]} availableLifecycleStages={[]} availableIntegrations={[]}
    setHttpActionToEdit={vi.fn()} setIsHttpSheetOpen={vi.fn()} setEditingHttpIndex={vi.fn()}
    kbMode="text" setKbMode={vi.fn()} kbTitle="" setKbTitle={vi.fn()} kbContent="" setKbContent={vi.fn()} kbFile={null} setKbFile={vi.fn()}
    knowledgeSources={[]} knowledgeLoading={false} fetchKnowledge={vi.fn()} addTextKnowledge={vi.fn()} uploadFileKnowledge={vi.fn()} deleteKnowledge={vi.fn()}
  />);

  expect(screen.getByText('Create Agent')).toBeInTheDocument();
});
