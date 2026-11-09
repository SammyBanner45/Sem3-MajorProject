import React, { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Leaf, LoaderCircle, LogIn, UserPlus } from 'lucide-react';
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
    return <div className="grid min-h-screen place-items-center" role="status">Loading EcoSync…</div>;
  }
  if (user) return <Navigate to="/" replace />;

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
      const requested = location.state?.from;
      const destination = requested && requested.pathname !== '/login' && requested.pathname !== '/signup'
        ? `${requested.pathname}${requested.search || ''}${requested.hash || ''}`
        : '/';
      navigate(destination, { replace: true });
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setSubmitting(false);
    }
  }

  const title = isSignup ? 'Create your account' : 'Welcome back';
  const inputClass = 'min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-eco-500 focus:ring-4 focus:ring-eco-100';

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-eco-50 via-white to-white px-4 py-8 sm:px-6">
      <section className="w-full max-w-md" aria-labelledby="auth-title">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-eco-600 text-white shadow-lg shadow-eco-200">
            <Leaf className="h-7 w-7" aria-hidden="true" />
          </div>
          <p className="mb-1 text-sm font-bold tracking-wide text-eco-700">ECOSYNC</p>
          <h1 id="auth-title" className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
          <p className="mt-2 text-sm text-slate-600">
            {isSignup ? 'Build greener habits, one day at a time.' : 'Sign in to continue your sustainability journey.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-xl shadow-slate-200/60 sm:p-7">
          {notice && <div className="rounded-xl border border-eco-200 bg-eco-50 p-3 text-sm text-eco-900" role="status">{notice}</div>}
          {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">{error}</div>}

          {isSignup && (
            <div>
              <label htmlFor="displayName" className="mb-1.5 block text-sm font-semibold text-slate-700">Display name</label>
              <input id="displayName" name="displayName" type="text" autoComplete="nickname" maxLength={30} required
                value={values.displayName} onChange={(event) => update('displayName', event.target.value)}
                className={inputClass} placeholder="How should we greet you?" aria-invalid={Boolean(fieldErrors.displayName)} aria-describedby={fieldErrors.displayName ? 'displayName-error' : undefined} />
              {fieldErrors.displayName && <p id="displayName-error" className="mt-1 text-sm text-red-700">{fieldErrors.displayName}</p>}
            </div>
          )}

          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-slate-700">Email</label>
            <input id="email" name="email" type="email" inputMode="email" autoComplete="email" maxLength={254} required
              value={values.email} onChange={(event) => update('email', event.target.value)}
              className={inputClass} placeholder="you@example.com" aria-invalid={Boolean(fieldErrors.email)} aria-describedby={fieldErrors.email ? 'email-error' : undefined} />
            {fieldErrors.email && <p id="email-error" className="mt-1 text-sm text-red-700">{fieldErrors.email}</p>}
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-slate-700">Password</label>
            <div className="relative">
              <input id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete={isSignup ? 'new-password' : 'current-password'} minLength={8} maxLength={128} required
                value={values.password} onChange={(event) => update('password', event.target.value)}
                className={`${inputClass} pr-12`} placeholder="At least 8 characters" aria-invalid={Boolean(fieldErrors.password)} aria-describedby={fieldErrors.password ? 'password-error' : undefined} />
              <button type="button" onClick={() => setShowPassword((visible) => !visible)}
                className="absolute inset-y-0 right-2 grid w-10 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-eco-500"
                aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword}>
                {showPassword ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
              </button>
            </div>
            {fieldErrors.password && <p id="password-error" className="mt-1 text-sm text-red-700">{fieldErrors.password}</p>}
          </div>

          {isSignup && (
            <div>
              <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-semibold text-slate-700">Confirm password</label>
              <input id="confirmPassword" name="confirmPassword" type={showPassword ? 'text' : 'password'} autoComplete="new-password" minLength={8} maxLength={128} required
                value={values.confirmPassword} onChange={(event) => update('confirmPassword', event.target.value)}
                className={inputClass} placeholder="Enter your password again" aria-invalid={Boolean(fieldErrors.confirmPassword)} aria-describedby={fieldErrors.confirmPassword ? 'confirmPassword-error' : undefined} />
              {fieldErrors.confirmPassword && <p id="confirmPassword-error" className="mt-1 text-sm text-red-700">{fieldErrors.confirmPassword}</p>}
            </div>
          )}

          <button type="submit" disabled={submitting}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-eco-700 px-4 font-bold text-white shadow-md shadow-eco-200 transition hover:bg-eco-800 focus:outline-none focus:ring-4 focus:ring-eco-200 disabled:cursor-wait disabled:opacity-70">
            {submitting ? <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" /> : isSignup ? <UserPlus className="h-5 w-5" aria-hidden="true" /> : <LogIn className="h-5 w-5" aria-hidden="true" />}
            {submitting ? 'Please wait…' : isSignup ? 'Create account' : 'Sign in'}
          </button>

          <p className="pt-1 text-center text-sm text-slate-600">
            {isSignup ? 'Already have an account?' : 'New to EcoSync?'}{' '}
            <Link to={isSignup ? '/login' : '/signup'} className="font-bold text-eco-700 underline-offset-4 hover:underline focus:outline-none focus:ring-2 focus:ring-eco-500">
              {isSignup ? 'Sign in' : 'Create an account'}
            </Link>
          </p>
        </form>
      </section>
    </main>
  );
}
