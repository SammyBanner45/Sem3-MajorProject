import React from 'react';
import { Gift, Copy } from 'lucide-react';

export default function Coupons() {
  const coupons = [
    {
      code: 'ECO7-MOCK',
      title: '7-Day Streak Starter',
      discount: '10% OFF Eco Store',
      milestone: '7 Days',
      status: 'Available',
    },
    {
      code: 'ECO15-MOCK',
      title: '15-Day Green Habit',
      discount: '15% OFF Sustainable Market',
      milestone: '15 Days',
      status: 'Locked',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Streak Coupons</h1>
          <p className="text-xs text-gray-500">Unlocked milestone coupons</p>
        </div>
        <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
          <Gift className="w-5 h-5" />
        </div>
      </div>

      <div className="space-y-3">
        {coupons.map((c) => (
          <div
            key={c.code}
            className={`p-4 rounded-2xl border ${
              c.status === 'Available'
                ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200'
                : 'bg-white border-gray-100 opacity-60'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-200/60 px-2 py-0.5 rounded-full">
                {c.milestone} Milestone
              </span>
              <span className="text-xs font-semibold text-gray-500">{c.status}</span>
            </div>
            <h3 className="font-bold text-gray-800 text-sm">{c.title}</h3>
            <p className="text-xs text-gray-600 mt-0.5">{c.discount}</p>

            <div className="mt-3 pt-3 border-t border-amber-200/60 flex items-center justify-between">
              <code className="text-xs font-mono font-bold text-amber-900 bg-white/70 px-2 py-1 rounded">
                {c.code}
              </code>
              <button
                type="button"
                className="text-xs text-amber-700 font-semibold flex items-center gap-1 hover:underline"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Code</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
