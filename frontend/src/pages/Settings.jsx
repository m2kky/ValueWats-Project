import { useState, useEffect } from 'react';
import { ShieldExclamationIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import api from '../api/client';

export default function Settings() {
  const [settings, setSettings] = useState({
    optoutEnabled: true,
    optoutMessage: '',
    optoutKeywords: [],
  });
  const [newKeyword, setNewKeyword] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get('/settings').then(r => {
      setSettings(r.data);
      setLoading(false);
    });
  }, []);

  const save = async () => {
    setSaving(true);
    await api.put('/settings', settings);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const addKeyword = () => {
    const kw = newKeyword.trim();
    if (!kw || settings.optoutKeywords.includes(kw)) return;
    setSettings(s => ({ ...s, optoutKeywords: [...s.optoutKeywords, kw] }));
    setNewKeyword('');
  };

  const removeKeyword = (kw) => {
    setSettings(s => ({ ...s, optoutKeywords: s.optoutKeywords.filter(k => k !== kw) }));
  };

  if (loading) return <div className="p-8 text-zinc-400">جاري التحميل...</div>;

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <h1 className="text-xl font-bold text-white">الإعدادات</h1>

      {/* Opt-out Card */}
      <div className="glass-card border border-white/5 bg-zinc-900/40 rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-3">
          <ShieldExclamationIcon className="w-5 h-5 text-indigo-400" />
          <span className="text-sm font-black text-white uppercase tracking-widest">إعدادات إلغاء الاشتراك</span>
        </div>

        {/* Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-white">تفعيل نظام إلغاء الاشتراك</p>
            <p className="text-xs text-zinc-500 mt-0.5">عند الإيقاف، لن يتم حظر أي جهة اتصال تلقائياً</p>
          </div>
          <button
            onClick={() => setSettings(s => ({ ...s, optoutEnabled: !s.optoutEnabled }))}
            className={`inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.optoutEnabled ? 'bg-indigo-600' : 'bg-zinc-700'}`}
          >
            <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${settings.optoutEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

        {settings.optoutEnabled && (
          <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
            {/* Message */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">رسالة التأكيد</label>
              <textarea
                rows={3}
                value={settings.optoutMessage}
                onChange={e => setSettings(s => ({ ...s, optoutMessage: e.target.value }))}
                className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500/30 resize-none"
              />
            </div>

            {/* Keywords */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">كلمات إلغاء الاشتراك</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {settings.optoutKeywords.map(kw => (
                  <span key={kw} className="flex items-center gap-1.5 bg-white/5 border border-white/5 rounded-lg px-3 py-1 text-xs text-white">
                    {kw}
                    <button onClick={() => removeKeyword(kw)} className="hover:text-rose-400 transition-colors">
                      <TrashIcon className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={newKeyword}
                  onChange={e => setNewKeyword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addKeyword()}
                  placeholder="أضف كلمة جديدة..."
                  className="flex-1 bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500/30"
                />
                <button
                  onClick={addKeyword}
                  className="bg-indigo-600 hover:bg-indigo-500 rounded-xl px-4 py-2.5 text-xs font-black uppercase tracking-widest text-white transition-colors"
                >
                  <PlusIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={save}
          disabled={saving}
          className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-xl py-3 text-xs font-black uppercase tracking-widest text-white transition-colors"
        >
          {saved ? '✅ تم الحفظ' : saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
        </button>
      </div>
    </div>
  );
}
