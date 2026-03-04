import { useState, useEffect } from 'react';
import {
    PlusIcon,
    TrashIcon,
    CheckCircleIcon,
    MapIcon,
    Squares2X2Icon
} from '@heroicons/react/24/outline';
import api from '../../api/client';

export default function LifecycleSettings() {
    const [stages, setStages] = useState([
        { id: 1, name: 'New Lead', color: '#6366f1', icon: '🆕' },
        { id: 2, name: 'Hot Lead', color: '#f43f5e', icon: '🔥' },
        { id: 3, name: 'Proposal Sent', color: '#f59e0b', icon: '📄' },
        { id: 4, name: 'Closed Won', color: '#10b981', icon: '🎉' },
        { id: 5, name: 'Closed Lost', color: '#64748b', icon: '❌' },
    ]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black text-white italic tracking-tight uppercase">Lifecycle Stages</h1>
                    <p className="text-zinc-500 text-sm font-medium">Manage your sales pipeline and contact phases</p>
                </div>
                <button
                    className="btn-premium flex items-center gap-2"
                    onClick={() => alert('Customizing lifecycle stages is coming soon!')}
                >
                    <PlusIcon className="h-4 w-4" />
                    Add Stage
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {stages.map((stage, index) => (
                    <div key={stage.id} className="glass-card p-6 relative group overflow-hidden border-l-4" style={{ borderLeftColor: stage.color }}>
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <span className="text-6xl">{stage.icon}</span>
                        </div>

                        <div className="flex items-center gap-3 mb-4">
                            <div className="text-2xl">{stage.icon}</div>
                            <div>
                                <h3 className="font-bold text-white tracking-tight">{stage.name}</h3>
                                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Stage {index + 1}</p>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button className="btn-glass text-[10px] px-3 py-1 uppercase tracking-widest font-black">Edit</button>
                            {index > 0 && index < stages.length - 1 && (
                                <button className="btn-glass text-rose-500/50 hover:text-rose-400 text-[10px] px-3 py-1 uppercase tracking-widest font-black">Delete</button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className="glass-card p-8 bg-indigo-600/5 border border-indigo-600/20 text-center">
                <MapIcon className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-white mb-2 tracking-tight italic uppercase">Automation Map</h3>
                <p className="text-zinc-400 text-sm max-w-lg mx-auto mb-6">
                    Define rules to automatically move contacts between stages based on tags, received messages, or field updates.
                </p>
                <button className="btn-premium">Configure Automations</button>
            </div>
        </div>
    );
}
