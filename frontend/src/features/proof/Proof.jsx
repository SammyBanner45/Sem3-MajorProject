import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  Camera,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  ArrowLeft,
  Sparkles,
  ChevronDown
} from 'lucide-react';
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

  // Load fallback tasks if user arrived directly at /proof without selecting an activity
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
      // Create a File object from blob for multipart form submission
      const file = new File([capturedBlob], 'camera-proof.jpg', { type: 'image/jpeg' });
      await submitPhotoProof(selectedTask.id, file);

      setSubmitSuccess(true);
      // Refresh submissions history in background
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
      points: sub.points || 15
    });
    handleRetake();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div className="space-y-6 max-w-md mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => navigate('/activities')}
            className="w-9 h-9 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-600 hover:text-gray-900 transition shadow-2xs"
            aria-label="Back to activities"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-black tracking-tight text-gray-900">Photo Proof</h1>
            <p className="text-xs text-gray-500">Live camera-only verification</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Link
            to="/admin/review"
            className="text-[11px] font-bold text-eco-700 bg-eco-50 hover:bg-eco-100 border border-eco-200 px-2.5 py-1.5 rounded-xl transition flex items-center gap-1 shadow-2xs"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Review Queue</span>
          </Link>
          <div className="w-9 h-9 rounded-xl bg-eco-100 flex items-center justify-center text-eco-700 shadow-2xs">
            <Camera className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Camera-Only Warning Banner */}
      <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200/80 flex items-start gap-3 shadow-2xs">
        <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <p className="text-[11px] text-amber-800 leading-relaxed">
          <strong>Camera-only:</strong> Gallery and file uploads are disabled to prevent fraud. Snap a fresh live photo of your eco action.
        </p>
      </div>

      {/* Selected Task Card / Switcher */}
      {selectedTask ? (
        <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-eco-50 flex items-center justify-center text-2xl shrink-0 shadow-inner">
              {selectedTask.icon || (selectedTask.type === 'challenge' ? '🔥' : '🌱')}
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-eco-700">
                {selectedTask.type === 'challenge' ? 'Daily Challenge' : 'Daily Activity'}
              </span>
              <h2 className="font-bold text-sm text-gray-900 leading-snug line-clamp-1">
                {selectedTask.title}
              </h2>
              <p className="text-[11px] font-extrabold text-eco-600">
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
                className="text-xs font-bold text-gray-500 bg-gray-50 hover:bg-gray-100 px-2.5 py-1.5 rounded-xl border border-gray-200 flex items-center gap-1"
              >
                <span>Change</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="p-4 bg-white rounded-2xl border border-gray-100 text-center space-y-2">
          <p className="text-xs text-gray-500">Please choose an activity first</p>
          <Link
            to="/activities"
            className="inline-block px-4 py-2 bg-eco-600 text-white rounded-xl text-xs font-bold"
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
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-xs transition-opacity animate-fade-in">
          <div
            className="w-full max-w-md bg-white rounded-t-3xl shadow-2xl p-5 space-y-4 max-h-[85dvh] overflow-y-auto pb-[env(safe-area-inset-bottom,20px)] animate-slide-up"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 16px) + 20px)' }}
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-extrabold text-gray-900">Confirm Photo Submission</h3>
              <button
                type="button"
                onClick={handleRetake}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error Message in Sheet */}
            {submitError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-xs text-rose-800">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-bold">Submission Failed</p>
                  <p className="text-[11px] text-rose-700">{submitError}</p>
                </div>
              </div>
            )}

            {/* Confirmation Dialog on Success */}
            {submitSuccess ? (
              <div className="p-6 text-center space-y-3 bg-emerald-50 rounded-2xl border border-emerald-200">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h4 className="text-base font-black text-emerald-950">
                  Proof Submitted Successfully!
                </h4>
                <p className="text-xs text-emerald-800 leading-relaxed max-w-xs mx-auto">
                  Your photo proof has been logged with status <strong>Pending</strong>. An admin will review it within <strong>24 hours</strong> to credit your <strong>+{selectedTask?.points} Eco Points</strong>.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    handleRetake();
                    navigate('/activities');
                  }}
                  className="w-full min-h-[44px] py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
                >
                  Back to Activities
                </button>
              </div>
            ) : (
              <>
                {/* Task & Photo Summary */}
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-gray-100">
                  <img
                    src={capturedPreview}
                    alt="Captured proof"
                    className="w-16 h-16 rounded-xl object-cover border border-gray-200 shrink-0"
                  />
                  <div className="space-y-0.5">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      Selected Task
                    </p>
                    <h4 className="text-xs font-bold text-gray-900 leading-snug">
                      {selectedTask?.title}
                    </h4>
                    <span className="text-[11px] font-black text-eco-700">
                      +{selectedTask?.points} Points to be awarded
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-gray-500 space-y-1">
                  <p>• Make sure the photo clearly demonstrates the completed task.</p>
                  <p>• Only 1 submission allowed per task per day.</p>
                </div>

                {/* Submit Action Button */}
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleSubmitProof}
                  className="w-full min-h-[48px] py-3 px-4 bg-eco-600 hover:bg-eco-700 text-white rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition shadow-md active:scale-[0.98] disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Uploading Proof...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
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
      <div className="pt-2 border-t border-gray-100">
        <MySubmissions
          submissions={submissions}
          onResubmit={handleResubmitFromHistory}
          onRefresh={loadSubmissions}
        />
      </div>
    </div>
  );
}
