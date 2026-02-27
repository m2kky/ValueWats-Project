import { useState, useEffect } from 'react';
import api from '../api/client';
import {
    UserIcon,
    ChatBubbleLeftRightIcon,
    TagIcon,
    PencilSquareIcon,
    EnvelopeIcon,
    CalendarIcon,
    CheckCircleIcon,
    ArrowPathIcon
} from '@heroicons/react/24/outline';

const getActionIcon = (type) => {
    switch (type) {
        case 'lifecycle_change': return <ArrowPathIcon className="w-4 h-4" />;
        case 'label_added':
        case 'label_removed': return <TagIcon className="w-4 h-4" />;
        case 'note_added': return <PencilSquareIcon className="w-4 h-4" />;
        case 'assigned': return <UserIcon className="w-4 h-4" />;
        case 'closed': return <CheckCircleIcon className="w-4 h-4" />;
        case 'tool_email': return <EnvelopeIcon className="w-4 h-4" />;
        case 'tool_calendar': return <CalendarIcon className="w-4 h-4" />;
        case 'tool_whatsapp': return <ChatBubbleLeftRightIcon className="w-4 h-4" />;
        default: return <ChatBubbleLeftRightIcon className="w-4 h-4" />;
    }
};

const getActionColor = (type) => {
    switch (type) {
        case 'lifecycle_change': return 'bg-blue-500/20 text-blue-400';
        case 'label_added': return 'bg-emerald-500/20 text-emerald-400';
        case 'note_added': return 'bg-amber-500/20 text-amber-400';
        case 'closed': return 'bg-zinc-500/20 text-zinc-400';
        case 'tool_email': return 'bg-purple-500/20 text-purple-400';
        case 'tool_calendar': return 'bg-rose-500/20 text-rose-400';
        default: return 'bg-indigo-500/20 text-indigo-400';
    }
};

export default function ActivityFeed() {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchActivity = async () => {
        try {
            const res = await api.get('/dashboard/activity?limit=10');
            setActivities(res.data.activity);
        } catch (error) {
            console.error('Failed to fetch activity:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchActivity();
        const interval = setInterval(fetchActivity, 30000);
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="space-y-4 p-6">
                {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-white/5" />
                        <div className="flex-1 space-y-2">
                            <div className="h-4 bg-white/5 rounded w-3/4" />
                            <div className="h-3 bg-white/5 rounded w-1/4" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (activities.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-zinc-600 grayscale opacity-50">
                <ArrowPathIcon className="w-12 h-12 mb-4" />
                <p className="font-bold uppercase tracking-widest text-[10px]">No recent activity</p>
            </div>
        );
    }

    return (
        <div className="divide-y divide-white/5">
            {activities.map((log) => (
                <div key={log.id} className="p-5 hover:bg-white/[0.02] transition-colors group">
                    <div className="flex gap-4">
                        <div className={`mt-1 p-2 rounded-xl shrink-0 ${getActionColor(log.actionType)}`}>
                            {getActionIcon(log.actionType)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-white font-medium break-words">
                                {log.contact?.name || log.contact?.phoneNumber || 'System'}
                                <span className="text-zinc-500 font-normal ml-1.5">{log.description}</span>
                            </p>
                            <div className="mt-1 flex items-center gap-3">
                                <span className="text-[10px] font-black text-zinc-600 uppercase tracking-tighter">
                                    {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                {log.metadata?.agentName && (
                                    <span className="text-[10px] font-black text-indigo-500/70 border border-indigo-500/20 px-1.5 rounded uppercase">
                                        Agent: {log.metadata.agentName}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
