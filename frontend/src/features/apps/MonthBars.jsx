import { useEffect, useState } from 'react';
import { Calendar, Target, TrendingUp } from 'lucide-react';
import { pointsApi } from './api';

export default function MonthBars() {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');

  const load = () => {
    setError('');
    pointsApi.summary()
      .then(setSummary)
      .catch((requestError) => setError(requestError.message));
  };

  useEffect(() => {
    load();
    window.addEventListener('ecosync:points-updated', load);
    return () => window.removeEventListener('ecosync:points-updated', load);
  }, []);

  if (error) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm">
        Could not load month data.{' '}
        <button type="button" onClick={load} className="font-semibold text-emerald-700 underline">
          Retry
        </button>
      </section>
    );
  }

  if (!summary) {
    return <div className="h-44 animate-pulse rounded-3xl bg-slate-100" />;
  }

  const saved = Number(summary.monthEarned || 0);
  const emitted = Number(summary.monthEmittedKg || 0);
  const target = Number(summary.monthTarget || 30);
  const max = Math.max(target, saved, emitted, 1);
  const percent = Math.min(100, Math.round((saved / target) * 100));

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="month-progress-title">
      <div className="flex items-center justify-between">
        <div>
          <h2 id="month-progress-title" className="text-lg font-extrabold tracking-tight text-slate-900">Your month in carbon</h2>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
            <Target className="h-3.5 w-3.5 text-emerald-600" />
            Target: save {target} kg CO₂e ({target} pts)
          </p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
          <Calendar className="h-3 w-3" />
          {new Intl.DateTimeFormat('en', { month: 'short', year: 'numeric' }).format(new Date())}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 text-center">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">You saved</span>
          <strong className="mt-1 block text-3xl font-extrabold tracking-tight text-emerald-900 sm:text-4xl">
            {saved.toFixed(2)}
          </strong>
          <span className="text-xs font-semibold text-emerald-700">kg CO₂e</span>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-slate-50/90 p-4 text-center">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">You emitted</span>
          <strong className="mt-1 block text-3xl font-extrabold tracking-tight text-slate-800 sm:text-4xl">
            {emitted.toFixed(2)}
          </strong>
          <span className="text-xs font-semibold text-slate-500">kg CO₂e</span>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        <div>
          <div className="mb-1 flex justify-between text-xs font-semibold">
            <span className="text-emerald-700">Saved towards target</span>
            <span className="text-emerald-900">{saved.toFixed(2)} / {target} kg</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-emerald-600 transition-all duration-500"
              style={{ width: `${Math.min(100, (saved / target) * 100)}%` }}
            />
          </div>
        </div>

        <div>
          <div className="mb-1 flex justify-between text-xs font-semibold">
            <span className="text-slate-600">Emitted (logged trips & orders)</span>
            <span className="text-slate-800">{emitted.toFixed(2)} kg</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-slate-400 transition-all duration-500"
              style={{ width: `${Math.min(100, (emitted / max) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
        <span className="flex items-center gap-1 font-semibold text-emerald-700">
          <TrendingUp className="h-3.5 w-3.5" />
          {percent}% of monthly goal reached
        </span>
        <span className="text-slate-400 text-[11px]">1 pt = 1 kg CO₂e saved</span>
      </div>
    </section>
  );
}
