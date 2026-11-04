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
    <div className="fixed inset-0 z-30 flex items-end bg-slate-950/40" role="dialog" aria-modal="true" aria-labelledby="add-app-title">
      <form onSubmit={submit} className="max-h-[90dvh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-xl">
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-200" />
        <div className="flex items-center justify-between">
          <h2 id="add-app-title" className="text-xl font-bold text-slate-900">Add app</h2>
          <button type="button" onClick={onClose} className="min-h-11 min-w-11 rounded-full text-2xl text-slate-500" aria-label="Close">×</button>
        </div>
        <div className="mt-4 grid grid-cols-2 rounded-xl bg-slate-100 p-1 text-sm font-semibold">
          {['preset', 'custom'].map((value) => <button key={value} type="button" onClick={() => setMode(value)} className={`min-h-11 rounded-lg capitalize ${mode === value ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500'}`}>{value}</button>)}
        </div>
        {mode === 'preset' ? (
          <div className="mt-4 grid grid-cols-2 gap-2">
            {appPresets.map((item) => <button key={item.name} type="button" onClick={() => setPreset(item)} className={`min-h-14 rounded-xl border p-3 text-left ${preset.name === item.name ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200'}`}><span className="mr-2 text-xl">{item.icon}</span><span className="font-medium">{item.name}</span></button>)}
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <input value={custom.name} onChange={(event) => setCustom({ ...custom, name: event.target.value })} placeholder="App name" className="min-h-12 w-full rounded-xl border border-slate-200 px-3" />
            <input value={custom.url} onChange={(event) => setCustom({ ...custom, url: event.target.value })} placeholder="https://example.com" inputMode="url" className="min-h-12 w-full rounded-xl border border-slate-200 px-3" />
            <select value={custom.category} onChange={(event) => setCustom({ ...custom, category: event.target.value })} className="min-h-12 w-full rounded-xl border border-slate-200 px-3"><option value="travel">Travel</option><option value="food">Food</option><option value="grocery">Grocery</option></select>
          </div>
        )}
        {error && <p className="mt-3 text-sm text-red-600" role="alert">{error}</p>}
        <button disabled={saving} className="mt-5 min-h-12 w-full rounded-xl bg-emerald-600 font-bold text-white disabled:opacity-50">{saving ? 'Adding…' : 'Add app'}</button>
      </form>
    </div>
  );
}
