import { useState } from 'react';
import { appPresets } from './presets';

export default function AddAppModal({ onClose, onSave, saving }) {
  const [mode, setMode] = useState('preset');
  const [preset, setPreset] = useState(appPresets[0]);
  const [custom, setCustom] = useState({ name: '', url: '', icon: '🔗', category: 'travel' });
  const [error, setError] = useState('');

  function submit(event) {
    event.preventDefault();
    const app = mode === 'preset' ? preset : custom;
    if (!app.name.trim() || !app.url.trim()) return setError('Name and URL are required.');
    if (!/^https:\/\//i.test(app.url.trim())) return setError('Use a secure https:// URL.');
    setError('');
    onSave({ ...app, name: app.name.trim(), url: app.url.trim() });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/70 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="add-app-title">
      <form onSubmit={submit} className="max-h-[90dvh] w-full overflow-y-auto rounded-t-3xl border border-[#26332e] bg-[#151b19] p-5 pb-[calc(5rem+env(safe-area-inset-bottom))] text-white shadow-2xl">
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-[#3b4842]" />
        <div className="flex items-center justify-between">
          <h2 id="add-app-title" className="text-xl font-bold text-[#f1f5f2]">Add app</h2>
          <button type="button" onClick={onClose} className="min-h-11 min-w-11 rounded-full text-2xl text-[#aeb8b0] hover:bg-[#26332e]" aria-label="Close">×</button>
        </div>
        <div className="mt-4 grid grid-cols-2 rounded-xl border border-[#26332e] bg-[#0f1512] p-1 text-sm font-semibold">
          {['preset', 'custom'].map((value) => <button key={value} type="button" onClick={() => setMode(value)} className={`min-h-11 rounded-lg capitalize ${mode === value ? 'bg-[#26332e] text-[#a3f542] shadow-card' : 'text-[#aeb8b0]'}`}>{value}</button>)}
        </div>
        {mode === 'preset' ? (
          <div className="mt-4 grid grid-cols-2 gap-2">
            {appPresets.map((item) => <button key={item.name} type="button" onClick={() => setPreset(item)} className={`min-h-14 rounded-xl border p-3 text-left text-[#e1e8e2] ${preset.name === item.name ? 'border-[#a3f542] bg-[#26332e]' : 'border-[#35413b] bg-[#1b2320] hover:border-[#66756c]'}`}><span className="mr-2 text-xl">{item.icon}</span><span className="font-medium">{item.name}</span></button>)}
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <input value={custom.name} onChange={(event) => setCustom({ ...custom, name: event.target.value })} placeholder="App name" className="min-h-12 w-full rounded-xl border border-[#3b4842] bg-[#0f1512] px-3 text-white placeholder:text-[#77847a]" />
            <input value={custom.url} onChange={(event) => setCustom({ ...custom, url: event.target.value })} placeholder="https://example.com" inputMode="url" className="min-h-12 w-full rounded-xl border border-[#3b4842] bg-[#0f1512] px-3 text-white placeholder:text-[#77847a]" />
            <select value={custom.category} onChange={(event) => setCustom({ ...custom, category: event.target.value })} className="min-h-12 w-full rounded-xl border border-[#3b4842] bg-[#0f1512] px-3 text-white"><option value="travel">Travel</option><option value="food">Food</option><option value="grocery">Grocery</option></select>
          </div>
        )}
        {error && <p className="mt-3 text-sm text-red-300" role="alert">{error}</p>}
        <button disabled={saving} className="mt-5 min-h-12 w-full rounded-xl bg-[#a3f542] font-bold text-[#14200d] disabled:opacity-50">{saving ? 'Adding…' : 'Add app'}</button>
      </form>
    </div>
  );
}
