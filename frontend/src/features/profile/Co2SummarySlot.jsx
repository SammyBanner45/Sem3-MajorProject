import React, { useEffect, useState } from 'react';
import { BarChart3, Leaf, Car, Utensils, ShoppingBasket } from 'lucide-react';
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
    <section className="rounded-2xl border border-[#414a36] bg-[#171d1a] p-5 text-[#dee4df] shadow-sm" aria-labelledby="co2-summary-title">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#252b28] text-[#a3f542] shadow-sm">
          <BarChart3 className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <h2 id="co2-summary-title" className="font-bold text-[#dee4df]">Your CO₂ summary</h2>
            <Leaf className="h-5 w-5 shrink-0 text-sky-600" aria-hidden="true" />
          </div>
          <p className="mt-1 text-xs text-[#aeb8b0]">
            Total recorded emissions across your logged trips, food orders and grocery orders.
          </p>

          <div className="mt-4 grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
            <div className="rounded-xl bg-[#1b211e] p-3 shadow-xs">
              <span className="block text-lg font-extrabold text-[#dee4df]">
                {loading ? '…' : `${Number(data?.totalKg || 0).toFixed(2)}`}
              </span>
              <span className="text-[11px] font-semibold text-[#aeb8b0]">Total kg</span>
            </div>
            <div className="rounded-xl bg-[#1b211e] p-3 shadow-xs">
              <div className="flex items-center justify-center gap-1">
                <Car className="h-3.5 w-3.5 text-sky-600" />
                <span className="block text-lg font-extrabold text-[#dee4df]">
                  {loading ? '…' : `${Number(data?.travelKg || 0).toFixed(2)}`}
                </span>
              </div>
              <span className="text-[11px] font-semibold text-[#aeb8b0]">Travel kg</span>
            </div>
            <div className="rounded-xl bg-[#1b211e] p-3 shadow-xs">
              <div className="flex items-center justify-center gap-1">
                <Utensils className="h-3.5 w-3.5 text-emerald-600" />
                <span className="block text-lg font-extrabold text-[#dee4df]">
                  {loading ? '…' : `${Number(data?.foodKg || 0).toFixed(2)}`}
                </span>
              </div>
              <span className="text-[11px] font-semibold text-[#aeb8b0]">Food kg</span>
            </div>
            <div className="rounded-xl bg-[#1b211e] p-3 shadow-xs">
              <div className="flex items-center justify-center gap-1">
                <ShoppingBasket className="h-3.5 w-3.5 text-[#a3f542]" />
                <span className="block text-lg font-extrabold text-[#dee4df]">{loading ? '…' : Number(data?.groceryKg || 0).toFixed(2)}</span>
              </div>
              <span className="text-[11px] font-semibold text-[#aeb8b0]">Grocery kg</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
