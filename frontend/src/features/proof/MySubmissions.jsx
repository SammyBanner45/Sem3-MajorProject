import React from 'react';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  RotateCcw,
  Camera,
  Image as ImageIcon
} from 'lucide-react';

function formatDate(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  return d.toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default function MySubmissions({ submissions = [], onResubmit, onRefresh }) {
  if (!submissions || submissions.length === 0) {
    return (
      <div className="p-6 bg-surface-container rounded-3xl border border-surface-container-high text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-surface-container-high flex items-center justify-center text-on-surface-variant mx-auto">
          <ImageIcon className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-primary uppercase">No Photo Submissions Yet</h3>
        <p className="text-xs text-on-surface-variant max-w-xs mx-auto">
          Capture live photo proof for any daily activity or challenge to earn eco-points!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-black text-on-surface-variant uppercase tracking-wider">
          My Submissions History
        </h3>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            className="text-[11px] font-bold text-primary-container hover:underline flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            Refresh
          </button>
        )}
      </div>

      <div className="space-y-2.5">
        {submissions.map((sub) => {
          const isApproved = sub.status === 'approved';
          const isPending = sub.status === 'pending';
          const isRejected = sub.status === 'rejected';

          return (
            <div
              key={sub.id}
              className="p-4 bg-surface-container rounded-2xl border border-surface-container-high shadow-[0_2px_0_#0a0f0d] space-y-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-0.5">
                  <h4 className="font-bold text-sm text-primary uppercase leading-snug">
                    {sub.taskTitle || 'Activity Proof'}
                  </h4>
                  <p className="text-[11px] text-on-surface-variant">{formatDate(sub.date || sub.createdAt)}</p>
                </div>

                {isApproved && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-on-primary-fixed bg-primary-container px-2.5 py-0.5 rounded-full shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Approved
                  </span>
                )}
                {isPending && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-on-tertiary bg-tertiary-container px-2.5 py-0.5 rounded-full shrink-0">
                    <Clock className="w-3.5 h-3.5" />
                    Pending Review
                  </span>
                )}
                {isRejected && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-on-error bg-error px-2.5 py-0.5 rounded-full shrink-0">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Rejected
                  </span>
                )}
              </div>

              {/* Rejection Reason display */}
              {isRejected && (
                <div className="p-3 bg-rose-50/80 rounded-xl border border-rose-200 text-xs text-rose-900 space-y-1">
                  <div className="font-bold flex items-center gap-1 text-rose-800">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Reviewer Feedback:
                  </div>
                  <p className="text-[11px] text-rose-700 leading-relaxed">
                    {sub.rejectionReason || 'Photo proof did not meet activity guidelines.'}
                  </p>
                  {onResubmit && (
                    <button
                      type="button"
                      onClick={() => onResubmit(sub)}
                      className="mt-2 min-h-[36px] px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 transition"
                    >
                      <Camera className="w-3 h-3" />
                      Resubmit Now
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
