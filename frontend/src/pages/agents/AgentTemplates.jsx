import React from 'react';
import { ArrowLeftIcon, SparklesIcon, PlusIcon } from '@heroicons/react/24/outline';

const templateMeta = {
  receptionist: {
    emoji: '👋',
    color: 'from-violet-500 to-purple-600',
    bgLight: 'bg-violet-50 border-violet-200',
    description: 'Greets visitors, answers FAQs, and routes conversations to the right team.',
  },
  sales: {
    emoji: '🛍️',
    color: 'from-emerald-500 to-teal-600',
    bgLight: 'bg-emerald-50 border-emerald-200',
    description: 'Qualifies leads, presents products, and guides customers through the sales funnel.',
  },
  support: {
    emoji: '🛠️',
    color: 'from-blue-500 to-indigo-600',
    bgLight: 'bg-blue-50 border-blue-200',
    description: 'Handles technical issues, troubleshoots problems, and escalates when needed.',
  },
};

export default function AgentTemplates({ setView, handleSelectTemplate, saving, handleCustomCreate }) {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Back Button */}
      <button
        onClick={() => setView('list')}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Back to Agents
      </button>

      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Choose a Template</h1>
        <p className="text-gray-500 text-lg">Start with a pre-configured agent or create your own from scratch.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {Object.entries(templateMeta).map(([key, meta]) => (
          <button
            key={key}
            onClick={() => handleSelectTemplate(key)}
            disabled={saving}
            className="group card border hover:shadow-lg transition-all duration-300 text-left hover:-translate-y-1"
          >
            <div className="p-6">
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${meta.color} flex items-center justify-center text-2xl mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                {meta.emoji}
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2 capitalize">{key}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{meta.description}</p>
            </div>
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
              <span className="text-sm font-medium text-blue-600 group-hover:text-blue-700 flex items-center gap-1">
                Use Template
                <SparklesIcon className="h-4 w-4" />
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Custom Agent Card */}
      <div className="text-center">
        <button
          onClick={handleCustomCreate}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-dashed border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50 transition-all"
        >
          <PlusIcon className="h-5 w-5" />
          Create Custom Agent
        </button>
      </div>
    </div>
  );
}
