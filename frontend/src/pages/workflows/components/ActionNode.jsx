import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { getActionMeta } from '../nodeTypes';

function ActionNode({ data, selected }) {
  const meta = getActionMeta(data.actionType);
  const Icon = meta.icon;
  const color = meta.color || '#6366f1';

  return (
    <div className={`
      relative min-w-[260px] rounded-2xl border-2 transition-all duration-200
      ${selected
        ? 'shadow-[0_0_30px_rgba(99,102,241,0.15)]'
        : 'hover:border-white/15'}
      bg-gradient-to-b from-[#141318] to-[#0e0d12]
    `}
    style={{
      borderColor: selected ? `${color}60` : `${color}25`,
    }}
    >
      {/* Input Handle (top) */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !border-2 !-top-1.5"
        style={{ backgroundColor: color, borderColor: `${color}40` }}
      />

      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-white/5">
        <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${color}18` }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-sm font-semibold text-zinc-200 truncate block">
            {data.label || meta.label}
          </span>
          <span className="text-[10px] font-medium uppercase tracking-widest truncate block" style={{ color: `${color}90` }}>
            {meta.label}
          </span>
        </div>
      </div>

      {/* Body — summary preview */}
      {data.summary && (
        <div className="px-4 py-2.5">
          <p className="text-[11px] text-zinc-500 truncate">{data.summary}</p>
        </div>
      )}

      {/* Output Handle (bottom) */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !border-2 !-bottom-1.5"
        style={{ backgroundColor: color, borderColor: `${color}40` }}
      />
    </div>
  );
}

export default memo(ActionNode);
