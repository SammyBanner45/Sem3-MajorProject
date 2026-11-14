import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, ArrowRight, Sparkles } from 'lucide-react';
import AddAppModal from './AddAppModal';
import { appsApi, rewardsApi } from './api';
import FoodNudgeSheet from './FoodNudgeSheet';
import GroceryNudgeSheet from './GroceryNudgeSheet';
import GroceryLogPrompt from './GroceryLogPrompt';
import TravelEstimateSheet from './TravelEstimateSheet';
import FoodLogPrompt from './FoodLogPrompt';
import usePendingFoodLog from './usePendingFoodLog';

export default function AppLauncherPage() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState(null);
  const [storePreview, setStorePreview] = useState([]);
  // grocery: 'nudge' shows pre-open sheet; 'log' shows post-order log prompt
  const [groceryPhase, setGroceryPhase] = useState(null); // null | 'nudge' | 'log'
  const { pendingLog, refresh: refreshPendingFood } = usePendingFoodLog();
  // Track which pending log IDs the user has already seen/dismissed this session
  // so the prompt does not pop up again automatically on page re-mount.
  const dismissedLogIds = useRef(new Set());
  const [showFoodPrompt, setShowFoodPrompt] = useState(false);

  // When a new pending log arrives (freshly created by opening a food app),
  // show the prompt — but only if we haven't already dismissed it this session.
  useEffect(() => {
    if (pendingLog && !dismissedLogIds.current.has(pendingLog.id)) {
      // Only auto-show if this log was created within the last 10 minutes
      // (i.e. the user just opened a food app now, not a stale log from yesterday)
      const ageMs = Date.now() - Date.parse(pendingLog.createdAt);
      if (ageMs < 10 * 60 * 1000) {
        setShowFoodPrompt(true);
      }
    }
  }, [pendingLog]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [appsList, rewardsData] = await Promise.all([
        appsApi.list(),
        rewardsApi.list().catch(() => null)
      ]);
      setApps(appsList);
      if (rewardsData?.rewards) {
        setStorePreview(rewardsData.rewards.slice(0, 3));
      }
      setError('');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  async function addApp(app) {
    setSaving(true);
    try { await appsApi.create(app); setShowAdd(false); await loadData(); } catch (requestError) { setError(requestError.message); } finally { setSaving(false); }
  }

  async function removeApp(id) {
    if (!window.confirm('Remove this shortcut?')) return;
    try { await appsApi.remove(id); setApps((current) => current.filter((app) => app.id !== id)); } catch (requestError) { setError(requestError.message); }
  }

  return (
    <main className="mx-auto min-h-[100dvh] w-full max-w-md space-y-6 px-4 pb-12 pt-5 text-on-surface">
      {/* Header */}
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-primary-container">EcoSync</p>
          <h1 className="text-2xl font-bold tracking-tight text-on-surface">Your apps</h1>
        </div>
        <button type="button" onClick={() => setShowAdd(true)} className="min-h-11 rounded-xl bg-primary-container px-4 text-sm font-bold text-on-primary-container shadow-card transition hover:brightness-105">
          + Add app
        </button>
      </header>

      {/* Error alert */}
      {error && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-red-400/30 bg-red-950/40 p-3 text-sm text-red-200" role="alert">
          <span>{error}</span>
          <button type="button" onClick={loadData} className="min-h-10 font-bold text-red-100 underline">Retry</button>
        </div>
      )}

      {/* App Shortcuts Grid */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-28 animate-pulse rounded-2xl bg-surface-container" />
          ))}
        </div>
      ) : apps.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-outline-variant bg-surface-container p-6 text-center shadow-card">
          <p className="text-3xl">🌱</p>
          <h2 className="mt-2 font-bold text-on-surface">No shortcuts yet</h2>
          <p className="mt-1 text-sm text-on-surface-variant">Add your everyday travel, food, or grocery apps.</p>
          <button type="button" onClick={() => setShowAdd(true)} className="mt-4 min-h-11 rounded-xl bg-primary-container px-4 font-bold text-on-primary-container">
            Add your first app
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {apps.map((app) => (
          <div key={app.id} className="relative rounded-2xl border border-outline-variant bg-surface-container p-3 shadow-card transition hover:border-primary-container/60">
              <button type="button" onClick={() => setSelected(app)} className="flex min-h-24 w-full flex-col items-center justify-center rounded-xl text-center active:bg-surface-container-high">
                <span className="text-3xl" aria-hidden="true">{app.icon}</span>
                <span className="mt-2 text-sm font-bold text-on-surface">{app.name}</span>
                <span className="mt-1 text-[11px] capitalize text-on-surface-variant">{app.category}</span>
              </button>
              <button type="button" onClick={() => removeApp(app.id)} className="absolute right-2 top-2 min-h-10 min-w-10 rounded-full text-lg text-on-surface-variant hover:text-red-300" aria-label={`Remove ${app.name}`}>
                ⋮
              </button>
            </div>
          ))}
        </div>
      )}

      {/* In-App Store Section */}
      <section className="rounded-3xl border border-outline-variant bg-surface-container p-4 shadow-card sm:p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary-container text-on-primary-container shadow-card">
              <ShoppingBag className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-sm font-extrabold text-on-surface">Green Marketplace</h2>
              <p className="text-[11px] text-on-surface-variant">Spend your saved carbon points</p>
            </div>
          </div>
          <Link
            to="/rewards"
            className="flex items-center gap-1 rounded-full border border-primary-container/40 bg-surface-container-high px-3 py-2 text-xs font-bold text-primary-container shadow-card transition hover:bg-surface-container-highest"
          >
            <span>Visit Store</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Featured Store Items */}
        {storePreview.length > 0 && (
          <div className="mt-3.5 grid grid-cols-3 gap-2">
            {storePreview.map((item) => (
              <Link
                key={item.id}
                to="/rewards"
                className="group flex flex-col items-center rounded-2xl border border-outline-variant bg-surface-container-high p-2.5 text-center shadow-card transition hover:border-primary-container/60"
              >
                <span className="text-2xl">{item.icon}</span>
                <span className="mt-1.5 line-clamp-1 text-[11px] font-bold text-on-surface group-hover:text-primary-container">
                  {item.title}
                </span>
                <span className="mt-0.5 text-[10px] font-semibold text-primary-container">
                  🪙 {item.cost} pts
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Modals & Bottom Sheets */}
      {showAdd && <AddAppModal onClose={() => setShowAdd(false)} onSave={addApp} saving={saving} />}
      {selected && (
        selected.category === 'travel' ? (
          <TravelEstimateSheet app={selected} onClose={() => setSelected(null)} />
        ) : selected.category === 'grocery' ? (
          <GroceryNudgeSheet
            app={selected}
            onClose={() => setSelected(null)}
            onOpenApp={(nudges) => {
              // Open the app then show the post-order log prompt
              const appWindow = window.open('', '_blank');
              if (appWindow) appWindow.location.href = selected.url;
              else {
                const link = document.createElement('a');
                link.href = selected.url;
                link.target = '_blank';
                link.rel = 'noreferrer';
                link.click();
              }
              setSelected(null);
              setGroceryPhase('log');
            }}
          />
        ) : (
          <FoodNudgeSheet app={selected} onClose={() => setSelected(null)} onPendingCreated={refreshPendingFood} />
        )
      )}
      {groceryPhase === 'log' && (
        <GroceryLogPrompt onClose={() => setGroceryPhase(null)} />
      )}
      {pendingLog && showFoodPrompt && (
        <FoodLogPrompt
          pendingLog={pendingLog}
          onClose={() => {
            if (pendingLog?.id) dismissedLogIds.current.add(pendingLog.id);
            setShowFoodPrompt(false);
          }}
        />
      )}
    </main>
  );
}
