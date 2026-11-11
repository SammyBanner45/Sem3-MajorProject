import React from 'react';
import { Link, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import Home from './features/home';
import Activities from './features/activities';
import Apps from './features/apps';
import Leaderboard from './features/leaderboard';
import Profile from './features/profile';
import AuthRedirect from './features/auth/Auth.jsx';
import { AdminRoute, AuthProvider, LoginPage, ProtectedRoute, SignupPage } from './features/auth';
import Challenges from './features/challenges';
import Proof, { AdminReviewPage } from './features/proof';
import Streak from './features/streak';
import Coupons from './features/coupons';
import RewardsPage from './features/rewards';
import Journey from './features/journey';
import BottomNav from './components/BottomNav';
import { useAuth } from './features/auth/AuthProvider.jsx';

function AppShell() {
  const { user } = useAuth();
  const displayName = user?.displayName || 'Alex';

  return (
    <div className="flex min-h-screen flex-col bg-surface text-on-surface antialiased">
      {/* Tactile Arcade Fixed Top Header */}
      <header className="fixed top-0 inset-x-0 z-50 bg-surface-container-lowest/90 backdrop-blur-xl pt-safe border-b border-surface-container-high/40 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
        <div className="h-16 px-margin-mobile flex items-center justify-between gap-space-sm max-w-md mx-auto">
          {/* Logo & App Name */}
          <Link to="/" className="flex items-center gap-2 group active:scale-95 transition-transform" aria-label="EcoSync Home">
            <span className="w-8 h-8 rounded-xl bg-primary-container text-on-primary-fixed flex items-center justify-center shadow-[0_2px_0_#2d5000]">
              <span className="material-symbols-outlined text-[20px] font-black">eco</span>
            </span>
            <span className="font-headline-md text-lg tracking-wider text-primary font-black uppercase">
              ECOSYNC
            </span>
          </Link>

          {/* Gamified Live Metric Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            <div className="flex items-center gap-1 bg-surface-container px-2 py-1 rounded-full border border-primary-container/20">
              <span className="w-2 h-2 rounded-full bg-primary-container animate-pulse"></span>
              <span className="font-label-mono-num text-[11px] font-bold text-primary-container">1,420</span>
            </div>
            <Link to="/streak" className="flex items-center gap-1 bg-surface-container px-2 py-1 rounded-full border border-tertiary-fixed-dim/20 hover:border-tertiary-fixed-dim/50 transition">
              <span className="material-symbols-outlined text-[15px] text-tertiary-fixed-dim">local_fire_department</span>
              <span className="font-label-mono-num text-[11px] font-bold text-tertiary-fixed-dim">18d</span>
            </Link>
            <Link to="/rewards" className="flex items-center gap-1 bg-surface-container px-2 py-1 rounded-full border border-tertiary-container/20 hover:border-tertiary-container/50 transition">
              <span className="material-symbols-outlined text-[15px] text-tertiary-container">monetization_on</span>
              <span className="font-label-mono-num text-[11px] font-bold text-tertiary-container">850</span>
            </Link>
          </div>

          {/* Action Icons & Profile */}
          <div className="flex items-center gap-2">
            <Link
              to="/profile"
              className="relative flex items-center justify-center p-0.5 rounded-full ring-2 ring-primary-container/80 active:scale-95 transition-transform"
              aria-label="View user profile"
            >
              <div className="w-8 h-8 rounded-full bg-surface-container-high text-primary-container flex items-center justify-center font-bold text-xs uppercase">
                {displayName.charAt(0)}
              </div>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full flex-1 pt-20 pb-28 px-4 max-w-md mx-auto">
        <Outlet />
      </main>

      {/* Tactile Arcade Elevated Bottom Dock */}
      <BottomNav />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/auth" element={<AuthRedirect />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route index element={<Home />} />
            <Route path="activities" element={<Activities />} />
            <Route path="journey" element={<Journey />} />
            <Route path="apps" element={<Apps />} />
            <Route path="rewards" element={<RewardsPage />} />
            <Route path="leaderboard" element={<Leaderboard />} />
            <Route path="profile" element={<Profile />} />
            <Route path="challenges" element={<Challenges />} />
            <Route path="proof" element={<Proof />} />
            <Route path="streak" element={<Streak />} />
            <Route path="coupons" element={<Coupons />} />
            <Route element={<AdminRoute />}>
              <Route path="admin/review" element={<AdminReviewPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
