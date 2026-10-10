'use client';

import React, {
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from 'react';

export interface TurnstileWidgetHandle {
  reset: () => void;
}

interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: () => void;
  className?: string;
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          'error-callback'?: () => void;
          'expired-callback'?: () => void;
          theme?: 'light' | 'dark' | 'auto';
          size?: 'normal' | 'compact' | 'flexible';
        }
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
    onloadTurnstileCallback?: () => void;
  }
}

const TurnstileWidget = forwardRef<TurnstileWidgetHandle, TurnstileWidgetProps>(
  function TurnstileWidget(
    { onVerify, onExpire, onError, className = '' },
    ref
  ) {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);
    const [loadError, setLoadError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const onVerifyRef = useRef(onVerify);
    onVerifyRef.current = onVerify;
    const onExpireRef = useRef(onExpire);
    onExpireRef.current = onExpire;
    const onErrorRef = useRef(onError);
    onErrorRef.current = onError;

    const siteKey =
      process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA';

    useImperativeHandle(
      ref,
      () => ({
        reset() {
          if (widgetIdRef.current && window.turnstile) {
            try {
              window.turnstile.reset(widgetIdRef.current);
            } catch (e) {
              console.warn('Turnstile reset error:', e);
            }
          }
          setIsLoading(false);
          // If in test dummy key mode, re-trigger test token fallback
          if (siteKey.startsWith('1x000000')) {
            onVerifyRef.current('1x00000000000000000000AA');
          }
        },
      }),
      [siteKey]
    );

    useEffect(() => {
      let timeoutId: NodeJS.Timeout;

      const renderWidget = () => {
        if (!window.turnstile || !containerRef.current) return;
        if (widgetIdRef.current) return; // Already rendered

        try {
          const id = window.turnstile.render(containerRef.current, {
            sitekey: siteKey,
            callback: (token: string) => {
              setIsLoading(false);
              onVerifyRef.current(token);
            },
            'error-callback': () => {
              setIsLoading(false);
              setLoadError(true);
              if (onErrorRef.current) onErrorRef.current();
              // In dev or test environments with dummy keys, pass a dummy token fallback
              if (siteKey.startsWith('1x000000')) {
                onVerifyRef.current('1x00000000000000000000AA');
              }
            },
            'expired-callback': () => {
              if (onExpireRef.current) onExpireRef.current();
            },
          });
          widgetIdRef.current = id;
          setIsLoading(false);
        } catch (e) {
          console.warn('Turnstile render error:', e);
          setLoadError(true);
          setIsLoading(false);
        }
      };

      // If script is already loaded
      if (window.turnstile) {
        renderWidget();
        return;
      }

      // Set fallback timeout if script doesn't load within 5 seconds (e.g. adblocker, offline)
      timeoutId = setTimeout(() => {
        if (!window.turnstile) {
          setLoadError(true);
          setIsLoading(false);
          // If dummy key, fallback to bypass token for development & testing
          if (siteKey.startsWith('1x000000')) {
            onVerifyRef.current('1x00000000000000000000AA');
          }
        }
      }, 5000);

      // Check if script tag is already in DOM
      const existingScript = document.querySelector(
        'script[src*="challenges.cloudflare.com/turnstile"]'
      );
      if (!existingScript) {
        const script = document.createElement('script');
        script.src =
          'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        script.async = true;
        script.defer = true;
        script.onload = () => {
          clearTimeout(timeoutId);
          renderWidget();
        };
        script.onerror = () => {
          clearTimeout(timeoutId);
          setLoadError(true);
          setIsLoading(false);
          if (siteKey.startsWith('1x000000')) {
            onVerifyRef.current('1x00000000000000000000AA');
          }
        };
        document.head.appendChild(script);
      } else {
        existingScript.addEventListener('load', renderWidget);
      }

      return () => {
        clearTimeout(timeoutId);
        if (widgetIdRef.current && window.turnstile) {
          try {
            window.turnstile.remove(widgetIdRef.current);
            widgetIdRef.current = null;
          } catch {
            // ignore cleanup errors
          }
        }
      };
    }, [siteKey]);

    return (
      <div
        role="region"
        aria-label="Security verification challenge"
        className={`my-3 min-h-[65px] flex flex-col justify-center ${className}`}
      >
        <div ref={containerRef} aria-live="polite" />

        {isLoading && !loadError && (
          <p
            className="text-xs text-gray-500 flex items-center gap-1.5"
            aria-live="polite"
          >
            <span
              className="inline-block w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"
              aria-hidden="true"
            />
            Loading security verification challenge...
          </p>
        )}

        {loadError && (
          <div
            role="note"
            aria-live="polite"
            className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900"
          >
            <span className="font-semibold block mb-0.5">
              Automated security verification
            </span>
            <span>
              Security verification widget was blocked or unavailable. Server-side
              security checks will verify your request automatically. You may
              proceed with form submission.
            </span>
          </div>
        )}
      </div>
    );
  }
);

export default TurnstileWidget;
