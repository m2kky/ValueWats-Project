import { useState, useEffect } from 'react';
import { 
  UserCircleIcon, 
  PhoneIcon, 
  TagIcon, 
  AdjustmentsHorizontalIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import api from '../../services/api';

export default function ContactSidebar({ conversation, onClose, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const [stages, setStages] = useState([]);
  
  // Local state for editing
  const [name, setName] = useState(conversation.contactName || '');
  const [labels, setLabels] = useState(conversation.labels?.join(', ') || '');
  const [stageId, setStageId] = useState(conversation.lifecycleStageId || '');
  const [customFields, setCustomFields] = useState(
    conversation.contactFields?.map(f => ({ name: f.fieldName, value: f.fieldValue })) || []
  );
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldValue, setNewFieldValue] = useState('');

  // Fetch lifecycle stages
  useEffect(() => {
    api.get('/chat/lifecycle-stages')
      .then(res => setStages(res.data.stages))
      .catch(console.error);
  }, []);

  // Update local state when conversation changes
  useEffect(() => {
    setName(conversation.contactName || '');
    setLabels(conversation.labels?.join(', ') || '');
    setStageId(conversation.lifecycleStageId || '');
    setCustomFields(conversation.contactFields?.map(f => ({ name: f.fieldName, value: f.fieldValue })) || []);
  }, [conversation]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const labelsArray = labels.split(',').map(s => s.trim()).filter(Boolean);
      
      const payload = {
        contactName: name,
        labels: labelsArray,
        lifecycleStageId: stageId || null,
        customFields
      };

      const res = await api.put(`/chat/conversations/${conversation.id}/contact`, payload);
      if (onUpdate) onUpdate(res.data.conversation);
      
      // Show success toast (implied)
    } catch (error) {
      console.error('Failed to save contact:', error);
      alert('Failed to save contact details');
    } finally {
      setLoading(false);
    }
  };

  const addField = () => {
    if (!newFieldName || !newFieldValue) return;
    setCustomFields([...customFields, { name: newFieldName, value: newFieldValue }]);
    setNewFieldName('');
    setNewFieldValue('');
  };

  const removeField = (index) => {
    setCustomFields(customFields.filter((_, i) => i !== index));
  };

  return (
    <div className="w-80 border-l border-gray-200 bg-white h-full overflow-y-auto flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
        <h3 className="font-semibold text-gray-700">Contact Details</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>

      <div className="p-6 flex-1 space-y-6">
        {/* Profile Info */}
        <div className="flex flex-col items-center">
          <div className="h-20 w-20 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 text-2xl font-bold mb-3">
             {name?.[0]?.toUpperCase() || conversation.contactNumber?.[0] || '?'}
          </div>
          <div className="text-center w-full">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="block w-full text-center text-lg font-medium border-none focus:ring-0 focus:border-b focus:border-indigo-500 bg-transparent placeholder-gray-400"
              placeholder="Add Name"
            />
            <div className="flex items-center justify-center gap-1 text-gray-500 mt-1">
              <PhoneIcon className="h-4 w-4" />
              <span className="text-sm">{conversation.contactNumber}</span>
            </div>
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* Lifecycle Stage */}
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
            Lifecycle Stage
          </label>
          <select
            value={stageId}
            onChange={(e) => setStageId(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="">Select Stage</option>
            {stages.map(s => (
              <option key={s.id} value={s.id}>{s.name} {s.emoji}</option>
            ))}
          </select>
        </div>

        {/* Labels */}
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
            Labels (comma separated)
          </label>
          <div className="relative rounded-md shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <TagIcon className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={labels}
              onChange={(e) => setLabels(e.target.value)}
              className="block w-full rounded-md border-gray-300 pl-10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="vip, new, lead"
            />
          </div>
        </div>

        {/* Custom Fields */}
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 flex justify-between items-center">
            <span>Custom Fields</span>
            <span className="text-xs normal-case bg-gray-100 px-2 py-0.5 rounded text-gray-600">{customFields.length}</span>
          </label>
          
          <div className="space-y-2 mb-3">
            {customFields.map((field, idx) => (
              <div key={idx} className="flex gap-2 group">
                <div className="flex-1 bg-gray-50 p-2 rounded text-sm relative">
                  <div className="text-xs text-gray-500">{field.name}</div>
                  <input 
                    value={field.value}
                    onChange={(e) => {
                      const newFields = [...customFields];
                      newFields[idx].value = e.target.value;
                      setCustomFields(newFields);
                    }}
                    className="bg-transparent w-full border-none p-0 h-5 text-gray-800 focus:ring-0 text-sm"
                  />
                  <button 
                    onClick={() => removeField(idx)}
                    className="absolute top-1 right-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2 items-center bg-gray-50 p-2 rounded border border-dashed border-gray-300">
            <input
              placeholder="Field"
              value={newFieldName}
              onChange={(e) => setNewFieldName(e.target.value)}
              className="w-1/3 bg-transparent border-none p-1 text-xs focus:ring-0"
            />
            <span className="text-gray-300">|</span>
            <input
              placeholder="Value"
              value={newFieldValue}
              onChange={(e) => setNewFieldValue(e.target.value)}
              className="flex-1 bg-transparent border-none p-1 text-xs focus:ring-0"
              onKeyDown={(e) => e.key === 'Enter' && addField()}
            />
            <button 
              onClick={addField}
              disabled={!newFieldName || !newFieldValue}
              className="text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
            >
              <UserCircleIcon className="h-5 w-5" /> 
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
