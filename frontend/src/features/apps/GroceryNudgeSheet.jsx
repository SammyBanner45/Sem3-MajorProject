import { useState } from 'react';

const NUDGES = [
  { id: 'combine_order', label: 'Combine into one bigger order?', emoji: '📦' },
  { id: 'skip_plastic_bag', label: 'Skip the plastic bag?', emoji: '♻️' },
  { id: 'check_list', label: 'Check your list first to avoid extra orders?', emoji: '📋' }
];

export default function GroceryNudgeSheet({ app, onClose, onOpenApp }) {
  const [accepted, setAccepted] = useState(new Set());

  function toggle(id) {
    setAccepted((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleOpen() {
    onOpenApp([...accepted]);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-slate-950/40" role="dialog" aria-modal="true" aria-labelledby="grocery-nudge-title">
      <div className="w-full rounded-t-3xl bg-white p-5 pb-[calc(5rem+env(safe-area-inset-bottom))] shadow-xl">
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-200" />
        <p className="text-sm font-medium text-emerald-700">Grocery footprint</p>
        <h2 id="grocery-nudge-title" className="mt-1 text-xl font-bold text-slate-900">Before opening {app.name}</h2>

        <div className="mt-5 space-y-2">
          {NUDGES.map(({ id, label, emoji }) => (
            <button
              key={id}
              type="button"
              onClick={() => toggle(id)}
              className={`flex min-h-14 w-full items-center justify-between rounded-xl border p-3 text-left transition ${
                accepted.has(id) ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200'
              }`}
            >
              <span className="flex items-center gap-2 font-medium text-slate-800">
                <span className="text-lg" aria-hidden="true">{emoji}</span>
                {label}
              </span>
              <span className="text-xl" aria-hidden="true">{accepted.has(id) ? '✓' : '＋'}</span>
            </button>
          ))}
        </div>

        <p className="mt-3 text-xs text-slate-500">Tap a nudge to commit to it. All are optional.</p>

        <div className="mt-5 flex gap-3">
          <button type="button" onClick={onClose} className="min-h-11 flex-1 rounded-xl border border-slate-200 px-4 font-semibold text-slate-700">
            Close
          </button>
          <button type="button" onClick={handleOpen} className="min-h-11 flex-1 rounded-xl bg-emerald-600 px-4 font-semibold text-white hover:bg-emerald-700">
            Open app
          </button>
        </div>
      </div>
    </div>
  );
}
