import { useState } from 'react';
import { co2Api } from './api';

export default function FoodNudgeSheet({ app, onClose, onPendingCreated }) {
  const [skipCutlery, setSkipCutlery] = useState(false);
  const [combineOrder, setCombineOrder] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function openApp() {
    const appWindow = window.open('', '_blank');
    setSaving(true);
    setError('');
    let pendingLog;
    try {
      pendingLog = await co2Api.pendingFood({
        items: 1,
        isVeg: true,
        deliveryKm: 0,
        packaging: !skipCutlery,
        nudges: { skipDisposableCutlery: skipCutlery, combineOrder }
      });
    } catch {
      setError('Your order reminder could not be saved.');
    } finally {
      onPendingCreated?.(pendingLog);
      if (appWindow) appWindow.location.href = app.url;
      else {
        const link = document.createElement('a');
        link.href = app.url;
        link.target = '_blank';
        link.rel = 'noreferrer';
        link.click();
      }
      setSaving(false);
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end bg-slate-950/40" role="dialog" aria-modal="true" aria-labelledby="food-nudge-title">
      <div className="w-full rounded-t-3xl bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-xl">
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-200" />
        <p className="text-sm font-medium text-emerald-700">Food footprint</p>
        <h2 id="food-nudge-title" className="mt-1 text-xl font-bold text-slate-900">Before opening {app.name}</h2>
        <div className="mt-5 space-y-2">
          <button type="button" onClick={() => setSkipCutlery((value) => !value)} className={`flex min-h-14 w-full items-center justify-between rounded-xl border p-3 text-left ${skipCutlery ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200'}`}><span className="font-medium text-slate-800">Skip disposable cutlery?</span><span className="text-xl" aria-hidden="true">{skipCutlery ? '✓' : '＋'}</span></button>
          <button type="button" onClick={() => setCombineOrder((value) => !value)} className={`flex min-h-14 w-full items-center justify-between rounded-xl border p-3 text-left ${combineOrder ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200'}`}><span className="font-medium text-slate-800">Combine your order with others?</span><span className="text-xl" aria-hidden="true">{combineOrder ? '✓' : '＋'}</span></button>
        </div>
        {error && <p className="mt-3 text-xs text-slate-500" role="status">{error}</p>}
        <div className="mt-5 flex gap-3">
          <button type="button" onClick={onClose} className="min-h-11 flex-1 rounded-xl border border-slate-200 px-4 font-semibold text-slate-700">Close</button>
          <button type="button" disabled={saving} onClick={openApp} className="min-h-11 flex-1 rounded-xl bg-emerald-600 px-4 font-semibold text-white disabled:opacity-50">{saving ? 'Opening…' : 'Open app'}</button>
        </div>
      </div>
    </div>
  );
}
