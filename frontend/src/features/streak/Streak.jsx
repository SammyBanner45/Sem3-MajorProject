import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Flame } from 'lucide-react';
import useStreak from './useStreak.js';

function formatDate(dateKey) {
  if (!dateKey) return 'No approved activity yet';
  return new Intl.DateTimeFormat(undefined, {
    timeZone: 'Asia/Kolkata', year: 'numeric', month: 'long', day: 'numeric',
  }).format(new Date(`${dateKey}T00:00:00Z`));
}

function encouragement(streak) {
  if (streak === 0) return 'Submit an eco-action and get it approved to start your streak.';
  if (streak < 7) return 'Every approved day builds a greener habit. Keep your momentum going.';
  if (streak < 15) return 'You have built a strong rhythm. Keep showing up for the planet.';
  if (streak < 30) return 'Your consistency is making a difference. Keep the good days coming.';
  return 'Outstanding consistency. Your daily choices are adding up.';
}

export default function Streak() {
  const { streak, loading, error } = useStreak();
  const progress = streak ? Math.min(100, Math.max(0, (streak.currentStreak / streak.nextMilestone) * 100)) : 0;

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-4 sm:space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Your streak</h1>
          <p className="mt-1 text-sm text-slate-600">Consecutive calendar days with an approved eco-action.</p>
        </div>
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-orange-100 text-orange-600" aria-hidden="true">
          <Flame className="h-6 w-6 fill-orange-400" />
        </div>
      </div>

      {loading && <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm" role="status">Loading your approved activity history…</div>}

      {!loading && error && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800" role="alert">{error}</div>}

      {!loading && streak && <>
        <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500 via-amber-500 to-orange-600 p-6 text-white shadow-lg sm:p-8" aria-labelledby="streak-count">
          <div className="flex flex-col items-center text-center">
            <span className="grid h-16 w-16 place-items-center rounded-2xl bg-white/15 ring-1 ring-white/20">
              <Flame className="h-9 w-9 fill-amber-200 text-amber-100" aria-hidden="true" />
            </span>
            <h2 id="streak-count" className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">
              {streak.currentStreak} {streak.currentStreak === 1 ? 'day' : 'days'}
            </h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-orange-50">{encouragement(streak.currentStreak)}</p>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2" aria-label="Streak details">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Last approved day</p>
            <p className="mt-2 font-bold text-slate-900">{formatDate(streak.lastStreakDate)}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Next milestone</p>
            <p className="mt-2 font-bold text-slate-900">{streak.nextMilestone} days</p>
            <p className="mt-1 text-sm text-slate-600">{streak.daysToNext} {streak.daysToNext === 1 ? 'day' : 'days'} to go</p>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" aria-label="Progress to next milestone">
          <div className="mb-3 flex items-center justify-between gap-3 text-sm">
            <span className="font-semibold text-slate-800">Progress</span>
            <span className="tabular-nums text-slate-600">{streak.currentStreak}/{streak.nextMilestone}</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin="0" aria-valuemax="100" aria-label="Progress toward next streak milestone">
            <div className="h-full rounded-full bg-gradient-to-r from-orange-400 to-amber-500 transition-[width]" style={{ width: `${progress}%` }} />
          </div>
        </section>

        {streak.currentStreak === 0 && (
          <Link to="/activities" className="group flex items-center justify-between gap-4 rounded-2xl border border-eco-200 bg-eco-50 p-5 font-semibold text-eco-900 focus:outline-none focus:ring-4 focus:ring-eco-100">
            Find an activity to get started <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </Link>
        )}
      </>}
    </div>
  );
}
