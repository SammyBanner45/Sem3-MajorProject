import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Trophy, Camera, ClipboardList, UserRound } from 'lucide-react';

const items = [
  { name: 'Home', path: '/', icon: Home },
  { name: 'Leaderboard', path: '/leaderboard', icon: Trophy },
  { name: 'Quests', path: '/activities', icon: ClipboardList },
  { name: 'Profile', path: '/profile', icon: UserRound },
];

function NavItem({ item }) {
  const Icon = item.icon;
  return <NavLink to={item.path} end={item.path === '/'} className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}>
    {({ isActive }) => <><Icon className={`h-5 w-5 transition ${isActive ? 'scale-110 stroke-[2.5px]' : 'stroke-[1.8px]'}`} aria-hidden="true" /><span>{item.name}</span></>}
  </NavLink>;
}

export default function BottomNav() {
  return <nav className="app-bottom-nav fixed inset-x-0 bottom-0 z-50 border-t backdrop-blur-md">
    <div className="mx-auto grid h-20 max-w-3xl grid-cols-5 items-center px-2">
      <NavItem item={items[0]} />
      <NavItem item={items[1]} />
      <NavLink to="/proof" aria-label="Open camera proof" className="camera-nav-button mx-auto grid h-14 w-14 -translate-y-3 place-items-center rounded-full shadow-card transition active:translate-y-[-0.5rem]">
        <Camera className="h-6 w-6" aria-hidden="true" />
      </NavLink>
      <NavItem item={items[2]} />
      <NavItem item={items[3]} />
    </div>
  </nav>;
}
