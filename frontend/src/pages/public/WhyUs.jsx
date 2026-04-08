import PublicLayout from '../../components/public/PublicLayout';

const pillars = [
  {
    title: 'Built for Revenue, Not Just Replies',
    points: [
      'Convert inbound conversations into qualified opportunities using lifecycle rules and ownership flows.',
      'Track movement from first message to closed deal with context-rich customer timelines.',
      'Deploy campaigns, AI responses, and human handoff policies under one strategy.',
    ],
  },
  {
    title: 'One Operating Surface for the Team',
    points: [
      'Unify channels, assignments, templates, and notes in a single workspace to reduce missed handoffs.',
      'Support sales and support use cases without forcing teams to split across multiple tools.',
      'Standardize operations with shared snippets, reusable workflows, and action governance.',
    ],
  },
  {
    title: 'AI that Executes Real Work',
    points: [
      'Use action-driven AI agents that can update contacts, trigger workflows, and route ownership.',
      'Control agent behavior with explicit instruction patterns and measurable boundaries.',
      'Blend automation with escalation rules so quality remains high at scale.',
    ],
  },
  {
    title: 'Enterprise-Ready Foundation',
    points: [
      'Role-aware admin controls, audit visibility, and tenant-level oversight for growing organizations.',
      'Documented channel setup with official references to reduce integration risk.',
      'Reliable infrastructure pattern for high-volume messaging operations.',
    ],
  },
];

const comparisonRows = [
  { feature: 'Unified Multi-Channel Inbox', valuechat: 'Native', alternatives: 'Multiple tools / connectors' },
  { feature: 'AI Actions (not only suggestions)', valuechat: 'Built-in execution', alternatives: 'Manual glue or external bots' },
  { feature: 'Lifecycle + Contact Updates from Chat', valuechat: 'Real-time in flow', alternatives: 'Usually manual sync' },
  { feature: 'Campaign + Inbox + Automation in one stack', valuechat: 'Single workspace', alternatives: 'Fragmented stack' },
  { feature: 'Plan and Tenant Governance', valuechat: 'Super admin controls', alternatives: 'Limited or unavailable' },
  { feature: 'Operational Onboarding Docs', valuechat: 'Integrated', alternatives: 'External scattered docs' },
];

const outcomes = [
  {
    title: 'Faster Response Cycles',
    description: 'Reduce waiting time by routing new conversations instantly to the right owner or AI policy.',
  },
  {
    title: 'Higher Conversion Efficiency',
    description: 'Move opportunities forward with consistent template quality, contextual follow-ups, and lifecycle discipline.',
  },
  {
    title: 'Lower Operational Overhead',
    description: 'Cut duplicate tooling costs and handoff friction by centralizing workflows and communications.',
  },
  {
    title: 'Better Leadership Visibility',
    description: 'Give managers a clearer view of tenant health, plan usage, and campaign execution quality.',
  },
];

export default function WhyUs() {
  return (
    <PublicLayout>
      <div className="pt-32 pb-24 min-h-screen bg-black text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <section className="text-center max-w-4xl mx-auto mb-20">
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6">
              Why Choose Value chat?
            </h1>
            <p className="text-xl text-zinc-400 leading-relaxed">
              Value chat is designed as an operational system for growth teams. It combines conversation channels, AI execution, campaign tooling, and governance controls so teams can scale without losing quality.
            </p>
          </section>

          <section className="grid md:grid-cols-2 gap-6 mb-20">
            {pillars.map((pillar) => (
              <article key={pillar.title} className="bg-[#111113] border border-white/10 rounded-3xl p-7">
                <h2 className="text-2xl font-bold mb-4 text-[#e2f300]">{pillar.title}</h2>
                <ul className="space-y-3 text-zinc-300">
                  {pillar.points.map((point) => (
                    <li key={point} className="flex items-start gap-3">
                      <span className="mt-1 w-2 h-2 rounded-full bg-[#e2f300]"></span>
                      <span className="leading-relaxed">{point}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </section>

          <section className="bg-[#111113] border border-white/10 rounded-3xl p-7 md:p-9 mb-20">
            <h2 className="text-3xl font-bold mb-8">Detailed Comparison</h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-left">
                    <th className="py-3 px-3 text-zinc-400 font-semibold">Capability</th>
                    <th className="py-3 px-3 text-[#e2f300] font-semibold">Value chat</th>
                    <th className="py-3 px-3 text-zinc-400 font-semibold">Typical Alternatives</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row) => (
                    <tr key={row.feature} className="border-b border-white/5">
                      <td className="py-3 px-3 text-zinc-200">{row.feature}</td>
                      <td className="py-3 px-3 text-emerald-300">{row.valuechat}</td>
                      <td className="py-3 px-3 text-zinc-400">{row.alternatives}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="mb-20">
            <h2 className="text-3xl font-bold mb-8">Operational Outcomes You Can Expect</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {outcomes.map((item) => (
                <div key={item.title} className="bg-[#111113] border border-white/10 rounded-2xl p-5">
                  <h3 className="font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-gradient-to-r from-[#232318] to-[#111113] border border-white/10 rounded-3xl p-7 md:p-10">
            <h2 className="text-3xl font-bold mb-4">Built for Teams that Need Control and Speed</h2>
            <p className="text-zinc-300 text-lg leading-relaxed max-w-4xl mb-6">
              If your growth depends on conversation quality, clear ownership, and repeatable processes, Value chat gives your team the structure to execute faster while keeping experience standards high.
            </p>
            <div className="flex flex-wrap gap-3 text-sm">
              <span className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-zinc-300">Sales Teams</span>
              <span className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-zinc-300">Support Teams</span>
              <span className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-zinc-300">Agencies</span>
              <span className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-zinc-300">Multi-Tenant Operations</span>
              <span className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-zinc-300">High-Volume Campaigns</span>
            </div>
          </section>
        </div>
      </div>
    </PublicLayout>
  );
}

