'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type TextSize = 'normal' | 'large' | 'larger';

interface AccessibilityContextType {
  textSize: TextSize;
  highContrast: boolean;
  reducedMotion: boolean;
  setTextSize: (size: TextSize) => void;
  toggleHighContrast: () => void;
  toggleReducedMotion: () => void;
  resetAccessibility: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [textSize, setTextSizeState] = useState<TextSize>('normal');
  const [highContrast, setHighContrast] = useState<boolean>(false);
  const [reducedMotion, setReducedMotion] = useState<boolean>(false);

  // Load preferences from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const savedSize = localStorage.getItem('a11y_text_size') as TextSize;
    if (savedSize && ['normal', 'large', 'larger'].includes(savedSize)) {
      setTextSizeState(savedSize);
    }

    const savedContrast = localStorage.getItem('a11y_high_contrast');
    if (savedContrast === 'true') {
      setHighContrast(true);
    }

    const savedMotion = localStorage.getItem('a11y_reduced_motion');
    if (savedMotion === 'true') {
      setReducedMotion(true);
    }
  }, []);

  // Sync DOM classes whenever settings change
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const root = document.documentElement;

    // Apply text size classes
    root.classList.remove('text-size-normal', 'text-size-large', 'text-size-larger');
    root.classList.add(`text-size-${textSize}`);

    // Apply high contrast
    if (highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Apply reduced motion
    if (reducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }
  }, [textSize, highContrast, reducedMotion]);

  const setTextSize = (size: TextSize) => {
    setTextSizeState(size);
    localStorage.setItem('a11y_text_size', size);
  };

  const toggleHighContrast = () => {
    setHighContrast((prev) => {
      const next = !prev;
      localStorage.setItem('a11y_high_contrast', String(next));
      return next;
    });
  };

  const toggleReducedMotion = () => {
    setReducedMotion((prev) => {
      const next = !prev;
      localStorage.setItem('a11y_reduced_motion', String(next));
      return next;
    });
  };

  const resetAccessibility = () => {
    setTextSizeState('normal');
    setHighContrast(false);
    setReducedMotion(false);
    localStorage.removeItem('a11y_text_size');
    localStorage.removeItem('a11y_high_contrast');
    localStorage.removeItem('a11y_reduced_motion');
  };

  return (
    <AccessibilityContext.Provider
      value={{
        textSize,
        highContrast,
        reducedMotion,
        setTextSize,
        toggleHighContrast,
        toggleReducedMotion,
        resetAccessibility,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}
