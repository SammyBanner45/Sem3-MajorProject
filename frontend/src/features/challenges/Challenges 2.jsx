import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Camera,
  CheckCircle2,
  Clock,
  AlertCircle,
  RotateCcw,
  Flame,
  ShieldCheck,
  Calendar
} from 'lucide-react';
import { fetchDailyChallenge, fetchMySubmissions } from '../activities/api';

function isToday(dateString) {
  if (!dateString) return false;
  const subDate = new Date(dateString);
  const now = new Date();
  return (
    subDate.getFullYear() === now.getFullYear() &&
    subDate.getMonth() === now.getMonth() &&
    subDate.getDate() === now.getDate()
  );
}

function getTodaySubmissionStatus(taskId, submissions) {
  if (!Array.isArray(submissions) || !taskId) return 'not done';

  const todaySubmissions = submissions
    .filter((s) => s.taskId === taskId && isToday(s.date || s.createdAt))
    .sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));

  if (todaySubmissions.length === 0) return 'not done';
  if (todaySubmissions.some((s) => s.status === 'approved')) return 'approved';
  if (todaySubmissions.some((s) => s.status === 'pending')) return 'pending';
  if (todaySubmissions[0].status === 'rejected') return 'rejected';

  return 'not done';
}

function StatusBadge({ status }) {
  switch (status) {
    case 'approved':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-100/90 px-3 py-1.5 rounded-full border border-emerald-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          Challenge Approved! (+Bonus)
        </span>
      );
    case 'pending':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-100/90 px-3 py-1.5 rounded-full border border-amber-300">
          <Clock className="w-4 h-4 text-amber-600" />
          Pending Admin Review
        </span>
      );
    case 'rejected':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-800 bg-rose-100/90 px-3 py-1.5 rounded-full border border-rose-300">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          Rejected - Re-submission allowed
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          <Calendar className="w-3.5 h-3.5" />
          Not completed today
        </span>
      );
  }
}

export default function Challenges() {
  const navigate = useNavigate();
  const [challenge, setChallenge] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [challengeData, subsData] = await Promise.all([
        fetchDailyChallenge(),
        fetchMySubmissions()
      ]);
      setChallenge(challengeData);
      setSubmissions(Array.isArray(subsData) ? subsData : []);
    } catch (err) {
      console.error('Failed to load challenge:', err);
      setError(err.message || 'Failed to load today’s daily challenge.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function handleStartProof() {
    if (!challenge) return;
    navigate('/proof', {
      state: {
        task: {
          id: challenge.id,
          title: challenge.title,
          points: challenge.points,
          type: challenge.type,
          icon: challenge.icon
        }
      }
    });
  }

  const status = challenge ? getTodaySubmissionStatus(challenge.id, submissions) : 'not done';
  const isDone = status === 'approved' || status === 'pending';

  return (
    <div className="space-y-5 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900">Daily Challenge</h1>
          <p className="text-xs text-gray-500 mt-0.5">High-impact special task for bonus points</p>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600 shadow-xs">
          <Sparkles className="w-5 h-5" />
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1">
            <p className="text-xs font-bold text-rose-900">Unable to Load Challenge</p>
            <p className="text-xs text-rose-700">{error}</p>
            <button
              type="button"
              onClick={loadData}
              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-700 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && !error && (
        <div className="space-y-4">
          <div className="h-64 bg-gray-200 animate-pulse rounded-3xl" />
          <div className="h-28 bg-gray-100 animate-pulse rounded-2xl" />
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && !challenge && (
        <div className="p-8 text-center bg-white rounded-3xl border border-gray-100 space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center text-3xl mx-auto">
            ⏳
          </div>
          <h2 className="text-base font-bold text-gray-900">No Challenge Scheduled Today</h2>
          <p className="text-xs text-gray-500 leading-relaxed max-w-xs mx-auto">
            Today's daily challenge has not been unlocked yet. Check back soon or complete regular activities!
          </p>
          <button
            type="button"
            onClick={() => navigate('/activities')}
            className="px-4 py-2 bg-eco-600 text-white rounded-xl text-xs font-bold hover:bg-eco-700 transition"
          >
            Explore Activities
          </button>
        </div>
      )}

      {/* Active Challenge View */}
      {!loading && !error && challenge && (
        <div className="space-y-4">
          <div className="p-6 bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 rounded-3xl border border-amber-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-amber-900 bg-amber-200/90 px-3 py-1 rounded-full shadow-2xs">
                <Flame className="w-3.5 h-3.5 text-amber-700" />
                Special Event
              </span>
              <span className="text-xs font-black text-amber-900 bg-amber-300/80 px-3 py-1 rounded-xl shadow-2xs">
                +{challenge.points} Bonus Points
              </span>
            </div>

            <div className="space-y-2">
              <div className="w-16 h-16 rounded-2xl bg-white shadow-inner flex items-center justify-center text-3xl">
                {challenge.icon || '🔥'}
              </div>
              <h2 className="text-xl font-black text-gray-900 tracking-tight leading-snug">
                {challenge.title}
              </h2>
              {challenge.description && (
                <p className="text-xs text-gray-700 leading-relaxed">
                  {challenge.description}
                </p>
              )}
            </div>

            <div className="pt-2 border-t border-amber-200/70 flex flex-col gap-3">
              <div>
                <StatusBadge status={status} />
              </div>

              {/* Min 44px touch target button */}
              <button
                type="button"
                disabled={isDone}
                onClick={handleStartProof}
                className={`w-full min-h-[44px] min-w-[44px] py-3 px-4 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition shadow-xs ${
                  isDone
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-amber-600 hover:bg-amber-700 text-white active:scale-[0.98]'
                }`}
              >
                <Camera className="w-5 h-5" />
                <span>
                  {status === 'rejected'
                    ? 'Resubmit Challenge Proof'
                    : isDone
                    ? 'Challenge Submitted'
                    : 'Do Challenge & Snap Proof'}
                </span>
              </button>
            </div>
          </div>

          {/* Rules Card */}
          <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-xs space-y-2.5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-eco-600" />
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                Submission Guidelines
              </h3>
            </div>
            <ul className="text-xs text-gray-500 space-y-1.5 list-disc list-inside">
              <li>Must be completed on the scheduled challenge calendar date.</li>
              <li>Requires live photo proof via camera (no gallery uploads).</li>
              <li>Reviewed within 24 hours to award your bonus eco-points.</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
