'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types/user';
import { registerSchema, formatZodErrors, FormErrors, RegisterFormData } from '@/lib/validations';
import TurnstileWidget from '@/components/common/TurnstileWidget';
import { trackEvent } from '@/lib/analytics';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('candidate');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');

  const [fieldErrors, setFieldErrors] = useState<FormErrors<RegisterFormData>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Track privacy-safe event that registration flow was initiated
    trackEvent('register_started');
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);
    setFieldErrors({});

    // 1. Frontend validation using shared Zod schema matching backend rules
    const result = registerSchema.safeParse({
      fullName,
      email,
      phone,
      role,
      password,
      passwordConfirm,
      termsAccepted,
    });

    if (!result.success) {
      const formatted = formatZodErrors<RegisterFormData>(result.error);
      setFieldErrors(formatted);

      // Move keyboard focus to the first erroneous input
      const errorKeys = Object.keys(formatted);
      if (errorKeys.length > 0) {
        const firstField = errorKeys[0];
        const idMap: Record<string, string> = {
          fullName: 'fullName',
          email: 'reg-email',
          phone: 'phone',
          password: 'reg-password',
          passwordConfirm: 'reg-confirm',
          termsAccepted: 'termsConsent',
        };
        const el = document.getElementById(idMap[firstField] || firstField);
        if (el) {
          el.focus();
        }
      }
      return;
    }

    setLoading(true);
    try {
      await register({
        full_name: fullName,
        email,
        phone: phone || undefined,
        role,
        password,
        password_confirm: passwordConfirm,
        terms_accepted: termsAccepted,
        turnstile_token: turnstileToken,
      });
      router.push('/dashboard');
    } catch (err: any) {
      if (err.data && typeof err.data === 'object') {
        const backendErrors: FormErrors<RegisterFormData> = {};
        if (err.data.email) backendErrors.email = Array.isArray(err.data.email) ? err.data.email[0] : err.data.email;
        if (err.data.password) backendErrors.password = Array.isArray(err.data.password) ? err.data.password[0] : err.data.password;
        if (err.data.turnstile_token) {
          setServerError(Array.isArray(err.data.turnstile_token) ? err.data.turnstile_token[0] : err.data.turnstile_token);
        } else {
          setServerError(err.message || 'Registration failed. Please check the fields below.');
        }
        setFieldErrors(backendErrors);
      } else {
        setServerError(err.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto my-10 px-4">
      <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Create an Account</h1>
        <p className="mt-1 text-sm text-slate-600">
          Join Udyog Saarthi to access accessible jobs, government vacancies, and personalized exam prep.
        </p>

        {serverError && (
          <div
            role="alert"
            className="mt-4 p-3 bg-red-50 border-l-4 border-red-600 text-red-800 text-sm rounded-r"
          >
            <span className="font-bold">Error:</span> {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
          {/* Role Selection */}
          <fieldset className="border border-slate-200 rounded-lg p-4 bg-slate-50">
            <legend className="text-sm font-bold text-slate-800 px-1">
              Select Your Account Type <span className="text-red-600" aria-hidden="true">*</span>
            </legend>
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                className={`flex items-start p-3 rounded-lg border transition ${
                  role === 'candidate'
                    ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-600'
                    : 'border-slate-300 bg-white hover:bg-slate-50'
                }`}
              >
                <input
                  id="role-candidate"
                  type="radio"
                  name="role"
                  value="candidate"
                  checked={role === 'candidate'}
                  onChange={() => setRole('candidate')}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300"
                />
                <label htmlFor="role-candidate" className="ml-3 cursor-pointer">
                  <span className="block text-sm font-bold text-slate-900">Job Candidate</span>
                  <span className="block text-xs text-slate-500 mt-0.5">
                    For persons with disabilities seeking employment.
                  </span>
                </label>
              </div>

              <div
                className={`flex items-start p-3 rounded-lg border transition ${
                  role === 'guardian'
                    ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-600'
                    : 'border-slate-300 bg-white hover:bg-slate-50'
                }`}
              >
                <input
                  id="role-guardian"
                  type="radio"
                  name="role"
                  value="guardian"
                  checked={role === 'guardian'}
                  onChange={() => setRole('guardian')}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300"
                />
                <label htmlFor="role-guardian" className="ml-3 cursor-pointer">
                  <span className="block text-sm font-bold text-slate-900">Parent / Guardian</span>
                  <span className="block text-xs text-slate-500 mt-0.5">
                    Assisting a candidate with applications and tracking.
                  </span>
                </label>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Note: Job Coaches and Platform Admins are onboarded via institutional invitation.
            </p>
          </fieldset>

          {/* Full Name */}
          <div>
            <label htmlFor="fullName" className="block text-sm font-semibold text-slate-800">
              Full Name <span className="text-red-600" aria-hidden="true">*</span>
            </label>
            <input
              id="fullName"
              type="text"
              required
              aria-required="true"
              aria-invalid={!!fieldErrors.fullName}
              aria-describedby={fieldErrors.fullName ? 'fullName-error' : undefined}
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                if (fieldErrors.fullName) setFieldErrors({ ...fieldErrors, fullName: undefined });
              }}
              className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm sm:text-sm text-slate-900 focus:ring-2 focus:outline-none ${
                fieldErrors.fullName
                  ? 'border-red-600 ring-1 ring-red-600 focus:ring-red-600'
                  : 'border-slate-300 focus:ring-blue-600 focus:border-blue-600'
              }`}
              placeholder="e.g. Rahul Sharma"
            />
            {fieldErrors.fullName && (
              <p id="fullName-error" role="alert" className="text-red-700 text-xs mt-1 font-semibold">
                {fieldErrors.fullName}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="reg-email" className="block text-sm font-semibold text-slate-800">
              Email Address <span className="text-red-600" aria-hidden="true">*</span>
            </label>
            <input
              id="reg-email"
              type="email"
              required
              aria-required="true"
              aria-invalid={!!fieldErrors.email}
              aria-describedby={fieldErrors.email ? 'email-error' : undefined}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: undefined });
              }}
              className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm sm:text-sm text-slate-900 focus:ring-2 focus:outline-none ${
                fieldErrors.email
                  ? 'border-red-600 ring-1 ring-red-600 focus:ring-red-600'
                  : 'border-slate-300 focus:ring-blue-600 focus:border-blue-600'
              }`}
              placeholder="e.g. rahul@example.com"
            />
            {fieldErrors.email && (
              <p id="email-error" role="alert" className="text-red-700 text-xs mt-1 font-semibold">
                {fieldErrors.email}
              </p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="phone" className="block text-sm font-semibold text-slate-800">
              Mobile Number <span className="text-slate-500 font-normal">(Optional)</span>
            </label>
            <input
              id="phone"
              type="tel"
              aria-invalid={!!fieldErrors.phone}
              aria-describedby={fieldErrors.phone ? 'phone-error' : undefined}
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                if (fieldErrors.phone) setFieldErrors({ ...fieldErrors, phone: undefined });
              }}
              className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm sm:text-sm text-slate-900 focus:ring-2 focus:outline-none ${
                fieldErrors.phone
                  ? 'border-red-600 ring-1 ring-red-600 focus:ring-red-600'
                  : 'border-slate-300 focus:ring-blue-600 focus:border-blue-600'
              }`}
              placeholder="e.g. 9876543210"
            />
            {fieldErrors.phone && (
              <p id="phone-error" role="alert" className="text-red-700 text-xs mt-1 font-semibold">
                {fieldErrors.phone}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="reg-password" className="block text-sm font-semibold text-slate-800">
              Password <span className="text-red-600" aria-hidden="true">*</span>
            </label>
            <input
              id="reg-password"
              type="password"
              required
              aria-required="true"
              aria-invalid={!!fieldErrors.password}
              aria-describedby={fieldErrors.password ? 'password-error' : undefined}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: undefined });
              }}
              className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm sm:text-sm text-slate-900 focus:ring-2 focus:outline-none ${
                fieldErrors.password
                  ? 'border-red-600 ring-1 ring-red-600 focus:ring-red-600'
                  : 'border-slate-300 focus:ring-blue-600 focus:border-blue-600'
              }`}
              placeholder="Minimum 8 characters"
            />
            {fieldErrors.password && (
              <p id="password-error" role="alert" className="text-red-700 text-xs mt-1 font-semibold">
                {fieldErrors.password}
              </p>
            )}
          </div>

          {/* Password Confirm */}
          <div>
            <label htmlFor="reg-confirm" className="block text-sm font-semibold text-slate-800">
              Confirm Password <span className="text-red-600" aria-hidden="true">*</span>
            </label>
            <input
              id="reg-confirm"
              type="password"
              required
              aria-required="true"
              aria-invalid={!!fieldErrors.passwordConfirm}
              aria-describedby={fieldErrors.passwordConfirm ? 'passwordConfirm-error' : undefined}
              value={passwordConfirm}
              onChange={(e) => {
                setPasswordConfirm(e.target.value);
                if (fieldErrors.passwordConfirm) setFieldErrors({ ...fieldErrors, passwordConfirm: undefined });
              }}
              className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm sm:text-sm text-slate-900 focus:ring-2 focus:outline-none ${
                fieldErrors.passwordConfirm
                  ? 'border-red-600 ring-1 ring-red-600 focus:ring-red-600'
                  : 'border-slate-300 focus:ring-blue-600 focus:border-blue-600'
              }`}
              placeholder="Re-enter password"
            />
            {fieldErrors.passwordConfirm && (
              <p id="passwordConfirm-error" role="alert" className="text-red-700 text-xs mt-1 font-semibold">
                {fieldErrors.passwordConfirm}
              </p>
            )}
          </div>

          {/* Cloudflare Turnstile Spam Protection */}
          <TurnstileWidget onVerify={(token) => setTurnstileToken(token)} />

          {/* Terms & Privacy Consent Checkbox */}
          <div className="pt-2">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                id="termsConsent"
                type="checkbox"
                required
                aria-required="true"
                aria-invalid={!!fieldErrors.termsAccepted}
                aria-describedby={fieldErrors.termsAccepted ? 'termsAccepted-error' : undefined}
                checked={termsAccepted}
                onChange={(e) => {
                  setTermsAccepted(e.target.checked);
                  if (fieldErrors.termsAccepted) setFieldErrors({ ...fieldErrors, termsAccepted: undefined });
                }}
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
              />
              <span className="text-xs text-slate-700 leading-relaxed">
                I agree to the{' '}
                <Link
                  href="/terms"
                  target="_blank"
                  className="font-bold text-blue-700 hover:underline focus:outline-none focus:ring-1 focus:ring-blue-600 rounded"
                >
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link
                  href="/privacy-policy"
                  target="_blank"
                  className="font-bold text-blue-700 hover:underline focus:outline-none focus:ring-1 focus:ring-blue-600 rounded"
                >
                  Privacy Policy
                </Link>
                . I understand how my disability and accessibility data is protected under the DPDP Act, 2023. <span className="text-red-600" aria-hidden="true">*</span>
              </span>
            </label>
            {fieldErrors.termsAccepted && (
              <p id="termsAccepted-error" role="alert" className="text-red-700 text-xs mt-1 font-semibold">
                {fieldErrors.termsAccepted}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-bold text-white bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 disabled:opacity-50 transition"
          >
            {loading ? 'Creating account...' : 'Complete Registration'}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-200 text-center">
          <p className="text-sm text-slate-600">
            Already registered?{' '}
            <Link
              href="/login"
              className="font-semibold text-blue-700 hover:underline focus:outline-none focus:ring-1 focus:ring-blue-600 rounded"
            >
              Log in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
