import { useState, useEffect } from 'react';
import api from '../api/client';
import {
  UserGroupIcon,
  TrashIcon,
  EnvelopeIcon,
  ShieldCheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

export default function Team() {
  const [users, setUsers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Invite form
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('agent');
  const [sendingInvite, setSendingInvite] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = currentUser.role === 'admin';

  useEffect(() => {
    fetchTeam();
  }, []);

  const fetchTeam = async () => {
    try {
      const res = await api.get('/team');
      setUsers(res.data.users);
      setInvitations(res.data.invitations || []);
    } catch (error) {
      console.error('Failed to fetch team:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setSendingInvite(true);
    try {
      await api.post('/team/invite', { email: inviteEmail, role: inviteRole });
      setShowInviteModal(false);
      setInviteEmail('');
      setInviteRole('agent');
      fetchTeam();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to send invitation');
    } finally {
      setSendingInvite(false);
    }
  };

  const handleRemoveUser = async (userId) => {
    if (!window.confirm('Are you sure you want to remove this user?')) return;
    try {
      await api.delete(`/team/${userId}`);
      fetchTeam();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to remove user');
    }
  };

  const handleCancelInvite = async (inviteId) => {
    if (!window.confirm('Cancel this invitation?')) return;
    try {
      await api.delete(`/team/invitation/${inviteId}`);
      fetchTeam();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to cancel invitation');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]"></div>
      </div>
    );
  }

  return (
    <div className="font-sans space-y-8">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-black text-white sm:text-3xl sm:truncate tracking-tight uppercase italic">
            Team Management
          </h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-zinc-400 font-medium tracking-wide">
            Manage your team members and roles
          </p>
        </div>
        {isAdmin && (
          <div className="mt-4 flex md:mt-0 md:ml-4 gap-3">
            <button
              onClick={() => setShowInviteModal(true)}
              className="btn-premium flex items-center"
            >
              <UserGroupIcon className="-ml-1 mr-2 h-5 w-5 border-2 border-white/20 rounded-full p-0.5" />
              Invite Member
            </button>
          </div>
        )}
      </div>

      <div className="grid gap-8">
        {/* Team Members List */}
        <div className="glass-card overflow-hidden">
          <div className="px-6 py-5 border-b border-white/5 bg-white/[0.02]">
            <h3 className="text-sm font-black text-white uppercase tracking-widest italic flex items-center">
              <UserGroupIcon className="h-5 w-5 mr-3 text-indigo-400" />
              Active Members ({users.length})
            </h3>
          </div>
          <ul className="divide-y divide-white/5">
            {users.map((user) => (
              <li key={user.id} className="px-6 py-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors group">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-12 w-12 rounded-2xl bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 border border-indigo-500/20 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.1)]">
                    <span className="text-xl font-black text-indigo-400">
                      {user.email?.[0]?.toUpperCase()}
                    </span>
                  </div>
                  <div className="ml-4">
                    <div className="text-base font-bold text-white tracking-tight">{user.email}</div>
                    <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest mt-1 flex items-center">
                      <ShieldCheckIcon className="h-4 w-4 mr-1.5 text-zinc-400" />
                      Role: <span className="text-zinc-300 ml-1">{user.role}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center">
                  {user.id === currentUser.id ? (
                    <span className="text-[10px] font-black uppercase tracking-widest bg-white/10 text-white px-3 py-1 rounded-full border border-white/10">You</span>
                  ) : isAdmin ? (
                    <button
                      onClick={() => handleRemoveUser(user.id)}
                      className="p-2.5 bg-white/5 border border-white/5 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/20 rounded-xl transition-all"
                      title="Remove user"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Pending Invitations */}
        {invitations.length > 0 && (
          <div className="glass-card overflow-hidden">
            <div className="px-6 py-5 border-b border-white/5 bg-amber-500/5">
              <h3 className="text-sm font-black text-amber-400 uppercase tracking-widest italic flex items-center">
                <EnvelopeIcon className="h-5 w-5 mr-3" />
                Pending Invitations ({invitations.length})
              </h3>
            </div>
            <ul className="divide-y divide-white/5">
              {invitations.map((invite) => (
                <li key={invite.id} className="px-6 py-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors group">
                  <div className="flex items-center">
                    <div className="ml-2">
                      <div className="text-base font-bold text-white tracking-tight">{invite.email}</div>
                      <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">
                        Role: <span className="text-zinc-300">{invite.role}</span> <span className="mx-2">•</span> Expires: {new Date(invite.expiresAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => handleCancelInvite(invite.id)}
                      className="px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                    >
                      Cancel
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowInviteModal(false)}></div>
          <div className="bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-md relative isolate overflow-hidden transform transition-all">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-zinc-900/50 backdrop-blur-md">
              <h2 className="text-xl font-black text-white italic tracking-tight uppercase">Invite Team Member</h2>
              <button onClick={() => setShowInviteModal(false)} className="text-zinc-500 hover:text-white transition-colors bg-white/5 p-2 rounded-xl border border-white/5 hover:bg-white/10">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleInvite} className="p-6 space-y-5">
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 mb-2 uppercase tracking-widest">Email Address</label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="glass-input"
                  placeholder="colleague@company.com"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-500 mb-2 uppercase tracking-widest">Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="glass-input appearance-none bg-zinc-900 cursor-pointer"
                >
                  <option value="agent" className="text-white bg-zinc-800">Agent (Can manage campaigns)</option>
                  <option value="admin" className="text-white bg-zinc-800">Admin (Full access)</option>
                  <option value="viewer" className="text-white bg-zinc-800">Viewer (Read only)</option>
                </select>
              </div>

              <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="btn-glass"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingInvite}
                  className="btn-premium"
                >
                  {sendingInvite ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                      <span>Sending...</span>
                    </div>
                  ) : (
                    'Send Invitation'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
