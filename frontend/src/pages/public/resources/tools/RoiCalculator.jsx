import { useMemo, useState } from 'react';
import PublicLayout from '../../../../components/public/PublicLayout';

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);

export default function RoiCalculator() {
  const [monthlyConversations, setMonthlyConversations] = useState(8000);
  const [avgOrderValue, setAvgOrderValue] = useState(32);
  const [currentConversionRate, setCurrentConversionRate] = useState(2.4);
  const [expectedLift, setExpectedLift] = useState(1.2);
  const [agentCount, setAgentCount] = useState(4);
  const [costPerAgent, setCostPerAgent] = useState(650);
  const [automationDeflection, setAutomationDeflection] = useState(28);
  const [platformCost, setPlatformCost] = useState(249);

  const metrics = useMemo(() => {
    const conv = toNumber(monthlyConversations);
    const order = toNumber(avgOrderValue);
    const baseRate = toNumber(currentConversionRate) / 100;
    const liftRate = toNumber(expectedLift) / 100;
    const teamSize = toNumber(agentCount);
    const agentCost = toNumber(costPerAgent);
    const deflection = toNumber(automationDeflection) / 100;
    const software = toNumber(platformCost);

    const baseRevenue = conv * baseRate * order;
    const projectedRevenue = conv * (baseRate + liftRate) * order;
    const revenueLift = Math.max(0, projectedRevenue - baseRevenue);

    const supportPayroll = teamSize * agentCost;
    const supportSavings = supportPayroll * deflection;

    const monthlyGain = revenueLift + supportSavings;
    const netGain = monthlyGain - software;
    const roiPercent = software > 0 ? (netGain / software) * 100 : 0;
    const paybackDays = monthlyGain > 0 ? Math.max(1, Math.round((software / monthlyGain) * 30)) : 0;

    return {
      baseRevenue,
      projectedRevenue,
      revenueLift,
      supportSavings,
      monthlyGain,
      netGain,
      roiPercent,
      paybackDays,
    };
  }, [
    monthlyConversations,
    avgOrderValue,
    currentConversionRate,
    expectedLift,
    agentCount,
    costPerAgent,
    automationDeflection,
    platformCost,
  ]);

  return (
    <PublicLayout>
      <div className="pt-32 pb-24 min-h-screen bg-black text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <p className="text-xs uppercase tracking-[0.2em] text-[#e2f300] font-bold mb-3">Free Tool</p>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">ROI Calculator</h1>
            <p className="text-zinc-400 text-lg max-w-3xl">
              Estimate how much additional revenue and support savings you can unlock by running your conversations through Value Chat automation.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3 bg-[#111113] border border-white/10 rounded-3xl p-6 md:p-8">
              <h2 className="text-xl font-bold mb-6">Business Inputs</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <Input label="Monthly Conversations" value={monthlyConversations} setValue={setMonthlyConversations} />
                <Input label="Average Order Value ($)" value={avgOrderValue} setValue={setAvgOrderValue} />
                <Input label="Current Conversion Rate (%)" value={currentConversionRate} setValue={setCurrentConversionRate} />
                <Input label="Expected Conversion Lift (%)" value={expectedLift} setValue={setExpectedLift} />
                <Input label="Support Agents" value={agentCount} setValue={setAgentCount} />
                <Input label="Cost per Agent / Month ($)" value={costPerAgent} setValue={setCostPerAgent} />
                <Input label="Automation Deflection (%)" value={automationDeflection} setValue={setAutomationDeflection} />
                <Input label="Platform Cost / Month ($)" value={platformCost} setValue={setPlatformCost} />
              </div>
            </div>

            <div className="lg:col-span-2 bg-[#111113] border border-white/10 rounded-3xl p-6 md:p-8">
              <h2 className="text-xl font-bold mb-6">Projected Outcome</h2>
              <div className="space-y-3">
                <Metric label="Current Monthly Revenue" value={formatCurrency(metrics.baseRevenue)} />
                <Metric label="Projected Monthly Revenue" value={formatCurrency(metrics.projectedRevenue)} />
                <Metric label="Revenue Lift" value={formatCurrency(metrics.revenueLift)} accent />
                <Metric label="Support Cost Savings" value={formatCurrency(metrics.supportSavings)} accent />
                <Metric label="Total Monthly Gain" value={formatCurrency(metrics.monthlyGain)} accent />
                <Metric
                  label="Net Gain After Platform Cost"
                  value={formatCurrency(metrics.netGain)}
                  accent={metrics.netGain >= 0}
                  muted={metrics.netGain < 0}
                />
                <Metric label="Estimated ROI" value={`${metrics.roiPercent.toFixed(0)}%`} accent />
                <Metric label="Estimated Payback Period" value={metrics.paybackDays ? `${metrics.paybackDays} days` : 'N/A'} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}

function Input({ label, value, setValue }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-widest text-zinc-500 font-bold">{label}</span>
      <input
        type="number"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="mt-2 w-full rounded-xl bg-black/60 border border-white/10 px-4 py-3 text-white outline-none focus:border-[#e2f300]/50"
      />
    </label>
  );
}

function Metric({ label, value, accent = false, muted = false }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-black/40 px-4 py-3">
      <span className="text-sm text-zinc-400">{label}</span>
      <span
        className={`font-bold ${
          muted ? 'text-red-300' : accent ? 'text-[#e2f300]' : 'text-white'
        }`}
      >
        {value}
      </span>
    </div>
  );
}
