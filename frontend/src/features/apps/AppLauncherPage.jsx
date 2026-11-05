import { useCallback, useEffect, useState } from 'react';
import AddAppModal from './AddAppModal';
import { appsApi } from './api';
import DevDashboardPage from './DevDashboardPage';
import FoodNudgeSheet from './FoodNudgeSheet';
import TravelEstimateSheet from './TravelEstimateSheet';

export default function AppLauncherPage() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState(null);
  const [devOpen, setDevOpen] = useState(false);

  const loadApps = useCallback(async () => {
    setLoading(true);
    try { setApps(await appsApi.list()); setError(''); } catch (requestError) { setError(requestError.message); } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadApps(); }, [loadApps]);

  async function addApp(app) {
    setSaving(true);
    try { await appsApi.create(app); setShowAdd(false); await loadApps(); } catch (requestError) { setError(requestError.message); } finally { setSaving(false); }
  }

  async function removeApp(id) {
    if (!window.confirm('Remove this shortcut?')) return;
    try { await appsApi.remove(id); setApps((current) => current.filter((app) => app.id !== id)); } catch (requestError) { setError(requestError.message); }
  }

  if (import.meta.env.DEV && devOpen) return <main className="mx-auto min-h-[100dvh] w-full max-w-md p-4"><button type="button" onClick={() => setDevOpen(false)} className="mb-3 min-h-11 text-sm font-semibold text-emerald-700">← Back to apps</button><DevDashboardPage /></main>;

  return (
    <main className="mx-auto min-h-[100dvh] w-full max-w-md px-4 pb-8 pt-5">
      <header className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold text-emerald-700">EcoSync</p><h1 className="text-2xl font-bold text-slate-900">Your apps</h1></div><div className="flex gap-2">{import.meta.env.DEV && <button type="button" onClick={() => setDevOpen(true)} className="min-h-11 rounded-xl border border-amber-300 px-3 text-xs font-bold text-amber-800">Dev</button>}<button type="button" onClick={() => setShowAdd(true)} className="min-h-11 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white">+ Add app</button></div></header>
      {error && <div className="mt-5 flex items-center justify-between gap-3 rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert"><span>{error}</span><button type="button" onClick={loadApps} className="min-h-10 font-bold underline">Retry</button></div>}
      {loading ? <div className="mt-6 grid grid-cols-2 gap-3">{[1, 2, 3, 4].map((item) => <div key={item} className="h-28 animate-pulse rounded-2xl bg-slate-100" />)}</div> : apps.length === 0 ? <div className="mt-8 rounded-2xl border border-dashed border-slate-300 p-6 text-center"><p className="text-3xl">🌱</p><h2 className="mt-2 font-bold text-slate-900">No shortcuts yet</h2><p className="mt-1 text-sm text-slate-500">Add your everyday travel, food, or grocery apps.</p><button type="button" onClick={() => setShowAdd(true)} className="mt-4 min-h-11 rounded-xl bg-emerald-600 px-4 font-bold text-white">Add your first app</button></div> : <div className="mt-6 grid grid-cols-2 gap-3">{apps.map((app) => <div key={app.id} className="relative rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"><button type="button" onClick={() => setSelected(app)} className="flex min-h-24 w-full flex-col items-center justify-center rounded-xl text-center active:bg-slate-50"><span className="text-3xl" aria-hidden="true">{app.icon}</span><span className="mt-2 text-sm font-bold text-slate-900">{app.name}</span><span className="mt-1 text-[11px] capitalize text-slate-500">{app.category}</span></button><button type="button" onClick={() => removeApp(app.id)} className="absolute right-2 top-2 min-h-10 min-w-10 rounded-full text-lg text-slate-400" aria-label={`Remove ${app.name}`}>⋮</button></div>)}</div>}
      {showAdd && <AddAppModal onClose={() => setShowAdd(false)} onSave={addApp} saving={saving} />}
      {selected && (selected.category === 'travel' ? <TravelEstimateSheet app={selected} onClose={() => setSelected(null)} /> : <FoodNudgeSheet app={selected} onClose={() => setSelected(null)} />)}
    </main>
  );
}
