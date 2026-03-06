import React from 'react';
import { ShieldExclamationIcon, CurrencyDollarIcon, LockClosedIcon } from '@heroicons/react/24/outline';

export default function AdminLogs() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto h-full flex flex-col">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">System & Webhook Logs</h1>
        <p className="text-zinc-400 text-sm mt-1">Real-time infrastructure payload inspection and errors.</p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center bg-white/5 border border-white/5 rounded-2xl p-12 text-center mt-6">
        <div className="w-16 h-16 rounded-2xl bg-zinc-800/50 flex items-center justify-center mb-6">
            <LockClosedIcon className="w-8 h-8 text-zinc-500" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Logs Locked (Phase 2 Feature)</h2>
        <p className="text-zinc-400 max-w-md mx-auto mb-6 text-sm">
            Webhook logging requires significant processing power and Elasticsearch infrastructure to run in real-time without halting the database. This feature is scheduled for Phase 2 of the Admin Panel expansion.
        </p>

        <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-xl text-xs font-bold uppercase tracking-wider">
           <ShieldExclamationIcon className="w-4 h-4" />
           Use Coolify Terminal in the meantime
        </div>
      </div>
    </div>
  );
}
