import React from 'react';
import { Link } from 'react-router-dom';
import HelpCenterLayout from '../../../components/public/HelpCenterLayout';
import { 
    ChevronRightIcon,
    InformationCircleIcon
} from '@heroicons/react/24/outline';

const channelCollections = [
    {
        id: 'whatsapp',
        name: 'WhatsApp',
        description: 'Connect WhatsApp accounts via QR code for fast two-way messaging.',
        icon: (
            <svg className="w-8 h-8 text-emerald-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .018 5.394 0 12.03c0 2.119.554 4.188 1.607 6.04L0 24l6.117-1.605A11.793 11.793 0 0012.046 24c6.638 0 12.032-5.393 12.035-12.03a11.77 11.77 0 00-3.536-8.508z"/>
            </svg>
        ),
        articleCount: 5,
        link: '/help/channels/whatsapp'
    },
    {
        id: 'messenger',
        name: 'Facebook Messenger',
        description: 'Engage customers on the world\'s largest social platform.',
        icon: (
            <svg className="w-8 h-8 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.654V24l4.088-2.242c1.092.303 2.246.464 3.443.464 6.627 0 12-4.974 12-11.111C24 4.974 18.627 0 12 0zm1.291 14.896l-3.048-3.253-5.941 3.253 6.538-6.945 3.122 3.253 5.856-3.253-6.527 6.945z"/>
            </svg>
        ),
        articleCount: 3,
        link: '/help/channels/messenger'
    },
    {
        id: 'instagram',
        name: 'Instagram',
        description: 'Reply to private messages and build strong brand connections.',
        icon: (
            <svg className="w-8 h-8 text-rose-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.17.054 1.805.249 2.227.412.56.216.96.475 1.382.895.419.42.679.819.895 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.013 3.584-.07 4.85c-.054 1.17-.248 1.805-.413 2.227-.215.56-.475.96-.895 1.382-.42.419-.819.679-1.381.895-.422.164-1.056.36-2.227.413-1.266.057-1.646.07-4.85.07s-3.584-.013-4.85-.07c-1.17-.054-1.805-.248-2.227-.413-.56-.215-.96-.475-1.382-.895-.419-.42-.679-.819-.895-1.381-.164-.422-.36-1.056-.413-2.227-.057-1.266-.07-1.646-.07-4.85s.013-3.584.07-4.85c.054-1.17.249-1.805.412-2.227.216-.56.475-.96.895-1.382.42-.419.819-.679 1.381-.895.422-.164 1.057-.36 2.227-.413 1.266-.057 1.646-.07 4.85-.07zM12 0C8.741 0 8.333.014 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.014 8.333 0 8.741 0 12s.014 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126s1.347 1.077 2.126 1.384c.766.297 1.636.499 2.913.558C8.333 23.986 8.741 24 12 24s3.667-.014 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384s1.077-1.347 1.384-2.126c.297-.766.499-1.636.558-2.913.058-1.28.072-1.687.072-4.947s-.014-3.667-.072-4.947c-.06-1.277-.262-2.148-.558-2.913-.306-.788-.718-1.459-1.384-2.126s-1.347-1.077-2.126-1.384c-.766-.297-1.636-.499-2.913-.558C15.667.014 15.259 0 12 0z"/>
            </svg>
        ),
        articleCount: 3,
        link: '/help/channels/instagram'
    }
];

export default function ChannelsList() {
    return (
        <HelpCenterLayout>
            <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6">
                {/* Breadcrumbs */}
                <nav className="flex items-center gap-2 mb-8 text-sm font-medium">
                    <Link to="/help" className="text-zinc-500 hover:text-white transition-colors">All Collections</Link>
                    <ChevronRightIcon className="w-4 h-4 text-zinc-700" />
                    <span className="text-zinc-300">Messaging Channels</span>
                </nav>

                <div className="mb-12">
                    <h1 className="text-4xl font-black text-white mb-4 tracking-tight">Messaging Channels</h1>
                    <p className="text-lg text-zinc-500 max-w-2xl leading-relaxed">
                        Learn how to connect and configure various messaging platforms to communicate with your customers effectively.
                    </p>
                </div>

                {/* Channels Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {channelCollections.map((channel) => (
                        <Link 
                            key={channel.id}
                            to={channel.link}
                            className="flex flex-col p-8 bg-[#111113] border border-white/5 rounded-3xl hover:bg-white/[0.03] hover:border-white/10 transition-all group"
                        >
                            <div className="flex items-start justify-between mb-6">
                                <div className="p-3 bg-white/5 rounded-2xl border border-white/5 shadow-inner group-hover:scale-110 transition-transform duration-300">
                                    {channel.icon}
                                </div>
                                <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-full border border-white/5">
                                    <InformationCircleIcon className="w-4 h-4 text-zinc-500" />
                                    <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">{channel.articleCount} Articles</span>
                                </div>
                            </div>

                            <h3 className="text-xl font-bold text-white mb-2 leading-tight">{channel.name}</h3>
                            <p className="text-zinc-500 text-[14px] leading-relaxed mb-8 flex-grow">
                                {channel.description}
                            </p>

                            <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                                <span>Go to collection</span>
                                <ChevronRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </HelpCenterLayout>
    );
}
