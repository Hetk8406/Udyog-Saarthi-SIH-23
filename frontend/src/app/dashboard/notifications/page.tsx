'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getNotificationPreferences,
  updateNotificationPreferences
} from '@/services/notificationService';
import { NotificationItem, NotificationPreference, NotificationTypeEnum } from '@/types/notification';

export default function NotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Tab filter: 'all' vs 'unread'
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  // Preferences Modal state
  const [isPrefModalOpen, setIsPrefModalOpen] = useState<boolean>(false);
  const [preferences, setPreferences] = useState<NotificationPreference | null>(null);
  const [savingPrefs, setSavingPrefs] = useState<boolean>(false);
  const [prefSuccessMsg, setPrefSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [notifsData, prefsData] = await Promise.all([
        getNotifications(filter === 'unread'),
        getNotificationPreferences(),
      ]);
      setNotifications(notifsData);
      setPreferences(prefsData);
    } catch (err: any) {
      setError(err.message || 'Unable to load notifications.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, filter]);

  async function handleMarkRead(id: string) {
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch {
      // Silently handle
    }
  }

  async function handleMarkAllRead() {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {
      // Silently handle
    }
  }

  async function handleSavePreferences(e: React.FormEvent) {
    e.preventDefault();
    if (!preferences) return;
    setSavingPrefs(true);
    setPrefSuccessMsg(null);
    try {
      const updated = await updateNotificationPreferences(preferences);
      setPreferences(updated);
      setPrefSuccessMsg('Notification preferences updated successfully!');
      setTimeout(() => {
        setIsPrefModalOpen(false);
        setPrefSuccessMsg(null);
      }, 1200);
    } catch {
      alert('Unable to save notification preferences.');
    } finally {
      setSavingPrefs(false);
    }
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const getTypeIconAndStyle = (type: NotificationTypeEnum) => {
    switch (type) {
      case 'deadline_reminder':
        return {
          icon: '⏰',
          badgeClass: 'bg-amber-100 text-amber-950 border-amber-300',
        };
      case 'exam_alert':
        return {
          icon: '🏛️',
          badgeClass: 'bg-purple-100 text-purple-950 border-purple-300',
        };
      case 'application_status':
        return {
          icon: '📄',
          badgeClass: 'bg-blue-100 text-blue-950 border-blue-300',
        };
      case 'job_recommendation':
        return {
          icon: '💼',
          badgeClass: 'bg-emerald-100 text-emerald-950 border-emerald-300',
        };
      default:
        return {
          icon: 'ℹ️',
          badgeClass: 'bg-slate-100 text-slate-800 border-slate-300',
        };
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <nav className="text-xs text-slate-500 mb-1" aria-label="Breadcrumb">
            <Link href="/dashboard" className="hover:underline">Dashboard</Link>
            <span className="mx-2">/</span>
            <span className="text-slate-900 font-semibold">Notification Center</span>
          </nav>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
              Notifications & Alerts
            </h1>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-300">
                {unreadCount} unread
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Stay updated on application progress, examination schedules, and upcoming deadlines.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 shrink-0">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold shadow-sm transition"
            >
              ✓ Mark All as Read
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsPrefModalOpen(true)}
            className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-sm transition inline-flex items-center gap-1.5"
          >
            <span>⚙️</span>
            <span>Alert Preferences</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            filter === 'all'
              ? 'bg-blue-700 text-white shadow-sm'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          All Alerts ({notifications.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            filter === 'unread'
              ? 'bg-blue-700 text-white shadow-sm'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Unread Only ({unreadCount})
        </button>
      </div>

      {/* Loading & Error States */}
      {loading && (
        <div className="py-20 text-center" role="status" aria-live="polite">
          <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-3 text-slate-600 font-medium text-sm">Loading your notification alerts...</p>
        </div>
      )}

      {error && !loading && (
        <div role="alert" className="p-4 bg-red-50 border border-red-300 text-red-900 text-sm rounded-xl">
          {error}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && notifications.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <span className="text-4xl block">🔔</span>
          <h2 className="text-base font-bold text-slate-900">
            {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
          </h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You will receive in-app and email alerts when official vacancies match your profile, or when milestones change on your applications.
          </p>
        </div>
      )}

      {/* Notifications List */}
      {!loading && !error && notifications.length > 0 && (
        <div className="space-y-3">
          {notifications.map((notif) => {
            const { icon, badgeClass } = getTypeIconAndStyle(notif.notification_type);
            return (
              <article
                key={notif.id}
                className={`p-5 rounded-2xl border transition flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 ${
                  notif.is_read
                    ? 'bg-white border-slate-200 text-slate-700'
                    : 'bg-blue-50/50 border-blue-200 text-slate-900 shadow-sm'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <span className="text-2xl mt-0.5 shrink-0" aria-hidden="true">
                    {icon}
                  </span>

                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badgeClass}`}>
                        {notif.notification_type_display}
                      </span>
                      {!notif.is_read && (
                        <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" title="Unread alert"></span>
                      )}
                      <span className="text-[11px] text-slate-500">
                        {new Date(notif.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <h2 className="text-sm sm:text-base font-bold text-slate-900">
                      {notif.title}
                    </h2>

                    <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                      {notif.message}
                    </p>

                    {notif.link && (
                      <div className="pt-1">
                        <Link
                          href={notif.link}
                          className="text-xs font-bold text-blue-700 hover:underline inline-flex items-center gap-1"
                        >
                          View Details →
                        </Link>
                      </div>
                    )}
                  </div>
                </div>

                {/* Mark Read CTA */}
                {!notif.is_read && (
                  <div className="shrink-0 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => handleMarkRead(notif.id)}
                      className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-blue-700 hover:bg-slate-100 rounded-lg border border-slate-200 transition"
                    >
                      Mark as Read
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {/* NOTIFICATION PREFERENCES MODAL */}
      {isPrefModalOpen && preferences && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="pref-modal-title"
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 sm:p-7 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="text-xs font-bold uppercase text-blue-700 tracking-wider">
                  Settings
                </span>
                <h3 id="pref-modal-title" className="text-lg font-bold text-slate-900">
                  Notification Delivery Preferences
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPrefModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-xl"
              >
                ✕
              </button>
            </div>

            {prefSuccessMsg && (
              <div role="status" className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-bold">
                ✓ {prefSuccessMsg}
              </div>
            )}

            <form onSubmit={handleSavePreferences} className="space-y-5">
              {/* Delivery Channels Section */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wide text-slate-700">
                  Delivery Channels
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50">
                    <input
                      id="channel_in_app"
                      type="checkbox"
                      checked={preferences.channel_in_app}
                      onChange={(e) =>
                        setPreferences({ ...preferences, channel_in_app: e.target.checked })
                      }
                      className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                    />
                    <label htmlFor="channel_in_app" className="cursor-pointer flex-1">
                      <strong className="text-slate-900 block">In-App Notification Center</strong>
                      <span className="text-slate-500 text-[11px]">Receive bell badge alerts and dashboard updates.</span>
                    </label>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50">
                    <input
                      id="channel_email"
                      type="checkbox"
                      checked={preferences.channel_email}
                      onChange={(e) =>
                        setPreferences({ ...preferences, channel_email: e.target.checked })
                      }
                      className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                    />
                    <label htmlFor="channel_email" className="cursor-pointer flex-1">
                      <strong className="text-slate-900 block">Email Alerts</strong>
                      <span className="text-slate-500 text-[11px]">Send urgent updates and deadlines to {user?.email}.</span>
                    </label>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50">
                    <input
                      id="channel_sms"
                      type="checkbox"
                      checked={preferences.channel_sms}
                      onChange={(e) =>
                        setPreferences({ ...preferences, channel_sms: e.target.checked })
                      }
                      className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                    />
                    <label htmlFor="channel_sms" className="cursor-pointer flex-1">
                      <strong className="text-slate-900 block">Mobile SMS Alerts (Simulation)</strong>
                      <span className="text-slate-500 text-[11px]">SMS alerts for admit cards and closing deadlines.</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Notification Categories Section */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <h4 className="text-xs font-bold uppercase tracking-wide text-slate-700">
                  Notification Categories
                </h4>
                <div className="space-y-2 text-xs">
                  <label htmlFor="pref_app_status_updates" className="flex items-center gap-3 p-2.5 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer">
                    <input
                      id="pref_app_status_updates"
                      type="checkbox"
                      checked={preferences.app_status_updates}
                      onChange={(e) =>
                        setPreferences({ ...preferences, app_status_updates: e.target.checked })
                      }
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-slate-800 font-medium">Application status progression (Admit card, interview, selection)</span>
                  </label>

                  <label htmlFor="pref_deadline_alerts" className="flex items-center gap-3 p-2.5 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer">
                    <input
                      id="pref_deadline_alerts"
                      type="checkbox"
                      checked={preferences.deadline_alerts}
                      onChange={(e) =>
                        setPreferences({ ...preferences, deadline_alerts: e.target.checked })
                      }
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-slate-800 font-medium">Application deadline reminders (3 days and 24 hours prior)</span>
                  </label>

                  <label htmlFor="pref_exam_alerts" className="flex items-center gap-3 p-2.5 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer">
                    <input
                      id="pref_exam_alerts"
                      type="checkbox"
                      checked={preferences.exam_alerts}
                      onChange={(e) =>
                        setPreferences({ ...preferences, exam_alerts: e.target.checked })
                      }
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-slate-800 font-medium">Examination date & scribe allocation alerts</span>
                  </label>

                  <label htmlFor="pref_job_recommendations" className="flex items-center gap-3 p-2.5 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer">
                    <input
                      id="pref_job_recommendations"
                      type="checkbox"
                      checked={preferences.job_recommendations}
                      onChange={(e) =>
                        setPreferences({ ...preferences, job_recommendations: e.target.checked })
                      }
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-slate-800 font-medium">New vacancies matching your disability reservation</span>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsPrefModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPrefs}
                  className="px-5 py-2 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  {savingPrefs ? 'Saving Preferences...' : 'Save Preferences ✓'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
