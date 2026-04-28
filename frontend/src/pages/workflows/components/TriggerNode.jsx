import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { BoltIcon } from '@heroicons/react/24/outline';
import { getTriggerMeta } from '../nodeTypes';

function TriggerNode({ data, selected }) {
  const meta = getTriggerMeta(data.triggerType);
  const Icon = meta.icon || BoltIcon;

  return (
    <div className={`
      relative min-w-[260px] rounded-2xl border-2 transition-all duration-200
      ${selected 
        ? 'border-rose-500/60 shadow-[0_0_30px_rgba(244,63,94,0.15)]' 
        : 'border-rose-500/20 hover:border-rose-500/40'}
      bg-gradient-to-b from-[#1a1017] to-[#12090f]
    `}>
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-white/5">
        <div className="p-1.5 rounded-lg bg-rose-500/15">
          <BoltIcon className="w-4 h-4 text-rose-400" />
        </div>
        <span className="text-[10px] font-black uppercase tracking-[0.15em] text-rose-400/80">Trigger</span>
      </div>

      {/* Body */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-zinc-400 shrink-0" />
          <span className="text-sm font-semibold text-zinc-200 truncate">{meta.label}</span>
        </div>
        {data.description && (
          <p className="text-[11px] text-zinc-500 mt-1 truncate">{data.description}</p>
        )}
      </div>

      {/* Output Handle (bottom) */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-rose-500 !border-2 !border-rose-300/30 !-bottom-1.5"
      />
    </div>
  );
}

export default memo(TriggerNode);
