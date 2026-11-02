import React from 'react';
import { Camera, ShieldAlert } from 'lucide-react';

export default function Proof() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Photo Proof</h1>
          <p className="text-xs text-gray-500">Live camera-only submissions</p>
        </div>
        <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
          <Camera className="w-5 h-5" />
        </div>
      </div>

      <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800 leading-relaxed">
          <strong>Camera-only:</strong> Gallery uploads are not permitted. Photos are reviewed within 24 hours before points are credited.
        </p>
      </div>

      <div className="border-2 border-dashed border-gray-200 rounded-3xl p-8 bg-white text-center space-y-3">
        <div className="w-16 h-16 rounded-full bg-eco-50 flex items-center justify-center mx-auto text-eco-600">
          <Camera className="w-8 h-8" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-800 text-sm">Open Live Camera</h3>
          <p className="text-xs text-gray-400 mt-1">Requires camera permission</p>
        </div>
        <button
          type="button"
          className="px-5 py-2.5 bg-eco-600 text-white rounded-xl text-xs font-semibold shadow hover:bg-eco-700 transition"
        >
          Capture Live Photo
        </button>
      </div>
    </div>
  );
}
