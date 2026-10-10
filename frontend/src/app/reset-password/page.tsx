'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { requestPasswordReset, confirmPasswordReset } from '@/services/authService';
import {
  resetPasswordRequestSchema,
  resetPasswordConfirmSchema,
  formatZodErrors,
  FormErrors,
  ResetPasswordRequestFormData,
  ResetPasswordConfirmFormData,
} from '@/lib/validations';
import TurnstileWidget from '@/components/common/TurnstileWidget';

function ResetPasswordContent() {
  const searchParams = useSearchParams();

  const uid = searchParams.get('uid');
  const token = searchParams.get('token');

  const isConfirmMode = Boolean(uid && token);

  // Request mode state
  const [email, setEmail] = useState('');
  const [requestSuccess, setRequestSuccess] = useState(false);
  const [requestErrors, setRequestErrors] = useState<FormErrors<ResetPasswordRequestFormData>>({});

  // Confirm mode state
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [confirmSuccess, setConfirmSuccess] = useState(false);
  const [confirmErrors, setConfirmErrors] = useState<FormErrors<ResetPasswordConfirmFormData>>({});

  const [turnstileToken, setTurnstileToken] = useState('');
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleRequestSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);
    setRequestErrors({});

    const result = resetPasswordRequestSchema.safeParse({ email });
    if (!result.success) {
      const errs = formatZodErrors<ResetPasswordRequestFormData>(result.error);
      setRequestErrors(errs);
      const el = document.getElementById('reset-email');
      if (el) el.focus();
      return;
    }

    setLoading(true);
    try {
      await requestPasswordReset(email, turnstileToken);
      setRequestSuccess(true);
    } catch (err: any) {
      setServerError(err.message || 'Unable to request password reset. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);
    setConfirmErrors({});

    const result = resetPasswordConfirmSchema.safeParse({
      password: newPassword,
      passwordConfirm: newPasswordConfirm,
    });

    if (!result.success) {
      const errs = formatZodErrors<ResetPasswordConfirmFormData>(result.error);
      setConfirmErrors(errs);
      const firstKey = Object.keys(errs)[0];
      const el = document.getElementById(firstKey === 'password' ? 'newPassword' : 'newPasswordConfirm');
      if (el) el.focus();
      return;
    }

    setLoading(true);
    try {
      await confirmPasswordReset({
        uid: uid!,
        token: token!,
        new_password: newPassword,
        new_password_confirm: newPasswordConfirm,
      });
      setConfirmSuccess(true);
    } catch (err: any) {
      setServerError(err.message || 'Invalid or expired password reset token.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
      <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
        {isConfirmMode ? 'Set New Password' : 'Reset Your Password'}
      </h1>
      <p className="mt-1 text-sm text-slate-600">
        {isConfirmMode
          ? 'Enter your new secure password below.'
          : 'Enter your registered email address and we will generate a password reset link.'}
      </p>

      {serverError && (
        <div role="alert" className="mt-4 p-3 bg-red-50 border-l-4 border-red-600 text-red-800 text-sm rounded-r">
          <span className="font-bold">Error:</span> {serverError}
        </div>
      )}

      {isConfirmMode ? (
        confirmSuccess ? (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-green-900">
            <p className="font-bold">Password successfully updated!</p>
            <p className="mt-1">You can now sign in with your new password.</p>
            <Link
              href="/login"
              className="mt-3 inline-block px-4 py-2 bg-blue-700 text-white font-semibold rounded-md hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              Go to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleConfirmSubmit} noValidate className="mt-6 space-y-4">
            <div>
              <label htmlFor="newPassword" className="block text-sm font-semibold text-slate-800">
                New Password <span className="text-red-600">*</span>
              </label>
              <input
                id="newPassword"
                type="password"
                required
                aria-required="true"
                aria-invalid={!!confirmErrors.password}
                aria-describedby={confirmErrors.password ? 'newPassword-error' : undefined}
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (confirmErrors.password) setConfirmErrors({ ...confirmErrors, password: undefined });
                }}
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm sm:text-sm text-slate-900 focus:ring-2 focus:outline-none ${
                  confirmErrors.password
                    ? 'border-red-600 ring-1 ring-red-600 focus:ring-red-600'
                    : 'border-slate-300 focus:ring-blue-600 focus:border-blue-600'
                }`}
                placeholder="Min. 8 characters"
              />
              {confirmErrors.password && (
                <p id="newPassword-error" role="alert" className="text-red-700 text-xs mt-1 font-semibold">
                  {confirmErrors.password}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="newPasswordConfirm" className="block text-sm font-semibold text-slate-800">
                Confirm New Password <span className="text-red-600">*</span>
              </label>
              <input
                id="newPasswordConfirm"
                type="password"
                required
                aria-required="true"
                aria-invalid={!!confirmErrors.passwordConfirm}
                aria-describedby={confirmErrors.passwordConfirm ? 'newPasswordConfirm-error' : undefined}
                value={newPasswordConfirm}
                onChange={(e) => {
                  setNewPasswordConfirm(e.target.value);
                  if (confirmErrors.passwordConfirm) setConfirmErrors({ ...confirmErrors, passwordConfirm: undefined });
                }}
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm sm:text-sm text-slate-900 focus:ring-2 focus:outline-none ${
                  confirmErrors.passwordConfirm
                    ? 'border-red-600 ring-1 ring-red-600 focus:ring-red-600'
                    : 'border-slate-300 focus:ring-blue-600 focus:border-blue-600'
                }`}
                placeholder="Re-enter password"
              />
              {confirmErrors.passwordConfirm && (
                <p id="newPasswordConfirm-error" role="alert" className="text-red-700 text-xs mt-1 font-semibold">
                  {confirmErrors.passwordConfirm}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-md shadow-sm text-sm font-bold text-white bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50"
            >
              {loading ? 'Updating Password...' : 'Save New Password'}
            </button>
          </form>
        )
      ) : requestSuccess ? (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-green-900">
          <p className="font-bold">Reset link dispatched!</p>
          <p className="mt-1">
            If an account is associated with <strong>{email}</strong>, instructions have been generated.
            (In this development environment, the email and link are printed directly to the Django terminal console).
          </p>
          <Link
            href="/login"
            className="mt-3 inline-block px-4 py-2 bg-blue-700 text-white font-semibold rounded-md hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            Back to Login
          </Link>
        </div>
      ) : (
        <form onSubmit={handleRequestSubmit} noValidate className="mt-6 space-y-4">
          <div>
            <label htmlFor="reset-email" className="block text-sm font-semibold text-slate-800">
              Email Address <span className="text-red-600">*</span>
            </label>
            <input
              id="reset-email"
              type="email"
              required
              aria-required="true"
              aria-invalid={!!requestErrors.email}
              aria-describedby={requestErrors.email ? 'reset-email-error' : undefined}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (requestErrors.email) setRequestErrors({ ...requestErrors, email: undefined });
              }}
              className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm sm:text-sm text-slate-900 focus:ring-2 focus:outline-none ${
                requestErrors.email
                  ? 'border-red-600 ring-1 ring-red-600 focus:ring-red-600'
                  : 'border-slate-300 focus:ring-blue-600 focus:border-blue-600'
              }`}
              placeholder="e.g. rahul@example.com"
            />
            {requestErrors.email && (
              <p id="reset-email-error" role="alert" className="text-red-700 text-xs mt-1 font-semibold">
                {requestErrors.email}
              </p>
            )}
          </div>

          {/* Cloudflare Turnstile Spam Protection */}
          <TurnstileWidget onVerify={(token) => setTurnstileToken(token)} />

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-md shadow-sm text-sm font-bold text-white bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50"
          >
            {loading ? 'Sending link...' : 'Send Password Reset Link'}
          </button>
        </form>
      )}

      <div className="mt-6 pt-4 border-t border-slate-200 text-center">
        <Link href="/login" className="text-sm font-semibold text-blue-700 hover:underline focus:outline-none focus:ring-1 focus:ring-blue-600 rounded">
          Back to Login
        </Link>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="max-w-md mx-auto my-12 px-4">
      <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading reset form...</div>}>
        <ResetPasswordContent />
      </Suspense>
    </div>
  );
}
