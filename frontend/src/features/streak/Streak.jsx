import React from 'react';
import { Flame, Lock } from 'lucide-react';

export default function Streak() {
  const milestones = [
    { day: 7, title: '7 Days Streak', unlocked: false },
    { day: 15, title: '15 Days Streak', unlocked: false },
    { day: 30, title: '30 Days Streak', unlocked: false },
    { day: 60, title: '60 Days Streak', unlocked: false },
    { day: 120, title: '120 Days Streak', unlocked: false },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Daily Streaks</h1>
          <p className="text-xs text-gray-500">Keep up approved eco-actions every day</p>
        </div>
        <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
          <Flame className="w-5 h-5 fill-orange-500" />
        </div>
      </div>

      <div className="p-6 bg-gradient-to-br from-orange-500 to-amber-600 text-white rounded-3xl text-center space-y-2 shadow-md">
        <Flame className="w-12 h-12 mx-auto text-amber-200 fill-amber-200" />
        <p className="text-4xl font-extrabold">0 Days</p>
        <p className="text-xs text-orange-100">
          Complete at least 1 approved activity daily to maintain your streak.
        </p>
      </div>

      <div className="space-y-2.5">
        <h2 className="text-sm font-bold text-gray-800">Streak Milestones</h2>
        {milestones.map((m) => (
          <div
            key={m.day}
            className="p-3.5 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 text-sm">{m.title}</h3>
                <p className="text-xs text-gray-400">Unlocks coupon reward</p>
              </div>
            </div>
            <span className="text-xs font-bold text-gray-400">Day {m.day}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
