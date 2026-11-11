import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

export default function Activities() {
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [dailyChallenge, setDailyChallenge] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('daily');

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [actData, challengeData, subsData] = await Promise.all([
        fetchActivities(),
        fetchDailyChallenge(),
        fetchMySubmissions(),
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
      {/* Weekly Gold Chest Milestone Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-container via-surface-container-high to-secondary-container p-space-md shadow-xl text-surface-container-lowest border border-primary-container/40">
        <div className="absolute -right-10 -top-10 w-36 h-36 bg-primary-fixed/20 rounded-full blur-2xl pointer-events-none"></div>
        <div className="flex items-start justify-between relative z-10 gap-space-sm">
          <div className="flex flex-col">
            <span className="inline-flex items-center gap-1 font-label-chunky text-[11px] tracking-wider uppercase bg-surface-container-lowest/80 text-primary-fixed px-2 py-0.5 rounded-full w-fit mb-1 shadow-sm">
              <span className="material-symbols-outlined text-[14px]">stars</span>
              WEEKLY GOLD CHEST
            </span>
            <h2 className="font-headline-lg-mobile text-2xl font-black tracking-tight text-surface-container-lowest uppercase leading-none">
              EARN 15 QUEST PTS
            </h2>
            <p className="font-body-md text-xs text-surface-container-lowest/90 font-bold mt-1">
              Unlock in <span className="underline decoration-2">2 days</span> for 2x point multiplier
            </p>
          </div>
          {/* Mystery Chest Icon */}
          <div className="relative flex-shrink-0 flex items-center justify-center w-14 h-14 bg-surface-container-lowest text-tertiary-container rounded-2xl shadow-lg border-b-4 border-surface-container-highest animate-bounce">
            <span className="material-symbols-outlined text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              inventory_2
            </span>
            <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tertiary-container opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-tertiary-fixed text-[9px] font-black text-on-tertiary items-center justify-center">
                !
              </span>
            </span>
          </div>
        </div>

        {/* 5-Segment Progress Bar */}
        <div className="mt-space-md pt-space-xs relative z-10">
          <div className="flex items-center justify-between gap-1.5">
            {[1, 2, 3, 4, 5].map((seg) => {
              const isFilled = seg <= Math.min(5, completedCount + 2);
              return (
                <div key={seg} className="h-3 flex-1 bg-surface-container-lowest rounded-sm overflow-hidden p-0.5 shadow-inner">
                  <div className={`h-full rounded-sm transition-all duration-300 ${isFilled ? 'bg-primary-container shadow-[0_0_8px_rgba(163,245,66,0.8)]' : 'bg-surface-container-highest/60'}`} />
                </div>
              );
            })}
          </div>
          <div className="flex justify-between items-center mt-1.5 text-surface-container-lowest/90 font-label-mono-num text-[11px] font-extrabold">
            <span>Step {Math.min(5, completedCount + 2)} of 5</span>
            <span className="tracking-wide">LEVEL 4 ACTIVE</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-space-xs bg-surface-container-lowest p-1 rounded-xl shadow-md border border-surface-container-high/40">
        <button
          type="button"
          onClick={() => setActiveTab('daily')}
          className={`tab-button flex-1 py-2 px-3 rounded-lg font-label-chunky text-[12px] uppercase transition-all duration-150 text-center ${
            activeTab === 'daily'
              ? 'bg-tertiary-container text-on-tertiary shadow-sm font-extrabold'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          DAILY ({activities.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('weekly')}
          className={`tab-button flex-1 py-2 px-3 rounded-lg font-label-chunky text-[12px] uppercase transition-all duration-150 text-center ${
            activeTab === 'weekly'
              ? 'bg-tertiary-container text-on-tertiary shadow-sm font-extrabold'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          WEEKLY (7)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('badges')}
          className={`tab-button flex-1 py-2 px-3 rounded-lg font-label-chunky text-[12px] uppercase transition-all duration-150 text-center ${
            activeTab === 'badges'
              ? 'bg-tertiary-container text-on-tertiary shadow-sm font-extrabold'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          BADGES (12)
        </button>
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
          <span className="font-label-mono-num text-[11px] text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full border border-surface-container-high">
            RESET IN 14h 22m
          </span>
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

      {/* Weekly Raid Community Target Progress Bar */}
      <div className="relative bg-surface-container rounded-2xl p-space-md shadow-xl border-b-4 border-surface-container-lowest border border-surface-container-high/60 overflow-hidden mt-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-secondary-fixed text-[20px]">groups</span>
            <h3 className="font-title-md text-sm font-black uppercase tracking-tight text-primary">
              WEEKLY RAID
            </h3>
          </div>
          <span className="font-label-mono-num text-[11px] font-bold bg-secondary-container/40 text-secondary-fixed px-2 py-0.5 rounded">
            COMMUNITY TARGET
          </span>
        </div>
        <p className="font-headline-md text-xl font-extrabold uppercase text-on-surface tracking-tight mb-space-sm">
          50,000 KG <span className="text-on-surface-variant font-medium text-xs">CO₂ OFFSET</span>
        </p>

        <div className="w-full bg-surface-container-highest h-3 rounded-full overflow-hidden p-0.5 mb-2 shadow-inner">
          <div
            className="bg-gradient-to-r from-secondary-container via-primary-container to-primary-container h-full rounded-full relative"
            style={{ width: '78%' }}
          >
            <span className="absolute right-1 top-0 bottom-0 w-1.5 bg-surface-bright rounded-full animate-ping"></span>
          </div>
        </div>

        <div className="flex justify-between items-center font-label-mono-num text-[11px] mb-space-md">
          <span className="text-primary-container font-extrabold">39,120 KG ACHIEVED</span>
          <span className="text-on-surface-variant font-bold">78%</span>
        </div>

        {/* Mascot Dialogue Bubble */}
        <div className="flex items-center gap-space-sm bg-surface-container-low p-space-sm rounded-xl border border-surface-container-high/40">
          <div className="relative flex-shrink-0 w-10 h-10 bg-primary-container/20 rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined text-[24px] text-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>
              eco
            </span>
            <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center shadow-md">
              <span className="material-symbols-outlined text-[10px] font-black">thumb_up</span>
            </span>
          </div>
          <div className="flex-1 bg-surface-container-highest/60 p-2 rounded-lg text-on-surface">
            <p className="font-body-md text-xs font-bold leading-tight">
              "Pacing ahead of schedule! <span className="text-primary-container">3 days left</span> to hit the goal and unlock the raid badge!"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
