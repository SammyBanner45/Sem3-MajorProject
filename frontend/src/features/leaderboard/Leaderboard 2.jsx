import React, { useEffect, useState } from 'react';
import { LoaderCircle, Medal, Trophy } from 'lucide-react';
import { apiFetch } from '../../lib/api.js';

function isLeaderboardResponse(value) {
  return value && value.period && typeof value.period.month === 'string' &&
    typeof value.period.timeZone === 'string' && Array.isArray(value.leaders) &&
    value.leaders.every((leader) => leader && Number.isInteger(leader.rank) &&
      typeof leader.displayName === 'string' && Number.isFinite(leader.points));
}

function monthLabel(month) {
  const [year, number] = month.split('-').map(Number);
  return new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(Date.UTC(year, number - 1, 1)));
}

function rankStyle(rank) {
  if (rank === 1) return 'bg-amber-400 text-white';
  if (rank === 2) return 'bg-slate-300 text-slate-700';
  if (rank === 3) return 'bg-amber-700 text-white';
  return 'bg-gray-100 text-gray-600';
}

export default function Leaderboard() {
  const [state, setState] = useState({ period: null, leaders: [], winner: null, loading: true, error: '' });

  useEffect(() => {
    const controller = new AbortController();
    setState({ period: null, leaders: [], winner: null, loading: true, error: '' });
    apiFetch('/api/leaderboard', { signal: controller.signal })
      .then((response) => {
        if (!isLeaderboardResponse(response)) throw new Error('The leaderboard service returned an invalid response.');
        setState({ ...response, loading: false, error: '' });
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setState({ period: null, leaders: [], winner: null, loading: false, error: error.message || 'The leaderboard is unavailable right now.' });
        }
      });
    return () => controller.abort();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Monthly Leaderboard</h1>
          <p className="text-xs text-gray-500">
            {state.period ? `${monthLabel(state.period.month)} · approved points · ${state.period.timeZone}` : 'Approved points this month'}
          </p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-100 text-purple-600">
          <Trophy className="h-5 w-5" aria-hidden="true" />
        </div>
      </div>

      {state.loading && <div className="flex items-center gap-2 rounded-2xl border border-gray-100 bg-white p-4 text-sm text-gray-600" role="status">
        <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> Loading this month’s leaderboard…
      </div>}

      {!state.loading && state.error && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800" role="alert">{state.error}</div>}

      {!state.loading && !state.error && state.leaders.length === 0 && <div className="rounded-2xl border border-gray-200 bg-white p-5 text-sm text-gray-600" role="status">
        No approved points have been recorded this month yet.
      </div>}

      {!state.loading && !state.error && state.leaders.length > 0 && <>
        {state.winner && <section className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4" aria-label="EcoSync of the Month">
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-800">
            <Medal className="h-3.5 w-3.5" aria-hidden="true" /> EcoSync of the Month
          </span>
          <p className="mt-1 text-lg font-extrabold text-gray-900">{state.winner.displayName}</p>
          <p className="text-sm font-semibold text-eco-700">{state.winner.points} pts</p>
        </section>}

        <ol className="space-y-2" aria-label="Monthly leaderboard rankings">
          {state.leaders.map((leader) => (
            <li key={`${leader.rank}-${leader.displayName}`} className={`flex items-center justify-between gap-3 rounded-2xl border p-3.5 ${leader.rank === 1 ? 'border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 shadow-sm' : 'border-gray-100 bg-white'}`}>
              <div className="flex min-w-0 items-center gap-3">
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${rankStyle(leader.rank)}`} aria-label={`Rank ${leader.rank}`}>
                  {leader.rank}
                </span>
                <p className="truncate text-sm font-semibold text-gray-800">{leader.displayName}</p>
              </div>
              <span className="shrink-0 text-sm font-bold text-eco-700">{leader.points} pts</span>
            </li>
          ))}
        </ol>
      </>}
    </div>
  );
}
