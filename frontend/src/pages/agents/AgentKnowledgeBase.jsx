import React from 'react';
import { DocumentTextIcon, CloudArrowUpIcon, DocumentIcon, TrashIcon, BookOpenIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

export default function AgentKnowledgeBase({
  kbMode, setKbMode,
  kbTitle, setKbTitle,
  kbContent, setKbContent,
  kbFile, setKbFile,
  knowledgeSources, knowledgeLoading,
  fetchKnowledge, addTextKnowledge, uploadFileKnowledge, deleteKnowledge,
  editingId
}) {
  if (!editingId) {
    return (
      <div className="glass-card p-6 border border-white/5 bg-zinc-900/40">
        <div className="flex items-center gap-2 mb-6 border-b border-white/5 pb-4">
          <div className="w-1 h-4 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
          <h3 className="text-xs font-black text-white uppercase tracking-widest italic">NEURAL INDEXING</h3>
        </div>
        <div className="text-center py-12 border-2 border-dashed border-white/5 rounded-2xl">
          <BookOpenIcon className="h-10 w-10 text-zinc-700 mx-auto mb-3" />
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">SAVE AGENT FIRST</p>
          <p className="text-[8px] font-bold text-zinc-700 mt-1 uppercase tracking-tighter">
            CREATE OR SAVE THE AGENT TO ENABLE KNOWLEDGE UPLOADS
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Add Knowledge Buttons */}
      {!kbMode && (
        <div className="glass-card p-6 border border-white/5 bg-zinc-900/40">
          <div className="flex items-center gap-2 mb-6 border-b border-white/5 pb-4">
            <div className="w-1 h-4 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
            <h3 className="text-xs font-black text-white uppercase tracking-widest italic">NEURAL INDEXING</h3>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <button
              onClick={() => setKbMode('text')}
              className="flex flex-col items-center gap-4 p-8 rounded-2xl border border-white/5 bg-white/5 hover:bg-indigo-500/10 hover:border-indigo-500/30 transition-all group active:scale-95"
            >
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(71,37,244,0.1)]">
                <DocumentTextIcon className="h-6 w-6 text-indigo-400" />
              </div>
              <div className="text-center">
                <span className="block text-xs font-black text-white uppercase tracking-widest mb-1">STRING INPUT</span>
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">PASTE RAW DIRECTIVES OR FAQS</span>
              </div>
            </button>

            <label className="flex flex-col items-center gap-4 p-8 rounded-2xl border border-white/5 bg-white/5 hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all group cursor-pointer active:scale-95">
              <input
                type="file"
                className="hidden"
                accept=".pdf,.txt,.doc,.docx"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) setKbFile(file);
                  setKbMode('file');
                }}
              />
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                <CloudArrowUpIcon className="h-6 w-6 text-emerald-400" />
              </div>
              <div className="text-center">
                <span className="block text-xs font-black text-white uppercase tracking-widest mb-1">DATA INJECTION</span>
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">UPLOAD PDF OR TEXT CORPUS</span>
              </div>
            </label>
          </div>
        </div>
      )}

      {/* Knowledge Form: Text */}
      {kbMode === 'text' && (
        <div className="glass-card p-6 border border-white/5 bg-zinc-900/40 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-[10px] font-black text-white uppercase tracking-widest">STRING BUFFER</h4>
            <button onClick={() => setKbMode(null)} className="text-[9px] font-bold text-zinc-500 hover:text-white uppercase tracking-widest transition-colors">Cancel_STREAM</button>
          </div>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="DATA_TITLE"
              className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none focus:border-indigo-500/40"
              value={kbTitle}
              onChange={e => setKbTitle(e.target.value)}
            />
            <textarea
              placeholder="RAW_CONTENT_STREAM..."
              rows={6}
              className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-xs font-medium text-white outline-none focus:border-indigo-500/40 custom-scrollbar"
              value={kbContent}
              onChange={e => setKbContent(e.target.value)}
            />
            <button
              onClick={() => {
                addTextKnowledge(editingId, { title: kbTitle, content: kbContent });
                setKbMode(null);
                setKbTitle('');
                setKbContent('');
              }}
              disabled={!kbTitle || !kbContent || knowledgeLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-600 py-3 rounded-xl text-[10px] font-black text-white uppercase tracking-widest shadow-lg shadow-indigo-500/20 transition-all"
            >
              {knowledgeLoading ? 'VECTORIZING...' : 'INJECT KERNEL'}
            </button>
          </div>
        </div>
      )}

      {/* Knowledge Form: File */}
      {kbMode === 'file' && (
        <div className="glass-card p-6 border border-white/5 bg-zinc-900/40 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-[10px] font-black text-white uppercase tracking-widest">DATA PACKET READY</h4>
            <button onClick={() => { setKbMode(null); setKbFile(null); }} className="text-[9px] font-bold text-zinc-500 hover:text-white uppercase tracking-widest transition-colors">Cancel_UPLOAD</button>
          </div>
          <div className="p-8 border-2 border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center gap-4 bg-white/5">
            <DocumentIcon className="h-10 w-10 text-emerald-400/40" />
            <div className="text-center">
              <p className="text-xs font-black text-white uppercase tracking-tight mb-1">{kbFile?.name}</p>
              <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">{(kbFile?.size / 1024).toFixed(1)} KB READY FOR INJECTION</p>
            </div>
            <button
              onClick={() => {
                uploadFileKnowledge(editingId, kbFile);
                setKbMode(null);
                setKbFile(null);
              }}
              disabled={knowledgeLoading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-600 py-3 rounded-xl text-[10px] font-black text-white uppercase tracking-widest shadow-lg shadow-emerald-500/20 transition-all mt-4"
            >
              {knowledgeLoading ? 'VECTORIZING...' : 'INJECT KERNEL'}
            </button>
          </div>
        </div>
      )}

      {/* Knowledge Sources List */}
      <div className="glass-card border border-white/5 bg-zinc-900/40 divide-y divide-white/5">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-1 h-3 bg-zinc-500 rounded-full"></div>
            <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em] italic">
              NEURAL KERNELS ({knowledgeSources.length})
            </h3>
          </div>
          {editingId && (
            <button
              onClick={() => fetchKnowledge(editingId)}
              className="p-1 text-zinc-500 hover:text-white transition-colors"
              title="Refresh"
            >
              <ArrowPathIcon className={`h-4 w-4 ${knowledgeLoading ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>

        <div className="p-4">
          {knowledgeLoading && knowledgeSources.length === 0 ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 rounded-full border-t-2 border-indigo-500 animate-spin" />
            </div>
          ) : knowledgeSources.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-white/5 rounded-2xl">
              <BookOpenIcon className="h-10 w-10 text-zinc-800 mx-auto mb-3" />
              <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">ZERO KERNELS DETECTED</p>
              <p className="text-[8px] font-bold text-zinc-700 mt-1 uppercase tracking-tighter">INJECT DATA SOURCES TO ENABLE RAG CAPABILITIES</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {knowledgeSources.map(source => (
                <div key={source.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all group">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${source.sourceType === 'file'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                      }`}>
                      {source.sourceType === 'file' ? '📄' : '📝'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-white truncate uppercase tracking-tight">{source.title}</p>
                      <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">
                        {source.sourceType} • {Number(source.chunkCount) || 1} SECTORS
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteKnowledge(editingId, source.id)}
                    className="p-2 text-zinc-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    title="Purge"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
