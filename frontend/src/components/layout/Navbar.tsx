'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import NotificationBell from '@/components/notifications/NotificationBell';

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  async function handleLogout() {
    await logout();
    router.push('/login');
  }

  // Format user role label
  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'candidate':
        return 'Candidate';
      case 'guardian':
        return 'Guardian';
      case 'coach':
        return 'Job Coach';
      case 'admin':
        return 'Admin';
      default:
        return 'User';
    }
  };

  return (
    <header role="banner" className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <nav aria-label="Main Navigation" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo & Brand Name */}
          <div className="flex items-center">
            <Link
              href="/"
              className="flex items-center text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 rounded px-1 py-1"
            >
              <Image
                src="/logo.svg"
                alt="Udyog Saarthi — Empowering Every Ability"
                width={190}
                height={42}
                priority
                className="h-10 w-auto"
              />
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex md:ml-8 md:space-x-6">
              <Link
                href="/"
                className="text-slate-700 hover:text-blue-700 px-3 py-2 font-medium rounded-md hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                Home
              </Link>
              <Link
                href="/jobs"
                className="text-slate-700 hover:text-blue-700 px-3 py-2 font-medium rounded-md hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                Jobs
              </Link>
              <Link
                href="/learning"
                className="text-slate-700 hover:text-blue-700 px-3 py-2 font-medium rounded-md hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                Learning & Tests
              </Link>
              <Link
                href="/dashboard"
                className="text-slate-700 hover:text-blue-700 px-3 py-2 font-medium rounded-md hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                Dashboard
              </Link>
              <Link
                href="/support"
                className="text-slate-700 hover:text-blue-700 px-3 py-2 font-medium rounded-md hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                Support
              </Link>
              {(user?.role === 'coach') && (
                <Link
                  href="/coach"
                  className="text-blue-700 hover:text-blue-800 px-3 py-2 font-semibold rounded-md hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  Coach Desk
                </Link>
              )}
              {user?.role === 'admin' && (
                <Link
                  href="/admin-panel"
                  className="text-amber-700 bg-amber-50 hover:bg-amber-100 px-3 py-2 font-bold rounded-md border border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  Admin Console ⚙
                </Link>
              )}
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            {user ? (
              <div className="flex items-center gap-3">
                <NotificationBell />
                <div className="text-right">
                  <span className="block text-sm font-semibold text-slate-800 leading-tight">
                    {user.full_name}
                  </span>
                  <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                    {getRoleLabel(user.role)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-3.5 py-1.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
                >
                  Log Out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-blue-700 hover:bg-slate-50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
                >
                  Log In
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle navigation menu"
              className="p-2 rounded-md text-slate-700 hover:text-blue-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu panel */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-slate-200 space-y-2">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-100 rounded-md"
            >
              Home
            </Link>
            <Link
              href="/jobs"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-100 rounded-md"
            >
              Jobs
            </Link>
            <Link
              href="/learning"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-100 rounded-md"
            >
              Learning & Tests
            </Link>
            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-100 rounded-md"
            >
              Dashboard
            </Link>
            <Link
              href="/support"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-100 rounded-md"
            >
              Support
            </Link>
            {(user?.role === 'coach') && (
              <Link
                href="/coach"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 text-base font-semibold text-blue-700 hover:bg-blue-50 rounded-md"
              >
                Coach Desk
              </Link>
            )}
            {user?.role === 'admin' && (
              <Link
                href="/admin-panel"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 text-base font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-md border border-amber-300"
              >
                Admin Console ⚙
              </Link>
            )}
            {user ? (
              <div className="pt-2 border-t border-slate-200">
                <div className="px-3 py-1 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{user.full_name}</p>
                    <p className="text-xs text-slate-500">{user.email} ({getRoleLabel(user.role)})</p>
                  </div>
                  <NotificationBell />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full text-left px-3 py-2 text-base font-medium text-red-700 hover:bg-red-50 rounded-md"
                >
                  Log Out
                </button>
              </div>
            ) : (
              <div className="pt-2 border-t border-slate-200 space-y-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-100 rounded-md"
                >
                  Log In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 text-base font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-md text-center"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        )}
      </nav>
    </header>
  );
}
