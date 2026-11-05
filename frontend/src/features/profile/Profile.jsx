import React from 'react';
import { Flame, Gift, Award, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Profile() {
  return (
    <div className="space-y-4">
      <div className="p-5 bg-white rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-eco-100 flex items-center justify-center text-eco-700 font-bold text-xl">
          ST
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900">Shubham Tale</h1>
          <p className="text-xs text-gray-500">shubham@ecosync.local</p>
          <span className="inline-block mt-1 text-[10px] font-semibold bg-eco-50 text-eco-700 px-2 py-0.5 rounded-full">
            Member 1 • User
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="p-3 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <Flame className="w-5 h-5 mx-auto text-orange-500 mb-1" />
          <p className="text-lg font-bold text-gray-800">0</p>
          <p className="text-[10px] text-gray-400 uppercase font-semibold">Streak</p>
        </div>
        <div className="p-3 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <Award className="w-5 h-5 mx-auto text-eco-600 mb-1" />
          <p className="text-lg font-bold text-gray-800">180</p>
          <p className="text-[10px] text-gray-400 uppercase font-semibold">Points</p>
        </div>
        <div className="p-3 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <Gift className="w-5 h-5 mx-auto text-amber-500 mb-1" />
          <p className="text-lg font-bold text-gray-800">0</p>
          <p className="text-[10px] text-gray-400 uppercase font-semibold">Coupons</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50 overflow-hidden">
        <Link
          to="/streak"
          className="p-4 flex items-center justify-between text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
        >
          <span>Streak Milestones</span>
          <span className="text-xs text-gray-400">View progress &rarr;</span>
        </Link>
        <Link
          to="/coupons"
          className="p-4 flex items-center justify-between text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
        >
          <span>My Coupons</span>
          <span className="text-xs text-gray-400">View rewards &rarr;</span>
        </Link>
        <Link
          to="/auth"
          className="p-4 flex items-center justify-between text-sm font-medium text-red-600 hover:bg-red-50 transition"
        >
          <span className="flex items-center gap-2">
            <LogOut className="w-4 h-4" />
            <span>Sign Out / Switch Account</span>
          </span>
        </Link>
      </div>
    </div>
  );
}
