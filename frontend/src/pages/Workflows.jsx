import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PlusIcon,
  TrashIcon,
  BoltIcon,
  PencilSquareIcon
} from '@heroicons/react/24/outline';
import api from '../api/client';

export default function WorkflowsList() {
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchWorkflows = async () => {
    try {
      const { data } = await api.get('/workflows');
      setWorkflows(data.workflows);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const handleDelete = async (e, id) => {
    e.stopPropagation(); // Prevent opening the builder
    if (!confirm('Delete this workflow?')) return;
    try {
      await api.delete(`/workflows/${id}`);
      fetchWorkflows();
    } catch (error) { console.error(error); }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white uppercase tracking-widest italic drop-shadow-md">Workflows</h1>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-sm text-zinc-400">Build visual automations and AI triggers</p>
            </div>
          </div>
        <button
          onClick={() => navigate('/workflows/new')}
          className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 text-white font-semibold rounded-xl hover:bg-rose-500 transition-all shadow-lg shadow-rose-500/20"
        >
          <PlusIcon className="h-5 w-5" />
          Create Workflow
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><div className="text-zinc-500">Loading workflows...</div></div>
      ) : (
        <div className="grid gap-4">
          {workflows.map(wf => (
            <div 
              key={wf.id} 
              onClick={() => navigate(`/workflows/${wf.id}`)}
              className="bg-zinc-900/50 p-4 rounded-2xl border border-white/5 shadow-sm flex items-center justify-between cursor-pointer hover:bg-zinc-800/80 hover:border-white/10 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-rose-500/10 text-rose-500 rounded-xl">
                  <BoltIcon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-200 group-hover:text-white transition-colors">{wf.name}</h3>
                  <div className="text-sm text-zinc-500 flex items-center gap-2 mt-0.5">
                    <span>Trigger: {wf.triggerType || 'Manual'}</span>
                  </div>
                  <div className="mt-2 text-[10px] bg-black/40 inline-block px-2 py-1 rounded text-zinc-500 font-mono">
                     {wf.id}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                 <div className="text-right text-sm text-zinc-500 mr-4">
                    <div className="text-[10px] uppercase tracking-widest font-black">Executions</div>
                    <div className="font-semibold text-zinc-300">{wf._count?.executions || 0}</div>
                 </div>
                 <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/workflows/${wf.id}`);
                  }}
                  className="p-2 text-zinc-500 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                  title="Edit Workflow"
                 >
                   <PencilSquareIcon className="h-5 w-5" />
                 </button>
                 <button 
                  onClick={(e) => handleDelete(e, wf.id)}
                  className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                  title="Delete Workflow"
                 >
                   <TrashIcon className="h-5 w-5" />
                 </button>
              </div>
            </div>
          ))}
          
           {workflows.length === 0 && (
            <div className="text-center py-16 bg-zinc-900/30 rounded-3xl border border-dashed border-white/10">
              <div className="p-4 bg-white/5 rounded-full inline-block mb-4">
                <BoltIcon className="w-8 h-8 text-zinc-500" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">No workflows yet</h3>
              <p className="text-zinc-500 max-w-sm mx-auto mb-6">Build powerful automation flows with AI agents, external integrations, and CRM actions.</p>
              <button
                onClick={() => navigate('/workflows/new')}
                className="px-6 py-2.5 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-all"
              >
                Create your first workflow
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
