import React from 'react';
import { Trophy, Medal } from 'lucide-react';

export default function Leaderboard() {
  const leaders = [
    { rank: 1, name: 'Aarav Patel', points: 340, badge: 'EcoSync of the Month' },
    { rank: 2, name: 'Priya Sharma', points: 290 },
    { rank: 3, name: 'Rohan Mehta', points: 260 },
    { rank: 4, name: 'You (Shubham)', points: 180 },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Monthly Leaderboard</h1>
          <p className="text-xs text-gray-500">Approved points this calendar month</p>
        </div>
        <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
          <Trophy className="w-5 h-5" />
        </div>
      </div>

      <div className="space-y-2">
        {leaders.map((leader) => (
          <div
            key={leader.rank}
            className={`p-3.5 rounded-2xl flex items-center justify-between border ${
              leader.rank === 1
                ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 shadow-sm'
                : 'bg-white border-gray-100'
            }`}
          >
            <div className="flex items-center gap-3">
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                  leader.rank === 1
                    ? 'bg-amber-400 text-white'
                    : leader.rank === 2
                    ? 'bg-slate-300 text-slate-700'
                    : leader.rank === 3
                    ? 'bg-amber-700 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {leader.rank}
              </span>
              <div>
                <p className="text-sm font-semibold text-gray-800">{leader.name}</p>
                {leader.badge && (
                  <span className="text-[10px] font-medium text-amber-700 flex items-center gap-1">
                    <Medal className="w-3 h-3" />
                    {leader.badge}
                  </span>
                )}
              </div>
            </div>
            <span className="text-sm font-bold text-eco-700">{leader.points} pts</span>
          </div>
        ))}
      </div>
    </div>
  );
}
