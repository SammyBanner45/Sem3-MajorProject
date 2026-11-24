import { useEffect, useState } from 'react';
import { co2Api, notifyPointsUpdated } from './api';

function getDetails(pendingLog) {
  return pendingLog?.details && typeof pendingLog.details === 'object' ? pendingLog.details : {};
}

export default function FoodLogPrompt({ pendingLog, onClose, onLogged }) {
  const details = getDetails(pendingLog);
  const [isVeg, setIsVeg] = useState(details.isVeg ?? true);
  const [items, setItems] = useState(details.items ?? 1);
  const [deliveryKm, setDeliveryKm] = useState(details.deliveryKm ?? 0);
  const [packaging, setPackaging] = useState(details.packaging ?? false);
  const [nudges, setNudges] = useState(Array.isArray(details.nudges) ? details.nudges : []);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const nextDetails = getDetails(pendingLog);
    setIsVeg(nextDetails.isVeg ?? true);
    setItems(nextDetails.items ?? 1);
    setDeliveryKm(nextDetails.deliveryKm ?? 0);
    setPackaging(nextDetails.packaging ?? false);
    setNudges(Array.isArray(nextDetails.nudges) ? nextDetails.nudges : []);
    setResult(null);
    setError('');
    setDismissed(false);
  }, [pendingLog]);

  if (!pendingLog || dismissed) return null;

  function dismiss() {
    setDismissed(true);
    onClose?.();
  }

  async function submit(event) {
    event.preventDefault();
    const itemCount = Number(items);
    const distance = Number(deliveryKm);
    if (!Number.isInteger(itemCount) || itemCount < 0 || !Number.isFinite(distance) || distance < 0) {
      setError('Enter a valid item count and delivery distance.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const logged = await co2Api.logFood(pendingLog.id, { items: itemCount, isVeg, deliveryKm: distance, packaging, nudges });
      setResult({ co2Kg: logged?.log?.co2Kg ?? logged?.co2Kg ?? 0, pointsEarned: logged?.pointsEarned ?? 0, capReached: logged?.capReached });
      notifyPointsUpdated();
      onLogged?.(logged);
    } catch (requestError) {
      setError(requestError.message || 'Could not log this order.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-slate-950/40" role="dialog" aria-modal="true" aria-labelledby="food-log-title">
      <form onSubmit={submit} className="max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-xl">
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-200" />
        <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-medium text-emerald-700">Order reminder</p><h2 id="food-log-title" className="mt-1 text-xl font-bold text-slate-900">Log your food order?</h2></div><button type="button" onClick={dismiss} className="min-h-11 min-w-11 rounded-full text-2xl text-slate-500" aria-label="Close">×</button></div>
        {result === null ? <>
          <div className="mt-5 grid grid-cols-2 gap-2"><button type="button" onClick={() => setIsVeg(true)} className={`min-h-12 rounded-xl border font-semibold ${isVeg ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-600'}`}>Vegetarian</button><button type="button" onClick={() => setIsVeg(false)} className={`min-h-12 rounded-xl border font-semibold ${!isVeg ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-600'}`}>Non-veg</button></div>
          <label className="mt-4 block text-sm font-semibold text-slate-700">Number of items<input type="number" min="0" step="1" value={items} onChange={(event) => setItems(event.target.value)} className="mt-1 min-h-12 w-full rounded-xl border border-slate-200 px-3 text-base" /></label>
          <label className="mt-3 block text-sm font-semibold text-slate-700">Delivery distance (km)<input type="number" min="0" step="0.1" inputMode="decimal" value={deliveryKm} onChange={(event) => setDeliveryKm(event.target.value)} className="mt-1 min-h-12 w-full rounded-xl border border-slate-200 px-3 text-base" /></label>
          <label className="mt-3 flex min-h-12 items-center gap-3 text-sm font-semibold text-slate-700"><input type="checkbox" checked={packaging} onChange={(event) => setPackaging(event.target.checked)} className="h-5 w-5" /> Included packaging</label>
          {error && <p className="mt-3 text-sm text-red-600" role="alert">{error}</p>}
          <div className="mt-5 flex gap-3"><button type="button" onClick={dismiss} className="min-h-12 flex-1 rounded-xl border border-slate-200 px-4 font-semibold text-slate-700">Not now</button><button type="submit" disabled={saving} className="min-h-12 flex-1 rounded-xl bg-emerald-600 px-4 font-semibold text-white disabled:opacity-50">{saving ? 'Saving…' : 'Log order'}</button></div>
          <button type="button" onClick={dismiss} className="mt-3 min-h-11 w-full text-sm font-semibold text-slate-500">Skip</button>
        </> : <div className="mt-6"><p className="text-sm font-medium text-emerald-700">Saved to your CO₂ log</p><div className="mt-3 grid grid-cols-2 gap-3"><div className="rounded-2xl bg-slate-100 p-4"><p className="text-2xl font-bold text-slate-700">{Number(result.co2Kg).toFixed(2)} kg</p><p className="text-xs text-slate-500">CO₂e emitted</p></div><div className="rounded-2xl bg-emerald-50 p-4"><p className="text-2xl font-bold text-emerald-700">+{Number(result.pointsEarned).toFixed(2)} pts</p><p className="text-xs text-emerald-700">CO₂e saved</p></div></div>{result.capReached && <p className="mt-3 text-xs text-slate-500">Daily limit reached.</p>}<button type="button" onClick={dismiss} className="mt-5 min-h-12 w-full rounded-xl bg-emerald-600 px-4 font-semibold text-white">Done</button></div>}
      </form>
    </div>
  );
}
