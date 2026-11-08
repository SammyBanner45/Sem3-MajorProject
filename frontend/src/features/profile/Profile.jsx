import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Award, Check, Flame, Gift, LoaderCircle, LogOut, ShieldAlert, Trash2, X } from 'lucide-react';
import { apiFetch } from '../../lib/api.js';
import { useAuth } from '../auth/AuthProvider.jsx';
import useMyStats from './useMyStats.js';
import Co2SummarySlot from './Co2SummarySlot.jsx';

function getErrorMessage(error) {
  return error.data?.error?.message || error.data?.message || error.message || 'Please try again.';
}

function initials(name) {
  return (name || 'EcoSync member')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'E';
}

function StatCard({ icon: Icon, label, value, tone, detail }) {
  return (
    <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <span className={`grid h-10 w-10 place-items-center rounded-xl ${tone}`}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <p className="mt-4 text-2xl font-extrabold tracking-tight text-slate-900">{value}</p>
      <p className="mt-0.5 text-sm font-semibold text-slate-700">{label}</p>
      {detail && <p className="mt-1 text-xs leading-4 text-slate-500">{detail}</p>}
    </div>
  );
}

export default function Profile() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const { stats, loading: statsLoading, error: statsError } = useMyStats(user?.id);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    setDisplayName(user?.displayName || '');
  }, [user?.displayName]);

  const trimmedName = displayName.trim();
  const nameIsValid = trimmedName.length >= 2 && trimmedName.length <= 30;
  const nameChanged = trimmedName !== (user?.displayName || '');

  async function saveDisplayName(event) {
    event.preventDefault();
    if (saving) return;
    setSaveError('');
    setSaveMessage('');
    if (!nameIsValid) {
      setSaveError('Display name must be 2–30 characters.');
      return;
    }

    setSaving(true);
    try {
      const result = await apiFetch('/api/profile/me', { method: 'PATCH', body: { displayName: trimmedName } });
      const savedName = result?.profile?.displayName;
      if (typeof savedName !== 'string') throw new Error('The server returned an invalid profile response.');
      updateUser({ displayName: savedName });
      setDisplayName(savedName);
      setSaveMessage('Your display name has been updated. It is the name shown on the leaderboard.');
    } catch (error) {
      setSaveError(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  function cancelEdit() {
    setDisplayName(user?.displayName || '');
    setSaveError('');
    setSaveMessage('');
  }

  async function deleteAccount(event) {
    event.preventDefault();
    if (deleteConfirmation !== 'DELETE') return;
    setDeleteError('');
    setDeleting(true);
    try {
      await apiFetch('/api/profile/me', { method: 'DELETE' });
      logout();
      navigate('/login', { replace: true, state: { notice: 'Your account records have been deleted.' } });
    } catch (error) {
      setDeleteError(getErrorMessage(error));
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-6 sm:space-y-8">
      <header>
        <p className="text-sm font-semibold text-eco-700">Your account</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Profile</h1>
        <p className="mt-1 text-sm text-slate-600">Manage your public profile and see the progress connected to your account.</p>
      </header>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7" aria-labelledby="profile-info-title">
        <div className="flex flex-wrap items-start gap-4">
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-eco-100 text-xl font-extrabold text-eco-800" aria-hidden="true">
            {initials(user?.displayName)}
          </div>
          <div className="min-w-0 flex-1">
            <h2 id="profile-info-title" className="text-lg font-bold text-slate-900">Profile information</h2>
            {user?.email && <p className="mt-1 break-all text-sm text-slate-600">{user.email}</p>}
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-eco-50 px-3 py-1 text-xs font-semibold text-eco-800">
              <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />
              Display name is visible on the leaderboard
            </p>
          </div>
        </div>

        <form onSubmit={saveDisplayName} className="mt-6 space-y-3">
          <label htmlFor="profile-display-name" className="block text-sm font-semibold text-slate-700">Display name</label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input id="profile-display-name" name="displayName" type="text" autoComplete="nickname" maxLength={30}
              value={displayName} onChange={(event) => { setDisplayName(event.target.value); setSaveError(''); setSaveMessage(''); }}
              className="min-h-12 min-w-0 flex-1 rounded-xl border border-slate-200 px-4 text-base text-slate-900 outline-none focus:border-eco-500 focus:ring-4 focus:ring-eco-100"
              aria-invalid={displayName.length > 0 && !nameIsValid} aria-describedby="display-name-help" />
            <div className="flex gap-2">
              <button type="submit" disabled={!nameChanged || !nameIsValid || saving}
                className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-eco-700 px-4 text-sm font-bold text-white hover:bg-eco-800 focus:outline-none focus:ring-4 focus:ring-eco-200 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none">
                {saving ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Check className="h-4 w-4" aria-hidden="true" />}
                Save
              </button>
              {nameChanged && <button type="button" onClick={cancelEdit} disabled={saving}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-100 disabled:opacity-50">
                <X className="h-4 w-4" aria-hidden="true" /> Cancel
              </button>}
            </div>
          </div>
          <p id="display-name-help" className="text-xs text-slate-500">Use 2–30 characters. This name is also displayed on the leaderboard.</p>
          {saveError && <p className="text-sm text-red-700" role="alert">{saveError}</p>}
          {saveMessage && <p className="text-sm text-eco-800" role="status">{saveMessage}</p>}
        </form>
      </section>

      <section aria-labelledby="stats-title">
        <div className="mb-3">
          <h2 id="stats-title" className="text-lg font-extrabold text-slate-900">Your progress</h2>
          <p className="mt-1 text-sm text-slate-600">Points and streaks use approved activity records. Coupon totals need a read API.</p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard icon={Award} label="Approved points" value={statsLoading ? '…' : (stats ? stats.totalPoints : '—')} tone="bg-amber-100 text-amber-700"
            detail={stats ? 'From approved submissions' : statsLoading ? 'Loading activity history…' : 'Not available'} />
          <StatCard icon={Flame} label="Current streak" value={statsLoading ? '…' : (stats ? `${stats.currentStreak} days` : '—')} tone="bg-orange-100 text-orange-700"
            detail={stats ? 'Consecutive approved activity days' : statsLoading ? 'Loading activity history…' : 'Not available'} />
          <StatCard icon={Gift} label="Coupons earned" value="—" tone="bg-eco-100 text-eco-700"
            detail="The backend does not currently expose a coupon list endpoint." />
        </div>
        {statsError && <p className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900" role="status">
          <Activity className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />{statsError}
        </p>}
      </section>

      <Co2SummarySlot />

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" aria-labelledby="account-actions-title">
        <h2 id="account-actions-title" className="font-bold text-slate-900">Account actions</h2>
        <button type="button" onClick={logout}
          className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-100 sm:w-auto">
          <LogOut className="h-4 w-4" aria-hidden="true" /> Sign out
        </button>

        <div className="mt-5 border-t border-slate-100 pt-5">
          <button type="button" onClick={() => { setDeleteOpen(true); setDeleteConfirmation(''); setDeleteError(''); }}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-red-200 px-4 text-sm font-bold text-red-700 hover:bg-red-50 focus:outline-none focus:ring-4 focus:ring-red-100 sm:w-auto">
            <Trash2 className="h-4 w-4" aria-hidden="true" /> Delete account
          </button>
        </div>
      </section>

      {deleteOpen && (
        <div className="fixed inset-0 z-[60] grid place-items-center overflow-y-auto bg-slate-950/60 p-4"
          onMouseDown={(event) => { if (event.target === event.currentTarget && !deleting) setDeleteOpen(false); }}
          onKeyDown={(event) => { if (event.key === 'Escape' && !deleting) setDeleteOpen(false); }}>
          <section role="alertdialog" aria-modal="true" aria-labelledby="delete-title" aria-describedby="delete-description"
            className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl sm:p-6">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-red-100 text-red-700"><Trash2 className="h-5 w-5" aria-hidden="true" /></span>
            <h2 id="delete-title" className="mt-4 text-xl font-extrabold text-slate-900">Delete your account?</h2>
            <p id="delete-description" className="mt-2 text-sm leading-6 text-slate-600">
              This permanently deletes your account and associated database records. This cannot be undone.
            </p>
            <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-5 text-amber-900">
              Uploaded submission photo files are not currently removed by the backend deletion endpoint.
            </p>
            <form onSubmit={deleteAccount} className="mt-5 space-y-3">
              <label htmlFor="delete-confirmation" className="block text-sm font-semibold text-slate-700">
                Type <span className="font-mono">DELETE</span> to confirm.
              </label>
              <input id="delete-confirmation" name="confirmation" type="text" autoComplete="off" autoFocus value={deleteConfirmation}
                onChange={(event) => setDeleteConfirmation(event.target.value)}
                className="min-h-12 w-full rounded-xl border border-slate-200 px-4 text-base outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100"
                disabled={deleting} />
              {deleteError && <p className="text-sm text-red-700" role="alert">{deleteError}</p>}
              <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                <button type="button" onClick={() => setDeleteOpen(false)} disabled={deleting}
                  className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Cancel</button>
                <button type="submit" disabled={deleteConfirmation !== 'DELETE' || deleting}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-red-700 px-4 text-sm font-bold text-white hover:bg-red-800 focus:outline-none focus:ring-4 focus:ring-red-200 disabled:cursor-not-allowed disabled:opacity-50">
                  {deleting ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Trash2 className="h-4 w-4" aria-hidden="true" />}
                  {deleting ? 'Deleting…' : 'Delete account permanently'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
