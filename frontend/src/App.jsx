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
    <div className="flex min-h-screen flex-col">
      <main className="w-full flex-1">
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
