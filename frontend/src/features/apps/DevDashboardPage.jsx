import { useEffect, useMemo, useState } from 'react';
import factors from '../../data/emissionFactors.json';
import { appsApi, co2Api, hasRealToken, setDevUserId } from './api';
import { appPresets } from './presets';

const endpointRows = [
  ['GET /api/apps', () => appsApi.list()],
  ['POST /api/apps', () => appsApi.create({ name: 'Dev app', category: 'travel', icon: '🧪', url: 'https://example.com/dev-app' })],
  ['DELETE /api/apps/:id', async () => {
    const apps = await appsApi.list();
    let app = apps[0];
    if (!app) app = await appsApi.create({ name: 'Temporary dev app', category: 'travel', icon: '🧪', url: 'https://example.com/temp-dev-app' });
    return appsApi.remove(app.id);
  }],
  ['POST /api/co2/travel/estimate', () => co2Api.estimateTravel({ origin: '12.9716,77.5946', destination: '12.9352,77.6245', vehicle: 'bus' })],
  ['POST /api/co2/travel', () => co2Api.saveTravel({ origin: '12.9716,77.5946', destination: '12.9352,77.6245', vehicle: 'bus' })],
  ['POST /api/co2/food/pending', () => co2Api.pendingFood({ items: 2, isVeg: true, deliveryKm: 3, packaging: true })],
  ['PATCH /api/co2/food/:id', async () => {
    const pending = await co2Api.logs('pending_log');
    const log = pending.find((item) => item.type === 'food');
    if (!log) throw new Error('Create a pending food log first');
    return co2Api.logFood(log.id, { items: 2, isVeg: true, deliveryKm: 3, packaging: true });
  }],
  ['GET /api/co2/logs', () => co2Api.logs()],
  ['GET /api/co2/summary', () => co2Api.summary()]
];

function formatResult(result) {
  return typeof result === 'string' ? result : JSON.stringify(result, null, 2);
}

export default function DevDashboardPage() {
  const [userId, setUserId] = useState('user-1');
  const [results, setResults] = useState({});
  const [running, setRunning] = useState(false);
  const [raw, setRaw] = useState({ apps: [], logs: [], summary: null });
  const [distance, setDistance] = useState(10);
  const [vehicle, setVehicle] = useState('bus');
  const [food, setFood] = useState({ items: 2, isVeg: true, deliveryKm: 3, packaging: true });

  useEffect(() => setDevUserId(userId), [userId]);

  async function refreshRaw() {
    const [apps, logs, summary] = await Promise.all([appsApi.list(), co2Api.logs(), co2Api.summary()]);
    setRaw({ apps, logs, summary });
  }

  async function testEndpoint(index, request) {
    const started = performance.now();
    try {
      const response = await request();
      setResults((current) => ({ ...current, [index]: { ok: true, status: response?.status || 200, time: Math.round(performance.now() - started) } }));
      refreshRaw().catch(() => undefined);
    } catch (error) {
      setResults((current) => ({ ...current, [index]: { ok: false, status: error.status || 'ERR', time: Math.round(performance.now() - started), message: error.message } }));
    }
  }

  async function runAll() {
    setRunning(true);
    for (let index = 0; index < endpointRows.length; index += 1) await testEndpoint(index, endpointRows[index][1]);
    setRunning(false);
  }

  const travelResult = useMemo(() => Number(distance) * (factors.travel[vehicle]?.value || 0), [distance, vehicle]);
  const foodResult = useMemo(() => Number(food.items || 0) * (food.isVeg ? factors.food.vegItem.value : factors.food.nonVegItem.value) + Number(food.deliveryKm || 0) * factors.food.deliveryVehicle.value + (food.packaging ? factors.food.packaging.value : 0), [food]);

  return (
    <section className="space-y-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-slate-800">
      <div><p className="font-bold text-amber-900">Dev dashboard</p><p className="text-xs text-amber-800">Module-only endpoint and calculator checks.</p></div>
      <div className="rounded-xl bg-white p-3">
        <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="dev-user-id">Dev user id</label>
        <input id="dev-user-id" value={userId} onChange={(event) => setUserId(event.target.value)} className="mt-1 min-h-11 w-full rounded-lg border border-slate-200 px-3" />
        <p className="mt-2 text-xs text-slate-500">Auth: <span className="font-semibold">{hasRealToken() ? 'real token' : 'dev stub'}</span></p>
      </div>
      <div className="flex items-center justify-between"><h2 className="font-bold">Endpoints</h2><button type="button" disabled={running} onClick={runAll} className="min-h-11 rounded-lg bg-slate-900 px-4 font-semibold text-white disabled:opacity-50">{running ? 'Running…' : 'Run all'}</button></div>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {endpointRows.map(([label, request], index) => {
          const result = results[index];
          return <div key={label} className="flex items-center gap-2 border-b border-slate-100 p-3 last:border-0"><span className="min-w-0 flex-1 break-words text-xs">{label}</span>{result && <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${result.ok ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{result.ok ? 'OK' : 'ERR'}</span>}<span className="w-12 text-right text-[10px] text-slate-500">{result ? `${result.status} · ${result.time}ms` : '—'}</span><button type="button" onClick={() => testEndpoint(index, request)} className="min-h-10 rounded-lg border border-slate-200 px-2 text-xs font-semibold">Test</button></div>;
        })}
      </div>
      {Object.values(results).some((result) => result.message) && <p className="text-xs text-red-700">Latest error: {Object.values(results).find((result) => result.message)?.message}</p>}
      <div className="rounded-xl bg-white p-3"><h2 className="font-bold">Calculator playground</h2><div className="mt-3 grid grid-cols-2 gap-2"><label className="text-xs">Distance km<input type="number" min="0" value={distance} onChange={(event) => setDistance(event.target.value)} className="mt-1 min-h-10 w-full rounded-lg border px-2" /></label><label className="text-xs">Vehicle<select value={vehicle} onChange={(event) => setVehicle(event.target.value)} className="mt-1 min-h-10 w-full rounded-lg border px-2">{Object.keys(factors.travel).map((item) => <option key={item}>{item}</option>)}</select></label></div><p className="mt-2 font-semibold">Travel: {travelResult.toFixed(3)} kg CO₂e</p><div className="mt-4 grid grid-cols-2 gap-2"><label className="text-xs">Items<input type="number" min="0" value={food.items} onChange={(event) => setFood({ ...food, items: event.target.value })} className="mt-1 min-h-10 w-full rounded-lg border px-2" /></label><label className="text-xs">Delivery km<input type="number" min="0" value={food.deliveryKm} onChange={(event) => setFood({ ...food, deliveryKm: event.target.value })} className="mt-1 min-h-10 w-full rounded-lg border px-2" /></label></div><label className="mt-3 flex min-h-11 items-center gap-2 text-xs"><input type="checkbox" checked={food.isVeg} onChange={(event) => setFood({ ...food, isVeg: event.target.checked })} /> Vegetarian</label><label className="flex min-h-11 items-center gap-2 text-xs"><input type="checkbox" checked={food.packaging} onChange={(event) => setFood({ ...food, packaging: event.target.checked })} /> Packaging</label><p className="font-semibold">Food: {foodResult.toFixed(3)} kg CO₂e</p></div>
      <div className="rounded-xl bg-white p-3"><h2 className="font-bold">Raw current-user data</h2><pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap break-words text-[10px]">{formatResult(raw)}</pre><button type="button" onClick={() => refreshRaw().catch(() => undefined)} className="mt-3 min-h-10 rounded-lg border border-slate-200 px-3 text-xs font-semibold">Refresh raw data</button></div>
    </section>
  );
}
