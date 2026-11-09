import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarCheck2, Compass, Flame, LayoutGrid, Sparkles } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider.jsx';
import useStreak from '../streak/useStreak.js';

const destinations = [
  {
    to: '/activities',
    title: 'Activities',
    description: 'Choose a small action and make today a little greener.',
    icon: Compass,
    iconStyle: 'bg-eco-100 text-eco-700',
  },
  {
    to: '/challenges',
    title: 'Daily Challenge',
    description: 'Take on today’s featured sustainability challenge.',
    icon: Sparkles,
    iconStyle: 'bg-amber-100 text-amber-700',
  },
  {
    to: '/apps',
    title: 'App Launcher',
    description: 'Explore travel and food tools with a lighter footprint.',
    icon: LayoutGrid,
    iconStyle: 'bg-sky-100 text-sky-700',
  },
];

function greetingForHour(hour) {
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function Home() {
  const { user } = useAuth();
  const { streak, loading, error } = useStreak();
  const name = user?.displayName?.trim() || 'EcoSync member';
  const greeting = greetingForHour(new Date().getHours());

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-4 sm:space-y-8">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-eco-700 via-eco-800 to-emerald-950 p-6 text-white shadow-lg shadow-eco-900/10 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-eco-100">{greeting}</p>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">{name}</h1>
            <p className="mt-3 max-w-lg text-sm leading-6 text-emerald-50/90">
              Small actions become lasting habits. What will you do for the planet today?
            </p>
          </div>
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/10 text-eco-100 ring-1 ring-white/15">
            <CalendarCheck2 className="h-6 w-6" aria-hidden="true" />
          </div>
        </div>

        <Link to="/streak" className="mt-6 flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm transition hover:bg-white/15 focus:outline-none focus:ring-4 focus:ring-white/30" aria-label="View your streak">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-orange-300/20 text-orange-100">
            <Flame className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-eco-100">Today’s streak</p>
            {loading ? (
              <p className="mt-0.5 text-sm text-white/80" role="status">Loading activity summary…</p>
            ) : streak ? (
              <p className="mt-0.5 text-lg font-bold">{streak.currentStreak} {streak.currentStreak === 1 ? 'day' : 'days'}</p>
            ) : (
              <p className="mt-0.5 text-sm text-white/80">Streak data is unavailable right now.</p>
            )}
          </div>
          {streak?.currentStreak === 0 && !loading && <span className="text-xs text-white/75">Start with one approved activity</span>}
        </Link>
        {error && <p className="mt-2 text-xs leading-5 text-eco-100" role="status">{error}</p>}
      </section>

      <section aria-labelledby="explore-title">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 id="explore-title" className="text-xl font-extrabold tracking-tight text-slate-900">Explore EcoSync</h2>
            <p className="mt-1 text-sm text-slate-500">Pick a path to keep your progress moving.</p>
          </div>
          <span className="hidden text-xs font-semibold text-eco-800 sm:inline">Your next step is one tap away</span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {destinations.map(({ to, title, description, icon: Icon, iconStyle }) => (
            <Link key={to} to={to}
              className="group flex min-h-40 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-eco-300 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-eco-100">
              <div className="flex items-start justify-between gap-4">
                <span className={`grid h-11 w-11 place-items-center rounded-xl ${iconStyle}`}>
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <ArrowRight className="mt-1 h-4 w-4 text-slate-400 transition group-hover:translate-x-1 group-hover:text-eco-700" aria-hidden="true" />
              </div>
              <h3 className="mt-4 text-base font-bold text-slate-900">{title}</h3>
              <p className="mt-1 text-sm leading-5 text-slate-600">{description}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
