import { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  TrashIcon, 
  CheckCircleIcon, 
  ExclamationCircleIcon,
  CircleStackIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';
import api from '../api/client';

export default function Integrations() {
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  // Form State
  const [type, setType] = useState('google_sheets');
  const [name, setName] = useState('');
  const [credentials, setCredentials] = useState(''); // JSON string

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    try {
      const { data } = await api.get('/integrations');
      setIntegrations(data.integrations);
    } catch (error) {
      console.error('Failed to fetch integrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/integrations', {
        type,
        name,
        credentials
      });
      setShowModal(false);
      setName('');
      setCredentials('');
      fetchIntegrations();
    } catch (error) {
      alert('Failed to create integration: ' + error.response?.data?.error || error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure? This might break active workflows.')) return;
    try {
      await api.delete(`/integrations/${id}`);
      fetchIntegrations();
    } catch (error) {
      console.error(error);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'google_sheets': return <CircleStackIcon className="h-8 w-8 text-green-600" />;
      case 'webhook': return <GlobeAltIcon className="h-8 w-8 text-blue-600" />;
      default: return <CircleStackIcon className="h-8 w-8 text-gray-400" />;
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Integrations</h1>
          <p className="text-sm text-gray-500">Connect external tools to your AI agents</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          Add Integration
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {integrations.map(int => (
            <div key={int.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-gray-50 rounded-lg">
                  {getIcon(int.type)}
                </div>
                <button 
                  onClick={() => handleDelete(int.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
              
              <h3 className="font-semibold text-gray-900 mb-1">{int.name}</h3>
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                <span className="capitalize">{int.type.replace('_', ' ')}</span>
                <span>•</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                  int.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {int.status}
                </span>
              </div>

              <div className="text-xs text-gray-400 font-mono bg-gray-50 p-2 rounded truncate">
                ID: {int.id}
              </div>
            </div>
          ))}
          
          {integrations.length === 0 && (
            <div className="col-span-full text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
              <p className="text-gray-500">No integrations connected yet.</p>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Connect Integration</h2>
            
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select 
                  value={type} 
                  onChange={(e) => setType(e.target.value)}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="google_sheets">Google Sheets (Service Account)</option>
                  <option value="webhook">Webhook (Generic)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Sales Sheet"
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Credentials (JSON)
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  {type === 'google_sheets' 
                    ? 'Paste the full Service Account JSON here.' 
                    : 'Paste headers/auth token JSON here.'}
                </p>
                <textarea
                  required
                  rows={6}
                  value={credentials}
                  onChange={(e) => setCredentials(e.target.value)}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 font-mono text-xs"
                  placeholder='{"type": "service_account", ...}'
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Connect
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
