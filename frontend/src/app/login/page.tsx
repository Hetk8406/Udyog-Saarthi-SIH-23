'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { loginSchema, formatZodErrors, FormErrors, LoginFormData } from '@/lib/validations';
import TurnstileWidget, { TurnstileWidgetHandle } from '@/components/common/TurnstileWidget';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const returnTo = searchParams.get('returnTo');
  const sessionExpired = searchParams.get('sessionExpired') === 'true';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const turnstileRef = React.useRef<TurnstileWidgetHandle>(null);
  const [turnstileToken, setTurnstileToken] = useState('');

  const [fieldErrors, setFieldErrors] = useState<FormErrors<LoginFormData>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Quick fill demo user for easy evaluation
  const handleQuickFill = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Password123!');
    setServerError(null);
    setFieldErrors({});
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);
    setFieldErrors({});

    // 1. Frontend validation using shared Zod schema matching backend rules
    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      const formatted = formatZodErrors<LoginFormData>(result.error);
      setFieldErrors(formatted);

      // Move focus to first erroneous field
      const firstField = Object.keys(formatted)[0];
      const el = document.getElementById(firstField);
      if (el) el.focus();
      return;
    }

    setLoading(true);
    try {
      const loggedInUser = await login({
        email,
        password,
        turnstile_token: turnstileToken,
      });

      // Redirect safely to returnTo if provided, otherwise role-based destination
      if (returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//')) {
        router.push(returnTo);
      } else if (loggedInUser.role === 'admin') {
        router.push('/admin-panel');
      } else if (loggedInUser.role === 'coach') {
        router.push('/coach');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      // Reset Turnstile widget and token after every failed attempt
      setTurnstileToken('');
      turnstileRef.current?.reset();

      const statusCode = err.status;
      const details = err.details || err.data;

      // 1. Rate Limiting (HTTP 429)
      if (statusCode === 429 || (err.message && err.message.toLowerCase().includes('throttled'))) {
        setServerError('Too many login attempts. For security, please wait a minute before trying again.');
        return;
      }

      // 2. Structured backend errors (HTTP 400)
      if (details && typeof details === 'object') {
        const backendFieldErrors: FormErrors<LoginFormData> = {};
        if (details.email) {
          backendFieldErrors.email = Array.isArray(details.email) ? details.email[0] : details.email;
        }
        if (details.password) {
          backendFieldErrors.password = Array.isArray(details.password) ? details.password[0] : details.password;
        }
        setFieldErrors(backendFieldErrors);

        if (details.turnstile_token) {
          const tMsg = Array.isArray(details.turnstile_token) ? details.turnstile_token[0] : details.turnstile_token;
          setServerError(`Verification failed: ${tMsg}`);
          return;
        }

        if (details.non_field_errors) {
          const nfe = Array.isArray(details.non_field_errors) ? details.non_field_errors[0] : details.non_field_errors;
          if (typeof nfe === 'string' && nfe.includes('DEBUG is False')) {
            setServerError('Demo accounts are disabled when DEBUG is False. Please check your backend environment configuration.');
          } else {
            setServerError(nfe || 'Incorrect email or password. Please verify your credentials.');
          }
          return;
        }

        if (details.detail) {
          setServerError(details.detail);
          return;
        }

        if (Object.keys(backendFieldErrors).length > 0) {
          setServerError('Please correct the highlighted fields and try again.');
          return;
        }
      }

      // 3. Network or Server Connectivity Issues (HTTP 500+ or network abort)
      if (!statusCode || statusCode >= 500 || err.message?.includes('Cannot connect to backend')) {
        setServerError(
          'Unable to reach authentication server. Please verify your connection and ensure the backend is running.'
        );
        return;
      }

      // 4. Default plain-language fallback
      setServerError(err.message || 'Incorrect email or password. Please verify your credentials and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto my-12 px-4">
      <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Log In to Udyog Saarthi</h1>
        <p className="mt-1 text-sm text-slate-600">
          Enter your registered email and password to access your career dashboard.
        </p>

        {sessionExpired && (
          <div
            role="alert"
            className="mt-4 p-3.5 bg-amber-50 border border-amber-300 text-amber-900 text-sm rounded-lg flex items-start gap-2"
          >
            <span aria-hidden="true" className="text-base font-bold">⚠️</span>
            <div>
              <p className="font-semibold">Session Expired</p>
              <p className="text-xs text-amber-800 mt-0.5">Your previous session has expired. Please sign in again to continue where you left off.</p>
            </div>
          </div>
        )}

        {/* Quick-fill helper for test evaluation */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs font-semibold text-blue-900 mb-2">Quick Demo Login (1-click fill):</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleQuickFill('candidate@demo.com')}
              className="text-xs bg-white text-blue-800 border border-blue-300 px-2 py-1 rounded hover:bg-blue-100"
            >
              Candidate
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('guardian@demo.com')}
              className="text-xs bg-white text-blue-800 border border-blue-300 px-2 py-1 rounded hover:bg-blue-100"
            >
              Guardian
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('coach@demo.com')}
              className="text-xs bg-white text-blue-800 border border-blue-300 px-2 py-1 rounded hover:bg-blue-100"
            >
              Job Coach
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('admin@demo.com')}
              className="text-xs bg-white text-blue-800 border border-blue-300 px-2 py-1 rounded hover:bg-blue-100"
            >
              Admin
            </button>
          </div>
        </div>

        {serverError && (
          <div
            role="alert"
            className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-center gap-2"
          >
            <span aria-hidden="true">⚠️</span>
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-slate-800">
              Email Address <span className="text-red-500" aria-hidden="true">*</span>
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-describedby={fieldErrors.email ? 'email-error' : undefined}
              aria-invalid={Boolean(fieldErrors.email)}
              className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                fieldErrors.email ? 'border-red-500 bg-red-50' : 'border-slate-300'
              }`}
              placeholder="candidate@example.com"
            />
            {fieldErrors.email && (
              <p id="email-error" className="mt-1 text-xs text-red-600 font-medium" role="alert">
                {fieldErrors.email}
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="block text-sm font-semibold text-slate-800">
                Password <span className="text-red-500" aria-hidden="true">*</span>
              </label>
              <Link
                href="/reset-password"
                className="text-xs font-semibold text-blue-700 hover:underline focus:outline-none focus:ring-1 focus:ring-blue-600 rounded"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative mt-1">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-describedby={fieldErrors.password ? 'password-error' : undefined}
                aria-invalid={Boolean(fieldErrors.password)}
                className={`block w-full px-3 py-2 pr-10 border rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                  fieldErrors.password ? 'border-red-500 bg-red-50' : 'border-slate-300'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs font-medium text-slate-500 hover:text-slate-800"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {fieldErrors.password && (
              <p id="password-error" className="mt-1 text-xs text-red-600 font-medium" role="alert">
                {fieldErrors.password}
              </p>
            )}
          </div>

          <div className="pt-2">
            <TurnstileWidget
              ref={turnstileRef}
              onVerify={(token) => setTurnstileToken(token)}
              onError={() => setTurnstileToken('')}
              onExpire={() => setTurnstileToken('')}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-bold text-white bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 disabled:opacity-50 transition"
          >
            {loading ? 'Logging in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-200 text-center">
          <p className="text-sm text-slate-600">
            Do not have an account?{' '}
            <Link
              href="/register"
              className="font-semibold text-blue-700 hover:underline focus:outline-none focus:ring-1 focus:ring-blue-600 rounded"
            >
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="max-w-md mx-auto my-12 p-8 text-center text-slate-500">Loading sign in form...</div>}>
      <LoginContent />
    </Suspense>
  );
}
