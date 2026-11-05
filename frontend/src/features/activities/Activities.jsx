import React from 'react';
import { Compass, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Activities() {
  const sampleActivities = [
    { id: 1, title: 'Take public transit / bus', points: 15, tag: 'Commute' },
    { id: 2, title: 'Cycle or walk to destination', points: 20, tag: 'Commute' },
    { id: 3, title: 'Use reusable shopping bag', points: 10, tag: 'Lifestyle' },
    { id: 4, title: 'Proper garbage waste segregation', points: 15, tag: 'Waste' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Daily Activities</h1>
          <p className="text-xs text-gray-500">Complete tasks and snap camera photo proof</p>
        </div>
        <div className="w-9 h-9 rounded-full bg-eco-100 flex items-center justify-center text-eco-600">
          <Compass className="w-5 h-5" />
        </div>
      </div>

      <div className="space-y-3">
        {sampleActivities.map((act) => (
          <div
            key={act.id}
            className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between"
          >
            <div className="space-y-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-eco-600 bg-eco-50 px-2 py-0.5 rounded-full">
                {act.tag}
              </span>
              <h3 className="font-semibold text-gray-800 text-sm">{act.title}</h3>
              <p className="text-xs text-gray-400">+{act.points} Eco Points</p>
            </div>
            <Link
              to="/proof"
              className="px-3 py-1.5 bg-eco-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1 hover:bg-eco-700 transition"
            >
              <span>Submit</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
