import React, { useEffect, useState } from 'react';
import apiClient from '../../api/client';
import ValueWatsLoader from '../../components/ValueWatsLoader';
import { format } from 'date-fns';
import {
  MagnifyingGlassIcon,
  ShieldExclamationIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

export default function AdminTenants() {
  const [tenants, setTenants] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [impersonating, setImpersonating] = useState({});
  const [statusUpdating, setStatusUpdating] = useState({});
  const [planUpdating, setPlanUpdating] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tenantsRes, plansRes] = await Promise.all([
        apiClient.get('/api/admin/tenants'),
        apiClient.get('/api/admin/plans')
      ]);
      setTenants(tenantsRes.data || []);
      setPlans(plansRes.data || []);
    } catch (error) {
      console.error('Failed to load tenants/plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImpersonate = async (tenantId) => {
    try {
      if (!window.confirm('Are you sure you want to impersonate this tenant? You will leave your Super Admin session.')) {
        return;
      }

      setImpersonating((prev) => ({ ...prev, [tenantId]: true }));
      const res = await apiClient.post(`/api/admin/tenants/${tenantId}/impersonate`);

      if (res.data?.token) {
        const impersonatedUser = res.data.user || {};
        const tenant = res.data.tenant || {};

        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify({
          ...impersonatedUser,
          tenantId: impersonatedUser.tenantId || tenant.id,
          subscriptionPlan: tenant.subscriptionPlan,
          onboardingCompleted: tenant.onboardingCompleted,
        }));

        alert('Impersonation successful. Redirecting to Tenant Dashboard.');
        window.location.href = '/dashboard';
      }
    } catch (error) {
      console.error('Impersonation Failed', error);
      alert(error.response?.data?.error || 'Failed to impersonate tenant. No admin found in this workspace.');
    } finally {
      setImpersonating((prev) => ({ ...prev, [tenantId]: false }));
    }
  };

  const handleStatusChange = async (tenantId, newStatus) => {
    try {
      if (!window.confirm(`Are you sure you want to change this tenant's status to ${newStatus}?`)) {
        return;
      }

      setStatusUpdating((prev) => ({ ...prev, [tenantId]: true }));
      await apiClient.patch(`/api/admin/tenants/${tenantId}/status`, { status: newStatus });
      setTenants((prev) => prev.map((tenant) => (
        tenant.id === tenantId ? { ...tenant, status: newStatus } : tenant
      )));
    } catch (err) {
      console.error('Status change failed', err);
      alert(err.response?.data?.error || 'Failed to change status');
    } finally {
      setStatusUpdating((prev) => ({ ...prev, [tenantId]: false }));
    }
  };

  const handlePlanChange = async (tenantId, planId) => {
    try {
      setPlanUpdating((prev) => ({ ...prev, [tenantId]: true }));
      const { data } = await apiClient.patch(`/api/admin/tenants/${tenantId}/plan`, { planId });

      setTenants((prev) => prev.map((tenant) => (
        tenant.id === tenantId
          ? {
              ...tenant,
              plan: data.plan,
              planId: data.planId,
              subscriptionPlan: data.subscriptionPlan
            }
          : tenant
      )));
    } catch (error) {
      console.error('Plan update failed', error);
      alert(error.response?.data?.error || 'Failed to update tenant plan');
    } finally {
      setPlanUpdating((prev) => ({ ...prev, [tenantId]: false }));
    }
  };

  const filteredTenants = tenants.filter((tenant) =>
    tenant.name.toLowerCase().includes(search.toLowerCase()) ||
    tenant.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Workspaces (Tenants)</h1>
          <p className="text-zinc-400 text-sm mt-1">Manage organizations, status, and assigned subscription plans.</p>
        </div>
        <div className="relative w-full md:w-72">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search tenant by name or owner email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#1c1f26] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:ring-1 focus:ring-red-500/50 outline-none"
          />
        </div>
      </div>

      <div className="bg-[#0a0f16] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/5">
                <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Organization</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Plan</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Usage Details</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <ValueWatsLoader size={40} />
                  </td>
                </tr>
              ) : filteredTenants.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-zinc-500 text-sm">
                    No tenants found.
                  </td>
                </tr>
              ) : filteredTenants.map((tenant) => (
                <tr key={tenant.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-white text-xs mr-3">
                        {tenant.name[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">{tenant.name}</div>
                        <div className="text-[11px] text-zinc-500 mt-0.5">{tenant.email}</div>
                        <div className="text-[10px] text-zinc-600">Created: {format(new Date(tenant.createdAt), 'MMM d, yyyy')}</div>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <select
                        value={tenant.planId || ''}
                        disabled={planUpdating[tenant.id]}
                        onChange={(e) => handlePlanChange(tenant.id, e.target.value)}
                        className="bg-[#1c1f26] border border-white/10 text-white text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                      >
                        <option value="">Unassigned</option>
                        {plans.map((plan) => (
                          <option key={plan.id} value={plan.id}>
                            {plan.name} ({plan.unlimitedUsers && Number(plan.price) === 0 ? 'Custom' : `$${plan.price}`})
                          </option>
                        ))}
                      </select>
                      {planUpdating[tenant.id] && (
                        <div className="text-[10px] text-zinc-500">Updating plan...</div>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-zinc-400">
                        Paid Seats:{' '}
                        <span className="text-white font-bold">
                          {tenant.usage?.paidUsers ?? 0}
                          {tenant.usage?.unlimitedUsers ? ' / Unlimited' : ` / ${tenant.usage?.seatLimit ?? 0}`}
                        </span>
                      </span>
                      <span className="text-xs text-zinc-400">
                        Viewers: <span className="text-white font-bold">{tenant.usage?.viewerUsers ?? 0}</span>
                      </span>
                      <span className="text-xs text-zinc-400">
                        Channels:{' '}
                        <span className="text-white font-bold">
                          {tenant.usage?.channelsUsed ?? 0}
                          {tenant.usage?.channelsLimit ? ` / ${tenant.usage.channelsLimit}` : ''}
                        </span>
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <select
                        value={tenant.status}
                        disabled={statusUpdating[tenant.id]}
                        onChange={(e) => handleStatusChange(tenant.id, e.target.value)}
                        className={`text-xs font-bold px-2 py-1 rounded border outline-none cursor-pointer ${
                          tenant.status === 'active' ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20' :
                          tenant.status === 'trial' ? 'bg-blue-400/10 text-blue-400 border-blue-400/20' :
                          'bg-rose-400/10 text-rose-400 border-rose-400/20'
                        }`}
                      >
                        <option value="active">Active</option>
                        <option value="trial">Trial</option>
                        <option value="suspended">Suspended</option>
                      </select>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-right space-x-3">
                    <button
                      onClick={() => handleImpersonate(tenant.id)}
                      disabled={impersonating[tenant.id]}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-bold rounded-lg transition-colors border border-red-500/20"
                    >
                      <ShieldExclamationIcon className="w-3.5 h-3.5" />
                      {impersonating[tenant.id] ? 'Loading...' : 'Impersonate'}
                    </button>
                    <button className="text-zinc-500 hover:text-white transition-colors" title="View Details">
                      <ChevronRightIcon className="w-5 h-5 inline" />
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
