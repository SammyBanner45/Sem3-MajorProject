import { useMemo, useRef, useState } from 'react';
import { MapPin, Navigation, Calculator } from 'lucide-react';
import { co2Api, notifyPointsUpdated } from './api';

const vehicleLabels = {
  walk: 'Walk', bicycle: 'Bicycle', metro: 'Metro', bus: 'Bus', cab_ev: 'EV cab', motorbike: 'Motorbike', auto_rickshaw: 'Auto rickshaw', cab_petrol: 'Petrol cab'
};

// Module-level LRU cache shared across renders — keyed by normalised query string
const SUGGESTION_CACHE = new Map();
const CACHE_MAX = 60;

function cacheGet(query) {
  const key = query.trim().toLowerCase();
  const entry = SUGGESTION_CACHE.get(key);
  if (!entry) return null;
  // Expire after 10 minutes
  if (Date.now() - entry.ts > 10 * 60 * 1000) { SUGGESTION_CACHE.delete(key); return null; }
  return entry.data;
}

function cacheSet(query, data) {
  const key = query.trim().toLowerCase();
  if (SUGGESTION_CACHE.size >= CACHE_MAX) {
    // Evict oldest entry
    SUGGESTION_CACHE.delete(SUGGESTION_CACHE.keys().next().value);
  }
  SUGGESTION_CACHE.set(key, { data, ts: Date.now() });
}

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

  // Suggestions state
  const [pickupSuggestions, setPickupSuggestions] = useState([]);
  const [dropSuggestions, setDropSuggestions] = useState([]);
  const [showPickupList, setShowPickupList] = useState(false);
  const [showDropList, setShowDropList] = useState(false);

  const pickupSearchTimeout = useRef(null);
  const dropSearchTimeout = useRef(null);

  // Search pickup suggestions
  function handlePickupChange(val) {
    setPickup(val);
    setShowPickupList(true);
    clearTimeout(pickupSearchTimeout.current);
    if (!val.trim() || val.includes(',')) {
      setPickupSuggestions([]);
      return;
    }
    // Serve from cache immediately (no debounce wait)
    const cached = cacheGet(val);
    if (cached) { setPickupSuggestions(cached); return; }

    pickupSearchTimeout.current = setTimeout(async () => {
      try {
        const list = await co2Api.searchLocations(val);
        cacheSet(val, list);
        setPickupSuggestions(list);
      } catch {
        setPickupSuggestions([]);
      }
    }, 150);
  }

  // Search drop suggestions
  function handleDropChange(val) {
    setDrop(val);
    setShowDropList(true);
    clearTimeout(dropSearchTimeout.current);
    if (!val.trim() || val.includes(',')) {
      setDropSuggestions([]);
      return;
    }
    // Serve from cache immediately (no debounce wait)
    const cached = cacheGet(val);
    if (cached) { setDropSuggestions(cached); return; }

    dropSearchTimeout.current = setTimeout(async () => {
      try {
        const list = await co2Api.searchLocations(val);
        cacheSet(val, list);
        setDropSuggestions(list);
      } catch {
        setDropSuggestions([]);
      }
    }, 150);
  }

  // Calculate distance only when user clicks the "Calculate Route" button
  async function handleCalculateRoute(e) {
    e?.preventDefault();
    if (!pickup.trim() || !drop.trim()) {
      setError('Please enter both pickup and destination.');
      return;
    }
    setShowPickupList(false);
    setShowDropList(false);
    setLoading(true);
    setError('');
    setEstimate(null);
    try {
      const result = await co2Api.estimateTravel({ origin: pickup.trim(), destination: drop.trim() });
      setEstimate(result);
      const lowest = Object.entries(result.emissions || {}).sort((first, second) => first[1] - second[1])[0]?.[0] || '';
      setSelectedVehicle(lowest);
    } catch (requestError) {
      setEstimate(null);
      setError(requestError.message || 'Could not estimate this route.');
    } finally {
      setLoading(false);
    }
  }

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
        setLocationMessage('Current GPS coordinates added.');
      },
      () => setLocationMessage('Location permission denied. Type your pickup instead.'),
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
          <div>
            <p className="text-sm font-medium text-emerald-700">Travel estimate</p>
            <h2 id="travel-estimate-title" className="mt-1 text-xl font-bold text-slate-900">Before opening {app.name}</h2>
          </div>
          <button type="button" onClick={onClose} className="min-h-11 min-w-11 rounded-full text-2xl text-slate-500" aria-label="Close">×</button>
        </div>

        <div className="mt-5 space-y-4">
          {/* Pickup Input with Suggestion Dropdown */}
          <div className="relative">
            <label htmlFor="travel-pickup" className="text-sm font-semibold text-slate-700">Pickup</label>
            <div className="mt-1 flex gap-2">
              <input
                id="travel-pickup"
                value={pickup}
                onChange={(event) => handlePickupChange(event.target.value)}
                onFocus={() => setShowPickupList(true)}
                placeholder="Enter pickup place (e.g. Salt Lake, Kolkata)"
                autoComplete="off"
                className="min-h-12 min-w-0 flex-1 rounded-xl border border-slate-200 px-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              />
              <button
                type="button"
                onClick={useCurrentLocation}
                className="flex items-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-xs font-bold text-emerald-700 hover:bg-emerald-100"
              >
                <Navigation className="h-3.5 w-3.5" />
                GPS
              </button>
            </div>
            {locationMessage && <p className="mt-1 text-xs text-slate-500">{locationMessage}</p>}

            {/* Pickup Suggestions Popup */}
            {showPickupList && pickupSuggestions.length > 0 && (
              <ul className="absolute z-30 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
                {pickupSuggestions.map((item, idx) => (
                  <li key={idx}>
                    <button
                      type="button"
                      onClick={() => {
                        setPickup(`${item.latitude.toFixed(6)}, ${item.longitude.toFixed(6)}`);
                        setLocationMessage(item.displayName.split(',').slice(0, 2).join(','));
                        setShowPickupList(false);
                      }}
                      className="flex w-full items-start gap-2 rounded-lg p-2 text-left text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-900"
                    >
                      <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                      <span className="line-clamp-2">{item.displayName}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Drop Input with Suggestion Dropdown */}
          <div className="relative">
            <label htmlFor="travel-drop" className="text-sm font-semibold text-slate-700">Drop</label>
            <input
              id="travel-drop"
              value={drop}
              onChange={(event) => handleDropChange(event.target.value)}
              onFocus={() => setShowDropList(true)}
              placeholder="Enter destination (e.g. Park Street, Kolkata)"
              autoComplete="off"
              className="mt-1 min-h-12 w-full rounded-xl border border-slate-200 px-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            />

            {/* Drop Suggestions Popup */}
            {showDropList && dropSuggestions.length > 0 && (
              <ul className="absolute z-30 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
                {dropSuggestions.map((item, idx) => (
                  <li key={idx}>
                    <button
                      type="button"
                      onClick={() => {
                        setDrop(`${item.latitude.toFixed(6)}, ${item.longitude.toFixed(6)}`);
                        setShowDropList(false);
                      }}
                      className="flex w-full items-start gap-2 rounded-lg p-2 text-left text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-900"
                    >
                      <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                      <span className="line-clamp-2">{item.displayName}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Calculate Route Button */}
          <button
            type="button"
            onClick={handleCalculateRoute}
            disabled={loading || !pickup.trim() || !drop.trim()}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-bold text-white shadow-xs transition hover:bg-slate-800 disabled:opacity-50"
          >
            <Calculator className="h-4 w-4 text-emerald-400" />
            <span>{loading ? 'Calculating Route…' : 'Calculate Distance & CO₂'}</span>
          </button>
        </div>

        {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>}

        {/* Calculation Result */}
        {estimate && !loading && (
          <div className="mt-5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900">Choose a vehicle</h3>
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                {estimate.distanceKm?.toFixed?.(1) || estimate.distanceKm} km
              </span>
            </div>
            <div className="mt-3 space-y-2">
              {Object.entries(emissions).map(([vehicle, value]) => (
                <button
                  key={vehicle}
                  type="button"
                  onClick={() => setSelectedVehicle(vehicle)}
                  className={`flex min-h-16 w-full items-center justify-between rounded-xl border p-3 text-left transition ${
                    selectedVehicle === vehicle ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <span>
                    <span className="block font-semibold text-slate-900">{vehicleLabels[vehicle] || vehicle}</span>
                    {vehicle === lowestVehicle && <span className="text-xs font-medium text-emerald-700">Lowest emission</span>}
                  </span>
                  <span className="text-right">
                    <span className="block font-bold text-slate-900">{Number(value).toFixed(3)} kg</span>
                    {estimate.approximate && <span className="text-[11px] text-amber-700">Approximate</span>}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <p className="mt-5 text-xs leading-5 text-slate-500">Estimates use average emission factors and may differ from actual emissions.</p>
        {saveError && <p className="mt-2 text-xs text-slate-500" role="status">{saveError}</p>}
        {saveResult && (
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm font-bold text-emerald-800">{saveResult.capReached ? 'Daily limit reached (5 pts)' : `+${Number(saveResult.pointsEarned || 0).toFixed(2)} pts earned`}</p>
            {saveResult.reason && <p className="mt-1 text-xs text-slate-600">{saveResult.reason}</p>}
            <p className="mt-2 text-xs text-slate-600">Trip saved as an estimate.</p>
          </div>
        )}

        <div className="mt-4 flex gap-3">
          <button type="button" onClick={onClose} className="min-h-12 flex-1 rounded-xl border border-slate-200 px-4 font-semibold text-slate-700 hover:bg-slate-50">
            Close
          </button>
          <button
            type="button"
            onClick={continueToApp}
            disabled={!estimate || loading || !selectedVehicle}
            className="min-h-12 flex-1 rounded-xl bg-emerald-600 px-4 font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
          >
            Continue to {app.name}
          </button>
        </div>
      </div>
    </div>
  );
}
