import React from 'react';

export default function Journey() {
  return (
    <div className="flex flex-col w-full relative max-w-md mx-auto pt-2 pb-12 select-none">
      {/* Zone Selector Floating Bar */}
      <div className="sticky top-0 z-30 pt-space-xs pb-space-sm bg-surface-container-lowest/90 backdrop-blur-md">
        <div className="flex items-center justify-between gap-space-xs bg-surface-container-high p-1 rounded-xl shadow-md">
          <button className="flex-1 py-1.5 px-space-xs rounded-lg text-center transition-all bg-surface-container text-on-surface-variant flex items-center justify-center gap-1 active:translate-y-0.5" id="zone-prev-btn">
            <span className="material-symbols-outlined text-[16px]">park</span>
            <span className="font-label-chunky text-[11px] truncate uppercase">Z1: Sprouts</span>
          </button>
          <button className="flex-1 py-1.5 px-space-xs rounded-lg text-center bg-primary-container text-on-primary-fixed shadow-sm flex items-center justify-center gap-1 active:translate-y-0.5" id="zone-curr-btn">
            <span className="material-symbols-outlined text-[16px] text-on-primary-fixed">directions_subway</span>
            <span className="font-label-chunky text-[11px] truncate uppercase font-extrabold">Z2: Commute</span>
          </button>
          <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface-container text-on-surface-variant hover:text-primary active:scale-95 transition-transform">
            <span className="material-symbols-outlined text-[18px]">map</span>
          </button>
        </div>
      </div>

      {/* Sector Header Tactical Banner */}
      <div className="pt-space-xs pb-space-sm">
        <div className="relative bg-surface-container-low rounded-2xl p-space-md shadow-lg overflow-hidden border border-surface-container-high">
          {/* Glow */}
          <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-primary-container/10 rounded-full blur-2xl pointer-events-none"></div>
          <div className="absolute top-2 right-3 flex items-center gap-1 bg-surface-container-highest/80 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-container animate-ping"></span>
            <span className="font-label-mono-num text-[11px] text-primary-container tracking-wider uppercase font-bold">ONLINE</span>
          </div>
          <div className="flex flex-col gap-1 z-10 relative">
            <div className="flex items-center gap-1.5">
              <span className="font-label-chunky text-[11px] text-primary-fixed-dim uppercase tracking-widest font-black">SECTOR 02</span>
              <span className="text-on-surface-variant text-[10px]">•</span>
              <span className="font-label-chunky text-[11px] text-on-surface-variant uppercase tracking-wider">EXPEDITION MAP</span>
            </div>
            <h1 className="font-headline-lg-mobile text-2xl text-primary font-black uppercase tracking-tight">URBAN COMMUTE</h1>

            {/* Progress Row */}
            <div className="mt-2 flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="font-label-mono-num text-[12px] text-on-surface-variant font-bold">8 / 15 NODES MASTERED</span>
                <span className="font-label-mono-num text-[12px] text-tertiary-fixed font-black tracking-tight">+420 XP in Sector 02</span>
              </div>
              {/* Tactile Gauge */}
              <div className="w-full h-3 rounded-full bg-surface-container-lowest p-0.5 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-primary-fixed-dim via-primary-container to-secondary transition-all duration-700 relative" style={{ width: '53%' }}>
                  <div className="absolute right-0 top-0 bottom-0 w-2 bg-primary rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Isometric Level Path Container */}
      <div className="relative w-full pt-space-xs pb-16 overflow-hidden">
        {/* Serpentine SVG Path Underlay */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="activeLine" x1="0%" x2="0%" y1="100%" y2="0%">
              <stop offset="0%" stopColor="#8cdc27" stopOpacity="0.9"></stop>
              <stop offset="50%" stopColor="#a3f542" stopOpacity="0.9"></stop>
              <stop offset="100%" stopColor="#414a36" stopOpacity="0.4"></stop>
            </linearGradient>
          </defs>
          <path
            d="M 80, 80 C 80, 140 280, 140 280, 190 C 280, 240 100, 250 100, 310 C 100, 370 260, 370 260, 440 C 260, 510 110, 520 110, 590"
            fill="none"
            opacity="0.8"
            stroke="url(#activeLine)"
            strokeDasharray="14 10"
            strokeLinecap="round"
            strokeWidth="8"
          />
        </svg>

        {/* Stepping Stone Nodes */}
        <div className="relative z-10 flex flex-col gap-10 w-full pt-4">
          {/* Node 1: Completed (Left) */}
          <div className="flex items-center gap-3 self-start max-w-[280px]">
            <div className="relative flex flex-col items-center group cursor-pointer active:translate-y-1 transition-transform">
              <div className="w-16 h-16 rounded-2xl bg-surface-container-lowest flex items-center justify-center pt-1 shadow-md">
                <div className="w-14 h-14 rounded-xl bg-primary-container text-on-primary-fixed flex items-center justify-center shadow-[0_4px_0_#2d5000]">
                  <span className="material-symbols-outlined text-[30px] font-black">check</span>
                </div>
              </div>
              <div className="flex items-center gap-0.5 mt-1 bg-surface-container-high px-2 py-0.5 rounded-full shadow">
                <span className="material-symbols-outlined text-[13px] text-tertiary-fixed" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <span className="material-symbols-outlined text-[13px] text-tertiary-fixed" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <span className="material-symbols-outlined text-[13px] text-tertiary-fixed" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              </div>
            </div>
            <div className="flex flex-col bg-surface-container/90 border border-surface-container-high p-2 rounded-xl">
              <span className="font-label-chunky text-[10px] text-primary-fixed-dim uppercase tracking-wider">NODE 01 • DONE</span>
              <span className="font-title-md text-sm text-primary font-bold">Walk 2 km</span>
              <span className="font-label-mono-num text-[11px] text-on-surface-variant">+40 PTS</span>
            </div>
          </div>

          {/* Node 2: Completed (Right) */}
          <div className="flex items-center justify-end gap-3 self-end max-w-[280px]">
            <div className="flex flex-col items-end text-right bg-surface-container/90 border border-surface-container-high p-2 rounded-xl">
              <span className="font-label-chunky text-[10px] text-primary-fixed-dim uppercase tracking-wider">NODE 02 • DONE</span>
              <span className="font-title-md text-sm text-primary font-bold">Meatless Lunch</span>
              <span className="font-label-mono-num text-[11px] text-on-surface-variant">+50 PTS</span>
            </div>
            <div className="relative flex flex-col items-center group cursor-pointer active:translate-y-1 transition-transform">
              <div className="w-16 h-16 rounded-2xl bg-surface-container-lowest flex items-center justify-center pt-1 shadow-md">
                <div className="w-14 h-14 rounded-xl bg-primary-container text-on-primary-fixed flex items-center justify-center shadow-[0_4px_0_#2d5000]">
                  <span className="material-symbols-outlined text-[30px] font-black">check</span>
                </div>
              </div>
              <div className="flex items-center gap-0.5 mt-1 bg-surface-container-high px-2 py-0.5 rounded-full shadow">
                <span className="material-symbols-outlined text-[13px] text-tertiary-fixed" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <span className="material-symbols-outlined text-[13px] text-tertiary-fixed" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              </div>
            </div>
          </div>

          {/* Node 3: Current Active (Left) */}
          <div className="flex items-center gap-3 self-start max-w-[280px]">
            <div className="relative flex flex-col items-center group cursor-pointer active:translate-y-1 transition-transform">
              <div className="w-16 h-16 rounded-2xl bg-surface-container-lowest flex items-center justify-center pt-1 shadow-md">
                <div className="w-14 h-14 rounded-xl bg-tertiary-container text-on-tertiary flex items-center justify-center shadow-[0_4px_0_#776000] animate-pulse">
                  <span className="material-symbols-outlined text-[30px] font-black">directions_bike</span>
                </div>
              </div>
              <div className="flex items-center gap-0.5 mt-1 bg-tertiary-fixed text-on-tertiary-fixed px-2 py-0.5 rounded-full shadow font-label-chunky text-[9px] uppercase font-bold">
                ACTIVE
              </div>
            </div>
            <div className="flex flex-col bg-surface-container border-2 border-tertiary-container/80 p-2 rounded-xl">
              <span className="font-label-chunky text-[10px] text-tertiary-fixed uppercase tracking-wider">CURRENT NODE</span>
              <span className="font-title-md text-sm text-primary font-bold">Bicycle Commute</span>
              <span className="font-label-mono-num text-[11px] text-tertiary-fixed-dim">+60 PTS</span>
            </div>
          </div>

          {/* Node 4: Locked (Right) */}
          <div className="flex items-center justify-end gap-3 self-end max-w-[280px] opacity-60">
            <div className="flex flex-col items-end text-right bg-surface-container/60 p-2 rounded-xl">
              <span className="font-label-chunky text-[10px] text-on-surface-variant uppercase tracking-wider">LOCKED</span>
              <span className="font-title-md text-sm text-on-surface-variant font-bold">Solar Drying</span>
              <span className="font-label-mono-num text-[11px] text-on-surface-variant">+45 PTS</span>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-surface-container-lowest flex items-center justify-center pt-1 shadow-inner">
              <div className="w-14 h-14 rounded-xl bg-surface-container-highest text-on-surface-variant flex items-center justify-center">
                <span className="material-symbols-outlined text-[26px]">lock</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
