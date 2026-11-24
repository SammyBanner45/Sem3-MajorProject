import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  AlertTriangle,
  ArrowLeft,
  Loader2,
  Camera,
  Check,
  X,
  User,
  Sparkles
} from 'lucide-react';
import { apiFetch } from '../../lib/api.js';

const DEFAULT_ADMIN_USER_ID = '99999999-9999-4999-8999-999999999999';

function getAdminHeaders() {
  const userId =
    (typeof localStorage !== 'undefined' &&
      (localStorage.getItem('dev_admin_id') || localStorage.getItem('dev_user_id'))) ||
    DEFAULT_ADMIN_USER_ID;

  return {
    'x-dev-user-id': userId,
    'x-dev-role': 'admin'
  };
}

/**
 * Component to fetch and display photos from protected endpoints
 */
function ProtectedImage({ src, alt, className }) {
  const [blobUrl, setBlobUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const normalizedSrc = src.startsWith('/') ? src : `/${src}`;
    const fullUrl = src.startsWith('http') ? src : `${API_URL}${normalizedSrc}`;

    fetch(fullUrl, {
      headers: getAdminHeaders()
    })
      .then((res) => {
        if (!res.ok) throw new Error('Image fetch error');
        return res.blob();
      })
      .then((blob) => {
        if (active) {
          setBlobUrl(URL.createObjectURL(blob));
          setLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          setError(true);
          setLoading(false);
        }
      });

    return () => {
      active = false;
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [src]);

  if (loading) {
    return (
      <div className={`bg-gray-100 animate-pulse flex items-center justify-center text-gray-400 ${className}`}>
        <Camera className="w-8 h-8 animate-bounce text-gray-300" />
      </div>
    );
  }

  if (error || !blobUrl) {
    return (
      <div className={`bg-gray-100 border border-gray-200 flex flex-col items-center justify-center text-gray-400 text-xs p-4 text-center ${className}`}>
        <Camera className="w-6 h-6 mb-1 text-gray-300" />
        <span>Photo unavailable</span>
      </div>
    );
  }

  return <img src={blobUrl} alt={alt} className={className} />;
}

export default function AdminReviewPage() {
  const navigate = useNavigate();

  // Admin access check (supports dev mode role toggle)
  const [isAdmin, setIsAdmin] = useState(
    typeof localStorage !== 'undefined'
      ? localStorage.getItem('dev_role') === 'admin' ||
        localStorage.getItem('ecosync_role') === 'admin' ||
        true // Enabled by default in dev environment per prompt requirements
      : true
  );

  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Active rejection modal/sheet state
  const [rejectingItem, setRejectingItem] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  async function loadPendingSubmissions() {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch('/api/admin/submissions?status=pending', {
        headers: getAdminHeaders()
      });
      setSubmissions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load pending submissions:', err);
      setError(err.message || 'Failed to connect to admin review API.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPendingSubmissions();
  }, [isAdmin]);

  function showToast(msg) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }

  // Handle Approve Action
  async function handleApprove(submission) {
    setActionLoading(submission.id);
    try {
      await apiFetch(`/api/admin/submissions/${submission.id}`, {
        method: 'PATCH',
        body: { action: 'approve' },
        headers: getAdminHeaders()
      });

      // Remove item from queue list
      setSubmissions((prev) => prev.filter((item) => item.id !== submission.id));
      showToast(`Approved "${submission.taskTitle}" (+${submission.points} points awarded)`);
    } catch (err) {
      console.error('Approval failed:', err);
      alert(err.message || 'Failed to approve submission.');
    } finally {
      setActionLoading(null);
    }
  }

  // Handle Open Reject Sheet
  function openRejectSheet(submission) {
    setRejectingItem(submission);
    setRejectionReason('');
  }

  // Confirm Rejection Action
  async function handleConfirmReject() {
    if (!rejectingItem) return;
    if (!rejectionReason.trim()) {
      alert('Please enter a reason for rejection.');
      return;
    }

    const id = rejectingItem.id;
    setActionLoading(id);

    try {
      await apiFetch(`/api/admin/submissions/${id}`, {
        method: 'PATCH',
        body: {
          action: 'reject',
          reason: rejectionReason.trim()
        },
        headers: getAdminHeaders()
      });

      // Remove item from queue list
      setSubmissions((prev) => prev.filter((item) => item.id !== id));
      setRejectingItem(null);
      showToast(`Rejected "${rejectingItem.taskTitle}" with feedback`);
    } catch (err) {
      console.error('Rejection failed:', err);
      alert(err.message || 'Failed to reject submission.');
    } finally {
      setActionLoading(null);
    }
  }

  // Preset feedback suggestions
  const REASON_PRESETS = [
    'Photo is too blurry or unclear to verify the task.',
    'Photo does not clearly show the completed activity.',
    'Proof must show the live action, not an arbitrary object.',
    'Duplicate photo previously submitted.'
  ];

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-3xl border border-gray-100 text-center space-y-4 my-8">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-black text-gray-900">Admin Access Required</h2>
        <p className="text-xs text-gray-500 leading-relaxed max-w-xs mx-auto">
          You must be an administrator to access the photo review verification queue.
        </p>
        <button
          type="button"
          onClick={() => {
            localStorage.setItem('dev_role', 'admin');
            setIsAdmin(true);
          }}
          className="px-5 py-2.5 bg-eco-600 text-white rounded-xl text-xs font-bold shadow hover:bg-eco-700 transition"
        >
          Switch to Admin Role (Dev)
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-md mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => navigate('/activities')}
            className="w-9 h-9 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-600 hover:text-gray-900 transition shadow-2xs"
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-black tracking-tight text-gray-900">Admin Review</h1>
            <p className="text-xs text-gray-500">Live proof verification queue</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-xs font-black text-amber-800 bg-amber-100 px-2.5 py-1 rounded-full border border-amber-200">
            {submissions.length} Pending
          </span>
          <button
            type="button"
            onClick={loadPendingSubmissions}
            className="w-9 h-9 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-600 hover:text-gray-900 transition shadow-2xs"
            aria-label="Refresh queue"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1">
            <p className="text-xs font-bold text-rose-900">Error</p>
            <p className="text-xs text-rose-700">{error}</p>
            <button
              type="button"
              onClick={loadPendingSubmissions}
              className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-rose-800 underline"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading && !error && (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="p-4 bg-white rounded-3xl border border-gray-100 space-y-3 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3" />
              <div className="h-56 bg-gray-200 rounded-2xl" />
              <div className="h-12 bg-gray-100 rounded-2xl" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && submissions.length === 0 && (
        <div className="p-8 bg-white rounded-3xl border border-gray-100 text-center space-y-3 my-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto text-3xl">
            🎉
          </div>
          <h2 className="text-base font-black text-gray-900">All Caught Up!</h2>
          <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
            There are currently no pending photo submissions waiting in the review queue.
          </p>
          <button
            type="button"
            onClick={loadPendingSubmissions}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>
      )}

      {/* Pending Submissions Queue */}
      {!loading && !error && submissions.length > 0 && (
        <div className="space-y-4">
          {submissions.map((sub) => {
            const isProcessing = actionLoading === sub.id;

            return (
              <div
                key={sub.id}
                className="p-4 bg-white rounded-3xl border border-gray-100 shadow-xs space-y-3.5 transition"
              >
                {/* User & Task Info Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <User className="w-3.5 h-3.5 text-gray-400" />
                      <span className="font-semibold text-gray-800">{sub.displayName}</span>
                      <span>•</span>
                      <span>{new Date(sub.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <h3 className="font-extrabold text-base text-gray-900 leading-snug">
                      {sub.taskTitle}
                    </h3>
                  </div>

                  <span className="text-xs font-black text-eco-700 bg-eco-50 px-2.5 py-1 rounded-xl border border-eco-100 shrink-0">
                    +{sub.points} pts
                  </span>
                </div>

                {/* Photo Preview Container */}
                <div className="rounded-2xl overflow-hidden border border-gray-100 aspect-4/3 w-full relative">
                  <ProtectedImage
                    src={`/api/submissions/${sub.id}/photo`}
                    alt={`Proof for ${sub.taskTitle}`}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Big Action Buttons (Min 48px Touch Target) */}
                <div className="flex items-center gap-2.5 pt-1">
                  {/* Big Reject Button */}
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => openRejectSheet(sub)}
                    className="flex-1 min-h-[48px] px-4 py-3 bg-rose-50 hover:bg-rose-100 active:scale-[0.98] text-rose-700 border border-rose-200 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4 text-rose-600" />
                    <span>Reject</span>
                  </button>

                  {/* Big Approve Button */}
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => handleApprove(sub)}
                    className="flex-1 min-h-[48px] px-4 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-2xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition shadow-sm disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Approve</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reject Reason Bottom Sheet */}
      {rejectingItem && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-xs animate-fade-in">
          <div
            className="w-full max-w-md bg-white rounded-t-3xl shadow-2xl p-5 space-y-4 max-h-[90dvh] overflow-y-auto pb-[env(safe-area-inset-bottom,20px)] animate-slide-up"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 16px) + 20px)' }}
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
                  <XCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-gray-900">Reject Submission</h3>
                  <p className="text-[11px] text-gray-400">{rejectingItem.taskTitle}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRejectingItem(null)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <label htmlFor="rejectionReasonInput" className="block text-xs font-bold text-gray-700">
                Reason for Rejection <span className="text-rose-500">*</span>
              </label>
              <textarea
                id="rejectionReasonInput"
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explain to the user why their proof was rejected..."
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
            </div>

            {/* Quick preset suggestions */}
            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold text-gray-400">Quick reasons:</p>
              <div className="flex flex-wrap gap-1.5">
                {REASON_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setRejectionReason(preset)}
                    className="text-[10px] font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 px-2.5 py-1 rounded-lg transition text-left"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectingItem(null)}
                className="flex-1 min-h-[44px] py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!rejectionReason.trim() || actionLoading === rejectingItem.id}
                onClick={handleConfirmReject}
                className="flex-1 min-h-[44px] py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition disabled:opacity-50"
              >
                {actionLoading === rejectingItem.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <XCircle className="w-4 h-4" />
                    <span>Confirm Rejection</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
