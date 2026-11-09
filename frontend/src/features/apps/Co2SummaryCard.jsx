import { useEffect, useState } from 'react';
import { co2Api } from './api';

export default function Co2SummaryCard() {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    co2Api.summary()
      .then((result) => { if (active) setSummary(result); })
      .catch((requestError) => { if (active) setError(requestError.message || 'Summary unavailable'); });
    return () => { active = false; };
  }, []);

  if (error) return <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500">CO₂ summary unavailable</div>;
  if (!summary) return <div className="h-28 animate-pulse rounded-2xl bg-slate-100" aria-label="Loading CO₂ summary" />;

  return (
    <section className="rounded-2xl bg-emerald-700 p-4 text-white" aria-label="CO₂ summary">
      <p className="text-sm font-medium text-emerald-100">Your logged CO₂</p>
      <p className="mt-1 text-3xl font-bold">{Number(summary.totalKg || 0).toFixed(2)} kg</p>
      <div className="mt-3 grid grid-cols-3 gap-2 text-xs"><span><strong className="block text-base">{Number(summary.travelKg || 0).toFixed(2)}</strong>travel kg</span><span><strong className="block text-base">{Number(summary.foodKg || 0).toFixed(2)}</strong>food kg</span><span><strong className="block text-base">{summary.logCount || 0}</strong>logs</span></div>
    </section>
  );
}
