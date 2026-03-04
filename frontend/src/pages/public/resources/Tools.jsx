import PublicLayout from '../../../components/public/PublicLayout';

export default function Tools() {
    return (
        <PublicLayout>
            <div className="pt-32 pb-24 min-h-screen bg-black text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-4xl font-extrabold mb-4">Free WhatsApp Tools</h1>
                    <p className="text-xl text-zinc-400 mb-16">Utilities to help you grow your audience.</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
                        <a href="#" className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl hover:border-blue-500 transition-colors group block">
                            <div className="bg-blue-500/10 w-12 h-12 rounded-lg flex items-center justify-center mb-6 group-hover:bg-blue-500/20 transition-colors">
                                <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
                            </div>
                            <h3 className="text-xl font-bold mb-3">wa.me Link Generator</h3>
                            <p className="text-zinc-400 mb-4">Create customized WhatsApp "click to chat" links with pre-filled messages instantly.</p>
                            <span className="text-blue-400 font-medium flex items-center">Try it out <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg></span>
                        </a>

                        <a href="#" className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl hover:border-emerald-500 transition-colors group block">
                            <div className="bg-emerald-500/10 w-12 h-12 rounded-lg flex items-center justify-center mb-6 group-hover:bg-emerald-500/20 transition-colors">
                                <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                            </div>
                            <h3 className="text-xl font-bold mb-3">ROI Calculator</h3>
                            <p className="text-zinc-400 mb-4">Calculate how much time and money you can save by automating your conversational sales.</p>
                            <span className="text-emerald-400 font-medium flex items-center">Try it out <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg></span>
                        </a>

                        <a href="#" className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl hover:border-purple-500 transition-colors group block">
                            <div className="bg-purple-500/10 w-12 h-12 rounded-lg flex items-center justify-center mb-6 group-hover:bg-purple-500/20 transition-colors">
                                <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                            </div>
                            <h3 className="text-xl font-bold mb-3">Template Tester</h3>
                            <p className="text-zinc-400 mb-4">Preview how your HSM (Highly Structured Message) templates will look on iOS and Android devices.</p>
                            <span className="text-purple-400 font-medium flex items-center">Try it out <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg></span>
                        </a>
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
}
