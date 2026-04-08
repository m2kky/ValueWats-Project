import { Link } from 'react-router-dom';
import PublicLayout from '../../../components/public/PublicLayout';

const tools = [
  {
    title: 'wa.me Link Generator',
    description:
      'Create clickable WhatsApp links with prefilled text in seconds. Perfect for ads, landing pages, and social bios.',
    to: '/resources/tools/wa-me-link-generator',
    hoverBorder: 'hover:border-blue-500',
    iconWrap: 'bg-blue-500/10 group-hover:bg-blue-500/20',
    iconColor: 'text-blue-500',
    textAccent: 'text-blue-400',
  },
  {
    title: 'ROI Calculator',
    description:
      'Estimate monthly revenue lift, support savings, and overall ROI when moving to automated conversational flows.',
    to: '/resources/tools/roi-calculator',
    hoverBorder: 'hover:border-emerald-500',
    iconWrap: 'bg-emerald-500/10 group-hover:bg-emerald-500/20',
    iconColor: 'text-emerald-500',
    textAccent: 'text-emerald-400',
  },
  {
    title: 'Template Tester',
    description:
      'Validate placeholders, inject sample data, and preview final template output before publishing campaigns.',
    to: '/resources/tools/template-tester',
    hoverBorder: 'hover:border-amber-500',
    iconWrap: 'bg-amber-500/10 group-hover:bg-amber-500/20',
    iconColor: 'text-amber-500',
    textAccent: 'text-amber-400',
  },
];

export default function Tools() {
  return (
    <PublicLayout>
      <div className="pt-32 pb-24 min-h-screen bg-black text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-extrabold mb-4">Free WhatsApp Tools</h1>
          <p className="text-xl text-zinc-400 mb-16">Practical calculators and validators for faster execution.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
            {tools.map((tool) => (
              <Link
                key={tool.title}
                to={tool.to}
                className={`bg-zinc-900 border border-zinc-800 p-8 rounded-2xl transition-colors group block ${tool.hoverBorder}`}
              >
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-6 transition-colors ${tool.iconWrap}`}>
                  <svg className={`w-6 h-6 ${tool.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3">{tool.title}</h3>
                <p className="text-zinc-400 mb-4">{tool.description}</p>
                <span className={`font-medium flex items-center ${tool.textAccent}`}>
                  Open tool
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                  </svg>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
