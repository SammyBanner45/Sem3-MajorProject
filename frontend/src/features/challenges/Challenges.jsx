import React from 'react';
import { Sparkles, Camera } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Challenges() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Daily Challenge</h1>
          <p className="text-xs text-gray-500">Fresh challenge with bonus eco-points</p>
        </div>
        <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
          <Sparkles className="w-5 h-5" />
        </div>
      </div>

      <div className="p-5 bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl border border-amber-200 shadow-sm space-y-3">
        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
          Today's Special
        </span>
        <h2 className="text-lg font-bold text-gray-900">Zero Single-Use Plastic Day</h2>
        <p className="text-xs text-gray-600 leading-relaxed">
          Avoid all single-use plastic bottles, cups, and cutlery today. Capture a photo of your reusable kit!
        </p>
        <div className="flex items-center justify-between pt-2">
          <span className="text-sm font-bold text-amber-800">+50 Bonus Points</span>
          <Link
            to="/proof"
            className="px-4 py-2 bg-amber-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 hover:bg-amber-700 transition"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Snap Proof</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
