import { useEffect, useMemo, useRef, useState } from 'react';
import { co2Api, notifyPointsUpdated } from './api';

const vehicleLabels = {
  walk: 'Walk', bicycle: 'Bicycle', metro: 'Metro', bus: 'Bus', cab_ev: 'EV cab', motorbike: 'Motorbike', auto_rickshaw: 'Auto rickshaw', cab_petrol: 'Petrol cab'
};

export default function TravelEstimateSheet({ app, onClose }) {
  const [pickup, setPickup] = useState('');
  const [drop, setDrop] = useState('');
  const [estimate, setEstimate] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [loading, setLoading] = useState(false);
  const [locationMessage, setLocationMessage] = useState('');
  const [error, setError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [saveResult, setSaveResult] = useState(null);
  const requestNumber = useRef(0);

  useEffect(() => {
    if (!pickup.trim() || !drop.trim()) {
      setEstimate(null);
      setSelectedVehicle('');
      return undefined;
    }
    const currentRequest = requestNumber.current + 1;
    requestNumber.current = currentRequest;
    const timer = setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const result = await co2Api.estimateTravel({ origin: pickup.trim(), destination: drop.trim() });
        if (currentRequest !== requestNumber.current) return;
        setEstimate(result);
        const lowest = Object.entries(result.emissions || {}).sort((first, second) => first[1] - second[1])[0]?.[0] || '';
        setSelectedVehicle(lowest);
      } catch (requestError) {
        if (currentRequest === requestNumber.current) {
          setEstimate(null);
          setError(requestError.message || 'Could not estimate this route.');
        }
      } finally {
        if (currentRequest === requestNumber.current) setLoading(false);
      }
    }, 450);
    return () => clearTimeout(timer);
  }, [pickup, drop]);

  const lowestVehicle = useMemo(() => {
    if (!estimate?.emissions) return '';
    return Object.entries(estimate.emissions).sort((first, second) => first[1] - second[1])[0]?.[0] || '';
  }, [estimate]);

  function useCurrentLocation() {
    setLocationMessage('');
    if (!navigator.geolocation) {
      setLocationMessage('Location is unavailable. Type your pickup instead.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setPickup(`${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`);
        setLocationMessage('Current location added.');
      },
      () => setLocationMessage('Location permission was denied. Type your pickup instead.'),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  }

  async function continueToApp(event) {
    event.preventDefault();
    if (!estimate || !selectedVehicle) return;
    setSaveError('');
    const appWindow = window.open('', '_blank');
    try {
      const result = await co2Api.saveTravel({ origin: pickup.trim(), destination: drop.trim(), chosenVehicle: selectedVehicle });
      setSaveResult(result);
      notifyPointsUpdated();
    } catch (requestError) {
      setSaveError(requestError.message || 'Your estimate could not be saved, but you can still continue.');
    } finally {
      if (appWindow) {
        appWindow.location.href = app.url;
      } else {
        const link = document.createElement('a');
        link.href = app.url;
        link.target = '_blank';
        link.rel = 'noreferrer';
        link.click();
      }
    }
  }

  const emissions = estimate?.emissions || {};

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-slate-950/40" role="dialog" aria-modal="true" aria-labelledby="travel-estimate-title">
      <div className="max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 pb-[calc(5rem+env(safe-area-inset-bottom))] shadow-xl">
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-200" />
        <div className="flex items-start justify-between gap-3">
          <div><p className="text-sm font-medium text-emerald-700">Travel estimate</p><h2 id="travel-estimate-title" className="mt-1 text-xl font-bold text-slate-900">Before opening {app.name}</h2></div>
          <button type="button" onClick={onClose} className="min-h-11 min-w-11 rounded-full text-2xl text-slate-500" aria-label="Close">×</button>
        </div>
        <div className="mt-5 space-y-3">
          <div><label htmlFor="travel-pickup" className="text-sm font-semibold text-slate-700">Pickup</label><div className="mt-1 flex gap-2"><input id="travel-pickup" value={pickup} onChange={(event) => setPickup(event.target.value)} placeholder="Enter pickup location" inputMode="text" autoComplete="street-address" className="min-h-12 min-w-0 flex-1 rounded-xl border border-slate-200 px-3 text-base" /><button type="button" onClick={useCurrentLocation} className="min-h-12 rounded-xl border border-emerald-200 px-3 text-xs font-bold text-emerald-700">Use my location</button></div>{locationMessage && <p className="mt-1 text-xs text-slate-500">{locationMessage}</p>}</div>
          <div><label htmlFor="travel-drop" className="text-sm font-semibold text-slate-700">Drop</label><input id="travel-drop" value={drop} onChange={(event) => setDrop(event.target.value)} placeholder="Enter destination" inputMode="text" autoComplete="street-address" className="mt-1 min-h-12 w-full rounded-xl border border-slate-200 px-3 text-base" /></div>
        </div>
        {loading && <p className="mt-5 text-sm text-slate-500" role="status">Calculating route…</p>}
        {error && <p className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>}
        {estimate && !loading && <div className="mt-5"><div className="flex items-center justify-between"><h3 className="font-bold text-slate-900">Choose a vehicle</h3><span className="text-xs text-slate-500">{estimate.distanceKm?.toFixed?.(1) || estimate.distanceKm} km</span></div><div className="mt-3 space-y-2">{Object.entries(emissions).map(([vehicle, value]) => <button key={vehicle} type="button" onClick={() => setSelectedVehicle(vehicle)} className={`flex min-h-16 w-full items-center justify-between rounded-xl border p-3 text-left ${selectedVehicle === vehicle ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-white'}`}><span><span className="block font-semibold text-slate-900">{vehicleLabels[vehicle] || vehicle}</span>{vehicle === lowestVehicle && <span className="text-xs font-medium text-emerald-700">Lowest emission</span>}</span><span className="text-right"><span className="block font-bold text-slate-900">{Number(value).toFixed(3)} kg</span>{estimate.approximate && <span className="text-[11px] text-amber-700">Approximate</span>}</span></button>)}</div></div>}
        <p className="mt-5 text-xs leading-5 text-slate-500">Estimates use average emission factors and may differ from actual emissions.</p>
        {saveError && <p className="mt-2 text-xs text-slate-500" role="status">{saveError}</p>}
        {saveResult && <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4"><p className="text-sm font-bold text-emerald-800">{saveResult.capReached ? 'Daily limit reached (5 pts)' : `+${Number(saveResult.pointsEarned || 0).toFixed(2)} pts earned`}</p>{saveResult.reason && <p className="mt-1 text-xs text-slate-600">{saveResult.reason}</p>}<p className="mt-2 text-xs text-slate-600">Trip saved as an estimate.</p></div>}
        <div className="mt-4 flex gap-3"><button type="button" onClick={onClose} className="min-h-12 flex-1 rounded-xl border border-slate-200 px-4 font-semibold text-slate-700">Close</button><button type="button" onClick={continueToApp} disabled={!estimate || loading || !selectedVehicle} className="min-h-12 flex-1 rounded-xl bg-emerald-600 px-4 font-semibold text-white disabled:opacity-50">Continue to {app.name}</button></div>
      </div>
    </div>
  );
}
