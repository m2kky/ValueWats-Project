import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChatBubbleLeftRightIcon, CpuChipIcon, PlusIcon, SparklesIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

const templateMeta = {
  receptionist: {
    emoji: '👋',
    color: 'from-violet-500 to-purple-600',
    bgLight: 'bg-violet-50 border-violet-200',
    description: 'Greets visitors, answers FAQs, and routes conversations to the right team.',
  },
  sales: {
    emoji: '🛍️',
    color: 'from-emerald-500 to-teal-600',
    bgLight: 'bg-emerald-50 border-emerald-200',
    description: 'Qualifies leads, presents products, and guides customers through the sales funnel.',
  },
  support: {
    emoji: '🛠️',
    color: 'from-blue-500 to-indigo-600',
    bgLight: 'bg-blue-50 border-blue-200',
    description: 'Handles technical issues, troubleshoots problems, and escalates when needed.',
  },
};

export default function AgentList({ agents, loading, error, handleCreateNew, handleEdit, handleDelete, handleToggle }) {
  const navigate = useNavigate();

  return (
    <div className="max-w-7xl mx-auto px-8 py-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-12">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-indigo-500/20 group relative overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%)] bg-[length:250%_250%] animate-[shimmer_2s_infinite]"></div>
            <CpuChipIcon className="h-8 w-8 text-white relative z-10" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none">
              NEURAL <span className="text-indigo-500">LAB</span>
            </h1>
            <p className="text-zinc-500 font-bold uppercase tracking-[0.3em] text-[10px] mt-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></span>
              Core System Management • {agents.length || 0} Modules Active
            </p>
          </div>
        </div>
        <button
          onClick={handleCreateNew}
          className="bg-indigo-600 hover:bg-indigo-500 px-8 py-4 rounded-2xl text-xs font-black text-white uppercase tracking-[0.2em] shadow-xl shadow-indigo-500/20 transition-all flex items-center gap-3 active:scale-95 overflow-hidden relative group"
        >
          <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform"></div>
          <PlusIcon className="h-5 w-5 relative z-10" />
          <span className="relative z-10">INITIALIZE NEW MODULE</span>
        </button>
      </div>

      {error && (
        <div role="alert" className="mb-6 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-5 py-4 text-sm font-bold text-rose-200">
          {error}
        </div>
      )}

      {/* Agents Grid */}
      <div className="relative">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <div className="w-12 h-12 rounded-full border-t-2 border-indigo-500 animate-spin" />
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Scanning Neural Network...</span>
          </div>
        ) : agents.length === 0 ? (
          <div className="glass-card text-center py-24 border border-white/5 bg-zinc-900/40">
            <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-8 border border-white/5 shadow-inner">
              <CpuChipIcon className="h-10 w-10 text-zinc-800" />
            </div>
            <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-3">SYSTEM VACUUM</h3>
            <p className="text-zinc-500 text-sm max-w-sm mx-auto font-bold uppercase tracking-widest leading-relaxed">
              NO ACTIVE NEURAL ENTITIES DETECTED. INITIALIZE A PROTOCOL TO COMMENCE OPERATIONS.
            </p>
            <button
              onClick={handleCreateNew}
              className="mt-10 inline-flex items-center gap-3 bg-white/5 hover:bg-white/10 px-8 py-4 rounded-2xl text-[10px] font-black text-white uppercase tracking-widest border border-white/5 transition-all active:scale-95"
            >
              <SparklesIcon className="h-5 w-5 text-indigo-400" />
              BEGIN INITIALIZATION
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map(agent => {
              const meta = templateMeta[agent.templateType] || {};
              return (
                <div key={agent.id} className="glass-card group hover:border-indigo-500/30 transition-all duration-500 hover:-translate-y-1 bg-zinc-900/40 overflow-hidden relative border border-white/5 flex flex-col h-full">
                  <div className="absolute top-0 right-0 p-6 flex gap-2 child-opacity-0 group-hover:child-opacity-100 transition-all">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleEdit(agent); }}
                      className="p-2 text-zinc-500 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                      title="RECONFIGURE"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(agent); }}
                      className="p-2 text-zinc-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                      title="PURGE"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="p-8 pb-0">
                    <div className="flex items-start gap-5 mb-8">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0 shadow-lg relative ${meta.color
                        ? `bg-gradient-to-br ${meta.color}`
                        : 'bg-gradient-to-br from-zinc-700 to-zinc-900 border border-white/10'
                        }`}>
                        <div className="absolute inset-0 bg-white/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <span className="relative z-10">{meta.emoji || '👾'}</span>
                      </div>
                      <div className="min-w-0 pr-12">
                        <div className="flex flex-col gap-1">
                          <h3 className="text-xl font-black text-white truncate uppercase italic tracking-tighter leading-none">{agent.name}</h3>
                          <div className="flex gap-2 items-center">
                            {agent.templateType && agent.templateType !== 'custom' && (
                              <span className="inline-flex text-[8px] font-black text-indigo-400 uppercase tracking-[0.2em] py-0.5 border-b border-indigo-500/20 w-fit">
                                {agent.templateType}
                              </span>
                            )}
                            {!agent.isPublished && (
                              <span className="inline-flex text-[8px] font-black text-amber-500 bg-amber-500/10 rounded px-1.5 py-0.5 uppercase tracking-[0.2em] border border-amber-500/20 w-fit">
                                DRAFT
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                      <div className="p-3 bg-zinc-950/40 rounded-xl border border-white/5">
                        <span className="block text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-1">CONVERSATIONS</span>
                        <span className="text-sm font-black text-white">{agent._count?.conversations || 0}</span>
                      </div>
                      <div className="p-3 bg-zinc-950/40 rounded-xl border border-white/5">
                        <span className="block text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-1">PRIORITY_RANK</span>
                        <span className="text-sm font-black text-white italic">LVL_{agent.priority}</span>
                      </div>
                    </div>
                  </div>

                  <div className="px-8 pb-5">
                    <button
                      onClick={() => navigate(`/agents/${agent.id}/comment-replies`)}
                      className="w-full flex items-center justify-center gap-2 rounded-xl border border-lime-400/20 bg-lime-400/5 px-4 py-3 text-[9px] font-black uppercase tracking-[0.2em] text-lime-300 transition hover:border-lime-300/40 hover:bg-lime-400/10"
                    >
                      <ChatBubbleLeftRightIcon className="h-4 w-4" />
                      Comment Replies
                    </button>
                  </div>

                  <div className="mt-auto p-8 pt-5 border-t border-white/5 bg-transparent flex items-center justify-between group/status h-20">
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-1">MODULE_STATUS</span>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${agent.isActive ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-zinc-700'}`}></div>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${agent.isActive ? 'text-green-500' : 'text-zinc-600'}`}>
                          {agent.isActive ? 'OPERATIONAL' : 'OFFLINE'}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggle(agent)}
                      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 ${agent.isActive
                        ? 'bg-green-600 shadow-[0_0_15px_rgba(34,197,94,0.3)]'
                        : 'bg-zinc-800'
                        }`}
                    >
                      <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-xl transition-transform duration-300 ${agent.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
