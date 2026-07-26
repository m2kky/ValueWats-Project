import React from 'react';
import { ArrowLeftIcon, SparklesIcon, ClockIcon, ShieldCheckIcon, CommandLineIcon, PencilIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import ActionCard from '../../components/ActionCard';
import AgentKnowledgeBase from './AgentKnowledgeBase';

export default function AgentEditor({
  form, setForm,
  editingId, saving,
  handleSave, setView, fetchAgents,
  instructionCharacters, instructionOverLimit, instructionChecklist, missingInstructionSections,
  mentionTargets, availableTags, availableVariables, availableLifecycleStages, availableIntegrations,
  setHttpActionToEdit, setIsHttpSheetOpen, setEditingHttpIndex,
  
  // Knowledge base props
  kbMode, setKbMode, kbTitle, setKbTitle, kbContent, setKbContent, kbFile, setKbFile,
  knowledgeSources, knowledgeLoading, fetchKnowledge, addTextKnowledge, uploadFileKnowledge, deleteKnowledge
}) {
  return (
    <div className="w-3/5 overflow-y-auto border-r border-white/5 custom-scrollbar">
      {/* Editor Header */}
      <div className="flex items-center justify-between px-8 py-4 bg-transparent backdrop-blur-2xl border-b border-white/5 shrink-0 z-20 sticky top-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => { setView('list'); fetchAgents(); }}
            className="p-2.5 text-zinc-500 hover:text-white hover:bg-white/5 rounded-xl transition-all"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-xl font-black text-white tracking-tight italic uppercase">
              {editingId ? 'Agent Configuration' : 'Create Agent'}
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_8px_rgba(71,37,244,0.5)]"></span>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                {form.templateType !== 'custom' ? `Template: ${form.templateType}` : 'Custom Setup'}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => { setView('list'); fetchAgents(); }}
            className="px-5 py-2 text-xs font-black text-zinc-400 hover:text-white uppercase tracking-widest transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => handleSave(false)}
            disabled={saving || !form.name || !form.instructions || instructionOverLimit}
            className="bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 px-6 py-2.5 rounded-xl text-xs font-black text-white uppercase tracking-widest transition-all active:scale-95"
          >
            Save Draft
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={saving || !form.name || !form.instructions || instructionOverLimit}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-600 px-6 py-2.5 rounded-xl text-xs font-black text-white uppercase tracking-widest shadow-lg shadow-indigo-500/10 transition-all active:scale-95"
          >
            {saving ? 'Uploading...' : (form.isPublished ? 'Update Published' : 'Publish Agent')}
          </button>
        </div>
      </div>

      <div className="p-8 space-y-8">
        {/* Agent Name + Description */}
        <div className="glass-card p-6 border border-white/5 group bg-zinc-900/40">
          <div className="flex items-center gap-2 mb-6 border-b border-white/5 pb-4">
            <div className="w-1 h-4 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(71,37,244,0.5)]"></div>
            <h3 className="text-xs font-black text-white uppercase tracking-widest italic">AGENT IDENTITY</h3>
          </div>

          <div className="space-y-6">
            <div className="relative">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 block">Agent Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500/30 focus:ring-4 focus:ring-indigo-500/5 transition-all"
                placeholder="e.g. VANTAGE PROTOCOL"
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 block">Description</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500/30 transition-all font-medium"
                  placeholder="Directive summary"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 block">Greeting Message</label>
                <input
                  type="text"
                  value={form.greeting}
                  onChange={e => setForm({ ...form, greeting: e.target.value })}
                  className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500/30 transition-all font-medium"
                  placeholder="Awaiting input..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="glass-card p-6 border border-white/5 bg-zinc-900/40">
          <div className="flex items-center gap-2 mb-6 border-b border-white/5 pb-4">
            <div className="w-1 h-4 bg-purple-500 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.5)]"></div>
            <h3 className="text-xs font-black text-white uppercase tracking-widest italic">SYSTEM INSTRUCTIONS *</h3>
          </div>

          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-xl blur opacity-30 group-focus-within:opacity-100 transition duration-1000"></div>
            <textarea
              value={form.instructions}
              onChange={e => setForm({ ...form, instructions: e.target.value })}
              rows={12}
              className="relative w-full bg-[#0c0c0e] border border-white/5 rounded-xl p-5 text-sm text-zinc-200 outline-none focus:border-indigo-500/30 transition-all font-mono leading-relaxed custom-scrollbar"
              placeholder={`# CONTEXT\n- Who is contacting us and what is the goal?\n\n# ROLE & COMMUNICATION STYLE\n- Tone, pacing, and one-question-at-a-time rule.\n\n# TOP-LEVEL FLOW\n1. Greet\n2. Clarify intent\n3. Execute or route\n4. Confirm next step\n\n# BOUNDARIES\n- What must never be done.\n- What should be escalated to a human.`}
            />
          </div>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
              <div className="flex items-center gap-2 text-zinc-600">
                <SparklesIcon className="w-3 h-3 text-indigo-400" />
                Follow structured sections for best results
              </div>
              <span className={instructionOverLimit ? 'text-rose-400' : 'text-zinc-500'}>
                {instructionCharacters}/10000
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {instructionChecklist.map((item) => (
                <div
                  key={item.section}
                  className={`px-3 py-2 rounded-lg border text-[10px] font-bold uppercase tracking-widest ${item.present
                    ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
                    : 'border-amber-500/20 bg-amber-500/10 text-amber-300'
                    }`}
                >
                  <span className="mr-2">{item.present ? 'Ready' : 'Missing'}</span>
                  <span>{item.section.replace('# ', '')}</span>
                </div>
              ))}
            </div>

            {missingInstructionSections.length > 0 && (
              <p className="text-[10px] font-bold text-amber-300/90 uppercase tracking-widest">
                Missing sections: {missingInstructionSections.map(item => item.section).join(', ')}
              </p>
            )}

            {instructionOverLimit && (
              <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">
                Instructions exceed the 10,000 character limit.
              </p>
            )}
          </div>
        </div>

        {/* Follow Up */}
        <div className={`glass-card p-6 border transition-all duration-500 bg-zinc-900/40 ${form.followUpEnabled ? 'border-amber-500/30' : 'border-white/5'}`}>
          <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
            <div className="flex items-center gap-2">
              <div className={`w-1 h-4 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.5)] transition-colors ${form.followUpEnabled ? 'bg-amber-500' : 'bg-zinc-700'}`}></div>
              <h3 className="text-xs font-black text-white uppercase tracking-widest italic flex items-center gap-2">
                <ClockIcon className="h-4 w-4 text-amber-500" /> FOLLOW-UP AUTOMATION
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setForm({ ...form, followUpEnabled: !form.followUpEnabled })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 ${form.followUpEnabled ? 'bg-amber-600 shadow-[0_0_15px_rgba(245,158,11,0.4)]' : 'bg-zinc-800'
                }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-xl transition-transform duration-300 ${form.followUpEnabled ? 'translate-x-6' : 'translate-x-1'
                }`} />
            </button>
          </div>
          {form.followUpEnabled && (
            <div className="space-y-6 animate-in slide-in-from-top-2 duration-300">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block">Activation Delay (SEC)</label>
                  <input
                    type="number"
                    value={form.followUpDelay}
                    onChange={e => setForm({ ...form, followUpDelay: parseInt(e.target.value) || 300 })}
                    className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-amber-500/30 transition-all font-mono"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block">Retention Script</label>
                <textarea
                  value={form.followUpMessage}
                  onChange={e => setForm({ ...form, followUpMessage: e.target.value })}
                  rows={2}
                  className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-amber-500/30 transition-all font-medium italic"
                  placeholder="Is there anything else optimal to address?"
                />
              </div>
            </div>
          )}
        </div>

        {/* Working Hours */}
        <div className={`glass-card p-6 border transition-all duration-500 bg-zinc-900/40 ${form.workingHoursEnabled ? 'border-rose-500/30' : 'border-white/5'}`}>
          <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
            <div className="flex items-center gap-2">
              <div className={`w-1 h-4 rounded-full shadow-[0_0_10px_rgba(244,63,94,0.5)] transition-colors ${form.workingHoursEnabled ? 'bg-rose-500' : 'bg-zinc-700'}`}></div>
              <h3 className="text-xs font-black text-white uppercase tracking-widest italic flex items-center gap-2">
                <ShieldCheckIcon className="h-4 w-4 text-rose-500" /> WORKING HOURS
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setForm({ ...form, workingHoursEnabled: !form.workingHoursEnabled })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 ${form.workingHoursEnabled ? 'bg-rose-600 shadow-[0_0_15px_rgba(244,63,94,0.4)]' : 'bg-zinc-800'
                }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-xl transition-transform duration-300 ${form.workingHoursEnabled ? 'translate-x-6' : 'translate-x-1'
                }`} />
            </button>
          </div>
          {form.workingHoursEnabled && (
            <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block">Offline Deflection Script</label>
                <textarea
                  value={form.outOfHoursMessage}
                  onChange={e => setForm({ ...form, outOfHoursMessage: e.target.value })}
                  rows={2}
                  className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-rose-500/30 transition-all font-medium italic"
                  placeholder="Module currently in cold storage. Response expected during operational peak."
                />
              </div>
            </div>
          )}
        </div>

        {/* ═══ AGENT CAPABILITIES (Actions) ═══ */}
        <div className="space-y-8">
          <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-2xl p-6 flex gap-4 backdrop-blur-sm shadow-[0_0_20px_rgba(71,37,244,0.05)]">
            <SparklesIcon className="h-6 w-6 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-black text-white uppercase tracking-widest italic">AGENT CAPABILITIES</h4>
              <p className="text-[10px] font-bold text-zinc-500 mt-1 uppercase tracking-widest leading-relaxed">
                DEFINE NEURAL TRIGGERS AND EXTERNAL INTERFACING RULES. AGENT WILL EXECUTE THESE ACTIONS BASED ON PROBABILISTIC INTENT ANALYSIS.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <ActionCard
              title="Close conversations"
              description="ALLOW AGENT TO CLOSE CONVERSATIONS UPON OBJECTIVE COMPLETION."
              enabled={form.actionConfig?.closeConversation?.enabled || false}
              setEnabled={(val) => setForm(f => ({ ...f, actionConfig: { ...f.actionConfig, closeConversation: { ...f.actionConfig.closeConversation, enabled: val } } }))}
              config={form.actionConfig?.closeConversation?.instructions || ''}
              setConfig={(val) => setForm(f => ({ ...f, actionConfig: { ...f.actionConfig, closeConversation: { ...f.actionConfig.closeConversation, instructions: val } } }))}
              placeholder="CRITERIA: USER SIGN-OFF, RESOLVED QUERY, OR END-OF-FLOW..."
              mentions={mentionTargets}
              showMentions={true}
              tags={availableTags}
              variables={availableVariables}
              showTags={true}
            />

            <ActionCard
              title="Assign conversations"
              description="ALLOW AGENT TO ASSIGN CONVERSATIONS TO HUMAN OPERATORS OR SPECIALIZED SUB-MODULES."
              enabled={form.actionConfig?.assignAgent?.enabled || false}
              setEnabled={(val) => setForm(f => ({ ...f, actionConfig: { ...f.actionConfig, assignAgent: { ...f.actionConfig.assignAgent, enabled: val } } }))}
              config={form.actionConfig?.assignAgent?.instructions || ''}
              setConfig={(val) => setForm(f => ({ ...f, actionConfig: { ...f.actionConfig, assignAgent: { ...f.actionConfig.assignAgent, instructions: val } } }))}
              placeholder="IF: TECHNICAL ANOMALY DETECTED -> ROUTE TO SUPPORT_TIER_2..."
              mentions={mentionTargets}
              showMentions={true}
              tags={availableTags}
              variables={availableVariables}
              showTags={true}
            />
            {form.actionConfig?.assignAgent?.enabled && (
              <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-5 space-y-5">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-indigo-300 mb-3">
                    Authorized assignment targets
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {mentionTargets.map((target) => {
                      const value = String(target.value || '').replace(/^@/, '');
                      const selected = (form.actionConfig.assignAgent.allowedTargets || []).includes(value);
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setForm((current) => {
                            const assignAgent = current.actionConfig.assignAgent;
                            const targets = assignAgent.allowedTargets || [];
                            return {
                              ...current,
                              actionConfig: {
                                ...current.actionConfig,
                                assignAgent: {
                                  ...assignAgent,
                                  allowedTargets: selected
                                    ? targets.filter((item) => item !== value)
                                    : [...targets, value],
                                },
                              },
                            };
                          })}
                          className={`rounded-xl border px-3 py-2 text-[10px] font-bold transition-colors ${
                            selected
                              ? 'border-indigo-400 bg-indigo-500/20 text-white'
                              : 'border-white/10 bg-black/20 text-zinc-400 hover:text-white'
                          }`}
                        >
                          {target.label}
                        </button>
                      );
                    })}
                  </div>
                  {(form.actionConfig.assignAgent.allowedTargets || []).length === 0
                    && !form.actionConfig.assignAgent.allowUnassignedHuman && (
                    <p className="mt-3 text-[10px] font-bold text-amber-400">
                      Assignment remains blocked until at least one target is authorized.
                    </p>
                  )}
                </div>

                <label className="flex items-center gap-3 text-xs font-bold text-zinc-300">
                  <input
                    type="checkbox"
                    checked={form.actionConfig.assignAgent.allowUnassignedHuman || false}
                    onChange={(event) => setForm((current) => ({
                      ...current,
                      actionConfig: {
                        ...current.actionConfig,
                        assignAgent: {
                          ...current.actionConfig.assignAgent,
                          allowUnassignedHuman: event.target.checked,
                        },
                      },
                    }))}
                    className="h-4 w-4 accent-indigo-500"
                  />
                  Allow transfer to an unassigned human queue
                </label>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    Server-controlled handoff message
                  </label>
                  <input
                    value={form.actionConfig.assignAgent.handoffMessage || ''}
                    onChange={(event) => setForm((current) => ({
                      ...current,
                      actionConfig: {
                        ...current.actionConfig,
                        assignAgent: {
                          ...current.actionConfig.assignAgent,
                          handoffMessage: event.target.value,
                        },
                      },
                    }))}
                    maxLength={1000}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-indigo-500/50"
                  />
                </div>

                {(form.actionConfig.assignAgent.allowedTargets || [])
                  .filter((target) => target.startsWith('team:'))
                  .map((target) => (
                    <label key={target} className="flex items-center justify-between gap-4 text-xs text-zinc-300">
                      <span>{target}</span>
                      <select
                        value={form.actionConfig.assignAgent.teamStrategies?.[target] || 'round_robin'}
                        onChange={(event) => setForm((current) => ({
                          ...current,
                          actionConfig: {
                            ...current.actionConfig,
                            assignAgent: {
                              ...current.actionConfig.assignAgent,
                              teamStrategies: {
                                ...current.actionConfig.assignAgent.teamStrategies,
                                [target]: event.target.value,
                              },
                            },
                          },
                        }))}
                        className="rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-xs text-white"
                      >
                        <option value="round_robin">Round robin</option>
                        <option value="least_open">Least open</option>
                      </select>
                    </label>
                  ))}
              </div>
            )}

            <ActionCard
              title="Update contact information"
              description="ALLOW AGENT TO UPDATE CONTACT INFORMATION IN REAL-TIME."
              enabled={form.actionConfig?.updateFields?.enabled || false}
              setEnabled={(val) => setForm(f => ({ ...f, actionConfig: { ...f.actionConfig, updateFields: { ...f.actionConfig.updateFields, enabled: val } } }))}
              config={form.actionConfig?.updateFields?.instructions || ''}
              setConfig={(val) => setForm(f => ({ ...f, actionConfig: { ...f.actionConfig, updateFields: { ...f.actionConfig.updateFields, instructions: val } } }))}
              placeholder="FIELDS TO SYNC: EMAIL, PHONE_ORIGIN, CORPORATE_ID..."
              mentions={mentionTargets}
              showMentions={true}
              tags={availableTags}
              variables={availableVariables}
              showTags={true}
            />

            <ActionCard
              title="Update contact lifecycle stage"
              description="ALLOW AGENT TO UPDATE CONTACT LIFECYCLE STAGE IN REAL-TIME."
              enabled={form.actionConfig?.updateLifecycle?.enabled || false}
              setEnabled={(val) => setForm(f => ({ ...f, actionConfig: { ...f.actionConfig, updateLifecycle: { ...f.actionConfig.updateLifecycle, enabled: val } } }))}
              config={form.actionConfig?.updateLifecycle?.instructions || ''}
              setConfig={(val) => setForm(f => ({ ...f, actionConfig: { ...f.actionConfig, updateLifecycle: { ...f.actionConfig.updateLifecycle, instructions: val } } }))}
              placeholder="UPON HIGH_INTENT DETECTION -> TRIGGER STAGE: QUALIFIED_LEAD..."
              mentions={mentionTargets}
              showMentions={true}
              tags={availableTags}
              variables={availableVariables}
              showTags={true}
            >
              <div className="flex flex-wrap gap-2 mb-2">
                {availableLifecycleStages.map(stage => (
                  <button
                    key={stage.id}
                    type="button"
                    onClick={() => {
                      const current = form.actionConfig?.updateLifecycle?.instructions || '';
                      const next = current + (current && !current.endsWith(' ') ? ' ' : '') + `{{stage.${stage.name}}}`;
                      setForm(f => ({ ...f, actionConfig: { ...f.actionConfig, updateLifecycle: { ...f.actionConfig.updateLifecycle, instructions: next } } }));
                    }}
                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${form.actionConfig?.updateLifecycle?.stageId === stage.id
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-[0_0_10px_rgba(71,37,244,0.3)]'
                      : 'bg-white/5 border-white/5 text-zinc-500 hover:border-white/10'
                      }`}
                  >
                    {stage.name}
                  </button>
                ))}
              </div>
            </ActionCard>

            <ActionCard
              title="Trigger workflow"
              description="ALLOW AGENT TO TRIGGER EXTERNAL AUTOMATION CHAINS (WEBHOOKS/ZAPIER)."
              enabled={form.actionConfig?.triggerWorkflow?.enabled || false}
              setEnabled={(val) => setForm(f => ({ ...f, actionConfig: { ...f.actionConfig, triggerWorkflow: { ...f.actionConfig.triggerWorkflow, enabled: val } } }))}
              config={form.actionConfig?.triggerWorkflow?.instructions || ''}
              setConfig={(val) => setForm(f => ({ ...f, actionConfig: { ...f.actionConfig, triggerWorkflow: { ...f.actionConfig.triggerWorkflow, instructions: val } } }))}
              placeholder="POST-ONBOARDING: TRIGGER GOOGLE_SHEET_APPEND..."
              mentions={mentionTargets}
              showMentions={true}
              tags={availableTags}
              variables={availableVariables}
              showTags={true}
            />

            <ActionCard
              title="Tag modification"
              description="ALLOW AGENT TO APPEND OR REMOVE LABELS/TAGS BASED ON CONVERSATION CONTEXT."
              enabled={form.actionConfig?.updateTags?.enabled || false}
              setEnabled={(val) => setForm(f => ({ ...f, actionConfig: { ...f.actionConfig, updateTags: { ...f.actionConfig.updateTags, enabled: val } } }))}
              config={form.actionConfig?.updateTags?.instructions || ''}
              setConfig={(val) => setForm(f => ({ ...f, actionConfig: { ...f.actionConfig, updateTags: { ...f.actionConfig.updateTags, instructions: val } } }))}
              placeholder="IF: ISSUE RESOLVED -> REMOVE_TAG: %needs_support..."
              tags={availableTags}
              variables={availableVariables}
              showTags={true}
              mentions={mentionTargets}
              showMentions={true}
            />

            <ActionCard
              title="Notion Workspace"
              description="GRANT AGENT ACCESS TO SEARCH WIKIS, APPEND BLOCKS OR RUN DATABASE CRUD OPERATIONS SECURELY."
              enabled={form.actionConfig?.notion?.enabled || false}
              setEnabled={(val) => setForm(f => ({ ...f, actionConfig: { ...f.actionConfig, notion: { ...f.actionConfig.notion, enabled: val } } }))}
              config={form.actionConfig?.notion?.instructions || ''}
              setConfig={(val) => setForm(f => ({ ...f, actionConfig: { ...f.actionConfig, notion: { ...f.actionConfig.notion, instructions: val } } }))}
              placeholder="INSTRUCT AI ON WHICH NOTION PAGES OR DATABASES IT CAN MODIFY..."
              mentions={mentionTargets}
              showMentions={true}
              tags={availableTags}
              variables={availableVariables}
              showTags={true}
            >
              <div className="mb-4">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">
                  LINKED NOTION CONNECTION
                </label>
                <select
                  className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-xs font-medium text-white outline-none focus:border-indigo-500/50 appearance-none cursor-pointer"
                  value={form.actionConfig?.notion?.integrationId || ''}
                  onChange={(e) => setForm(f => ({ ...f, actionConfig: { ...f.actionConfig, notion: { ...f.actionConfig.notion, integrationId: e.target.value } } }))}
                >
                  <option value="">-- Select Notion Workspace Connection --</option>
                  {availableIntegrations.filter(i => i.type === 'notion_oauth' || i.type === 'notion').map(i => (
                    <option key={i.id} value={i.id}>{i.name}</option>
                  ))}
                </select>
              </div>
            </ActionCard>

            <ActionCard
              title="Internal comments"
              description="ALLOW AGENT TO ADD INTERNAL COMMENTS FOR AGENT HANDOFF OR AUDIT LOGS."
              enabled={form.actionConfig?.addComment?.enabled || false}
              setEnabled={(val) => setForm(f => ({ ...f, actionConfig: { ...f.actionConfig, addComment: { ...f.actionConfig.addComment, enabled: val } } }))}
              config={form.actionConfig?.addComment?.instructions || ''}
              setConfig={(val) => setForm(f => ({ ...f, actionConfig: { ...f.actionConfig, addComment: { ...f.actionConfig.addComment, instructions: val } } }))}
              placeholder="NOTE: USER IS UPSET. PRIORITIZE IMMEDIATE RETENTION FLOW..."
              mentions={mentionTargets}
              showMentions={true}
              tags={availableTags}
              variables={availableVariables}
              showTags={true}
            />

            <div className={`glass-card p-6 border transition-all duration-500 bg-zinc-900/40 relative overflow-hidden ${form.actionConfig?.httpRequests?.enabled ? 'border-indigo-500/30' : 'border-white/5 opacity-80'}`}>
              {form.actionConfig?.httpRequests?.enabled && (
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-500 to-purple-600"></div>
              )}

              <div className={`flex items-center justify-between ${form.actionConfig?.httpRequests?.enabled ? 'mb-4 border-b border-white/5 pb-4' : ''}`}>
                <div>
                  <h3 className={`text-sm font-black uppercase italic tracking-widest ${form.actionConfig?.httpRequests?.enabled ? 'text-indigo-400' : 'text-zinc-500'}`}>NETWORK COMMAND CENTER</h3>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">EXECUTE CUSTOM HTTP REQUESTS TO EXTERNAL APIS.</p>
                </div>
                <button
                  onClick={() => setForm(f => ({ ...f, actionConfig: { ...f.actionConfig, httpRequests: { ...f.actionConfig.httpRequests, enabled: !f.actionConfig.httpRequests?.enabled } } }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 ${form.actionConfig?.httpRequests?.enabled ? 'bg-indigo-600' : 'bg-zinc-800'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${form.actionConfig?.httpRequests?.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              {form.actionConfig?.httpRequests?.enabled && (
                <div className="space-y-4 animate-in slide-in-from-top-4 duration-300">
                  <div className="space-y-3">
                    {(form.actionConfig?.httpRequests?.actions || []).map((action, index) => (
                      <div key={index} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 group hover:border-white/10 transition-all">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                            <CommandLineIcon className="h-5 w-5 text-indigo-400" />
                          </div>
                          <div>
                            <p className="text-xs font-black text-white uppercase tracking-tight italic">{action.name}</p>
                            <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">{action.method} • {action.url.slice(0, 30)}...</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => { setHttpActionToEdit(action); setEditingHttpIndex(index); setIsHttpSheetOpen(true); }}
                            className="p-2 text-zinc-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-all"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              const newActions = form.actionConfig.httpRequests.actions.filter((_, i) => i !== index);
                              setForm(f => ({ ...f, actionConfig: { ...f.actionConfig, httpRequests: { ...f.actionConfig.httpRequests, actions: newActions } } }));
                            }}
                            className="p-2 text-zinc-600 hover:text-rose-500 transition-colors"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {(form.actionConfig?.httpRequests?.actions || []).length < 10 && (
                      <button
                        onClick={() => { setHttpActionToEdit(null); setEditingHttpIndex(-1); setIsHttpSheetOpen(true); }}
                        className="w-full py-4 border-2 border-dashed border-white/5 rounded-xl text-[10px] font-black text-zinc-500 hover:text-indigo-400 hover:border-indigo-500/20 transition-all flex flex-col items-center gap-2 bg-white/5 active:scale-95"
                      >
                        <PlusIcon className="h-5 w-5" />
                        ADD NEW NETWORK COMMAND
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ═══ NEURAL INDEXING (Knowledge Base) ═══ */}
        <AgentKnowledgeBase 
          kbMode={kbMode} setKbMode={setKbMode}
          kbTitle={kbTitle} setKbTitle={setKbTitle}
          kbContent={kbContent} setKbContent={setKbContent}
          kbFile={kbFile} setKbFile={setKbFile}
          knowledgeSources={knowledgeSources} knowledgeLoading={knowledgeLoading}
          fetchKnowledge={fetchKnowledge} addTextKnowledge={addTextKnowledge} 
          uploadFileKnowledge={uploadFileKnowledge} deleteKnowledge={deleteKnowledge}
          editingId={editingId}
        />

      </div>
    </div>
  );
}
