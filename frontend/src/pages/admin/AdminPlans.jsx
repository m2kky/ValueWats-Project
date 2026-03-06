import React, { useEffect, useState } from 'react';
import apiClient from '../../api/client';
import ValueWatsLoader from '../../components/ValueWatsLoader';
import { format } from 'date-fns';
import { PencilSquareIcon } from '@heroicons/react/24/outline';

export default function AdminPlans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/api/admin/plans');
      setPlans(res.data);
    } catch (error) {
      console.error('Failed to load plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (plan) => {
      // In a full implementation, this opens a modal to edit limits
      alert(`Editing ${plan.name} limits is coming in Phase 2.\nCurrent Limits:\nMessages/Day: ${plan.maxMessagesPerDay}\nInstances: ${plan.maxInstances}`);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Subscription Plans</h1>
          <p className="text-zinc-400 text-sm mt-1">Configure global pricing tiers and limits.</p>
        </div>
        <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors">
            Create New Plan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {loading ? (
             <div className="col-span-3 flex justify-center py-12"><ValueWatsLoader size={40} /></div>
         ) : plans.length === 0 ? (
             <div className="col-span-3 text-center py-12 text-zinc-500 bg-white/5 rounded-2xl border border-white/5">No plans found in database. Initial seeding required.</div>
         ) : plans.map(plan => (
             <div key={plan.id} className="bg-white/5 border border-white/5 rounded-2xl overflow-hidden flex flex-col group">
                 <div className="p-6 border-b border-white/5 bg-black/20">
                     <div className="flex justify-between items-start">
                         <h3 className="text-xl font-bold text-white capitalize">{plan.name}</h3>
                         <button onClick={() => handleEdit(plan)} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors">
                             <PencilSquareIcon className="w-4 h-4" />
                         </button>
                     </div>
                     <div className="mt-4 flex items-baseline">
                         <span className="text-3xl font-black text-white">${plan.price}</span>
                         <span className="text-sm text-zinc-500 ml-1">/mo</span>
                     </div>
                 </div>
                 <div className="p-6 flex-1 bg-[#1c1f26]/30">
                     <ul className="space-y-3">
                         <li className="flex justify-between text-sm">
                             <span className="text-zinc-400">Daily Messages</span>
                             <span className="text-white font-bold">{plan.maxMessagesPerDay}</span>
                         </li>
                         <li className="flex justify-between text-sm">
                             <span className="text-zinc-400">Max Contacts</span>
                             <span className="text-white font-bold">{plan.maxContactsPerCampaign}</span>
                         </li>
                         <li className="flex justify-between text-sm">
                             <span className="text-zinc-400">WhatsApp Channels</span>
                             <span className="text-white font-bold">{plan.maxInstances}</span>
                         </li>
                     </ul>
                 </div>
             </div>
         ))}
      </div>
    </div>
  );
}
