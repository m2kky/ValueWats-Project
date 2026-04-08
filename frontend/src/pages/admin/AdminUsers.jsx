import React, { useEffect, useState } from 'react';
import apiClient from '../../api/client';
import ValueWatsLoader from '../../components/ValueWatsLoader';
import { format } from 'date-fns';
import { KeyIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/api/admin/users');
      setUsers(res.data);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (userId, email) => {
    if (!window.confirm(`Are you sure you want to trigger a password reset for ${email}?`)) {
        return;
    }
    try {
      await apiClient.post(`/api/admin/users/${userId}/reset-password`);
      alert(`Password reset process initiated for ${email}`);
    } catch (err) {
      alert('Failed to reset password');
    }
  };

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(search.toLowerCase()) || 
    (u.name && u.name.toLowerCase().includes(search.toLowerCase())) ||
    (u.tenant?.name && u.tenant.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">System Users</h1>
          <p className="text-zinc-400 text-sm mt-1">Directory of all users across all tenants.</p>
        </div>
        <div className="relative w-full md:w-72">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input 
                type="text" 
                placeholder="Search by email, name or tenant..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-[#1c1f26] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:ring-1 focus:ring-red-500/50 outline-none"
            />
        </div>
      </div>

      <div className="bg-[#0a0f16] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/5">
                <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Workspace (Tenant)</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center">
                    <ValueWatsLoader size={40} />
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                 <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-zinc-500 text-sm">
                    No users found.
                  </td>
                </tr>
              ) : filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-zinc-400 text-xs mr-3">
                         {(user.name?.[0] || user.email[0]).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white flex items-center gap-2">
                            {user.name || 'No Name'}
                            {user.isSuperAdmin && (
                                <span className="text-[9px] uppercase tracking-widest text-red-500 border border-red-500/30 px-1.5 py-0.5 rounded bg-red-500/10">Super</span>
                            )}
                        </div>
                        <div className="text-[11px] text-zinc-500 mt-0.5">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-xs text-zinc-300 capitalize">{user.role}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                        <span className="text-sm text-indigo-400 font-medium">{user.tenant?.name || 'Unknown'}</span>
                        <span className="text-[10px] text-zinc-600 mt-0.5">ID: {user.tenantId ? `${user.tenantId.substring(0, 8)}...` : 'N/A'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button 
                       onClick={() => handlePasswordReset(user.id, user.email)}
                       className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white text-xs font-medium rounded-lg transition-colors border border-white/5"
                    >
                      <KeyIcon className="w-3.5 h-3.5" />
                      Reset Pass
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
