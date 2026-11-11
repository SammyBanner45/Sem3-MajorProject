import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api.js';

function isLeaderboardResponse(value) {
  return (
    value &&
    value.period &&
    typeof value.period.month === 'string' &&
    typeof value.period.timeZone === 'string' &&
    Array.isArray(value.leaders) &&
    value.leaders.every(
      (leader) =>
        leader &&
        Number.isInteger(leader.rank) &&
        typeof leader.displayName === 'string' &&
        Number.isFinite(leader.points)
    )
  );
}

function monthLabel(month) {
  const [year, number] = month.split('-').map(Number);
  return new Intl.DateTimeFormat(undefined, {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, number - 1, 1)));
}

export default function Leaderboard() {
  const [state, setState] = useState({
    period: null,
    leaders: [],
    winner: null,
    loading: true,
    error: '',
  });
  const [filterView, setFilterView] = useState('everyone');

  useEffect(() => {
    const controller = new AbortController();
    setState({ period: null, leaders: [], winner: null, loading: true, error: '' });
    apiFetch('/api/leaderboard', { signal: controller.signal })
      .then((response) => {
        if (!isLeaderboardResponse(response)) {
          throw new Error('The leaderboard service returned an invalid response.');
        }
        setState({ ...response, loading: false, error: '' });
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setState({
            period: null,
            leaders: [],
            winner: null,
            loading: false,
            error: error.message || 'The leaderboard is unavailable right now.',
          });
        }
      });
    return () => controller.abort();
  }, []);

  const leaders = state.leaders || [];
  const top1 = leaders.find((l) => l.rank === 1) || state.winner || { displayName: 'SolarSam', points: 2450 };
  const top2 = leaders.find((l) => l.rank === 2) || { displayName: 'GreenRider', points: 1890 };
  const top3 = leaders.find((l) => l.rank === 3) || { displayName: 'EcoPriya', points: 1640 };
  const otherLeaders = leaders.filter((l) => l.rank > 3);

  const monthTitle = state.period ? monthLabel(state.period.month).toUpperCase() : 'CURRENT';

  return (
    <div className="flex flex-col gap-space-lg select-none pb-8 max-w-md mx-auto">
      {/* League Title & Countdown */}
      <div className="flex flex-col gap-space-sm pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 bg-surface-container-high px-3 py-1 rounded-full shadow-sm border border-surface-container-highest">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
            <span className="font-label-mono-num text-[11px] text-secondary tracking-wider uppercase font-bold">
              Ends in 4d 18h
            </span>
          </div>
          <div className="flex items-center gap-1 bg-surface-container-high px-3 py-1 rounded-full text-tertiary-fixed font-label-chunky text-[11px] border border-surface-container-highest font-bold">
            <span className="material-symbols-outlined text-[15px] text-tertiary-fixed-dim" style={{ fontVariationSettings: "'FILL' 1" }}>
              shield
            </span>
            <span>TIER IV</span>
          </div>
        </div>

        <div className="flex items-baseline justify-between mt-1">
          <h1 className="font-headline-lg-mobile text-xl font-extrabold text-primary tracking-tight uppercase">
            {monthTitle} LEAGUE: DIAMOND
          </h1>
        </div>

        {/* Segmented Toggle (Friends vs Everyone) */}
        <div className="grid grid-cols-2 p-1 bg-surface-container-lowest rounded-xl shadow-[0_4px_0_#0a0f0d] gap-1 mt-1 border border-surface-container-high">
          <button
            onClick={() => setFilterView('friends')}
            className={`py-2 rounded-lg font-label-chunky text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
              filterView === 'friends'
                ? 'bg-surface-container-highest text-primary-container shadow-[0_2px_0_#171d1a] font-bold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
            type="button"
          >
            <span className="material-symbols-outlined text-[16px]">group</span>
            <span>Friends</span>
          </button>
          <button
            onClick={() => setFilterView('everyone')}
            className={`py-2 rounded-lg font-label-chunky text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
              filterView === 'everyone'
                ? 'bg-surface-container-highest text-primary-container shadow-[0_2px_0_#171d1a] font-bold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
            type="button"
          >
            <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              public
            </span>
            <span>Everyone</span>
          </button>
        </div>
      </div>

      {/* Top 3 Podium Hero Element */}
      <div className="relative flex flex-col pt-8 pb-2 px-1 items-center bg-surface-container-low rounded-2xl shadow-[0_4px_0_#0a0f0d] border border-surface-container-high overflow-hidden">
        <div className="absolute -top-6 inset-x-12 h-20 bg-primary-container/10 blur-2xl pointer-events-none rounded-full"></div>

        <div className="w-full flex items-end justify-center gap-2 relative z-10">
          {/* 2nd Place (Silver) */}
          <div className="flex flex-col items-center flex-1 min-w-0">
            <div className="relative flex flex-col items-center mb-1.5">
              <div className="w-13 h-13 w-12 h-12 rounded-2xl bg-surface-container-highest p-1 shadow-md overflow-hidden relative flex items-center justify-center font-black text-secondary uppercase text-sm border border-secondary/40">
                {top2.displayName.charAt(0)}
              </div>
              <div className="absolute -bottom-2 bg-secondary-fixed text-on-secondary-fixed font-label-mono-num text-[11px] px-2 py-0.2 rounded-full shadow-md font-black flex items-center gap-0.5">
                <span>#2</span>
              </div>
            </div>
            <span className="font-title-md text-xs text-on-surface font-bold truncate max-w-[85px] mt-1">
              @{top2.displayName}
            </span>
            <span className="font-label-mono-num text-[11px] text-secondary font-bold">
              {top2.points} PTS
            </span>
            {/* Tier Riser 90px */}
            <div className="w-full h-[90px] mt-2 rounded-t-xl bg-surface-container-highest flex flex-col items-center justify-start pt-2 shadow-[0_4px_0_#0a0f0d]">
              <span className="material-symbols-outlined text-secondary text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                military_tech
              </span>
              <span className="font-label-chunky text-[10px] text-on-surface-variant tracking-wider uppercase mt-1 font-bold">
                SILVER
              </span>
            </div>
          </div>

          {/* 1st Place (Gold Champion) */}
          <div className="flex flex-col items-center flex-1 min-w-0 relative -top-3">
            <div className="flex items-center gap-1 bg-gradient-to-r from-primary-container to-secondary px-2 py-0.5 rounded-full shadow-[0_2px_8px_rgba(163,245,66,0.3)] mb-1 animate-bounce">
              <span className="material-symbols-outlined text-on-primary-fixed text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                workspace_premium
              </span>
              <span className="font-label-chunky text-[9px] text-on-primary-fixed uppercase tracking-tight font-black">
                MVP
              </span>
            </div>
            <div className="relative flex flex-col items-center mb-1.5">
              <div className="w-16 h-16 rounded-2xl bg-tertiary-fixed-dim p-1 shadow-[0_0_20px_rgba(250,204,21,0.35)] overflow-hidden flex items-center justify-center font-black text-on-tertiary-fixed text-xl border-2 border-tertiary-fixed">
                {top1.displayName.charAt(0)}
              </div>
              <div className="absolute -bottom-2 bg-tertiary-fixed text-on-tertiary-fixed font-label-mono-num text-[11px] px-2 py-0.2 rounded-full shadow-lg font-black flex items-center gap-1">
                <span className="material-symbols-outlined text-[11px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  crown
                </span>
                <span>#1</span>
              </div>
            </div>
            <span className="font-title-md text-xs text-primary font-black truncate max-w-[100px] mt-1">
              @{top1.displayName}
            </span>
            <span className="font-label-mono-num text-[12px] text-primary-container font-extrabold">
              {top1.points} PTS
            </span>
            {/* Tier Riser 120px */}
            <div className="w-full h-[120px] mt-2 rounded-t-2xl bg-surface-container flex flex-col items-center justify-start pt-2 shadow-[0_4px_0_#0a0f0d] relative overflow-hidden border-t-2 border-tertiary-fixed">
              <span className="material-symbols-outlined text-tertiary-fixed text-[30px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                emoji_events
              </span>
              <span className="font-label-chunky text-[10px] text-tertiary-fixed tracking-wider uppercase mt-0.5 font-black">
                CHAMPION
              </span>
            </div>
          </div>

          {/* 3rd Place (Bronze) */}
          <div className="flex flex-col items-center flex-1 min-w-0">
            <div className="relative flex flex-col items-center mb-1.5">
              <div className="w-12 h-12 rounded-2xl bg-surface-container-highest p-1 shadow-md overflow-hidden relative flex items-center justify-center font-black text-tertiary-fixed-dim uppercase text-sm border border-tertiary-container/40">
                {top3.displayName.charAt(0)}
              </div>
              <div className="absolute -bottom-2 bg-tertiary-container text-on-tertiary-container font-label-mono-num text-[11px] px-2 py-0.2 rounded-full shadow-md font-black flex items-center gap-0.5">
                <span>#3</span>
              </div>
            </div>
            <span className="font-title-md text-xs text-on-surface font-bold truncate max-w-[85px] mt-1">
              @{top3.displayName}
            </span>
            <span className="font-label-mono-num text-[11px] text-tertiary-fixed-dim font-bold">
              {top3.points} PTS
            </span>
            {/* Tier Riser 75px */}
            <div className="w-full h-[75px] mt-2 rounded-t-xl bg-surface-container-highest flex flex-col items-center justify-start pt-2 shadow-[0_4px_0_#0a0f0d]">
              <span className="material-symbols-outlined text-tertiary-fixed-dim text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                workspace_premium
              </span>
              <span className="font-label-chunky text-[10px] text-on-surface-variant tracking-wider uppercase mt-0.5 font-bold">
                BRONZE
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Promotion Zone Notification Strip */}
      <div className="flex items-center justify-between bg-surface-container-low px-3.5 py-3 rounded-xl shadow-[0_4px_0_#0a0f0d] border border-surface-container-high">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-primary-container/20 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-primary-container text-[18px]">
              keyboard_double_arrow_up
            </span>
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-label-chunky text-[11px] text-primary-container tracking-wider uppercase font-black">
                Promotion Zone
              </span>
              <span className="text-on-surface-variant text-[10px]">•</span>
              <span className="font-body-md text-[11px] text-on-surface truncate">Top 10 to Master</span>
            </div>
            <span className="font-body-md text-[10px] text-on-surface-variant truncate">
              Prize: +500 XP & Rare Diamond Leaf Pin
            </span>
          </div>
        </div>
        <span className="material-symbols-outlined text-on-surface-variant text-[18px] shrink-0 ml-1">info</span>
      </div>

      {/* Subsequent Ranks List (4+) */}
      <div className="flex flex-col gap-space-sm">
        <div className="flex items-center justify-between px-1">
          <span className="font-label-chunky text-[11px] text-on-surface-variant uppercase tracking-wider font-bold">
            Top Contenders
          </span>
          <span className="font-label-mono-num text-[11px] text-secondary font-bold">Ranks 4 - 10</span>
        </div>

        {otherLeaders.length === 0 ? (
          <div className="p-4 bg-surface-container rounded-xl text-center text-xs text-on-surface-variant border border-surface-container-high">
            Climb the ranks by completing today's quests!
          </div>
        ) : (
          otherLeaders.map((leader) => (
            <div
              key={`${leader.rank}-${leader.displayName}`}
              className="flex items-center justify-between p-3 bg-surface-container-low rounded-xl shadow-[0_4px_0_#0a0f0d] border border-surface-container-high/60 active:translate-y-0.5 transition-all"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="font-label-mono-num text-[13px] text-on-surface-variant font-bold w-5 text-center">
                  {leader.rank}
                </span>
                <div className="w-9 h-9 rounded-xl bg-surface-container-highest flex items-center justify-center font-bold text-xs uppercase text-primary shrink-0">
                  {leader.displayName.charAt(0)}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-title-md text-xs text-primary font-bold truncate">
                    @{leader.displayName}
                  </span>
                  <span className="font-label-mono-num text-[10px] text-on-surface-variant">Active member</span>
                </div>
              </div>
              <span className="font-label-mono-num text-xs font-black text-primary-container">
                {leader.points} PTS
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
