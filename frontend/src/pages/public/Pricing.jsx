import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../api/client';

export default function Pricing() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get('/plans');
        setPlans(res.data || []);
      } catch (error) {
        console.error('Failed to fetch plans', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  const sortedPlans = useMemo(
    () => [...plans].sort((a, b) => Number(a.price) - Number(b.price)),
    [plans]
  );

  const featuredIndex = sortedPlans.length > 1 ? 1 : 0;

  return (
    <div className="pt-32 pb-24 border-b border-[#7a7839]/40 bg-[#232318] min-h-screen text-[#fffed9]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-5xl font-extrabold tracking-tight mb-6">Simple, transparent pricing</h1>
        <p className="text-xl text-[#fffed9]/70 mb-12 max-w-2xl mx-auto">
          Choose the package that fits your business now, then scale up when your volume grows.
        </p>

        {loading ? (
          <div className="py-20 text-[#fffed9]/70">Loading plans...</div>
        ) : sortedPlans.length === 0 ? (
          <div className="py-20 bg-[#1d1d14] border border-[#7a7839]/40 rounded-2xl text-[#fffed9]/70">
            Pricing plans are not configured yet. Check back soon.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            {sortedPlans.map((plan, idx) => {
              const isFeatured = idx === featuredIndex;
              return (
                <div
                  key={plan.id}
                  className={`rounded-2xl p-8 flex flex-col border transition-all ${
                    isFeatured
                      ? 'bg-[#e2f300] text-[#232318] border-[#e2f300] shadow-[0_20px_40px_rgba(226,243,0,0.16)] md:-translate-y-3'
                      : 'bg-[#1d1d14] border-[#7a7839]/40 text-[#fffed9]'
                  }`}
                >
                  {isFeatured && (
                    <div className="mb-4 inline-flex w-fit text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-[#232318] text-[#e2f300]">
                      Most Popular
                    </div>
                  )}

                  <h3 className="text-2xl font-semibold mb-2 capitalize">{plan.name}</h3>
                  <div className="flex items-baseline mb-4">
                    <span className="text-4xl font-extrabold">${plan.price}</span>
                    <span className={`ml-2 ${isFeatured ? 'text-[#232318]/70' : 'text-[#fffed9]/60'}`}>/month</span>
                  </div>

                  <p className={`mb-6 text-sm ${isFeatured ? 'text-[#232318]/80' : 'text-[#fffed9]/70'}`}>
                    Message limits and campaign controls for your team size.
                  </p>

                  <ul className="space-y-3 mb-8 flex-1 text-sm">
                    <li>• Daily messages: <strong>{plan.maxMessagesPerDay}</strong></li>
                    <li>• Max contacts/campaign: <strong>{plan.maxContactsPerCampaign}</strong></li>
                    <li>• Max channels: <strong>{plan.maxInstances}</strong></li>
                    <li>
                      • Working hours: <strong>{plan.workingHoursEnabled ? `${plan.workingHoursStart} - ${plan.workingHoursEnd}` : 'Disabled'}</strong>
                    </li>
                  </ul>

                  <Link
                    to="/register"
                    className={`w-full text-center py-3 px-4 rounded-lg font-medium transition-colors ${
                      isFeatured
                        ? 'bg-[#232318] text-[#e2f300] hover:bg-[#11110d]'
                        : 'bg-[#fffed9]/10 hover:bg-[#fffed9]/15 text-[#fffed9]'
                    }`}
                  >
                    Start now
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
