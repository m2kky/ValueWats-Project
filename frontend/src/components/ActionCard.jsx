import { useState, useRef } from 'react';
import { Switch } from '@headlessui/react';
import { SparklesIcon, CommandLineIcon } from '@heroicons/react/24/outline';

const VARIABLES = [
  { label: 'Contact Name', value: '{{contact.name}}' },
  { label: 'Phone Number', value: '{{contact.phone}}' },
  { label: 'User ID', value: '{{contact.id}}' },
  { label: 'Lifecycle Stage', value: '{{contact.lifecycleStage}}' },
  { label: 'Agent Name', value: '{{agent.name}}' },
  { label: 'Date', value: '{{date.today}}' },
];

export default function ActionCard({ 
  title, 
  description, 
  enabled, 
  setEnabled, 
  config, 
  setConfig, 
  placeholder 
}) {
  const [showVariables, setShowVariables] = useState(false);
  const textareaRef = useRef(null);

  const insertVariable = (variable) => {
    if (!textareaRef.current) return;
    
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const text = config || '';
    const newText = text.substring(0, start) + variable + text.substring(end);
    
    setConfig(newText);
    setShowVariables(false);
    
    // Reset cursor position
    setTimeout(() => {
      textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + variable.length;
      textareaRef.current.focus();
    }, 0);
  };

  return (
    <div className={`card transition-colors ${enabled ? 'border-blue-200 shadow-sm' : ''}`}>
      <div className="card-header pb-3">
        <div className="flex justify-between items-start gap-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
            <p className="text-xs text-gray-500 mt-1">{description}</p>
          </div>
          <Switch
            checked={enabled}
            onChange={setEnabled}
            className={`${
              enabled ? 'bg-blue-600' : 'bg-gray-200'
            } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
          >
            <span
              className={`${
                enabled ? 'translate-x-6' : 'translate-x-1'
              } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
            />
          </Switch>
        </div>
      </div>

      {enabled && (
        <div className="card-body bg-gray-50/50 pt-0">
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs text-gray-500 font-medium px-1">
              <span>When and how should this action be performed?</span>
              <button className="text-blue-600 hover:text-blue-700 flex items-center gap-1 opacity-50 cursor-not-allowed">
                <SparklesIcon className="h-3 w-3" /> Optimize
              </button>
            </div>
            
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={config}
                onChange={(e) => setConfig(e.target.value)}
                rows={4}
                className="input text-sm font-sans"
                placeholder={placeholder || "Describe the conditions..."}
              />
              
              <div className="absolute bottom-2 left-2 flex gap-2">
                <div className="relative">
                  <button
                    onClick={() => setShowVariables(!showVariables)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 bg-white border rounded shadow-sm hover:shadow transition-all"
                    title="Insert Variable"
                  >
                    <CommandLineIcon className="h-4 w-4" />
                  </button>
                  
                  {showVariables && (
                    <div className="absolute bottom-full left-0 mb-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 py-1 z-10">
                      <div className="px-3 py-1.5 text-xs font-semibold text-gray-400 border-b border-gray-50">
                        Insert Variable
                      </div>
                      {VARIABLES.map((v) => (
                        <button
                          key={v.value}
                          onClick={() => insertVariable(v.value)}
                          className="w-full text-left px-3 py-2 text-xs text-gray-600 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                        >
                          <span className="font-medium">{v.label}</span>
                          <span className="ml-2 text-gray-400 opacity-75">{v.value}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <p className="text-xs text-gray-400 px-1">
              ℹ️ The agent will intelligently decide when to trigger this based on your instructions.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
