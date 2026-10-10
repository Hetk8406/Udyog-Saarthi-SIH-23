/**
 * Privacy-Preserving Cookieless Analytics (Plausible)
 *
 * Requirements:
 * 1. Loaded ONLY after explicit user cookie consent.
 * 2. 100% cookieless and GDPR/DPDP Act 2023 compliant.
 * 3. Never tracks or transmits any PII, disability category, UDID, names, emails, or personal queries.
 * 4. Whitelisted event tracking only: 'register_started', 'job_saved', 'application_started'.
 */

type AllowedEvent = 'register_started' | 'job_saved' | 'application_started';

declare global {
  interface Window {
    plausible?: (
      eventName: string,
      options?: {
        props?: Record<string, string | number | boolean>;
        callback?: () => void;
      }
    ) => void;
  }
}

const PLAUSIBLE_DOMAIN = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN || 'udyogsaarthi.in';
const PLAUSIBLE_API_HOST = process.env.NEXT_PUBLIC_PLAUSIBLE_API_HOST || 'https://plausible.io';

let isInitialized = false;

/**
 * Initializes Plausible script dynamically ONLY when user has granted consent.
 */
export function initAnalytics(): void {
  if (typeof window === 'undefined') return;

  const consent = localStorage.getItem('cookie_consent');
  if (consent !== 'accepted') {
    return;
  }

  if (isInitialized || document.querySelector('script[data-domain]')) {
    return;
  }

  try {
    const script = document.createElement('script');
    script.defer = true;
    script.setAttribute('data-domain', PLAUSIBLE_DOMAIN);
    script.src = `${PLAUSIBLE_API_HOST.replace(/\/$/, '')}/js/script.js`;
    document.head.appendChild(script);
    isInitialized = true;
  } catch (err) {
    console.warn('Analytics initialization skipped:', err);
  }
}

/**
 * Disables and unloads analytics when consent is rejected or revoked.
 */
export function teardownAnalytics(): void {
  if (typeof window === 'undefined') return;
  const script = document.querySelector('script[data-domain]');
  if (script) {
    script.remove();
  }
  isInitialized = false;
  delete window.plausible;
}

/**
 * Track an allowed, privacy-safe platform event.
 * Enforces zero-PII guarantee by filtering through a strict whitelist.
 */
export function trackEvent(
  eventName: AllowedEvent,
  safeProps?: { jobId?: number | string; role?: string }
): void {
  if (typeof window === 'undefined') return;

  const consent = localStorage.getItem('cookie_consent');
  if (consent !== 'accepted') return;

  if (window.plausible) {
    // Sanitized props: Whitelist ONLY high-level non-PII metrics
    const sanitizedProps: Record<string, string | number | boolean> = {};
    if (safeProps?.jobId) sanitizedProps.jobId = String(safeProps.jobId);
    if (safeProps?.role) sanitizedProps.role = String(safeProps.role);

    window.plausible(eventName, { props: sanitizedProps });
  }
}

/**
 * Listen for consent events to automatically initialize or remove analytics.
 */
if (typeof window !== 'undefined') {
  window.addEventListener('analytics-consent-granted', () => {
    initAnalytics();
  });

  window.addEventListener('analytics-consent-revoked', () => {
    teardownAnalytics();
  });
}
