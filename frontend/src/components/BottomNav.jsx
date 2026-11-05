import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Compass, LayoutGrid, Trophy, User } from 'lucide-react';

const navItems = [
  { name: 'Home', path: '/', icon: Home },
  { name: 'Activities', path: '/activities', icon: Compass },
  { name: 'Apps', path: '/apps', icon: LayoutGrid },
  { name: 'Leaderboard', path: '/leaderboard', icon: Trophy },
  { name: 'Profile', path: '/profile', icon: User },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-gray-100 shadow-lg">
      <div className="max-w-md mx-auto flex items-center justify-around py-2 px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1 px-3 rounded-xl text-[10px] font-medium transition ${
                  isActive
                    ? 'text-eco-600 font-bold'
                    : 'text-gray-400 hover:text-gray-600'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={`w-5 h-5 mb-0.5 transition ${
                      isActive ? 'stroke-[2.5px] scale-110 text-eco-600' : 'stroke-[1.8px]'
                    }`}
                  />
                  <span>{item.name}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
