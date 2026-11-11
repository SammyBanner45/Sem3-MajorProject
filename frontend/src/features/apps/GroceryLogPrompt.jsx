import { useState } from 'react';
import { co2Api, notifyPointsUpdated } from './api';
import factors from '../../data/emissionFactors.json';

/**
 * Pure helper — same formula as backend's calculateGrocery, used for the
 * live preview shown to the user before they tap "Log order".
 */
export function calculateGroceryEstimate({ basketSize, productType, animalProducts, bagType }, groceryFactors = factors.grocery) {
  const base = groceryFactors.basketBaseKg[basketSize];
  const multiplier = groceryFactors.productTypeMultiplier[productType];
  const bag = groceryFactors.bagKg[bagType];
  if (base === undefined || multiplier === undefined || bag === undefined) {
    throw new RangeError('Choose a valid basket size, product type, and bag type.');
  }
  return Math.round((base * multiplier + (animalProducts ? groceryFactors.animalProductsAddKg : 0) + bag + groceryFactors.fixedDeliveryKg) * 1000) / 1000;
}
export default function GroceryLogPrompt({ onClose }) {
  const [basketSize, setBasketSize] = useState('medium');
  const [productType, setProductType] = useState('mix');
  const [animalProducts, setAnimalProducts] = useState(false);
  const [bagType, setBagType] = useState('none');
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const estimatedCo2 = calculateGroceryEstimate({ basketSize, productType, animalProducts, bagType });

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const logged = await co2Api.saveGrocery({ basketSize, productType, animalProducts, bagType, nudges: [] });
      setResult({ co2Kg: logged?.co2Kg ?? logged?.log?.co2Kg ?? 0 });
      notifyPointsUpdated();
    } catch (requestError) {
      setError(requestError.message || 'Could not log this order.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-slate-950/40" role="dialog" aria-modal="true" aria-labelledby="grocery-log-title">
      <form onSubmit={submit} className="max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 pb-[calc(5rem+env(safe-area-inset-bottom))] shadow-xl">
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-200" />
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-emerald-700">Grocery footprint</p>
            <h2 id="grocery-log-title" className="mt-1 text-xl font-bold text-slate-900">Log your grocery order?</h2>
          </div>
          <button type="button" onClick={onClose} className="min-h-11 min-w-11 rounded-full text-2xl text-slate-500" aria-label="Close">×</button>
        </div>

        {result === null ? (
          <>
            {/* Basket size */}
            <p className="mt-5 text-sm font-semibold text-slate-700">Basket size</p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {[['small', 'Small', '🧺'], ['medium', 'Medium', '🛒'], ['large', 'Large', '📦']].map(([value, label, icon]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setBasketSize(value)}
                  className={`flex min-h-14 flex-col items-center justify-center rounded-xl border text-sm font-semibold transition ${
                    basketSize === value ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-600'
                  }`}
                >
                  <span className="text-xl" aria-hidden="true">{icon}</span>
                  {label}
                </button>
              ))}
            </div>

            {/* Product type */}
            <p className="mt-4 text-sm font-semibold text-slate-700">Mostly</p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {[['fresh', 'Fresh', '🥦'], ['mix', 'Mix', '🥗'], ['packaged', 'Packaged', '🥫']].map(([value, label, icon]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setProductType(value)}
                  className={`flex min-h-14 flex-col items-center justify-center rounded-xl border text-sm font-semibold transition ${
                    productType === value ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-600'
                  }`}
                >
                  <span className="text-xl" aria-hidden="true">{icon}</span>
                  {label}
                </button>
              ))}
            </div>

            {/* Animal products */}
            <p className="mt-4 text-sm font-semibold text-slate-700">Includes meat / dairy / eggs?</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {[[true, 'Yes', '🥩'], [false, 'No', '🌿']].map(([value, label, icon]) => (
                <button
                  key={String(value)}
                  type="button"
                  onClick={() => setAnimalProducts(value)}
                  className={`flex min-h-12 items-center justify-center gap-2 rounded-xl border font-semibold transition ${
                    animalProducts === value ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-600'
                  }`}
                >
                  <span aria-hidden="true">{icon}</span> {label}
                </button>
              ))}
            </div>

            {/* Bag type */}
            <p className="mt-4 text-sm font-semibold text-slate-700">Bag type</p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {[['plastic', 'Plastic', '🛍️'], ['paper', 'Paper', '🧻'], ['none', 'No bag', '✋']].map(([value, label, icon]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setBagType(value)}
                  className={`flex min-h-14 flex-col items-center justify-center rounded-xl border text-sm font-semibold transition ${
                    bagType === value ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-600'
                  }`}
                >
                  <span className="text-xl" aria-hidden="true">{icon}</span>
                  {label}
                </button>
              ))}
            </div>

            {/* Live estimate preview */}
            <div className="mt-5 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
              <span className="text-sm font-semibold text-slate-600">Estimated CO₂</span>
              <span className="text-lg font-bold text-slate-900">{estimatedCo2.toFixed(2)} kg</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">Average-based estimate; actual emissions may vary. Delivery uses a fixed average.</p>

            {error && <p className="mt-3 text-sm text-red-600" role="alert">{error}</p>}

            <div className="mt-5 flex gap-3">
              <button type="button" onClick={onClose} className="min-h-12 flex-1 rounded-xl border border-slate-200 px-4 font-semibold text-slate-700">
                Not now
              </button>
              <button type="submit" disabled={saving} className="min-h-12 flex-1 rounded-xl bg-emerald-600 px-4 font-semibold text-white disabled:opacity-50">
                {saving ? 'Saving…' : 'Log order'}
              </button>
            </div>
            <button type="button" onClick={onClose} className="mt-3 min-h-11 w-full text-sm font-semibold text-slate-500">
              Skip
            </button>
          </>
        ) : (
          <div className="mt-6">
            <p className="text-sm font-medium text-emerald-700">Saved to your CO₂ log</p>
            <div className="mt-3 rounded-2xl bg-slate-100 p-5 text-center">
              <p className="text-3xl font-bold text-slate-700">{Number(result.co2Kg).toFixed(2)} kg</p>
              <p className="mt-1 text-sm text-slate-500">CO₂e emitted (estimate)</p>
            </div>
            <button type="button" onClick={onClose} className="mt-5 min-h-12 w-full rounded-xl bg-emerald-600 px-4 font-semibold text-white">
              Done
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

