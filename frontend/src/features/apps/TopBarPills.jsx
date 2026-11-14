import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Leaf, Cloud, ChevronRight } from 'lucide-react';
import { pointsApi } from './api';

export default function TopBarPills({ compact = false }) {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    const refresh = () => pointsApi.summary().then(setSummary).catch(() => undefined);
    refresh();
    window.addEventListener('ecosync:points-updated', refresh);
    return () => window.removeEventListener('ecosync:points-updated', refresh);
  }, []);

  const openFootprint = () => navigate('/profile?tab=footprint');

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Balance Pill */}
        <button
          type="button"
          onClick={openFootprint}
          title="Points Balance (1 pt = 1 kg CO₂e saved)"
          className="metric-pill metric-pill-saved group flex items-center gap-1.5 rounded-full border py-1 pl-2.5 pr-3 text-left transition focus:outline-none focus:ring-2 focus:ring-primary-container"
        >
          <span className="grid h-5 w-5 place-items-center rounded-full bg-primary-container text-on-primary-fixed shadow-xs">
            <Leaf className="h-3 w-3" />
          </span>
          <div className="flex flex-col leading-none">
            <span className="text-[9px] font-bold uppercase tracking-wider text-primary-container">Points</span>
            <span className="mt-0.5 text-xs font-extrabold text-on-surface">
              {summary ? Number(summary.balance || 0).toFixed(2) : '—'} <span className="font-semibold text-primary-container">pts</span>
            </span>
          </div>
        </button>

        {/* Emitted This Month Pill */}
        <button
          type="button"
          onClick={openFootprint}
          title="CO₂e Emitted this month"
          className="metric-pill metric-pill-emitted group flex items-center gap-1.5 rounded-full border py-1 pl-2.5 pr-3 text-left transition focus:outline-none focus:ring-2 focus:ring-outline"
        >
          <span className="grid h-5 w-5 place-items-center rounded-full bg-slate-500 text-white shadow-xs">
            <Cloud className="h-3 w-3" />
          </span>
          <div className="flex flex-col leading-none">
            <span className="text-[9px] font-bold uppercase tracking-wider text-on-surface-variant">Emitted</span>
            <span className="mt-0.5 text-xs font-extrabold text-on-surface">
              {summary ? Number(summary.monthEmittedKg || 0).toFixed(2) : '—'} <span className="font-semibold text-on-surface-variant">kg</span>
            </span>
          </div>
        </button>
      </div>
    );
  }

  // Standalone full width version
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
      <button
        type="button"
        onClick={openFootprint}
          className="metric-card metric-card-saved flex items-center justify-between rounded-card border p-3.5 text-left shadow-card transition sm:p-4"
      >
        <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-container text-on-primary-fixed shadow-sm">
            <Leaf className="h-5 w-5" />
          </span>
          <div>
            <span className="block text-[11px] font-bold uppercase tracking-wider text-emerald-700">Points Balance</span>
            <strong className="text-lg font-extrabold tracking-tight text-emerald-950 sm:text-xl">
              {summary ? Number(summary.balance || 0).toFixed(2) : '—'} <span className="text-xs font-bold text-emerald-700">pts</span>
            </strong>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-emerald-400" />
      </button>

      <button
        type="button"
        onClick={openFootprint}
        className="metric-card metric-card-emitted flex items-center justify-between rounded-card border p-3.5 text-left shadow-card transition sm:p-4"
      >
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600 shadow-sm">
            <Cloud className="h-5 w-5" />
          </span>
          <div>
            <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">Emitted This Month</span>
            <strong className="text-lg font-extrabold tracking-tight text-slate-900 sm:text-xl">
              {summary ? Number(summary.monthEmittedKg || 0).toFixed(2) : '—'} <span className="text-xs font-bold text-slate-500">kg CO₂e</span>
            </strong>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-slate-300" />
      </button>
    </div>
  );
}
