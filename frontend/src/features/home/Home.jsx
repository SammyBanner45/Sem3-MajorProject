import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Flame, Gift, Compass, Trophy, Camera } from 'lucide-react';

export default function Home() {
  return (
    <div className="space-y-6 pb-4">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-eco-600 to-eco-800 text-white rounded-3xl p-6 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-xs uppercase tracking-wider text-eco-200 font-semibold">Welcome Back</span>
            <h1 className="text-2xl font-bold mt-1">EcoSync</h1>
          </div>
          <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full text-sm font-semibold">
            <Flame className="w-4 h-4 text-orange-400 fill-orange-400" />
            <span>0 Day Streak</span>
          </div>
        </div>
        <p className="text-eco-100 text-sm">
          Small actions. Greener habits. A better planet.
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <Link
            to="/challenges"
            className="flex items-center gap-2 bg-white text-eco-800 rounded-xl px-4 py-2.5 text-sm font-semibold shadow hover:bg-eco-50 transition"
          >
            <Sparkles className="w-4 h-4 text-eco-600" />
            <span>Today's Challenge</span>
          </Link>
          <Link
            to="/proof"
            className="flex items-center gap-2 bg-eco-900/40 text-white rounded-xl px-4 py-2.5 text-sm font-semibold hover:bg-eco-900/60 transition backdrop-blur-sm"
          >
            <Camera className="w-4 h-4 text-eco-300" />
            <span>Submit Proof</span>
          </Link>
        </div>
      </div>

      {/* Quick Nav Cards */}
      <div>
        <h2 className="text-lg font-bold text-gray-800 mb-3">Explore</h2>
        <div className="grid grid-cols-2 gap-3">
          <Link
            to="/activities"
            className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-eco-200 transition"
          >
            <div className="w-10 h-10 rounded-xl bg-eco-50 flex items-center justify-center text-eco-600 mb-3">
              <Compass className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-gray-800 text-sm">Daily Activities</h3>
            <p className="text-xs text-gray-500 mt-1">Earn eco-points every day</p>
          </Link>

          <Link
            to="/apps"
            className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-eco-200 transition"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 mb-3">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-gray-800 text-sm">App Launcher</h3>
            <p className="text-xs text-gray-500 mt-1">Calculate CO₂ before ride & food</p>
          </Link>

          <Link
            to="/coupons"
            className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-eco-200 transition"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 mb-3">
              <Gift className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-gray-800 text-sm">Streak Coupons</h3>
            <p className="text-xs text-gray-500 mt-1">Unlock rewards at milestones</p>
          </Link>

          <Link
            to="/leaderboard"
            className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-eco-200 transition"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 mb-3">
              <Trophy className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-gray-800 text-sm">Leaderboard</h3>
            <p className="text-xs text-gray-500 mt-1">Monthly rankings & winners</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
