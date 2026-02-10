import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { 
  PaperAirplaneIcon, 
  PhotoIcon, 
  DevicePhoneMobileIcon,
  UserGroupIcon,
  DocumentArrowUpIcon,
  XMarkIcon,
  CalendarDaysIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

export default function NewCampaign() {
  const [instances, setInstances] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    instanceIds: [],
    message: '', // Kept for backward compatibility, will sync with messages[0]
    messages: [''], // Array of message templates
    numbers: '',
    delayMin: 5,
    delayMax: 15,
    instanceSwitchCount: 50,
    messageRotationCount: 1,
    scheduleEnabled: false,
    scheduledAt: ''
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('manual'); // 'manual' or 'csv'
  const navigate = useNavigate();

  useEffect(() => {
    fetchInstances();
  }, []);

  const fetchInstances = async () => {
    try {
      const response = await api.get('/instances');
      setInstances(response.data.instances.filter(i => i.status === 'connected'));
    } catch (error) {
      console.error('Failed to fetch instances', error);
    }
  };

  const toggleInstance = (id) => {
    const currentIds = formData.instanceIds;
    if (currentIds.includes(id)) {
      setFormData({ ...formData, instanceIds: currentIds.filter(i => i !== id) });
    } else {
      setFormData({ ...formData, instanceIds: [...currentIds, id] });
    }
  };

  const handleMessageChange = (index, value) => {
    const newMessages = [...formData.messages];
    newMessages[index] = value;
    setFormData({ 
      ...formData, 
      messages: newMessages,
      message: newMessages[0] // Sync primary message
    });
  };

  const addMessageTemplate = () => {
    setFormData({ ...formData, messages: [...formData.messages, ''] });
  };

  const removeMessageTemplate = (index) => {
    if (formData.messages.length > 1) {
      const newMessages = formData.messages.filter((_, i) => i !== index);
      setFormData({ 
        ...formData, 
        messages: newMessages,
        message: newMessages[0]
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = new FormData();
      data.append('name', formData.name);
      
      // Append each instance ID
      formData.instanceIds.forEach(id => {
        data.append('instanceIds', id); // Express/Multer handles array of same key
      });

      // Append each message template
      formData.messages.forEach(msg => {
        data.append('messages', msg);
      });
      
      data.append('message', formData.message); // Legacy support
      data.append('delayMin', formData.delayMin);
      data.append('delayMax', formData.delayMax);
      data.append('instanceSwitchCount', formData.instanceSwitchCount);
      data.append('messageRotationCount', formData.messageRotationCount);
      
      if (formData.scheduleEnabled && formData.scheduledAt) {
        data.append('scheduledAt', new Date(formData.scheduledAt).toISOString());
      }
      
      if (activeTab === 'manual') {
        data.append('numbers', formData.numbers);
      } else if (file) {
        data.append('file', file);
      }

      await api.post('/campaigns', data);

      navigate('/campaigns');
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to create campaign');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Create New Campaign</h3>
            <span className="text-sm text-gray-500">Step 1 of 1</span>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Campaign Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Name</label>
              <input
                type="text"
                required
                className="input w-full rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g. Summer Sale Promo"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>

            {/* Instance Selection (Multi-Select) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select WhatsApp Instances ({formData.instanceIds.length} selected)</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {instances.length === 0 ? (
                   <div className="col-span-2 p-4 bg-yellow-50 text-yellow-700 rounded-lg text-sm border border-yellow-200">
                     No connected instances found. Please connect a WhatsApp number first.
                   </div>
                ) : (
                  instances.map(instance => (
                    <div 
                      key={instance.id}
                      onClick={() => toggleInstance(instance.id)}
                      className={`cursor-pointer border rounded-lg p-4 flex items-center gap-3 transition-all ${
                        formData.instanceIds.includes(instance.id) 
                          ? 'border-blue-500 ring-1 ring-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                         formData.instanceIds.includes(instance.id) ? 'bg-blue-600 border-blue-600' : 'border-gray-300 bg-white'
                      }`}>
                        {formData.instanceIds.includes(instance.id) && (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                        )}
                      </div>
                      <div>
                        <p className={`font-medium text-sm ${formData.instanceIds.includes(instance.id) ? 'text-blue-900' : 'text-gray-900'}`}>{instance.instanceName}</p>
                        <p className="text-xs text-gray-500">{instance.phoneNumber}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <p className="mt-2 text-xs text-gray-500">
                💡 Select multiple instances to distribute the load and reduce ban risk.
              </p>
            </div>
            
            {/* Instance Rotation Settings (Only show if multiple instances selected) */}
            {formData.instanceIds.length > 1 && (
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                <label className="block text-sm font-medium text-blue-900 mb-1">🔄 Instance Rotation Strategy</label>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="block text-xs text-blue-700 mb-1">Switch instance every N messages</label>
                    <input
                      type="number"
                      min="1"
                      className="input w-full rounded-lg border-blue-200 focus:ring-blue-500 focus:border-blue-500"
                      value={formData.instanceSwitchCount}
                      onChange={e => setFormData({...formData, instanceSwitchCount: parseInt(e.target.value) || 1})}
                    />
                  </div>
                  <div className="text-xs text-blue-600 flex-1 pt-4">
                    With {formData.instanceIds.length} instances and switch count of {formData.instanceSwitchCount}:
                    <br/>
                    Instance 1 sends {formData.instanceSwitchCount} messages, then Instance 2 sends {formData.instanceSwitchCount}, etc.
                  </div>
                </div>
              </div>
            )}

            {/* Message Templates */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">Message Content ({formData.messages.length} Templates)</label>
                {formData.messages.length < 5 && (
                  <button 
                    type="button" 
                    onClick={addMessageTemplate}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                  >
                    <span>+ Add Variant</span>
                  </button>
                )}
              </div>
              
              <div className="space-y-4">
                {formData.messages.map((msg, index) => (
                  <div key={index} className="relative group">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-500 font-medium">Template #{index + 1}</span>
                      {formData.messages.length > 1 && (
                        <button 
                          type="button" 
                          onClick={() => removeMessageTemplate(index)}
                          className="text-xs text-red-500 hover:text-red-700"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <textarea
                        required
                        rows={5}
                        className="input w-full rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                        placeholder={index === 0 ? "Hi there! Check out our new offers..." : "Hello! Don't miss our latest deals..."}
                        value={msg}
                        onChange={e => handleMessageChange(index, e.target.value)}
                      />
                      <div className="absolute bottom-3 right-3 flex gap-2">
                         <button type="button" className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100" title="Add Image (Coming Soon)">
                           <PhotoIcon className="w-5 h-5" />
                         </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-xs text-gray-500">Variables like {`{name}`} coming soon. Add multiple variants to avoid spam detection.</p>
            </div>

            {/* Message Rotation Settings (Only show if multiple templates) */}
            {formData.messages.length > 1 && (
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                <label className="block text-sm font-medium text-purple-900 mb-1">🔀 Message Rotation Strategy</label>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="block text-xs text-purple-700 mb-1">Switch template every N messages</label>
                    <input
                      type="number"
                      min="1"
                      className="input w-full rounded-lg border-purple-200 focus:ring-purple-500 focus:border-purple-500"
                      value={formData.messageRotationCount}
                      onChange={e => setFormData({...formData, messageRotationCount: parseInt(e.target.value) || 1})}
                    />
                  </div>
                  <div className="text-xs text-purple-600 flex-1 pt-4">
                    With {formData.messages.length} templates and switch count of {formData.messageRotationCount}:
                    <br/>
                    Template 1 used for {formData.messageRotationCount} messages, then Template 2, etc. (Round Robin)
                  </div>
                </div>
              </div>
            )}

            {/* Recipient Source Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Recipients</label>
              <div className="flex border-b border-gray-200 mb-4">
                <button
                  type="button"
                  onClick={() => setActiveTab('manual')}
                  className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'manual' 
                      ? 'border-blue-500 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Manual Input
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('csv')}
                  className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'csv' 
                      ? 'border-blue-500 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Upload CSV
                </button>
              </div>

              {activeTab === 'manual' ? (
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute top-3 left-3 pointer-events-none">
                    <UserGroupIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <textarea
                    required={activeTab === 'manual'}
                    rows={6}
                    className="input w-full pl-10 rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                    placeholder={"1234567890\n9876543210"}
                    value={formData.numbers}
                    onChange={e => setFormData({...formData, numbers: e.target.value})}
                  />
                  <p className="mt-1 text-xs text-gray-500">Enter phone numbers (one per line) with country code (e.g., 201xxxxxxxxx).</p>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition-colors">
                  {file ? (
                    <div className="flex items-center justify-center gap-2 text-green-600 bg-green-50 p-2 rounded-lg inline-block">
                      <DocumentArrowUpIcon className="w-5 h-5" />
                      <span className="text-sm font-medium">{file.name}</span>
                      <button 
                        type="button" 
                        onClick={() => setFile(null)}
                        className="p-1 hover:bg-green-100 rounded-full"
                      >
                        <XMarkIcon className="w-4 h-4 text-green-700" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <DocumentArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="mt-4 flex text-sm leading-6 text-gray-600 justify-center">
                        <label
                          htmlFor="file-upload"
                          className="relative cursor-pointer rounded-md bg-white font-semibold text-blue-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-600 focus-within:ring-offset-2 hover:text-blue-500"
                        >
                          <span>Upload a file</span>
                          <input 
                            id="file-upload" 
                            name="file-upload" 
                            type="file" 
                            className="sr-only" 
                            accept=".csv"
                            onChange={(e) => setFile(e.target.files[0])}
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-600">CSV files only (Column 'number' required)</p>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Delay Configuration - P1 Feature */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                ⏱️ Message Delay (Anti-Spam)
              </label>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Minimum Delay: <span className="font-semibold text-gray-700">{formData.delayMin}s</span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="60"
                    value={formData.delayMin}
                    onChange={e => setFormData({...formData, delayMin: parseInt(e.target.value)})}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>1s</span>
                    <span>60s</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Maximum Delay: <span className="font-semibold text-gray-700">{formData.delayMax}s</span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="120"
                    value={formData.delayMax}
                    onChange={e => setFormData({...formData, delayMax: parseInt(e.target.value)})}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>1s</span>
                    <span>120s</span>
                  </div>
                </div>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                💡 Random delay between {formData.delayMin}-{formData.delayMax} seconds to avoid WhatsApp spam detection.
              </p>
            </div>
            
            {/* Schedule Campaign */}
            <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-100">
              <div className="flex items-center justify-between mb-2">
                <label className="flex items-center gap-2 text-sm font-medium text-indigo-900">
                  <CalendarDaysIcon className="h-5 w-5" />
                  Schedule Campaign
                </label>
                <button
                  type="button"
                  onClick={() => setFormData({...formData, scheduleEnabled: !formData.scheduleEnabled, scheduledAt: ''})}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.scheduleEnabled ? 'bg-indigo-600' : 'bg-gray-300'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    formData.scheduleEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
              {formData.scheduleEnabled ? (
                <div>
                  <div className="flex items-center gap-2">
                    <ClockIcon className="h-4 w-4 text-indigo-500" />
                    <input
                      type="datetime-local"
                      required={formData.scheduleEnabled}
                      min={new Date(Date.now() + 5 * 60000).toISOString().slice(0, 16)}
                      value={formData.scheduledAt}
                      onChange={e => setFormData({...formData, scheduledAt: e.target.value})}
                      className="flex-1 px-3 py-2 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    />
                  </div>
                  <p className="mt-2 text-xs text-indigo-600">
                    💡 Campaign will automatically launch at the scheduled time. Minimum 5 minutes from now.
                  </p>
                </div>
              ) : (
                <p className="text-xs text-indigo-600">Campaign will launch immediately after creation.</p>
              )}
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate('/campaigns')}
                className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="button"
                className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading || formData.instanceIds.length === 0 || (activeTab === 'csv' && !file)}
                onClick={handleSubmit}
              >
                {loading ? (formData.scheduleEnabled ? 'Scheduling...' : 'Launching...') : (
                  <>
                    {formData.scheduleEnabled ? (
                      <><CalendarDaysIcon className="-ml-1 mr-2 h-5 w-5" />Schedule Campaign</>
                    ) : (
                      <><PaperAirplaneIcon className="-ml-1 mr-2 h-5 w-5" />Launch Campaign</>
                    )}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
