import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Feature route components exported from each feature's index.js (one line each per contract)
import Home from './features/home';
import Activities from './features/activities';
import Apps from './features/apps';
import Leaderboard from './features/leaderboard';
import Profile from './features/profile';
import Auth from './features/auth';
import Challenges from './features/challenges';
import Proof from './features/proof';
import Streak from './features/streak';
import Coupons from './features/coupons';

import BottomNav from './components/BottomNav';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100 px-4 py-3 shadow-xs">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🌱</span>
            <span className="font-extrabold text-base tracking-tight text-eco-800">
              EcoSync
            </span>
          </div>
          <span className="text-[11px] font-semibold text-eco-700 bg-eco-50 px-2.5 py-1 rounded-full border border-eco-100">
            Pro Planet
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-md w-full mx-auto p-4 pb-24">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/activities" element={<Activities />} />
          <Route path="/apps" element={<Apps />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/challenges" element={<Challenges />} />
          <Route path="/proof" element={<Proof />} />
          <Route path="/streak" element={<Streak />} />
          <Route path="/coupons" element={<Coupons />} />
        </Routes>
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
