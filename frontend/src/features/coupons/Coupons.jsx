import React, { useEffect, useState } from 'react';
import { Copy, Gift, LoaderCircle } from 'lucide-react';
import { apiFetch } from '../../lib/api.js';

function isCouponResponse(value) {
  return value && Number.isInteger(value.currentStreak) && Array.isArray(value.coupons) &&
    value.coupons.every((coupon) => coupon && typeof coupon.code === 'string' &&
      Number.isInteger(coupon.milestoneDay) && typeof coupon.title === 'string' &&
      typeof coupon.discount === 'string' && typeof coupon.isRedeemed === 'boolean');
}

export default function Coupons() {
  const [state, setState] = useState({ coupons: [], currentStreak: 0, loading: true, error: '' });
  const [copiedCode, setCopiedCode] = useState('');
  const [copyError, setCopyError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    setState({ coupons: [], currentStreak: 0, loading: true, error: '' });
    apiFetch('/api/coupons/me', { signal: controller.signal })
      .then((response) => {
        if (!isCouponResponse(response)) throw new Error('The coupon service returned an invalid response.');
        setState({ ...response, loading: false, error: '' });
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setState({ coupons: [], currentStreak: 0, loading: false, error: error.message || 'Coupons are unavailable right now.' });
        }
      });
    return () => controller.abort();
  }, []);

  async function copyCode(code) {
    setCopiedCode('');
    setCopyError('');
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard access is unavailable in this browser.');
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
    } catch {
      setCopyError('Could not copy the code. Select and copy it manually.');
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Streak Coupons</h1>
          <p className="text-xs text-gray-500">Your rewards for {state.currentStreak} consecutive approved days</p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-amber-600">
          <Gift className="h-5 w-5" aria-hidden="true" />
        </div>
      </div>

      {state.loading && <div className="flex items-center gap-2 rounded-2xl border border-gray-100 bg-white p-4 text-sm text-gray-600" role="status">
        <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> Loading your coupons…
      </div>}

      {!state.loading && state.error && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800" role="alert">{state.error}</div>}

      {!state.loading && !state.error && state.coupons.length === 0 && <div className="rounded-2xl border border-gray-200 bg-white p-5 text-sm text-gray-600" role="status">
        No coupons yet. Reach a 7-day streak to unlock your first reward.
      </div>}

      {!state.loading && !state.error && state.coupons.length > 0 && <div className="space-y-3">
        {state.coupons.map((coupon) => (
          <article key={coupon.code} className={`rounded-2xl border p-4 ${coupon.isRedeemed ? 'border-gray-200 bg-gray-50 opacity-75' : 'border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50'}`}>
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="rounded-full bg-amber-200/60 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800">
                {coupon.milestoneDay}-Day Milestone
              </span>
              <span className="text-xs font-semibold text-gray-500">{coupon.isRedeemed ? 'Redeemed' : 'Available'}</span>
            </div>
            <h2 className="text-sm font-bold text-gray-800">{coupon.title}</h2>
            {coupon.description && <p className="mt-0.5 text-xs text-gray-600">{coupon.description}</p>}
            <p className="mt-1 text-xs font-medium text-gray-700">{coupon.discount}</p>
            <div className="mt-3 flex items-center justify-between gap-3 border-t border-amber-200/60 pt-3">
              <code className="break-all rounded bg-white/70 px-2 py-1 font-mono text-xs font-bold text-amber-900">{coupon.code}</code>
              {!coupon.isRedeemed && <button type="button" onClick={() => copyCode(coupon.code)}
                className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-amber-700 hover:underline focus:outline-none focus:ring-2 focus:ring-amber-500"
                aria-label={`Copy coupon code for ${coupon.milestoneDay}-day milestone`}>
                <Copy className="h-3.5 w-3.5" aria-hidden="true" /> {copiedCode === coupon.code ? 'Copied' : 'Copy Code'}
              </button>}
            </div>
          </article>
        ))}
      </div>}
      {copyError && <p className="text-sm text-rose-700" role="alert">{copyError}</p>}
    </div>
  );
}
