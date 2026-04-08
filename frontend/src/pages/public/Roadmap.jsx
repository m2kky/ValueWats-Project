import PublicLayout from '../../components/public/PublicLayout';

const roadmapColumns = [
  {
    status: 'Now Live',
    accent: 'bg-emerald-500',
    border: 'border-emerald-500/25',
    label: 'text-emerald-300',
    items: [
      {
        title: 'wa.me Link Generator',
        desc: 'Generate clean click-to-chat links with prefilled text for paid ads, landing pages, and social bios.',
      },
      {
        title: 'ROI Calculator',
        desc: 'Model projected revenue lift and support-cost savings to justify automation investments with clear numbers.',
      },
      {
        title: 'Template Tester',
        desc: 'Validate placeholders, test sample variables, and preview final message output before launch.',
      },
      {
        title: 'Omnichannel Inbox',
        desc: 'One workspace for WhatsApp, Messenger, and Instagram conversations with assignment and lifecycle controls.',
      },
      {
        title: 'AI Agent Action Center',
        desc: 'Production-ready agent actions for assignment, lifecycle updates, comments, tags, and external HTTP calls.',
      },
    ],
  },
  {
    status: 'In Active Build',
    accent: 'bg-[#e2f300]',
    border: 'border-[#e2f300]/30',
    label: 'text-[#e2f300]',
    items: [
      {
        title: 'Super Admin Console Completion',
        desc: 'Finalize global plans, tenant controls, usage visibility, and notification operations from one panel.',
      },
      {
        title: 'Subscription & Plan Enforcement',
        desc: 'Unified limits across channels, campaigns, and team operations with cleaner upgrade prompts.',
      },
      {
        title: 'Real-time Inbox Performance',
        desc: 'Hardening websocket reliability and auto-refresh behavior for low-latency message rendering.',
      },
      {
        title: 'Guided Channel Tutorials',
        desc: 'Official-step docs and improved onboarding guidance for WhatsApp, Messenger, and Instagram setup.',
      },
    ],
  },
  {
    status: 'Next Releases',
    accent: 'bg-[#7a7839]',
    border: 'border-[#7a7839]/30',
    label: 'text-[#fffed9]',
    items: [
      {
        title: 'Campaign Experimentation',
        desc: 'A/B test message variants, audience splits, and send windows with confidence scoring.',
      },
      {
        title: 'Advanced Revenue Attribution',
        desc: 'Track funnel stages from first message to closed sale with campaign-level contribution reporting.',
      },
      {
        title: 'Deeper CRM Connectivity',
        desc: 'Expand native integrations for enterprise CRMs and internal systems through secure connector actions.',
      },
      {
        title: 'Operational Governance',
        desc: 'More granular role permissions, audit coverage, and compliance controls for larger teams.',
      },
    ],
  },
];

export default function Roadmap() {
  return (
    <PublicLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight mb-6">
            Product <span className="text-[#e2f300]">Roadmap</span>
          </h1>
          <p className="text-xl text-zinc-400 max-w-3xl mx-auto">
            A transparent view of what is live, what is currently under construction, and what is planned for upcoming releases.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {roadmapColumns.map((column) => (
            <div key={column.status} className={`bg-[#111113] border ${column.border} rounded-3xl p-6`}>
              <div className="flex items-center gap-3 mb-8">
                <div className={`w-3 h-3 rounded-full ${column.accent}`}></div>
                <h2 className={`text-lg font-bold uppercase tracking-wider ${column.label}`}>{column.status}</h2>
              </div>

              <div className="space-y-4">
                {column.items.map((item) => (
                  <div key={item.title} className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-colors">
                    <h3 className="font-bold text-white mb-2">{item.title}</h3>
                    <p className="text-sm text-zinc-400 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </PublicLayout>
  );
}

