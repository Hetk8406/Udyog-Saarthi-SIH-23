'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { getUnreadCount } from '@/services/notificationService';

export default function NotificationBell() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    async function loadCount() {
      try {
        const res = await getUnreadCount();
        setUnreadCount(res.unread_count);
      } catch {
        // Silently handle
      }
    }

    loadCount();
    // Poll every 30 seconds for background updates (deadline reminders, status changes)
    const interval = setInterval(loadCount, 30000);
    return () => clearInterval(interval);
  }, [user]);

  if (!user) return null;

  return (
    <Link
      href="/dashboard/notifications"
      aria-label={
        unreadCount > 0
          ? `Notification Center: ${unreadCount} unread alert${unreadCount > 1 ? 's' : ''}`
          : 'Notification Center: No unread alerts'
      }
      className="relative p-2 text-slate-600 hover:text-blue-700 hover:bg-slate-100 rounded-full transition focus:outline-none focus:ring-2 focus:ring-blue-600 inline-flex items-center justify-center"
    >
      {/* Bell SVG Icon */}
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>

      {/* Unread Counter Badge */}
      {unreadCount > 0 && (
        <span
          className="absolute -top-0.5 -right-0.5 bg-red-600 text-white font-extrabold text-[10px] h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center shadow-sm animate-in fade-in"
          aria-hidden="true"
        >
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </Link>
  );
}
