import { memo, useMemo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { ArrowsRightLeftIcon } from '@heroicons/react/24/outline';

function BranchNode({ data, selected }) {
  const branches = data.branches || [
    { id: 'branch_1', label: 'Branch 1', conditions: [] },
  ];
  const color = '#f59e0b';

  return (
    <div className={`
      relative min-w-[280px] rounded-2xl border-2 transition-all duration-200
      ${selected
        ? 'border-amber-500/60 shadow-[0_0_30px_rgba(245,158,11,0.15)]'
        : 'border-amber-500/20 hover:border-amber-500/40'}
      bg-gradient-to-b from-[#1a1610] to-[#12100b]
    `}>
      {/* Input Handle (top) */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-amber-500 !border-2 !border-amber-300/30 !-top-1.5"
      />

      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-white/5">
        <div className="p-1.5 rounded-lg bg-amber-500/15">
          <ArrowsRightLeftIcon className="w-4 h-4 text-amber-400" />
        </div>
        <span className="text-sm font-semibold text-zinc-200">Branch</span>
        <span className="ml-auto text-[10px] font-bold text-amber-500/60 uppercase tracking-widest">
          {branches.length + 1} paths
        </span>
      </div>

      {/* Branch labels */}
      <div className="px-4 py-2.5 flex flex-wrap gap-1.5">
        {branches.map((b, i) => (
          <span
            key={b.id}
            className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-400/80 border border-amber-500/15"
          >
            {b.label || `Branch ${i + 1}`}
          </span>
        ))}
        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-zinc-500/10 text-zinc-500 border border-zinc-500/15">
          Else
        </span>
      </div>

      {/* Output Handles — one per branch + else */}
      {branches.map((b, i) => (
        <Handle
          key={b.id}
          type="source"
          position={Position.Bottom}
          id={b.id}
          className="!w-2.5 !h-2.5 !bg-amber-500 !border-2 !border-amber-300/30 !-bottom-1.5"
          style={{ left: `${((i + 1) / (branches.length + 2)) * 100}%` }}
        />
      ))}
      <Handle
        type="source"
        position={Position.Bottom}
        id="else"
        className="!w-2.5 !h-2.5 !bg-zinc-500 !border-2 !border-zinc-400/30 !-bottom-1.5"
        style={{ left: `${((branches.length + 1) / (branches.length + 2)) * 100}%` }}
      />
    </div>
  );
}

export default memo(BranchNode);
