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
        nudges: [
          skipCutlery ? 'skip_disposable_cutlery' : null,
          combineOrder ? 'combine_order' : null
        ].filter(Boolean)
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
    <div className="fixed inset-0 z-50 flex items-end bg-black/70 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="food-nudge-title">
      <div className="w-full rounded-t-3xl border border-[#26332e] bg-[#151b19] p-5 pb-[calc(5rem+env(safe-area-inset-bottom))] text-white shadow-2xl">
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-[#3b4842]" />
        <p className="text-sm font-semibold text-[#a3f542]">Food footprint</p>
        <h2 id="food-nudge-title" className="mt-1 text-xl font-bold text-[#f1f5f2]">Before opening {app.name}</h2>
        <div className="mt-5 space-y-2">
          <button type="button" onClick={() => setSkipCutlery((value) => !value)} className={`flex min-h-14 w-full items-center justify-between rounded-xl border p-3 text-left ${skipCutlery ? 'border-[#a3f542] bg-[#26332e]' : 'border-[#35413b] bg-[#1b2320] hover:border-[#66756c]'}`}><span className="font-medium text-[#e1e8e2]">Skip disposable cutlery?</span><span className={`text-xl ${skipCutlery ? 'text-[#a3f542]' : 'text-[#98a49b]'}`} aria-hidden="true">{skipCutlery ? '✓' : '＋'}</span></button>
          <button type="button" onClick={() => setCombineOrder((value) => !value)} className={`flex min-h-14 w-full items-center justify-between rounded-xl border p-3 text-left ${combineOrder ? 'border-[#a3f542] bg-[#26332e]' : 'border-[#35413b] bg-[#1b2320] hover:border-[#66756c]'}`}><span className="font-medium text-[#e1e8e2]">Combine your order with others?</span><span className={`text-xl ${combineOrder ? 'text-[#a3f542]' : 'text-[#98a49b]'}`} aria-hidden="true">{combineOrder ? '✓' : '＋'}</span></button>
        </div>
        {error && <p className="mt-3 text-xs text-amber-200" role="status">{error}</p>}
        <div className="mt-5 flex gap-3">
          <button type="button" onClick={onClose} className="min-h-11 flex-1 rounded-xl border border-[#3b4842] px-4 font-semibold text-[#d7dfd8] hover:bg-[#1f2a26]">Close</button>
          <button type="button" disabled={saving} onClick={openApp} className="min-h-11 flex-1 rounded-xl bg-[#a3f542] px-4 font-semibold text-[#14200d] hover:brightness-105 disabled:opacity-50">{saving ? 'Opening…' : 'Open app'}</button>
        </div>
      </div>
    </div>
  );
}
