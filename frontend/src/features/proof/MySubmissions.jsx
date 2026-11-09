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
      <div className="p-6 bg-white rounded-3xl border border-gray-100 text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 mx-auto">
          <ImageIcon className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-gray-800">No Photo Submissions Yet</h3>
        <p className="text-xs text-gray-500 max-w-xs mx-auto">
          Capture live photo proof for any daily activity or challenge to earn eco-points!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-black text-gray-700 uppercase tracking-wider">
          My Submissions History
        </h3>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            className="text-[11px] font-bold text-eco-600 hover:text-eco-700 flex items-center gap-1"
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
              className="p-4 bg-white rounded-2xl border border-gray-100 shadow-2xs space-y-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-0.5">
                  <h4 className="font-bold text-sm text-gray-900 leading-snug">
                    {sub.taskTitle || 'Activity Proof'}
                  </h4>
                  <p className="text-[11px] text-gray-400">{formatDate(sub.date || sub.createdAt)}</p>
                </div>

                {isApproved && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Approved
                  </span>
                )}
                {isPending && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 shrink-0">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    Pending Review
                  </span>
                )}
                {isRejected && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200 shrink-0">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
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
