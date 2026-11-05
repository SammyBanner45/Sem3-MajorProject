import React from 'react';
import { Smartphone, Car, Utensils, ShoppingBag, ExternalLink } from 'lucide-react';

export default function Apps() {
  const apps = [
    { name: 'Uber / Ola', category: 'travel', icon: Car, desc: 'Calculate ride footprint' },
    { name: 'Zomato / Swiggy', category: 'food', icon: Utensils, desc: 'Eco nudges & food order logging' },
    { name: 'Zepto / Blinkit', category: 'grocery', icon: ShoppingBag, desc: 'Quick delivery emission estimate' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">App Launcher &amp; CO₂</h1>
          <p className="text-xs text-gray-500">Compare emissions before opening services</p>
        </div>
        <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
          <Smartphone className="w-5 h-5" />
        </div>
      </div>

      <div className="space-y-3">
        {apps.map((app) => {
          const Icon = app.icon;
          return (
            <div
              key={app.name}
              className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 text-sm">{app.name}</h3>
                  <p className="text-xs text-gray-400">{app.desc}</p>
                </div>
              </div>
              <button
                type="button"
                className="px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1 hover:bg-blue-700 transition"
              >
                <span>Launch</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
