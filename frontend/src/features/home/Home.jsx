import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider.jsx';
import { apiFetch } from '../../lib/api.js';
import { fetchMyStats } from '../profile/profileStats.js';
import { getTimeUntilLocalReset } from '../../lib/dailyReset.js';

export default function Home() {
  const { user } = useAuth();
  const [progress, setProgress] = useState({ completed: 0, total: 0 });
  const [currentStreak, setCurrentStreak] = useState(null);
  const [countdown, setCountdown] = useState(() => getTimeUntilLocalReset());
  const name = user?.displayName?.trim() || 'Alex';

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const [tasks, submissions, stats] = await Promise.all([
          apiFetch('/api/tasks'),
          apiFetch('/api/submissions/mine'),
          fetchMyStats(user?.id),
        ]);
        if (!active) return;
        const todayKey = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
        const completedIds = new Set((Array.isArray(submissions) ? submissions : [])
          .filter((submission) => submission.status === 'approved')
          .filter((submission) => {
            const date = new Date(submission.date || submission.createdAt);
            return !Number.isNaN(date.getTime()) && new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(date) === todayKey;
          })
          .map((submission) => submission.taskId));
        setProgress({ total: Array.isArray(tasks) ? tasks.length : 0, completed: completedIds.size });
        setCurrentStreak(stats.currentStreak);
      } catch {
        if (active) { setProgress({ completed: 0, total: 0 }); setCurrentStreak(null); }
      }
    };
    load();
    return () => { active = false; };
  }, [user?.id]);

  useEffect(() => {
    const update = () => setCountdown(getTimeUntilLocalReset());
    update();
    const timer = window.setInterval(update, 60000);
    return () => window.clearInterval(timer);
  }, []);

  const milestones = [7, 15, 30];
  const nextMilestone = milestones.find((milestone) => milestone > (currentStreak || 0)) || (Math.floor((currentStreak || 0) / 60) + 1) * 60;
  const daysToReward = nextMilestone - (currentStreak || 0);

  return (
    <div className="flex flex-col gap-space-lg select-none pb-8 max-w-md mx-auto">
      {/* Friendly Morning Greeting */}
      <section className="flex flex-col gap-1 pt-space-xs">
        <div className="flex items-center justify-between">
          <h1 className="font-headline-lg-mobile text-2xl font-black text-primary tracking-tight uppercase">
            Good Morning, {name}!
          </h1>
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-surface-container text-primary-container shadow">
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              wb_sunny
            </span>
          </span>
        </div>
        <p className="font-body-md text-xs text-on-surface-variant font-medium">
          Ready for today's eco actions?
        </p>
      </section>

      {/* Hero Streak Card (Smooth Gradient, Chunky Tactical Depth) */}
      <Link
        to="/streak"
        className="relative overflow-hidden rounded-2xl p-space-lg bg-gradient-to-br from-[#a3f542] to-[#3b82f6] text-surface-container-lowest shadow-[0_4px_0_#1b4332] active:translate-y-0.5 transition-transform block border border-white/20"
      >
        <div className="flex items-start justify-between gap-space-sm mb-2">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-surface-container-lowest/20 backdrop-blur-sm">
              <span className="material-symbols-outlined text-[26px] text-[#facc15]" style={{ fontVariationSettings: "'FILL' 1" }}>
                local_fire_department
              </span>
            </div>
            <span className="font-label-chunky text-[11px] tracking-wider uppercase bg-surface-container-lowest/15 px-2.5 py-1 rounded-full text-surface-container-lowest font-black">
              Streak Active
            </span>
          </div>
          <span className="material-symbols-outlined text-surface-container-lowest/70 text-[20px]">bolt</span>
        </div>

        <div className="flex flex-col mb-3">
          <h2 className="font-display-hero-mobile text-3xl tracking-tight leading-none text-surface-container-lowest uppercase font-black">
            {currentStreak ?? '—'} Day Streak
          </h2>
          <p className="font-body-md text-xs text-surface-container-lowest/85 font-bold mt-1">
            Keep it burning today! You're crushing it.
          </p>
        </div>

        {/* Progress Track to Reward */}
        <div className="flex flex-col gap-1.5 pt-2 bg-surface-container-lowest/15 backdrop-blur-sm rounded-xl p-2.5">
          <div className="flex items-center justify-between font-label-mono-num text-[11px] text-surface-container-lowest font-black">
            <span>{daysToReward} days left for next reward</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-surface-container-lowest/30 overflow-hidden p-0.5">
            <div
              className="h-full rounded-full bg-surface-container-lowest transition-all duration-500"
              style={{ width: `${Math.min(100, ((currentStreak || 0) / nextMilestone) * 100)}%` }}
            />
          </div>
        </div>
      </Link>

      {/* Daily Challenges Card */}
      <Link
        to="/challenges"
        className="w-full text-left rounded-2xl bg-surface-container-low p-space-md shadow-[0_3px_0_#0a0f0d] border border-surface-container-high/60 active:translate-y-[2px] transition-all flex flex-col gap-space-sm group block"
      >
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <span className="font-headline-md text-base tracking-wide text-primary uppercase font-bold">
              Daily Challenges
            </span>
            <span className="inline-flex items-center gap-1 font-label-mono-num text-[10px] text-tertiary-container bg-surface-container px-2 py-0.5 rounded-full font-bold">
              <span className="material-symbols-outlined text-[12px]">timer</span>
              Ends in {countdown}
            </span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-[#facc15] group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              emoji_events
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between text-on-surface-variant font-label-mono-num text-[11px]">
          <span>{progress.completed} of {progress.total} completed</span>
        </div>

        <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container-highest">
          <div className="h-full rounded-full bg-primary-container transition-all duration-500" style={{ width: `${progress.total ? Math.min(100, (progress.completed / progress.total) * 100) : 0}%` }} />
        </div>
      </Link>

      {/* Quick Launch Cards */}
      <section className="grid grid-cols-2 gap-3 pt-1">
        <Link
          to="/activities"
          className="p-4 bg-surface-container rounded-2xl border border-surface-container-high/60 shadow-[0_3px_0_#0a0f0d] flex flex-col justify-between gap-3 active:translate-y-0.5 transition-all"
        >
          <div className="w-10 h-10 rounded-xl bg-primary-container/20 text-primary-container flex items-center justify-center">
            <span className="material-symbols-outlined text-[22px]">explore</span>
          </div>
          <div>
            <h3 className="font-title-md text-sm text-primary font-bold uppercase">All Quests</h3>
            <p className="font-body-md text-[11px] text-on-surface-variant mt-0.5">30 tasks ready</p>
          </div>
        </Link>

        <Link
          to="/apps"
          className="p-4 bg-surface-container rounded-2xl border border-surface-container-high/60 shadow-[0_3px_0_#0a0f0d] flex flex-col justify-between gap-3 active:translate-y-0.5 transition-all"
        >
          <div className="w-10 h-10 rounded-xl bg-secondary-container/30 text-secondary-fixed flex items-center justify-center">
            <span className="material-symbols-outlined text-[22px]">apps</span>
          </div>
          <div>
            <h3 className="font-title-md text-sm text-primary font-bold uppercase">Log CO2</h3>
            <p className="font-body-md text-[11px] text-on-surface-variant mt-0.5">Log travel, food &amp; grocery</p>
          </div>
        </Link>
      </section>
    </div>
  );
}
