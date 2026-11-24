import React, { useEffect, useState } from 'react';
import { BarChart3, Leaf, Car, Utensils } from 'lucide-react';
import { co2Api } from '../apps/api';

export default function Co2SummarySlot() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadSummary = () => {
    co2Api.summary()
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadSummary();
    window.addEventListener('ecosync:points-updated', loadSummary);
    return () => window.removeEventListener('ecosync:points-updated', loadSummary);
  }, []);

  return (
    <section className="rounded-2xl border border-sky-100 bg-sky-50/70 p-5 shadow-sm" aria-labelledby="co2-summary-title">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-sky-700 shadow-sm">
          <BarChart3 className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <h2 id="co2-summary-title" className="font-bold text-slate-900">Your CO₂ summary</h2>
            <Leaf className="h-5 w-5 shrink-0 text-sky-600" aria-hidden="true" />
          </div>
          <p className="mt-1 text-xs text-slate-600">
            Total recorded emissions across your logged trips and food orders.
          </p>

          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-white p-3 shadow-xs">
              <span className="block text-lg font-extrabold text-slate-900">
                {loading ? '…' : `${Number(data?.totalKg || 0).toFixed(2)}`}
              </span>
              <span className="text-[11px] font-semibold text-slate-500">Total kg</span>
            </div>
            <div className="rounded-xl bg-white p-3 shadow-xs">
              <div className="flex items-center justify-center gap-1">
                <Car className="h-3.5 w-3.5 text-sky-600" />
                <span className="block text-lg font-extrabold text-slate-900">
                  {loading ? '…' : `${Number(data?.travelKg || 0).toFixed(2)}`}
                </span>
              </div>
              <span className="text-[11px] font-semibold text-slate-500">Travel kg</span>
            </div>
            <div className="rounded-xl bg-white p-3 shadow-xs">
              <div className="flex items-center justify-center gap-1">
                <Utensils className="h-3.5 w-3.5 text-emerald-600" />
                <span className="block text-lg font-extrabold text-slate-900">
                  {loading ? '…' : `${Number(data?.foodKg || 0).toFixed(2)}`}
                </span>
              </div>
              <span className="text-[11px] font-semibold text-slate-500">Food kg</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
