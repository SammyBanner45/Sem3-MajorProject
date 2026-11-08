export default function FoodNudgeSheet({ app, onClose }) {
  return (
    <div className="fixed inset-0 z-40 flex items-end bg-slate-950/40" role="dialog" aria-modal="true">
      <div className="w-full rounded-t-3xl bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-xl">
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-200" />
        <p className="text-sm font-medium text-emerald-700">Food footprint</p>
        <h2 className="mt-1 text-xl font-bold text-slate-900">Before opening {app.name}</h2>
        <p className="mt-2 text-sm text-slate-600">The food calculator placeholder is ready for order details and a packaging nudge.</p>
        <div className="mt-5 flex gap-3">
          <button type="button" onClick={onClose} className="min-h-11 flex-1 rounded-xl border border-slate-200 px-4 font-semibold text-slate-700">Close</button>
          <a href={app.url} target="_blank" rel="noreferrer" className="flex min-h-11 flex-1 items-center justify-center rounded-xl bg-emerald-600 px-4 font-semibold text-white">Continue</a>
        </div>
      </div>
    </div>
  );
}
