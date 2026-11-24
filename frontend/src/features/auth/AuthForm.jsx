import React, { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LoaderCircle, LogIn, UserPlus, Sparkles, Shield } from 'lucide-react';
import { apiFetch } from '../../lib/api.js';
import { useAuth } from './AuthProvider.jsx';

function getErrorMessage(error) {
  return error.data?.error?.message || error.data?.message || error.message || 'Please try again.';
}

export default function AuthForm({ mode }) {
  const isSignup = mode === 'signup';
  const { user, loading: authLoading, login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [values, setValues] = useState({ displayName: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const notice = location.state?.notice;

  if (authLoading) {
    return <div className="grid min-h-screen place-items-center bg-surface text-primary" role="status">Loading EcoSync…</div>;
  }
  if (user) return <Navigate to="/" replace />;

  function handleDemoLogin(asAdmin = false) {
    const demoPayload = asAdmin
      ? {
          user: { id: '00000000-0000-4000-8000-000000000001', role: 'ADMIN', email: 'admin@ecosync.example' },
          profile: { id: '00000000-0000-4000-8000-000000000001', displayName: 'EcoSync Admin' },
          token: 'demo.eyJzdWIiOiIwMDAwMDAwMC0wMDAwLTQwMDAtODAwMC0wMDAwMDAwMDAwMDEiLCJyb2xlIjoiQURNSU4ifQ.sig',
        }
      : {
          user: { id: '11111111-1111-4111-8111-111111111111', role: 'USER', email: 'yug@ecosync.example' },
          profile: { id: '11111111-1111-4111-8111-111111111111', displayName: 'Yug Dhamecha' },
          token: 'demo.eyJzdWIiOiIxMTExMTExMS0xMTExLTQxMTEtODExMS0xMTExMTExMTExMTEiLCJyb2xlIjoiVVNFUiJ9.sig',
        };

    localStorage.setItem('ecosync_display_name', demoPayload.profile.displayName);
    if (asAdmin) {
      localStorage.setItem('dev_role', 'admin');
    } else {
      localStorage.removeItem('dev_role');
    }

    login(demoPayload);
    navigate('/', { replace: true });
  }

  function validate() {
    const next = {};
    const email = values.email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) next.email = 'Enter a valid email address.';
    if (values.password.length < 8 || values.password.length > 128) next.password = 'Use 8–128 characters.';
    if (isSignup) {
      const name = values.displayName.trim();
      if (name.length < 2 || name.length > 30) next.displayName = 'Use 2–30 characters.';
      if (values.confirmPassword !== values.password) next.confirmPassword = 'Passwords do not match.';
    }
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  function update(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    setError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;
    setError('');
    if (!validate()) return;

    setSubmitting(true);
    try {
      const body = isSignup
        ? { email: values.email.trim(), password: values.password, displayName: values.displayName.trim() }
        : { email: values.email.trim(), password: values.password };
      const result = await apiFetch(`/api/auth/${isSignup ? 'signup' : 'login'}`, {
        method: 'POST',
        body,
      });
      login(result);
      navigate('/', { replace: true });
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setSubmitting(false);
    }
  }

  const title = isSignup ? 'Create Account' : 'Arcade Access';
  const inputClass = 'min-h-12 w-full rounded-xl border border-surface-container-high bg-surface-container-lowest px-4 text-base text-on-surface outline-none transition placeholder:text-on-surface-variant/50 focus:border-primary-container focus:ring-2 focus:ring-primary-container/30';

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-4 py-8 sm:px-6 select-none">
      <section className="w-full max-w-md" aria-labelledby="auth-title">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-primary-container text-on-primary-fixed shadow-[0_4px_0_#2d5000]">
            <span className="material-symbols-outlined text-[32px] font-black">eco</span>
          </div>
          <p className="mb-1 text-xs font-black tracking-widest text-primary-container uppercase">ECOSYNC TACTILE ARCADE</p>
          <h1 id="auth-title" className="text-2xl font-black uppercase tracking-tight text-primary sm:text-3xl">{title}</h1>
          <p className="mt-1 text-xs text-on-surface-variant font-medium">
            {isSignup ? 'Build climate habits with high-impact arcade progression.' : 'Sign in to sync your eco streak and photo proofs.'}
          </p>
        </div>

        {/* 1-Click Fast Preview Logins */}
        <div className="mb-4 space-y-2.5">
          <button
            type="button"
            onClick={() => handleDemoLogin(false)}
            className="w-full min-h-[48px] py-3 px-4 bg-primary-container text-on-primary-fixed rounded-2xl font-label-chunky text-xs uppercase font-extrabold flex items-center justify-center gap-2 shadow-[0_4px_0_#2d5000] active:translate-y-1 active:shadow-none transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>⚡ 1-Click Demo Login (Yug Dhamecha)</span>
          </button>

          <button
            type="button"
            onClick={() => handleDemoLogin(true)}
            className="w-full min-h-[40px] py-2 px-3 bg-surface-container hover:bg-surface-container-high text-secondary rounded-xl font-label-chunky text-[11px] uppercase font-bold flex items-center justify-center gap-1.5 border border-surface-container-high shadow-[0_2px_0_#0a0f0d] active:translate-y-0.5 transition-all cursor-pointer"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>🛡️ Demo Admin Mode (Review Queue)</span>
          </button>
        </div>

        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-surface-container-high"></div>
          <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">or sign in with email</span>
          <div className="flex-1 h-px bg-surface-container-high"></div>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4 rounded-3xl border border-surface-container-high bg-surface-container p-5 shadow-xl sm:p-6">
          {notice && <div className="rounded-xl border border-primary-container/40 bg-primary-container/10 p-3 text-xs text-primary font-bold" role="status">{notice}</div>}
          {error && <div className="rounded-xl border border-error bg-error-container/20 p-3 text-xs text-error font-bold" role="alert">{error}</div>}

          {isSignup && (
            <div>
              <label htmlFor="displayName" className="mb-1.5 block text-xs font-bold text-on-surface uppercase">Display Name</label>
              <input id="displayName" name="displayName" type="text" maxLength={30} required
                value={values.displayName} onChange={(event) => update('displayName', event.target.value)}
                className={inputClass} placeholder="Your eco username" />
              {fieldErrors.displayName && <p className="mt-1 text-xs text-error font-bold">{fieldErrors.displayName}</p>}
            </div>
          )}

          <div>
            <label htmlFor="email" className="mb-1.5 block text-xs font-bold text-on-surface uppercase">Email Address</label>
            <input id="email" name="email" type="email" inputMode="email" maxLength={254} required
              value={values.email} onChange={(event) => update('email', event.target.value)}
              className={inputClass} placeholder="yug@example.com" />
            {fieldErrors.email && <p className="mt-1 text-xs text-error font-bold">{fieldErrors.email}</p>}
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-xs font-bold text-on-surface uppercase">Password</label>
            <div className="relative">
              <input id="password" name="password" type={showPassword ? 'text' : 'password'} minLength={8} maxLength={128} required
                value={values.password} onChange={(event) => update('password', event.target.value)}
                className={`${inputClass} pr-12`} placeholder="At least 8 characters" />
              <button type="button" onClick={() => setShowPassword((visible) => !visible)}
                className="absolute inset-y-0 right-2 grid w-10 place-items-center rounded-lg text-on-surface-variant hover:text-on-surface"
                aria-label={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {fieldErrors.password && <p className="mt-1 text-xs text-error font-bold">{fieldErrors.password}</p>}
          </div>

          {isSignup && (
            <div>
              <label htmlFor="confirmPassword" className="mb-1.5 block text-xs font-bold text-on-surface uppercase">Confirm Password</label>
              <input id="confirmPassword" name="confirmPassword" type={showPassword ? 'text' : 'password'} minLength={8} maxLength={128} required
                value={values.confirmPassword} onChange={(event) => update('confirmPassword', event.target.value)}
                className={inputClass} placeholder="Confirm your password" />
              {fieldErrors.confirmPassword && <p className="mt-1 text-xs text-error font-bold">{fieldErrors.confirmPassword}</p>}
            </div>
          )}

          <button type="submit" disabled={submitting}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-surface-container-highest hover:bg-surface-bright text-primary font-label-chunky text-xs uppercase font-extrabold shadow-[0_3px_0_#0a0f0d] active:translate-y-0.5 transition-all cursor-pointer disabled:opacity-60">
            {submitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : isSignup ? <UserPlus className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
            {submitting ? 'Please wait…' : isSignup ? 'Create Account' : 'Sign In'}
          </button>

          <p className="pt-1 text-center text-xs text-on-surface-variant">
            {isSignup ? 'Already have an account?' : 'New to EcoSync?'}{' '}
            <Link to={isSignup ? '/login' : '/signup'} className="font-bold text-primary-container hover:underline">
              {isSignup ? 'Sign in' : 'Create an account'}
            </Link>
          </p>
        </form>
      </section>
    </main>
  );
}
