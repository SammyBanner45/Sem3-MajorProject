import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import CameraCapture from './CameraCapture';
import MySubmissions from './MySubmissions';
import { fetchActivities, fetchDailyChallenge, fetchMySubmissions, submitPhotoProof } from '../activities/api';

export default function Proof() {
  const location = useLocation();
  const navigate = useNavigate();

  // Task passed from Activities or Challenges page via navigation state
  const [selectedTask, setSelectedTask] = useState(location.state?.task || null);
  const [availableTasks, setAvailableTasks] = useState([]);

  // Camera capture state
  const [capturedBlob, setCapturedBlob] = useState(null);
  const [capturedPreview, setCapturedPreview] = useState(null);

  // Bottom sheet submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Submissions history state
  const [submissions, setSubmissions] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  async function loadSubmissions() {
    setLoadingSubmissions(true);
    try {
      const data = await fetchMySubmissions();
      setSubmissions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Failed to load submissions:', err);
    } finally {
      setLoadingSubmissions(false);
    }
  }

  useEffect(() => {
    loadSubmissions();

    if (!selectedTask) {
      Promise.all([fetchActivities(), fetchDailyChallenge()])
        .then(([acts, ch]) => {
          const list = [];
          if (ch) list.push(ch);
          if (Array.isArray(acts)) list.push(...acts);
          setAvailableTasks(list);
          if (list.length > 0 && !selectedTask) {
            setSelectedTask(list[0]);
          }
        })
        .catch((err) => console.error('Failed to load task options:', err));
    }
  }, []);

  function handleCapture(blob, previewUrl) {
    setCapturedBlob(blob);
    setCapturedPreview(previewUrl);
    setSubmitError(null);
    setSubmitSuccess(false);
  }

  function handleRetake() {
    setCapturedBlob(null);
    setCapturedPreview(null);
    setSubmitError(null);
    setSubmitSuccess(false);
  }

  async function handleSubmitProof() {
    if (!selectedTask || !capturedBlob) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const file = new File([capturedBlob], 'camera-proof.jpg', { type: 'image/jpeg' });
      await submitPhotoProof(selectedTask.id, file);

      setSubmitSuccess(true);
      loadSubmissions();
    } catch (err) {
      console.error('Submission failed:', err);
      setSubmitError(
        err.message || 'Failed to submit proof. You may have already submitted for this task today.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleResubmitFromHistory(sub) {
    setSelectedTask({
      id: sub.taskId,
      title: sub.taskTitle,
      points: sub.points || 15,
    });
    handleRetake();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div className="flex flex-col gap-space-lg select-none pb-8 max-w-md mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => navigate('/activities')}
            className="w-9 h-9 rounded-xl bg-surface-container border border-surface-container-high flex items-center justify-center text-on-surface hover:text-primary transition active:scale-95 shadow-[0_2px_0_#0a0f0d]"
            aria-label="Back to activities"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <div>
            <h1 className="font-headline-md text-lg font-black tracking-tight text-primary uppercase">
              Photo Proof
            </h1>
            <p className="font-body-md text-xs text-on-surface-variant">Live camera verification</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Link
            to="/admin/review"
            className="font-label-chunky text-[11px] font-bold text-primary-container bg-surface-container hover:bg-surface-container-high border border-primary-container/40 px-2.5 py-1.5 rounded-xl transition flex items-center gap-1 shadow-[0_2px_0_#0a0f0d]"
          >
            <span className="material-symbols-outlined text-[16px]">shield</span>
            <span>Review Queue</span>
          </Link>
        </div>
      </div>

      {/* Selected Task Card / Switcher */}
      {selectedTask ? (
        <div className="p-4 bg-surface-container rounded-2xl border border-surface-container-high shadow-lg flex items-center justify-between gap-3 border-b-4 border-surface-container-lowest">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-primary-container/20 text-primary-container flex items-center justify-center text-2xl shrink-0 shadow-inner border border-primary-container/30">
              {selectedTask.icon || (selectedTask.type === 'challenge' ? '🔥' : '🌱')}
            </div>
            <div className="space-y-0.5">
              <span className="font-label-chunky text-[10px] font-bold uppercase tracking-wider text-primary-fixed-dim">
                {selectedTask.type === 'challenge' ? 'Daily Challenge' : 'Daily Activity'}
              </span>
              <h2 className="font-title-md text-sm text-primary font-bold leading-snug line-clamp-1 uppercase">
                {selectedTask.title}
              </h2>
              <p className="font-label-mono-num text-[11px] font-black text-primary-container">
                +{selectedTask.points} Eco Points
              </p>
            </div>
          </div>

          {availableTasks.length > 1 && (
            <div className="relative">
              <select
                aria-label="Change activity"
                className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                onChange={(e) => {
                  const found = availableTasks.find((t) => t.id === e.target.value);
                  if (found) {
                    setSelectedTask(found);
                    handleRetake();
                  }
                }}
                value={selectedTask.id}
              >
                {availableTasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title} (+{t.points} pts)
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="font-label-chunky text-xs font-bold text-on-surface-variant bg-surface-container-high hover:bg-surface-container-highest px-2.5 py-1.5 rounded-xl border border-surface-container-highest flex items-center gap-1 shadow-[0_2px_0_#0a0f0d]"
              >
                <span>Change</span>
                <span className="material-symbols-outlined text-[16px]">expand_more</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="p-4 bg-surface-container rounded-2xl border border-surface-container-high text-center space-y-2">
          <p className="font-body-md text-xs text-on-surface-variant">Please choose an activity first</p>
          <Link
            to="/activities"
            className="inline-block px-4 py-2 bg-primary-container text-on-primary-fixed font-label-chunky rounded-xl text-xs font-bold uppercase shadow-[0_3px_0_#2d5000]"
          >
            Browse Activities
          </Link>
        </div>
      )}

      {/* Live Rear Camera Capture Component */}
      <CameraCapture
        onCapture={handleCapture}
        onRetake={handleRetake}
        capturedPreview={capturedPreview}
      />

      {/* Bottom Sheet for Confirmation & Submission */}
      {capturedPreview && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm transition-opacity">
          <div
            className="w-full max-w-md bg-surface-container rounded-t-3xl shadow-2xl p-5 space-y-4 max-h-[85dvh] overflow-y-auto border-t-2 border-primary-container"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 16px) + 20px)' }}
          >
            <div className="flex items-center justify-between border-b border-surface-container-high pb-3">
              <h3 className="font-title-md text-base font-extrabold text-primary uppercase">
                Confirm Photo Submission
              </h3>
              <button
                type="button"
                onClick={handleRetake}
                className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Error Message in Sheet */}
            {submitError && (
              <div className="p-3 bg-error-container/20 border border-error rounded-xl text-xs text-error font-bold">
                {submitError}
              </div>
            )}

            {/* Confirmation Dialog on Success */}
            {submitSuccess ? (
              <div className="p-6 text-center space-y-3 bg-primary-container/10 rounded-2xl border border-primary-container">
                <div className="w-12 h-12 rounded-full bg-primary-container text-on-primary-fixed flex items-center justify-center mx-auto shadow-inner">
                  <span className="material-symbols-outlined text-[28px] font-black">check</span>
                </div>
                <h4 className="font-headline-md text-base font-black text-primary uppercase">
                  Proof Submitted!
                </h4>
                <p className="font-body-md text-xs text-on-surface-variant leading-relaxed max-w-xs mx-auto">
                  Your photo proof has been logged with status <strong>Pending</strong>. An admin will review it within <strong>24 hours</strong> to credit your <strong>+{selectedTask?.points} Eco Points</strong>.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    handleRetake();
                    navigate('/activities');
                  }}
                  className="w-full min-h-[44px] py-2.5 px-4 bg-primary-container text-on-primary-fixed rounded-xl font-label-chunky text-xs uppercase font-extrabold transition shadow-[0_3px_0_#2d5000]"
                >
                  Back to Activities
                </button>
              </div>
            ) : (
              <>
                {/* Task & Photo Summary */}
                <div className="flex items-center gap-3 p-3 bg-surface-container-low rounded-2xl border border-surface-container-high">
                  <img
                    src={capturedPreview}
                    alt="Captured proof"
                    className="w-16 h-16 rounded-xl object-cover border border-surface-container-high shrink-0"
                  />
                  <div className="space-y-0.5">
                    <p className="font-label-chunky text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                      Selected Task
                    </p>
                    <h4 className="font-title-md text-xs font-bold text-primary uppercase leading-snug">
                      {selectedTask?.title}
                    </h4>
                    <span className="font-label-mono-num text-[11px] font-black text-primary-container">
                      +{selectedTask?.points} Points to be awarded
                    </span>
                  </div>
                </div>

                {/* Submit Action Button with Tactile Extrusion */}
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleSubmitProof}
                  className="w-full min-h-[48px] py-3 px-4 bg-primary-container text-on-primary-fixed rounded-2xl font-label-chunky text-sm font-extrabold uppercase flex items-center justify-center gap-2 shadow-[0_4px_0_#2d5000] active:translate-y-1 active:shadow-none transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Uploading Proof...</span>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[20px]">check</span>
                      <span>Submit for Admin Review</span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Submissions History Section */}
      <div className="pt-2 border-t border-surface-container-high">
        <MySubmissions
          submissions={submissions}
          onResubmit={handleResubmitFromHistory}
          onRefresh={loadSubmissions}
        />
      </div>
    </div>
  );
}
