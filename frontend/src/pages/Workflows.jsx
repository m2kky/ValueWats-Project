import { useState, useEffect } from 'react';
import { 
  PlusIcon,
  PlayIcon,
  TrashIcon,
  BoltIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import api from '../api/client';

export default function Workflows() {
  const [workflows, setWorkflows] = useState([]);
  const [integrations, setIntegrations] = useState([]); // Needed for dropdown
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  // Form
  const [name, setName] = useState('');
  const [sheetId, setSheetId] = useState('');
  const [integrationId, setIntegrationId] = useState('');

  const fetchWorkflows = async () => {
    try {
      const { data } = await api.get('/workflows');
      setWorkflows(data.workflows);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchIntegrations = async () => {
    try {
      const { data } = await api.get('/integrations');
      setIntegrations(data.integrations);
      if (data.integrations.length > 0) setIntegrationId(data.integrations[0].id);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    Promise.all([
      fetchWorkflows(),
      fetchIntegrations()
    ]).finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      if (!integrationId) return alert('Please create an integration first');

      // Construct steps JSON for simple "Add Row" workflow
      const steps = [
        {
          id: 'step1',
          action: 'append_row',
          integrationId: integrationId,
          params: {
            spreadsheetId: sheetId,
            values: ['{{contact.name}}', '{{contact.number}}', '{{agent.name}}', '{{message.content}}']
          }
        }
      ];

      await api.post('/workflows', {
        name,
        triggerType: 'agent_action',
        steps
      });
      
      setShowModal(false);
      setName('');
      setSheetId('');
      fetchWorkflows();
    } catch (error) {
      alert('Failed: ' + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete workflow?')) return;
    try {
      await api.delete(`/workflows/${id}`);
      fetchWorkflows();
    } catch (error) { console.error(error); }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Workflows</h1>
          <p className="text-sm text-gray-500">Automate actions when agents trigger events</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          Create Workflow
        </button>
      </div>

      {loading ? <div>Loading...</div> : (
        <div className="grid gap-4">
          {workflows.map(wf => (
            <div key={wf.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-full">
                  <BoltIcon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{wf.name}</h3>
                  <div className="text-sm text-gray-500 flex items-center gap-2">
                    <span>Trigger: Agent Action</span>
                    <ArrowRightIcon className="h-3 w-3" />
                    <span>Append to Sheet</span>
                  </div>
                  <div className="mt-1 text-xs bg-gray-100 inline-block px-1.5 py-0.5 rounded border border-gray-300 text-gray-600 font-mono">
                     ID: {wf.id}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                 <div className="text-right text-sm text-gray-500">
                    <div>Executions</div>
                    <div className="font-semibold text-gray-900">{wf._count?.executions || 0}</div>
                 </div>
                 <button 
                  onClick={() => handleDelete(wf.id)}
                  className="p-2 text-gray-400 hover:text-red-500"
                 >
                   <TrashIcon className="h-5 w-5" />
                 </button>
              </div>
            </div>
          ))}
          
           {workflows.length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
              <p className="text-gray-500">No workflows defined.</p>
            </div>
          )}
        </div>
      )}

      {/* Simple Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">New Workflow</h2>
            
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Workflow Name</label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border-gray-300"
                  placeholder="e.g. Save Lead to Sheets"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Integration</label>
                <select
                  required
                  value={integrationId}
                  onChange={(e) => setIntegrationId(e.target.value)}
                  className="w-full rounded-lg border-gray-300"
                >
                  <option value="">Select Google Sheets Integration</option>
                  {integrations.filter(i => i.type === 'google_sheets').map(i => (
                    <option key={i.id} value={i.id}>{i.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Spreadsheet ID</label>
                <input
                  required
                  value={sheetId}
                  onChange={(e) => setSheetId(e.target.value)}
                  className="w-full rounded-lg border-gray-300 font-mono text-xs"
                  placeholder="1BxiMVs0XRA5nFMdKbBdB_..."
                />
                <p className="text-xs text-gray-500 mt-1">Copy from Google Sheet URL</p>
              </div>

              <div className="bg-blue-50 p-3 rounded text-sm text-blue-700">
                <p>This workflow will append: <strong>Name, Number, Agent, Message</strong> to the sheet when triggered.</p>
                <p className="mt-1">Copy the Workflow ID after creation and paste it into your Agent's "Actions" tab.</p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
