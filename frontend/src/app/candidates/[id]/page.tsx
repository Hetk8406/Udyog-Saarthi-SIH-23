'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { apiRequest } from '@/services/api';
import { CandidateProfileData } from '@/types/profile';

export default function CandidateProfileViewPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [profile, setProfile] = useState<CandidateProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const candidateId = params.id as string;

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace(`/login?returnTo=%2Fcandidates%2F${candidateId}`);
      return;
    }

    if (user) {
      loadProfile();
    }
  }, [user, authLoading, candidateId]);

  async function loadProfile() {
    setLoading(true);
    setForbidden(false);
    setErrorMessage('');
    try {
      const data = await apiRequest<CandidateProfileData>(`/profiles/${candidateId}/`, {
        method: 'GET',
        requiresAuth: true,
      });
      setProfile(data);
    } catch (err: any) {
      if (err.status === 403 || err.message?.toLowerCase().includes('permission') || err.message?.toLowerCase().includes('cannot view')) {
        setForbidden(true);
        setErrorMessage("You do not have permission to view this candidate profile.");
      } else {
        setErrorMessage(err.message || 'Failed to load profile.');
      }
    } finally {
      setLoading(false);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center" role="status" aria-live="polite">
        <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="mt-3 text-slate-600 font-medium">Loading candidate profile...</p>
      </div>
    );
  }

  if (forbidden) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center" role="alert">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-700 text-3xl font-black mb-4">
          !
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Access Denied (403)</h1>
        <p className="text-slate-600 mb-6 font-medium">
          {errorMessage || "Candidates cannot view another candidate's private profile."}
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center px-6 py-2.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-bold text-sm shadow-sm transition"
        >
          Return to Your Dashboard
        </Link>
      </div>
    );
  }

  if (errorMessage || !profile) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center" role="alert">
        <h1 className="text-xl font-bold text-slate-900 mb-2">Profile Unavailable</h1>
        <p className="text-slate-600 mb-6">{errorMessage || 'Could not find candidate.'}</p>
        <Link href="/dashboard" className="text-blue-700 font-bold hover:underline">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Candidate Profile</h1>
        <p className="text-sm text-slate-600">
          Location: {profile.city}, {profile.state}
        </p>
      </div>
    </div>
  );
}
