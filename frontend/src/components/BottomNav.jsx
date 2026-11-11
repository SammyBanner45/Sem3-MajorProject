import React from 'react';
import { NavLink } from 'react-router-dom';

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 pb-safe bg-surface-container-lowest/95 backdrop-blur-xl border-t border-surface-container-high/60 shadow-[0_-8px_24px_rgba(0,0,0,0.6)]">
      <div className="flex items-center justify-around h-20 px-space-xs relative max-w-md mx-auto">
        {/* Home */}
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `flex flex-col items-center justify-center min-w-[44px] min-h-[44px] px-2 py-1 transition-all active:translate-y-0.5 group ${
              isActive
                ? 'text-primary-container font-bold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <span
                className={`icon-indicator flex items-center justify-center w-10 h-8 rounded-full transition-colors mb-0.5 ${
                  isActive ? 'bg-primary-container/15 text-primary-container' : ''
                }`}
              >
                <span className="material-symbols-outlined text-[24px]">home</span>
              </span>
              <span className="font-label-chunky text-[11px] tracking-wide uppercase">Home</span>
            </>
          )}
        </NavLink>

        {/* Journey */}
        <NavLink
          to="/journey"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center min-w-[44px] min-h-[44px] px-2 py-1 transition-all active:translate-y-0.5 group ${
              isActive
                ? 'text-primary-container font-bold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <span
                className={`icon-indicator flex items-center justify-center w-10 h-8 rounded-full transition-colors mb-0.5 ${
                  isActive ? 'bg-primary-container/15 text-primary-container' : ''
                }`}
              >
                <span className="material-symbols-outlined text-[24px]">explore</span>
              </span>
              <span className="font-label-chunky text-[11px] tracking-wide uppercase">Journey</span>
            </>
          )}
        </NavLink>

        {/* Elevated Centerpiece Camera Action Button */}
        <div className="flex items-center justify-center -translate-y-4">
          <NavLink
            to="/proof"
            aria-label="Live Camera Proof Action"
            className="flex flex-col items-center justify-center w-14 h-14 rounded-2xl bg-primary-container text-on-primary-fixed shadow-[0_0_20px_rgba(163,245,66,0.4),0_4px_0_#2d5000] active:translate-y-1 active:shadow-[0_0_12px_rgba(163,245,66,0.3),0_1px_0_#2d5000] transition-all hover:scale-105"
          >
            <span className="material-symbols-outlined text-[30px] font-black">photo_camera</span>
          </NavLink>
        </div>

        {/* Quests (Activities & Challenges) */}
        <NavLink
          to="/activities"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center min-w-[44px] min-h-[44px] px-2 py-1 transition-all active:translate-y-0.5 group ${
              isActive
                ? 'text-primary-container font-bold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <span
                className={`icon-indicator flex items-center justify-center w-10 h-8 rounded-full transition-colors mb-0.5 relative ${
                  isActive ? 'bg-primary-container/15 text-primary-container' : ''
                }`}
              >
                <span className="material-symbols-outlined text-[24px]">emoji_events</span>
                <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-error"></span>
              </span>
              <span className="font-label-chunky text-[11px] tracking-wide uppercase">Quests</span>
            </>
          )}
        </NavLink>

        {/* Ranks (Leaderboard) */}
        <NavLink
          to="/leaderboard"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center min-w-[44px] min-h-[44px] px-2 py-1 transition-all active:translate-y-0.5 group ${
              isActive
                ? 'text-primary-container font-bold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <span
                className={`icon-indicator flex items-center justify-center w-10 h-8 rounded-full transition-colors mb-0.5 ${
                  isActive ? 'bg-primary-container/15 text-primary-container' : ''
                }`}
              >
                <span className="material-symbols-outlined text-[24px]">leaderboard</span>
              </span>
              <span className="font-label-chunky text-[11px] tracking-wide uppercase">Ranks</span>
            </>
          )}
        </NavLink>
      </div>
    </nav>
  );
}
