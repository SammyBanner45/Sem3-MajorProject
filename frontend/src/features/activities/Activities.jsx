import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchActivities, fetchDailyChallenge, fetchMySubmissions } from './api';
import defaultActivities from '../../data/activities.json';
import defaultChallenges from '../../data/challenges.json';

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

function getTimeUntilLocalReset() {
  const now = new Date();
  const reset = new Date(now);
  reset.setHours(24, 0, 0, 0);
  const totalSeconds = Math.max(0, Math.floor((reset.getTime() - now.getTime()) / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
}

export default function Activities() {
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [dailyChallenge, setDailyChallenge] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [countdown, setCountdown] = useState(() => getTimeUntilLocalReset());

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [actData, challengeData, subsData] = await Promise.all([
        fetchActivities().catch(() => null),
        fetchDailyChallenge().catch(() => null),
        fetchMySubmissions().catch(() => []),
      ]);

      const resolvedActivities =
        Array.isArray(actData) && actData.length > 0
          ? actData
          : defaultActivities.map((a, i) => ({ id: `act-${i + 1}`, ...a, type: 'activity' }));

      const resolvedChallenge =
        challengeData || { id: 'ch-today', ...defaultChallenges[0], type: 'challenge' };

      setActivities(resolvedActivities);
      setDailyChallenge(resolvedChallenge);
      setSubmissions(Array.isArray(subsData) ? subsData : []);
    } catch (err) {
      console.warn('Using offline activities fallback:', err);
      setActivities(defaultActivities.map((a, i) => ({ id: `act-${i + 1}`, ...a, type: 'activity' })));
      setDailyChallenge({ id: 'ch-today', ...defaultChallenges[0], type: 'challenge' });
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const updateCountdown = () => setCountdown(getTimeUntilLocalReset());
    updateCountdown();
    const intervalId = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  function handleStartProof(task) {
    navigate('/proof', {
      state: {
        task: {
          id: task.id,
          title: task.title,
          points: task.points,
          type: task.type,
          icon: task.icon,
        },
      },
    });
  }

  const completedCount = activities.filter(
    (a) => getTodaySubmissionStatus(a.id, submissions) === 'approved'
  ).length;

  return (
    <div className="flex flex-col gap-space-lg select-none pb-8">
      {/* Daily reset countdown */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#a3f542] to-[#7dd3fc] p-space-md shadow-xl text-[#0b0f0e] border border-white/30">
        <div className="flex items-center justify-between gap-space-sm">
          <div>
            <p className="font-label-chunky text-[11px] tracking-wider uppercase text-[#183329]">Daily reset</p>
            <h2 className="mt-1 font-headline-lg-mobile text-2xl font-black tracking-tight uppercase leading-none">{countdown}</h2>
            <p className="mt-1 font-body-md text-xs text-[#183329]/85 font-bold">Until quests refresh at midnight</p>
          </div>
          <span className="material-symbols-outlined text-[#183329]/75 text-[32px]" aria-hidden="true">schedule</span>
        </div>
      </div>

      {/* Quests Container */}
      <div className="flex flex-col gap-space-md">
        {/* Header with streak hint */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-primary-container text-[20px]">bolt</span>
            <h3 className="font-headline-md text-lg font-extrabold uppercase tracking-tight text-primary">
              TODAY'S QUESTS
            </h3>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="p-4 bg-error-container/20 border border-error text-error rounded-2xl flex items-center justify-between">
            <span className="text-xs font-bold">{error}</span>
            <button
              type="button"
              onClick={loadData}
              className="text-xs bg-error text-on-error font-bold px-3 py-1 rounded-lg"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading Skeleton */}
        {loading && (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-28 bg-surface-container rounded-xl animate-pulse" />
            ))}
          </div>
        )}

        {/* Top Daily Challenge Card (Bonus Quest) */}
        {!loading && dailyChallenge && (
          <div className="relative bg-surface-container rounded-2xl p-space-md shadow-lg border-b-4 border-surface-container-lowest border border-tertiary-container/40 flex flex-col gap-space-sm active:translate-y-0.5 transition-transform">
            <div className="flex items-start justify-between gap-space-sm">
              <div className="flex items-center gap-space-sm min-w-0">
                <div className="w-12 h-12 rounded-xl bg-tertiary-container/30 text-tertiary-fixed flex items-center justify-center flex-shrink-0 border-b-2 border-tertiary-container text-2xl shadow-inner">
                  {dailyChallenge.icon || '🔥'}
                </div>
                <div className="min-w-0 flex flex-col">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-label-chunky text-[10px] uppercase bg-tertiary-container/20 text-tertiary-fixed px-1.5 py-0.2 rounded font-bold">
                      DAILY CHALLENGE
                    </span>
                    <span className="font-label-mono-num text-[11px] font-bold bg-tertiary-container/30 text-tertiary-fixed-dim px-1.5 py-0.5 rounded">
                      +{dailyChallenge.points} PTS
                    </span>
                  </div>
                  <h4 className="font-title-md text-sm font-black tracking-tight text-primary uppercase truncate mt-0.5">
                    {dailyChallenge.title}
                  </h4>
                  <p className="font-body-md text-on-surface-variant text-xs line-clamp-1 mt-0.5">
                    {dailyChallenge.description}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-space-md pt-space-xs border-t border-surface-container-high/40">
              <span className="font-label-mono-num text-[11px] text-tertiary-fixed font-bold">
                Status: {getTodaySubmissionStatus(dailyChallenge.id, submissions).toUpperCase()}
              </span>
              <button
                type="button"
                onClick={() => handleStartProof(dailyChallenge)}
                disabled={getTodaySubmissionStatus(dailyChallenge.id, submissions) === 'approved'}
                className="flex-shrink-0 bg-tertiary-container text-on-tertiary font-label-chunky text-xs px-4 py-2 rounded-lg border-b-4 border-on-tertiary-container active:border-b-0 active:translate-y-1 transition-all uppercase flex items-center gap-1 font-black cursor-pointer disabled:opacity-50"
              >
                <span>DO IT</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>
          </div>
        )}

        {/* Regular Quests List */}
        {!loading &&
          activities.map((act) => {
            const status = getTodaySubmissionStatus(act.id, submissions);
            const isApproved = status === 'approved';
            const isPending = status === 'pending';

            return (
              <div
                key={act.id}
                className="relative bg-surface-container rounded-2xl p-space-md shadow-lg border-b-4 border-surface-container-lowest border border-surface-container-high/60 flex flex-col gap-space-sm active:translate-y-0.5 transition-transform"
              >
                <div className="flex items-start justify-between gap-space-sm">
                  <div className="flex items-center gap-space-sm min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-primary-container/20 text-primary-container flex items-center justify-center flex-shrink-0 border-b-2 border-primary-container/40 text-2xl shadow-inner">
                      {act.icon || '🌱'}
                    </div>
                    <div className="min-w-0 flex flex-col">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="font-title-md text-sm font-black tracking-tight text-primary uppercase truncate">
                          {act.title}
                        </h4>
                        <span className="font-label-mono-num text-[11px] font-bold bg-primary-container/15 text-primary-container px-1.5 py-0.5 rounded">
                          +{act.points} PTS
                        </span>
                      </div>
                      <p className="font-body-md text-on-surface-variant text-xs line-clamp-1 mt-0.5">
                        {act.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Progress + Action Bar */}
                <div className="flex items-center justify-between gap-space-md pt-space-xs border-t border-surface-container-high/40">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-label-chunky text-[10px] uppercase px-2 py-0.5 rounded-full font-bold ${
                        isApproved
                          ? 'bg-primary-container text-on-primary-fixed'
                          : isPending
                          ? 'bg-tertiary-container text-on-tertiary'
                          : status === 'rejected'
                          ? 'bg-error text-on-error'
                          : 'bg-surface-container-highest text-on-surface-variant'
                      }`}
                    >
                      {status === 'approved'
                        ? 'COMPLETED'
                        : status === 'pending'
                        ? 'IN REVIEW'
                        : status === 'rejected'
                        ? 'REJECTED'
                        : 'READY'}
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={isApproved || isPending}
                    onClick={() => handleStartProof(act)}
                    className={`flex-shrink-0 font-label-chunky text-xs px-4 py-2 rounded-lg border-b-4 transition-all uppercase flex items-center gap-1 font-black ${
                      isApproved || isPending
                        ? 'bg-surface-container-highest text-on-surface-variant border-surface-container-lowest cursor-not-allowed opacity-60'
                        : 'bg-primary-container text-on-primary-container border-on-primary-fixed-variant active:border-b-0 active:translate-y-1 cursor-pointer'
                    }`}
                  >
                    <span>{status === 'rejected' ? 'RETRY' : isApproved ? 'DONE' : isPending ? 'PENDING' : 'DO IT'}</span>
                    {!isApproved && !isPending && (
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
      </div>

    </div>
  );
}
