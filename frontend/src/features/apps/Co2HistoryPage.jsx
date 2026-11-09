import { useEffect, useState } from 'react';
import { co2Api } from './api';
import Co2SummaryCard from './Co2SummaryCard';

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Unknown date' : date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export { Co2SummaryCard };

export default function Co2HistoryPage() {
  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([co2Api.logs(), co2Api.summary()])
      .then(([nextLogs, nextSummary]) => {
        if (!active) return;
        setLogs(Array.isArray(nextLogs) ? nextLogs : []);
        setSummary(nextSummary);
        setError('');
      })
      .catch((requestError) => { if (active) setError(requestError.message || 'Could not load your CO₂ history.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const travelKg = Number(summary?.travelKg || 0);
  const foodKg = Number(summary?.foodKg || 0);
  const totalKg = travelKg + foodKg;
  const travelPercent = totalKg ? Math.round((travelKg / totalKg) * 100) : 0;

  return (
    <main className="mx-auto min-h-[100dvh] w-full max-w-md space-y-5 px-4 pb-8 pt-5">
      <header><p className="text-sm font-semibold text-emerald-700">EcoSync</p><h1 className="mt-1 text-2xl font-bold text-slate-900">CO₂ history</h1><p className="mt-1 text-sm text-slate-500">Your logged travel and food footprint.</p></header>
      {loading ? <div className="space-y-3"><div className="h-32 animate-pulse rounded-2xl bg-slate-100" /><div className="h-24 animate-pulse rounded-2xl bg-slate-100" /></div> : error ? <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700" role="alert">{error}</div> : <>
        <section className="rounded-2xl bg-emerald-700 p-4 text-white"><p className="text-sm font-medium text-emerald-100">Total logged CO₂</p><p className="mt-1 text-3xl font-bold">{Number(summary?.totalKg ?? totalKg).toFixed(2)} kg</p><p className="mt-1 text-xs text-emerald-100">{summary?.logCount || logs.length} logged entries</p></section>
        <section className="rounded-2xl border border-slate-200 bg-white p-4"><h2 className="font-bold text-slate-900">Breakdown</h2><div className="mt-3 h-3 overflow-hidden rounded-full bg-orange-100"><div className="h-full bg-sky-500" style={{ width: `${travelPercent}%` }} /></div><div className="mt-3 grid grid-cols-2 gap-3 text-sm"><div><span className="mr-2 inline-block h-3 w-3 rounded-full bg-sky-500" />Travel <strong className="block pl-5">{travelKg.toFixed(2)} kg</strong></div><div><span className="mr-2 inline-block h-3 w-3 rounded-full bg-orange-400" />Food <strong className="block pl-5">{foodKg.toFixed(2)} kg</strong></div></div></section>
        {logs.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center"><p className="text-3xl">🌱</p><h2 className="mt-2 font-bold text-slate-900">No CO₂ logs yet</h2><p className="mt-1 text-sm text-slate-500">Your saved travel and food estimates will appear here.</p></div> : <section><h2 className="mb-3 font-bold text-slate-900">Recent logs</h2><div className="space-y-3">{logs.map((log) => <article key={log.id} className="rounded-2xl border border-slate-200 bg-white p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-bold capitalize text-slate-900">{log.type}</p><p className="mt-1 text-xs text-slate-500">{formatDate(log.loggedAt || log.createdAt)}</p></div><p className="text-lg font-bold text-slate-900">{Number(log.co2Kg || 0).toFixed(2)} kg</p></div><p className="mt-3 text-sm text-slate-500">{log.distanceKm == null ? 'Distance not recorded' : `${Number(log.distanceKm).toFixed(1)} km`}</p></article>)}</div></section>}
      </>}
    </main>
  );
}
