import React from 'react';
import { BarChart3, Leaf } from 'lucide-react';

export default function Co2SummarySlot() {
  return (
    <section className="rounded-2xl border border-sky-100 bg-sky-50/70 p-5" aria-labelledby="co2-summary-title">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-sky-700 shadow-sm">
          <BarChart3 className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h2 id="co2-summary-title" className="font-bold text-slate-900">Your CO₂ summary</h2>
          <p className="mt-1 text-sm leading-5 text-slate-600">
            Your personal footprint summary will appear here when the CO₂ summary card is integrated.
          </p>
        </div>
        <Leaf className="ml-auto h-5 w-5 shrink-0 text-sky-600" aria-hidden="true" />
      </div>
    </section>
  );
}
