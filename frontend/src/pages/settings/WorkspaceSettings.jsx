import { useState, useEffect } from 'react';
import api from '../../api/client';

export default function WorkspaceSettings() {
    const [tenant, setTenant] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTenant = async () => {
            try {
                const { data } = await api.get('/auth/me'); // Tenant info is usually in user object
                setTenant(data.user.tenant);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchTenant();
    }, []);

    if (loading) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col">
                <h1 className="text-2xl font-black text-white italic tracking-tight uppercase">General Settings</h1>
                <p className="text-zinc-500 text-sm font-medium">Manage your workspace basic information</p>
            </div>

            <div className="glass-card p-6 space-y-6">
                <div>
                    <label className="block text-[10px] font-bold text-zinc-500 mb-2 uppercase tracking-widest">Workspace Name</label>
                    <input
                        type="text"
                        readOnly
                        value={tenant?.name || ''}
                        className="glass-input bg-white/[0.02]"
                    />
                </div>

                <div>
                    <label className="block text-[10px] font-bold text-zinc-500 mb-2 uppercase tracking-widest">Workspace ID</label>
                    <input
                        type="text"
                        readOnly
                        value={tenant?.id || ''}
                        className="glass-input bg-white/[0.02] font-mono"
                    />
                </div>

                <div>
                    <label className="block text-[10px] font-bold text-zinc-500 mb-2 uppercase tracking-widest">API Key</label>
                    <div className="flex gap-2">
                        <input
                            type="password"
                            readOnly
                            value="******************************"
                            className="glass-input flex-1 bg-white/[0.02]"
                        />
                        <button className="btn-glass text-xs" onClick={() => alert('API keys are managed in the cloud dashboard.')}>Reveal</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
