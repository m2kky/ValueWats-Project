import React, { useRef, useEffect } from 'react';
import { CpuChipIcon, ArrowPathIcon, ChatBubbleLeftRightIcon, PaperAirplaneIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

export default function AgentTestChat({
  form,
  previewTab, setPreviewTab,
  chatMessages, setChatMessages,
  chatInput, setChatInput,
  chatLoading, handleSendTest,
  mockContact, setMockContact,
  editingId
}) {
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  return (
    <div className="w-2/5 flex flex-col bg-[#08080a]">
      {/* Preview Header & Tabs */}
      <div className="border-b border-white/5 bg-zinc-950/40 backdrop-blur-xl shrink-0">
        <div className="h-20 flex items-center justify-between px-8">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center p-0.5">
                <div className="w-full h-full rounded-[10px] bg-[#0c0c0e] flex items-center justify-center">
                  <CpuChipIcon className="h-5 w-5 text-indigo-400" />
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0c0c0e] shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
            </div>
            <div>
              <h3 className="text-xs font-black text-white uppercase tracking-widest italic truncate max-w-[150px]">
                {form.name || 'UNNAMED_ENTITY'}
              </h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-tighter bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">PREVIEW_MODE</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setChatMessages([]);
                setMockContact({
                  firstName: 'John',
                  lastName: 'Doe',
                  email: 'test@example.com',
                  phone: '+201234567890',
                  lifecycleStage: 'New Lead',
                  assignee: 'Sales agent',
                  tags: ['%new_lead'],
                });
              }}
              className="p-2 text-zinc-500 hover:text-white hover:bg-white/5 rounded-xl transition-all flex items-center gap-2"
              title="Reset Neural Pulse"
            >
              <ArrowPathIcon className="h-4 w-4" />
              <span className="text-[9px] font-black uppercase tracking-widest">Reset Chat</span>
            </button>
          </div>
        </div>

        {/* TABS */}
        <div className="flex px-8 -mb-px">
          <button
            onClick={() => setPreviewTab('chat')}
            className={`px-4 py-3 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${previewTab === 'chat'
              ? 'border-indigo-500 text-white'
              : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
          >
            Chat
          </button>
          <button
            onClick={() => setPreviewTab('fields')}
            className={`px-4 py-3 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${previewTab === 'fields'
              ? 'border-indigo-500 text-white'
              : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
          >
            Contact fields
          </button>
        </div>
      </div>

      {/* Chat Messages */}
      {previewTab === 'chat' ? (
        <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-[radial-gradient(circle_at_50%_50%,rgba(71,37,244,0.03),transparent)]">
          {chatMessages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center max-w-xs mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center mb-6 shadow-2xl">
                <ChatBubbleLeftRightIcon className="h-8 w-8 text-indigo-500/40" />
              </div>
              <h4 className="text-xs font-black text-white uppercase tracking-widest mb-2">NEURAL LINK STANDBY</h4>
              <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-tighter leading-relaxed">
                DEPLOY MODULE OR SAVE ASSETS TO INITIALIZE LIVE INTERFACING PROTOCOL.
              </p>
            </div>
          )}
          {chatMessages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
              <div className={`relative max-w-[85%] px-5 py-3.5 text-xs font-medium leading-relaxed
              ${msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-2xl rounded-tr-none shadow-lg shadow-indigo-500/10 border border-indigo-400/20'
                  : 'bg-[#121215] border border-white/5 text-zinc-300 rounded-2xl rounded-tl-none'
                }`}>
                {msg.role === 'assistant' && (
                  <div className="absolute -left-2 -top-2 w-4 h-4 rounded-full bg-[#121215] border border-white/10 flex items-center justify-center">
                    <CpuChipIcon className="w-2 h-2 text-indigo-400" />
                  </div>
                )}
                {msg.content}
              </div>
            </div>
          ))}
          {chatLoading && (
            <div className="flex justify-start">
              <div className="bg-[#121215] border border-white/5 rounded-2xl rounded-tl-none px-5 py-4">
                <div className="flex gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-300 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      ) : (
        /* Contact Fields View */
        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar bg-transparent">
          <div className="space-y-6">
            {/* Lifecycle */}
            <div>
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-2">Lifecycle</label>
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 group transition-all hover:bg-white/10">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] p-1 bg-indigo-500/20 text-indigo-400 rounded leading-none">NEW</span>
                  <span className="text-xs font-bold text-white uppercase">{mockContact.lifecycleStage}</span>
                </div>
                <ChevronDownIcon className="h-4 w-4 text-zinc-600 group-hover:text-zinc-400" />
              </div>
            </div>

            {/* Assignee */}
            <div>
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-2">Assignee</label>
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 group transition-all hover:bg-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center text-[10px]">👨‍💼</div>
                  <span className="text-xs font-bold text-white uppercase">{mockContact.assignee}</span>
                </div>
                <ChevronDownIcon className="h-4 w-4 text-zinc-600 group-hover:text-zinc-400" />
              </div>
            </div>

            {/* Standard Fields */}
            <div className="grid gap-4">
              {[
                { label: 'First Name', value: mockContact.firstName },
                { label: 'Last Name', value: mockContact.lastName },
                { label: 'Phone Number', value: mockContact.phone },
                { label: 'Email Address', value: mockContact.email },
              ].map(field => (
                <div key={field.label}>
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1">
                    {field.label} <span className="text-zinc-700 italic ml-1">i</span>
                  </label>
                  <p className="text-sm font-bold text-white ml-0.5">{field.value || '—'}</p>
                </div>
              ))}
            </div>

            {/* Tags Section */}
            <div className="pt-6 border-t border-white/5">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-3">Active Tags</label>
              <div className="flex flex-wrap gap-2">
                {mockContact.tags.map(tag => (
                  <span key={tag} className="px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-[9px] font-black text-indigo-400 uppercase tracking-widest">
                    {tag}
                  </span>
                ))}
                {mockContact.tags.length === 0 && (
                  <span className="text-[10px] font-bold text-zinc-700 uppercase italic">No tags assigned</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chat Input */}
      <div className="p-6 border-t border-white/5 bg-zinc-950/40 backdrop-blur-xl">
        <div className="relative group">
          <input
            type="text"
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendTest()}
            disabled={!editingId || chatLoading}
            placeholder={editingId ? 'SEND COMMAND...' : 'SAVE MODULE TO TEST'}
            className="w-full bg-[#0c0c0e] border border-white/10 rounded-2xl pl-6 pr-14 py-4 text-xs font-bold text-white outline-none focus:border-indigo-500/40 focus:ring-4 focus:ring-indigo-500/5 transition-all placeholder:text-zinc-700"
          />
          <button
            onClick={handleSendTest}
            disabled={!editingId || chatLoading || !chatInput.trim()}
            className="absolute right-2 top-2 bottom-2 w-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-600 transition-all flex items-center justify-center shadow-lg shadow-indigo-500/20 active:scale-95"
          >
            <PaperAirplaneIcon className="h-4 w-4 text-white" />
          </button>
        </div>
        {chatMessages.length > 0 && (
          <button
            onClick={() => setChatMessages([])}
            className="mt-4 px-3 py-1.5 rounded-lg text-[9px] font-black text-zinc-600 hover:text-white hover:bg-white/5 uppercase tracking-[0.2em] transition-all flex items-center gap-2 mx-auto"
          >
            <ArrowPathIcon className="h-3 w-3" />
            Flush Neural Link
          </button>
        )}
      </div>
    </div>
  );
}
