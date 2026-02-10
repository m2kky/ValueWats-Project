import { useState, useEffect } from 'react';
import api from '../api/client';
import { 
  UserGroupIcon, 
  TrashIcon, 
  EnvelopeIcon,
  ShieldCheckIcon 
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
      alert('Invitation sent successfully');
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

  if (loading) return <div className="p-8 text-center text-gray-500">Loading team...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your team members and roles
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <UserGroupIcon className="h-5 w-5 mr-2" />
            Invite Member
          </button>
        )}
      </div>

      {/* Team Members List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
            <UserGroupIcon className="h-5 w-5 mr-2 text-gray-400" />
            Active Members ({users.length})
          </h3>
        </div>
        <ul className="divide-y divide-gray-200">
          {users.map((user) => (
            <li key={user.id} className="px-4 py-4 flex items-center justify-between hover:bg-gray-50">
              <div className="flex items-center">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-xl font-medium text-gray-500">
                    {user.email?.[0]?.toUpperCase()}
                  </span>
                </div>
                <div className="ml-4">
                  <div className="text-sm font-medium text-gray-900">{user.email}</div>
                  <div className="text-sm text-gray-500 flex items-center">
                    <ShieldCheckIcon className="h-3 w-3 mr-1" />
                    {user.role}
                  </div>
                </div>
              </div>
              <div className="flex items-center">
                {user.id === currentUser.id ? (
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">You</span>
                ) : isAdmin ? (
                  <button
                    onClick={() => handleRemoveUser(user.id)}
                    className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-full"
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
        <div className="bg-white shadow overflow-hidden sm:rounded-lg mt-6">
           <div className="px-4 py-5 sm:px-6 border-b border-gray-200 bg-yellow-50">
            <h3 className="text-lg leading-6 font-medium text-yellow-800 flex items-center">
              <EnvelopeIcon className="h-5 w-5 mr-2" />
              Pending Invitations ({invitations.length})
            </h3>
          </div>
          <ul className="divide-y divide-gray-200">
            {invitations.map((invite) => (
              <li key={invite.id} className="px-4 py-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center">
                   <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">{invite.email}</div>
                    <div className="text-sm text-gray-500">
                      Role: {invite.role} • Expires: {new Date(invite.expiresAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                {isAdmin && (
                  <button
                    onClick={() => handleCancelInvite(invite.id)}
                    className="text-gray-400 hover:text-red-600 text-sm"
                  >
                    Cancel
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
           <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
             <div className="flex justify-between items-center mb-4">
               <h2 className="text-lg font-medium text-gray-900">Invite Team Member</h2>
               <button onClick={() => setShowInviteModal(false)} className="text-gray-400 hover:text-gray-500">
                 <span className="sr-only">Close</span>
                 <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                 </svg>
               </button>
             </div>
            
            <form onSubmit={handleInvite}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                    placeholder="colleague@company.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                  >
                     <option value="agent">Agent (Can manage campaigns)</option>
                     <option value="admin">Admin (Full access)</option>
                     <option value="viewer">Viewer (Read only)</option>
                   </select>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingInvite}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50 transition-colors shadow-sm"
                >
                  {sendingInvite ? 'Sending...' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
