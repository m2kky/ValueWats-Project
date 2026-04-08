import { useMemo, useState } from 'react';
import PublicLayout from '../../../../components/public/PublicLayout';

export default function WaMeLinkGenerator() {
  const [countryCode, setCountryCode] = useState('20');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [prefilledMessage, setPrefilledMessage] = useState('Hello! I want to know more about your offer.');
  const [copied, setCopied] = useState(false);

  const sanitizedPhone = useMemo(() => {
    return `${countryCode}${phoneNumber}`.replace(/\D/g, '');
  }, [countryCode, phoneNumber]);

  const generatedLink = useMemo(() => {
    if (!sanitizedPhone) return '';
    const base = `https://wa.me/${sanitizedPhone}`;
    if (!prefilledMessage.trim()) return base;
    return `${base}?text=${encodeURIComponent(prefilledMessage.trim())}`;
  }, [sanitizedPhone, prefilledMessage]);

  const canGenerate = sanitizedPhone.length >= 8;

  const copyLink = async () => {
    if (!generatedLink) return;
    try {
      await navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (error) {
      setCopied(false);
    }
  };

  return (
    <PublicLayout>
      <div className="pt-32 pb-24 min-h-screen bg-black text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <p className="text-xs uppercase tracking-[0.2em] text-[#e2f300] font-bold mb-3">Free Tool</p>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">wa.me Link Generator</h1>
            <p className="text-zinc-400 text-lg max-w-2xl">
              Build clean WhatsApp click-to-chat links with an optional prefilled message, then copy and use them in ads, bios, and landing pages.
            </p>
          </div>

          <div className="bg-[#111113] border border-white/10 rounded-3xl p-6 md:p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className="block">
                <span className="text-xs uppercase tracking-widest text-zinc-500 font-bold">Country Code</span>
                <input
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  placeholder="20"
                  className="mt-2 w-full rounded-xl bg-black/60 border border-white/10 px-4 py-3 text-white outline-none focus:border-[#e2f300]/50"
                />
              </label>

              <label className="block md:col-span-2">
                <span className="text-xs uppercase tracking-widest text-zinc-500 font-bold">Phone Number</span>
                <input
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="1012345678"
                  className="mt-2 w-full rounded-xl bg-black/60 border border-white/10 px-4 py-3 text-white outline-none focus:border-[#e2f300]/50"
                />
              </label>
            </div>

            <label className="block">
              <span className="text-xs uppercase tracking-widest text-zinc-500 font-bold">Prefilled Message (Optional)</span>
              <textarea
                rows={4}
                value={prefilledMessage}
                onChange={(e) => setPrefilledMessage(e.target.value)}
                placeholder="Type the message users should send by default..."
                className="mt-2 w-full rounded-xl bg-black/60 border border-white/10 px-4 py-3 text-white outline-none focus:border-[#e2f300]/50 resize-y"
              />
            </label>

            <div className="rounded-2xl border border-white/10 bg-black/50 p-4">
              <p className="text-xs uppercase tracking-widest text-zinc-500 font-bold mb-2">Generated Link</p>
              {canGenerate ? (
                <code className="text-sm text-[#e2f300] break-all">{generatedLink}</code>
              ) : (
                <p className="text-sm text-zinc-500">Enter a valid number to generate your link.</p>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={copyLink}
                disabled={!canGenerate}
                className="px-5 py-2.5 rounded-xl font-bold text-[#232318] bg-[#e2f300] hover:bg-[#f2ff4f] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {copied ? 'Copied' : 'Copy Link'}
              </button>

              <a
                href={canGenerate ? generatedLink : '#'}
                target="_blank"
                rel="noreferrer"
                className={`px-5 py-2.5 rounded-xl font-bold border transition-colors ${
                  canGenerate
                    ? 'border-white/20 text-white hover:bg-white/5'
                    : 'border-white/10 text-zinc-600 pointer-events-none'
                }`}
              >
                Open Link
              </a>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
