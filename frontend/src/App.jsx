import React from 'react';
import { Link, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { Leaf } from 'lucide-react';
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
import BottomNav from './components/BottomNav';

import TopBarPills from './features/apps/TopBarPills';

function AppShell() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 px-3 py-2.5 shadow-xs backdrop-blur-md sm:px-4 sm:py-3">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-2">
          <Link to="/" className="inline-flex shrink-0 items-center gap-2 rounded-lg focus:outline-none focus:ring-4 focus:ring-eco-100" aria-label="EcoSync home">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-eco-100 text-eco-800">
              <Leaf className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="hidden text-base font-extrabold tracking-tight text-eco-900 sm:inline">EcoSync</span>
          </Link>
          <TopBarPills compact />
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-5 pb-28 sm:px-6 sm:py-8">
        <Outlet />
      </main>
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
