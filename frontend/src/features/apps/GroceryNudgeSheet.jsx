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
    <div className="fixed inset-0 z-50 flex items-end bg-black/70 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="grocery-nudge-title">
      <div className="w-full rounded-t-3xl border border-[#26332e] bg-[#151b19] p-5 pb-[calc(5rem+env(safe-area-inset-bottom))] text-white shadow-2xl">
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-[#3b4842]" />
        <p className="text-sm font-semibold text-[#a3f542]">Grocery footprint</p>
        <h2 id="grocery-nudge-title" className="mt-1 text-xl font-bold text-[#f1f5f2]">Before opening {app.name}</h2>

        <div className="mt-5 space-y-2">
          {NUDGES.map(({ id, label, emoji }) => (
            <button
              key={id}
              type="button"
              onClick={() => toggle(id)}
              className={`flex min-h-14 w-full items-center justify-between rounded-xl border p-3 text-left transition ${
                accepted.has(id) ? 'border-[#a3f542] bg-[#26332e]' : 'border-[#35413b] bg-[#1b2320] hover:border-[#66756c]'
              }`}
            >
              <span className="flex items-center gap-2 font-medium text-[#e1e8e2]">
                <span className="text-lg" aria-hidden="true">{emoji}</span>
                {label}
              </span>
              <span className={`text-xl ${accepted.has(id) ? 'text-[#a3f542]' : 'text-[#98a49b]'}`} aria-hidden="true">{accepted.has(id) ? '✓' : '＋'}</span>
            </button>
          ))}
        </div>

        <p className="mt-3 text-xs text-[#aeb8b0]">Tap a nudge to commit to it. All are optional.</p>

        <div className="mt-5 flex gap-3">
          <button type="button" onClick={onClose} className="min-h-11 flex-1 rounded-xl border border-[#3b4842] px-4 font-semibold text-[#d7dfd8] hover:bg-[#1f2a26]">
            Close
          </button>
          <button type="button" onClick={handleOpen} className="min-h-11 flex-1 rounded-xl bg-[#a3f542] px-4 font-semibold text-[#14200d] hover:brightness-105">
            Open app
          </button>
        </div>
      </div>
    </div>
  );
}
