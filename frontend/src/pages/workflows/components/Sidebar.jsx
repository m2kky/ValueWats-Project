import { ACTION_TYPES, CATEGORIES } from '../nodeTypes';

export default function Sidebar({ onAddNode }) {
  const grouped = {};
  ACTION_TYPES.forEach(a => {
    if (!grouped[a.category]) grouped[a.category] = [];
    grouped[a.category].push(a);
  });

  return (
    <div className="w-[280px] shrink-0 bg-[#0c0c0e] border-r border-white/5 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 py-4 border-b border-white/5">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Add Steps</h3>
      </div>

      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-5">
        {Object.entries(grouped).map(([cat, actions]) => {
          const catMeta = CATEGORIES[cat] || { label: cat, color: '#6366f1' };
          return (
            <div key={cat}>
              <div className="flex items-center gap-2 mb-2 px-1">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: catMeta.color }} />
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600">{catMeta.label}</span>
              </div>

              <div className="space-y-1">
                {actions.map(action => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.value}
                      onClick={() => onAddNode(action.value)}
                      className="w-full group flex items-center gap-3 px-3 py-2.5 rounded-xl
                        bg-white/[0.02] hover:bg-white/[0.06] border border-transparent hover:border-white/5
                        transition-all duration-150 text-left"
                    >
                      <div
                        className="p-1.5 rounded-lg shrink-0 transition-colors"
                        style={{ backgroundColor: `${action.color}15` }}
                      >
                        <Icon className="w-4 h-4" style={{ color: action.color }} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-zinc-300 group-hover:text-white truncate transition-colors">
                          {action.label}
                        </div>
                        <div className="text-[10px] text-zinc-600 truncate">
                          {action.description}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
