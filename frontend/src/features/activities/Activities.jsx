import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Compass,
  Sparkles,
  CheckCircle2,
  Clock,
  AlertCircle,
  RotateCcw,
  Camera,
  ArrowRight
} from 'lucide-react';
import { fetchActivities, fetchDailyChallenge, fetchMySubmissions } from './api';

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
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          Approved
        </span>
      );
    case 'pending':
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          Pending Review
        </span>
      );
    case 'rejected':
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
          <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
          Rejected
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
          Not done today
        </span>
      );
  }
}

export default function Activities() {
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [dailyChallenge, setDailyChallenge] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [actData, challengeData, subsData] = await Promise.all([
        fetchActivities(),
        fetchDailyChallenge(),
        fetchMySubmissions()
      ]);
      setActivities(Array.isArray(actData) ? actData : []);
      setDailyChallenge(challengeData);
      setSubmissions(Array.isArray(subsData) ? subsData : []);
    } catch (err) {
      console.error('Failed to load activities data:', err);
      setError(err.message || 'Failed to load activities. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function handleStartProof(task) {
    navigate('/proof', {
      state: {
        task: {
          id: task.id,
          title: task.title,
          points: task.points,
          type: task.type,
          icon: task.icon
        }
      }
    });
  }

  return (
    <div className="space-y-5 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900">Daily Activities</h1>
          <p className="text-xs text-gray-500 mt-0.5">Complete habits, submit photo proof & earn eco-points</p>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-eco-100 flex items-center justify-center text-eco-700 shadow-xs">
          <Compass className="w-5 h-5" />
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1">
            <p className="text-xs font-bold text-rose-900">Error Loading Data</p>
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

      {/* Loading Skeleton State */}
      {loading && !error && (
        <div className="space-y-4">
          <div className="h-44 bg-gray-200 animate-pulse rounded-3xl" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 bg-gray-100 animate-pulse rounded-2xl border border-gray-100" />
            ))}
          </div>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Top Daily Challenge Hero Card */}
          {dailyChallenge && (
            <div className="p-5 bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100/60 rounded-3xl border border-amber-200/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider text-amber-800 bg-amber-200/60 px-2.5 py-0.5 rounded-full">
                  <Sparkles className="w-3 h-3 text-amber-600" />
                  Today's Challenge
                </span>
                <span className="text-xs font-black text-amber-900 bg-amber-200/80 px-2.5 py-1 rounded-xl shadow-2xs">
                  +{dailyChallenge.points} Bonus Pts
                </span>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-2xl shrink-0 shadow-inner">
                  {dailyChallenge.icon || '🔥'}
                </div>
                <div className="space-y-1 flex-1">
                  <h2 className="font-extrabold text-gray-900 text-base leading-snug">
                    {dailyChallenge.title}
                  </h2>
                  {dailyChallenge.description && (
                    <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                      {dailyChallenge.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-amber-200/50">
                <StatusBadge status={getTodaySubmissionStatus(dailyChallenge.id, submissions)} />

                {(() => {
                  const status = getTodaySubmissionStatus(dailyChallenge.id, submissions);
                  const isDone = status === 'approved' || status === 'pending';

                  return (
                    <button
                      type="button"
                      disabled={isDone}
                      onClick={() => handleStartProof(dailyChallenge)}
                      className={`min-h-[44px] min-w-[44px] px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-xs ${
                        isDone
                          ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          : 'bg-amber-600 hover:bg-amber-700 text-white active:scale-95'
                      }`}
                    >
                      <Camera className="w-4 h-4" />
                      <span>{status === 'rejected' ? 'Resubmit' : isDone ? 'Submitted' : 'Do Challenge'}</span>
                    </button>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Activities List Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-extrabold text-gray-800 uppercase tracking-wider">
                Repeatable Habits
              </h2>
              <span className="text-xs text-gray-400 font-semibold">{activities.length} Available</span>
            </div>

            {/* Empty State */}
            {activities.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-3xl border border-gray-100 space-y-2">
                <span className="text-3xl">🌱</span>
                <p className="text-sm font-bold text-gray-800">No activities found</p>
                <p className="text-xs text-gray-500">Check back later for fresh eco-friendly tasks.</p>
              </div>
            ) : (
              activities.map((act) => {
                const status = getTodaySubmissionStatus(act.id, submissions);
                const isDone = status === 'approved' || status === 'pending';

                return (
                  <div
                    key={act.id}
                    className="p-4 bg-white rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between gap-3 hover:border-gray-200 transition"
                  >
                    <div className="flex items-start gap-3.5">
                      {/* 44px minimum touch target for icon */}
                      <div className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-eco-50 flex items-center justify-center text-2xl shrink-0 shadow-inner">
                        {act.icon || '🌱'}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-bold text-gray-900 text-sm leading-snug">
                            {act.title}
                          </h3>
                          <span className="text-xs font-black text-eco-700 bg-eco-50 px-2 py-0.5 rounded-lg shrink-0">
                            +{act.points} pts
                          </span>
                        </div>
                        {act.description && (
                          <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                            {act.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                      <StatusBadge status={status} />

                      {/* Min 44px touch target button */}
                      <button
                        type="button"
                        disabled={isDone}
                        onClick={() => handleStartProof(act)}
                        className={`min-h-[44px] min-w-[44px] px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-xs ${
                          isDone
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : status === 'rejected'
                            ? 'bg-rose-600 hover:bg-rose-700 text-white active:scale-95'
                            : 'bg-eco-600 hover:bg-eco-700 text-white active:scale-95'
                        }`}
                      >
                        <span>{status === 'rejected' ? 'Try Again' : isDone ? 'Done' : 'Do it'}</span>
                        {!isDone && <ArrowRight className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}
