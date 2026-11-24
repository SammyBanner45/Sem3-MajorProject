import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider.jsx';
import useStreak from '../streak/useStreak.js';

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { streak } = useStreak();
  const [selectedCategory, setSelectedCategory] = useState('travel');
  const name = user?.displayName?.trim() || 'Alex';
  const currentStreak = streak?.currentStreak ?? 18;

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

      {/* Community Activity Story Avatars */}
      <section className="flex items-center gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 py-1">
        {/* Marcus (Live) */}
        <button
          aria-label="View Marcus live challenge"
          className="flex flex-col items-center gap-1.5 flex-shrink-0 group active:scale-95 transition-transform"
          type="button"
        >
          <div className="relative p-0.5 rounded-full bg-error ring-2 ring-error">
            <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center font-bold text-xs uppercase text-error">
              MA
            </div>
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-error text-surface-container-lowest font-label-chunky text-[9px] px-1.5 py-0.2 rounded-full uppercase tracking-wider font-extrabold shadow-sm">
              LIVE
            </span>
          </div>
          <span className="font-label-mono-num text-[11px] text-on-surface truncate max-w-[62px]">Marcus</span>
        </button>

        {/* Team Green (Glowing Ring) */}
        <button
          aria-label="View Team Green challenge circle"
          className="flex flex-col items-center gap-1.5 flex-shrink-0 group active:scale-95 transition-transform"
          type="button"
        >
          <div className="relative p-0.5 rounded-full bg-primary-container ring-2 ring-primary-container/80 shadow-[0_0_12px_rgba(163,245,66,0.35)]">
            <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center font-bold text-xs uppercase text-primary-container">
              TG
            </div>
            <span className="absolute top-0 right-0 w-3 h-3 bg-primary-container rounded-full ring-2 ring-surface-container-lowest flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-on-primary-fixed"></span>
            </span>
          </div>
          <span className="font-label-mono-num text-[11px] text-primary-container truncate max-w-[62px] font-bold">
            Team Green
          </span>
        </button>

        {/* Priya */}
        <button
          aria-label="View Priya's profile"
          className="flex flex-col items-center gap-1.5 flex-shrink-0 group active:scale-95 transition-transform"
          type="button"
        >
          <div className="relative p-0.5 rounded-full bg-secondary ring-2 ring-secondary/50">
            <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center font-bold text-xs uppercase text-secondary">
              PR
            </div>
          </div>
          <span className="font-label-mono-num text-[11px] text-on-surface truncate max-w-[62px]">Priya</span>
        </button>

        {/* BMTC Commuters */}
        <button
          aria-label="View BMTC Commuters clan"
          className="flex flex-col items-center gap-1.5 flex-shrink-0 group active:scale-95 transition-transform"
          type="button"
        >
          <div className="relative p-0.5 rounded-full bg-tertiary-fixed-dim ring-2 ring-tertiary-fixed-dim/60">
            <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center font-bold text-xs uppercase text-tertiary-fixed">
              BM
            </div>
          </div>
          <span className="font-label-mono-num text-[11px] text-on-surface truncate max-w-[62px]">BMTC</span>
        </button>

        {/* Campus Cycle */}
        <button
          aria-label="View Campus Cycle club"
          className="flex flex-col items-center gap-1.5 flex-shrink-0 group active:scale-95 transition-transform"
          type="button"
        >
          <div className="relative p-0.5 rounded-full bg-surface-variant ring-2 ring-surface-bright">
            <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center font-bold text-xs uppercase text-on-surface">
              CC
            </div>
          </div>
          <span className="font-label-mono-num text-[11px] text-on-surface truncate max-w-[62px]">Campus</span>
        </button>
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
            {currentStreak} Day Streak
          </h2>
          <p className="font-body-md text-xs text-surface-container-lowest/85 font-bold mt-1">
            Keep it burning today! You're crushing it.
          </p>
        </div>

        {/* Progress Track to Reward */}
        <div className="flex flex-col gap-1.5 pt-2 bg-surface-container-lowest/15 backdrop-blur-sm rounded-xl p-2.5">
          <div className="flex items-center justify-between font-label-mono-num text-[11px] text-surface-container-lowest font-black">
            <span>{currentStreak}/21 days logged</span>
            <span>50% Zero-Waste Coupon</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-surface-container-lowest/30 overflow-hidden p-0.5">
            <div
              className="h-full rounded-full bg-surface-container-lowest transition-all duration-500"
              style={{ width: `${Math.min(100, (currentStreak / 21) * 100)}%` }}
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
              ENDS IN 4H
            </span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-[#facc15] group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              emoji_events
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between text-on-surface-variant font-label-mono-num text-[11px]">
          <span>3 OF 7 COMPLETED</span>
          <span className="text-primary-container font-bold">+240 XP Potential</span>
        </div>

        {/* Segmented Progress Bar */}
        <div className="grid grid-cols-7 gap-1.5 w-full pt-1">
          <div className="h-2 rounded bg-primary-container"></div>
          <div className="h-2 rounded bg-primary-container"></div>
          <div className="h-2 rounded bg-primary-container"></div>
          <div className="h-2 rounded bg-surface-container-highest"></div>
          <div className="h-2 rounded bg-surface-container-highest"></div>
          <div className="h-2 rounded bg-surface-container-highest"></div>
          <div className="h-2 rounded bg-surface-container-highest"></div>
        </div>
      </Link>

      {/* Category Filter Selector Tiles */}
      <section className="flex flex-col gap-2">
        <span className="font-label-chunky text-[11px] tracking-wider text-on-surface-variant uppercase font-bold">
          Choose Activity Category
        </span>
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 py-0.5">
          {/* TRAVEL: Mustard Yellow */}
          <button
            onClick={() => setSelectedCategory('travel')}
            className={`cat-pill flex items-center gap-2 px-4 py-2 rounded-xl font-title-md text-xs uppercase font-extrabold flex-shrink-0 transition-transform active:translate-y-[2px] ${
              selectedCategory === 'travel'
                ? 'bg-[#facc15] text-surface-container-lowest shadow-[0_3px_0_#997300]'
                : 'bg-surface-container-low text-on-surface-variant shadow-[0_3px_0_#0a0f0d]'
            }`}
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">directions_subway</span>
            <span>Travel</span>
          </button>

          {/* FOOD: Charcoal Neutral */}
          <button
            onClick={() => setSelectedCategory('food')}
            className={`cat-pill flex items-center gap-2 px-4 py-2 rounded-xl font-title-md text-xs uppercase font-extrabold flex-shrink-0 transition-transform active:translate-y-[2px] ${
              selectedCategory === 'food'
                ? 'bg-[#facc15] text-surface-container-lowest shadow-[0_3px_0_#997300]'
                : 'bg-surface-container-low text-on-surface-variant shadow-[0_3px_0_#0a0f0d]'
            }`}
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">restaurant</span>
            <span>Food</span>
          </button>

          {/* ENERGY */}
          <button
            onClick={() => setSelectedCategory('energy')}
            className={`cat-pill flex items-center gap-2 px-4 py-2 rounded-xl font-title-md text-xs uppercase font-extrabold flex-shrink-0 transition-transform active:translate-y-[2px] ${
              selectedCategory === 'energy'
                ? 'bg-[#facc15] text-surface-container-lowest shadow-[0_3px_0_#997300]'
                : 'bg-surface-container-low text-on-surface-variant shadow-[0_3px_0_#0a0f0d]'
            }`}
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">bolt</span>
            <span>Energy</span>
          </button>
        </div>
      </section>

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
            <h3 className="font-title-md text-sm text-primary font-bold uppercase">Eco Apps</h3>
            <p className="font-body-md text-[11px] text-on-surface-variant mt-0.5">Log travel & food</p>
          </div>
        </Link>
      </section>
    </div>
  );
}
