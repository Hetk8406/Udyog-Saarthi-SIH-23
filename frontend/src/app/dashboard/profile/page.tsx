'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  getMyProfile,
  updatePersonalInfo,
  updateAccessibilityProfile,
  addEducation,
  deleteEducation,
  addSkill,
  deleteSkill,
} from '@/services/profileService';
import {
  CandidateProfileData,
  AccessibilityProfileData,
  DisabilityCategory,
  DifficultyLevel,
} from '@/types/profile';
import {
  profilePersonalSchema,
  educationSchema,
  skillSchema,
  formatZodErrors,
} from '@/lib/validations';
import DocumentManager from '@/components/profile/DocumentManager';

export default function ProfileWizardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [profile, setProfile] = useState<CandidateProfileData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Form states - Step 1: Personal
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('prefer_not_to_say');
  const [alternatePhone, setAlternatePhone] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [bio, setBio] = useState('');

  // Form states - Step 2: Accessibility & Disability
  const [primaryDisability, setPrimaryDisability] = useState<DisabilityCategory>('other');
  const [disabilityPercentage, setDisabilityPercentage] = useState<string>('');
  const [udidNumber, setUdidNumber] = useState('');
  const [udidStatus, setUdidStatus] = useState('not_provided');

  // Washington Group functional difficulties
  const [diffSeeing, setDiffSeeing] = useState<DifficultyLevel>('none');
  const [diffHearing, setDiffHearing] = useState<DifficultyLevel>('none');
  const [diffWalking, setDiffWalking] = useState<DifficultyLevel>('none');
  const [diffRemembering, setDiffRemembering] = useState<DifficultyLevel>('none');
  const [diffSelfCare, setDiffSelfCare] = useState<DifficultyLevel>('none');
  const [diffCommunicating, setDiffCommunicating] = useState<DifficultyLevel>('none');
  const [diffUpperBody, setDiffUpperBody] = useState<DifficultyLevel>('none');

  // Assistive devices & accommodations
  const [devicesUsedText, setDevicesUsedText] = useState('');
  const [devicesRequiredText, setDevicesRequiredText] = useState('');
  const [needsScribe, setNeedsScribe] = useState(false);
  const [needsSignInterpreter, setNeedsSignInterpreter] = useState(false);
  const [needsAttendant, setNeedsAttendant] = useState(false);
  const [needsExtraTime, setNeedsExtraTime] = useState(false);
  const [needsGroundFloor, setNeedsGroundFloor] = useState(false);
  const [otherAssistanceNotes, setOtherAssistanceNotes] = useState('');

  // Form states - Step 3: Education form inputs
  const [newQualification, setNewQualification] = useState('');
  const [newInstitution, setNewInstitution] = useState('');
  const [newPassingYear, setNewPassingYear] = useState('');
  const [newPercentage, setNewPercentage] = useState('');
  const [addingEdu, setAddingEdu] = useState(false);

  // Form states - Step 4: Skill form inputs
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillCategory, setNewSkillCategory] = useState<'technical' | 'computer' | 'communication' | 'vocational' | 'soft_skill' | 'general'>('general');
  const [newSkillProficiency, setNewSkillProficiency] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [addingSkill, setAddingSkill] = useState(false);

  // Form states - Step 5: Preferences
  const [preferredSector, setPreferredSector] = useState<'govt' | 'psu' | 'private' | 'any'>('any');
  const [preferredWorkMode, setPreferredWorkMode] = useState<'on_site' | 'remote' | 'hybrid' | 'any'>('any');
  const [preferredLocationsText, setPreferredLocationsText] = useState('');
  const [expectedSalaryMin, setExpectedSalaryMin] = useState('');

  // Load existing profile from backend
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
      return;
    }

    async function loadData() {
      try {
        const data = await getMyProfile();
        setProfile(data);

        // Populate step 1
        setDateOfBirth(data.date_of_birth || '');
        setGender(data.gender || 'prefer_not_to_say');
        setAlternatePhone(data.alternate_phone || '');
        setAddressLine(data.address_line || '');
        setCity(data.city || '');
        setState(data.state || '');
        setPincode(data.pincode || '');
        setBio(data.bio || '');

        // Populate step 2
        if (data.accessibility_profile) {
          const acc = data.accessibility_profile;
          setPrimaryDisability(acc.primary_disability || 'other');
          setDisabilityPercentage(acc.disability_percentage ? String(acc.disability_percentage) : '');
          setUdidNumber(acc.udid_number || '');
          setUdidStatus(acc.udid_verification_status || 'not_provided');

          setDiffSeeing(acc.difficulty_seeing || 'none');
          setDiffHearing(acc.difficulty_hearing || 'none');
          setDiffWalking(acc.difficulty_walking_mobility || 'none');
          setDiffRemembering(acc.difficulty_remembering_concentrating || 'none');
          setDiffSelfCare(acc.difficulty_self_care || 'none');
          setDiffCommunicating(acc.difficulty_communicating || 'none');
          setDiffUpperBody(acc.difficulty_upper_body || 'none');

          setDevicesUsedText((acc.assistive_devices_used || []).join(', '));
          setDevicesRequiredText((acc.assistive_devices_required || []).join(', '));
          setNeedsScribe(acc.needs_scribe || false);
          setNeedsSignInterpreter(acc.needs_sign_language_interpreter || false);
          setNeedsAttendant(acc.needs_personal_attendant || false);
          setNeedsExtraTime(acc.needs_extra_time_for_exams || false);
          setNeedsGroundFloor(acc.needs_ground_floor_access || false);
          setOtherAssistanceNotes(acc.other_assistance_notes || '');
        }

        // Populate step 5
        setPreferredSector(data.preferred_sector || 'any');
        setPreferredWorkMode(data.preferred_work_mode || 'any');
        setPreferredLocationsText((data.preferred_locations || []).join(', '));
        setExpectedSalaryMin(data.expected_salary_min ? String(data.expected_salary_min) : '');
      } catch (err: any) {
        setStatusMessage({ text: 'Unable to load profile. Please check connection.', type: 'error' });
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      loadData();
    }
  }, [user, authLoading, router]);

  // Save current step data to backend
  async function saveCurrentStep(proceedToNext = false) {
    setSaving(true);
    setStatusMessage(null);

    try {
      if (currentStep === 1) {
        const valRes = profilePersonalSchema.safeParse({
          alternate_phone: alternatePhone,
          pincode: pincode,
          bio: bio,
        });
        if (!valRes.success) {
          const errs = formatZodErrors(valRes.error);
          const firstMsg = Object.values(errs)[0];
          setStatusMessage({ text: String(firstMsg), type: 'error' });
          setSaving(false);
          return;
        }

        const updated = await updatePersonalInfo({
          date_of_birth: dateOfBirth || null,
          gender,
          alternate_phone: alternatePhone,
          address_line: addressLine,
          city,
          state,
          pincode,
          bio,
        });
        setProfile(updated);
        setStatusMessage({ text: 'Personal details saved successfully.', type: 'success' });
      } else if (currentStep === 2) {
        const usedList = devicesUsedText.split(',').map((s) => s.trim()).filter(Boolean);
        const reqList = devicesRequiredText.split(',').map((s) => s.trim()).filter(Boolean);

        const updatedAcc = await updateAccessibilityProfile({
          primary_disability: primaryDisability,
          disability_percentage: disabilityPercentage ? parseInt(disabilityPercentage, 10) : null,
          udid_number: udidNumber,
          udid_verification_status: udidNumber ? 'self_declared' : 'not_provided',
          difficulty_seeing: diffSeeing,
          difficulty_hearing: diffHearing,
          difficulty_walking_mobility: diffWalking,
          difficulty_remembering_concentrating: diffRemembering,
          difficulty_self_care: diffSelfCare,
          difficulty_communicating: diffCommunicating,
          difficulty_upper_body: diffUpperBody,
          assistive_devices_used: usedList,
          assistive_devices_required: reqList,
          needs_scribe: needsScribe,
          needs_sign_language_interpreter: needsSignInterpreter,
          needs_personal_attendant: needsAttendant,
          needs_extra_time_for_exams: needsExtraTime,
          needs_ground_floor_access: needsGroundFloor,
          other_assistance_notes: otherAssistanceNotes,
        });

        // Refresh full profile to get new completion percentage
        const refreshed = await getMyProfile();
        setProfile(refreshed);
        setStatusMessage({ text: 'Accessibility & accommodation profile saved.', type: 'success' });
      } else if (currentStep === 5) {
        const locList = preferredLocationsText.split(',').map((s) => s.trim()).filter(Boolean);
        const updated = await updatePersonalInfo({
          preferred_sector: preferredSector,
          preferred_work_mode: preferredWorkMode,
          preferred_locations: locList,
          expected_salary_min: expectedSalaryMin ? parseFloat(expectedSalaryMin) : null,
        });
        setProfile(updated);
        setStatusMessage({ text: 'Career preferences saved successfully.', type: 'success' });
      }

      if (proceedToNext && currentStep < 6) {
        setCurrentStep((prev) => prev + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Error saving changes.', type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  // Handle adding education
  async function handleAddEducation(e: React.FormEvent) {
    e.preventDefault();
    const valRes = educationSchema.safeParse({
      qualification: newQualification,
      institution: newInstitution,
      passing_year: newPassingYear,
      percentage: newPercentage,
    });
    if (!valRes.success) {
      const errs = formatZodErrors(valRes.error);
      const firstMsg = Object.values(errs)[0];
      setStatusMessage({ text: String(firstMsg), type: 'error' });
      return;
    }

    setAddingEdu(true);
    try {
      await addEducation({
        qualification: newQualification,
        institution: newInstitution,
        year_of_passing: parseInt(newPassingYear, 10),
        percentage_or_cgpa: newPercentage,
      });
      const refreshed = await getMyProfile();
      setProfile(refreshed);
      setNewQualification('');
      setNewInstitution('');
      setNewPassingYear('');
      setNewPercentage('');
      setStatusMessage({ text: 'Education entry added.', type: 'success' });
    } catch (err: any) {
      setStatusMessage({ text: 'Failed to add education.', type: 'error' });
    } finally {
      setAddingEdu(false);
    }
  }

  // Handle deleting education
  async function handleDeleteEducation(id?: string) {
    if (!id) return;
    try {
      await deleteEducation(id);
      const refreshed = await getMyProfile();
      setProfile(refreshed);
      setStatusMessage({ text: 'Education entry removed.', type: 'success' });
    } catch {
      setStatusMessage({ text: 'Failed to delete education entry.', type: 'error' });
    }
  }

  // Handle adding skill
  async function handleAddSkill(e: React.FormEvent) {
    e.preventDefault();
    const valRes = skillSchema.safeParse({
      name: newSkillName,
    });
    if (!valRes.success) {
      const errs = formatZodErrors(valRes.error);
      const firstMsg = Object.values(errs)[0];
      setStatusMessage({ text: String(firstMsg), type: 'error' });
      return;
    }

    setAddingSkill(true);
    try {
      await addSkill({
        name: newSkillName,
        category: newSkillCategory,
        proficiency: newSkillProficiency,
      });
      const refreshed = await getMyProfile();
      setProfile(refreshed);
      setNewSkillName('');
      setStatusMessage({ text: 'Skill added.', type: 'success' });
    } catch {
      setStatusMessage({ text: 'Failed to add skill.', type: 'error' });
    } finally {
      setAddingSkill(false);
    }
  }

  // Handle deleting skill
  async function handleDeleteSkill(id?: string) {
    if (!id) return;
    try {
      await deleteSkill(id);
      const refreshed = await getMyProfile();
      setProfile(refreshed);
      setStatusMessage({ text: 'Skill removed.', type: 'success' });
    } catch {
      setStatusMessage({ text: 'Failed to delete skill.', type: 'error' });
    }
  }

  if (loading || !profile) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-4 text-center" role="status" aria-live="polite">
        <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-3 text-slate-600 font-medium">Loading profile information...</p>
      </div>
    );
  }

  const stepsList = [
    { number: 1, title: 'Personal Details' },
    { number: 2, title: 'Disability & Accommodations' },
    { number: 3, title: 'Education' },
    { number: 4, title: 'Skills' },
    { number: 5, title: 'Career Preferences' },
    { number: 6, title: 'Documents' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Top Navigation & Profile Completion Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 uppercase tracking-wider">
            <Link href="/dashboard" className="hover:underline">
              ← Back to Dashboard
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            Candidate Profile Builder
          </h1>
          <p className="text-sm text-slate-600">
            Complete each section to receive tailored job recommendations and exam accommodations.
          </p>
        </div>

        {/* Profile Completion Score Meter */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm sm:w-64">
          <div className="flex justify-between items-center text-xs font-bold text-slate-700 mb-1.5">
            <span>Profile Completion</span>
            <span className="text-blue-700 text-sm">{profile.completion_percentage}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden" role="progressbar" aria-valuenow={profile.completion_percentage} aria-valuemin={0} aria-valuemax={100}>
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${profile.completion_percentage}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Step Indicator Bar */}
      <nav aria-label="Profile Progress" className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <ol className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
          {stepsList.map((step) => {
            const isCurrent = currentStep === step.number;
            const isCompleted = currentStep > step.number;
            return (
              <li key={step.number}>
                <button
                  type="button"
                  onClick={() => setCurrentStep(step.number)}
                  className={`w-full text-left p-2 rounded-lg font-semibold border transition ${
                    isCurrent
                      ? 'border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-600'
                      : isCompleted
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  <span className="block text-[11px] uppercase tracking-wide opacity-80">
                    Step {step.number}
                  </span>
                  <span className="block truncate">{step.title}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Status Alerts */}
      {statusMessage && (
        <div
          role="alert"
          className={`p-4 rounded-lg text-sm font-medium border-l-4 ${
            statusMessage.type === 'success'
              ? 'bg-green-50 border-green-600 text-green-900'
              : 'bg-red-50 border-red-600 text-red-900'
          }`}
        >
          {statusMessage.text}
        </div>
      )}

      {/* STEP 1: PERSONAL DETAILS */}
      {currentStep === 1 && (
        <section aria-labelledby="step1-heading" className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm space-y-6">
          <div>
            <h2 id="step1-heading" className="text-xl font-bold text-slate-900">
              Section 1: Personal Details & Contact
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Basic contact information used for job applications and communications.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="dob" className="block text-sm font-semibold text-slate-800">
                Date of Birth
              </label>
              <input
                id="dob"
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm sm:text-sm text-slate-900"
              />
              <span className="text-xs text-slate-500 mt-1 block">Needed for government age-limit verifications.</span>
            </div>

            <div>
              <label htmlFor="gender" className="block text-sm font-semibold text-slate-800">
                Gender
              </label>
              <select
                id="gender"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm sm:text-sm text-slate-900"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </div>

            <div>
              <label htmlFor="city" className="block text-sm font-semibold text-slate-800">
                City / District
              </label>
              <input
                id="city"
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. New Delhi"
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm sm:text-sm text-slate-900"
              />
            </div>

            <div>
              <label htmlFor="state" className="block text-sm font-semibold text-slate-800">
                State / UT
              </label>
              <input
                id="state"
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="e.g. Delhi"
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm sm:text-sm text-slate-900"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="address" className="block text-sm font-semibold text-slate-800">
                Full Residential Address
              </label>
              <input
                id="address"
                type="text"
                value={addressLine}
                onChange={(e) => setAddressLine(e.target.value)}
                placeholder="House / Street / Colony"
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm sm:text-sm text-slate-900"
              />
            </div>

            <div>
              <label htmlFor="pincode" className="block text-sm font-semibold text-slate-800">
                PIN Code
              </label>
              <input
                id="pincode"
                type="text"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                placeholder="6-digit PIN code"
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm sm:text-sm text-slate-900"
              />
            </div>

            <div>
              <label htmlFor="alt-phone" className="block text-sm font-semibold text-slate-800">
                Alternate Mobile Number
              </label>
              <input
                id="alt-phone"
                type="tel"
                value={alternatePhone}
                onChange={(e) => setAlternatePhone(e.target.value)}
                placeholder="e.g. Guardian or secondary number"
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm sm:text-sm text-slate-900"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="bio" className="block text-sm font-semibold text-slate-800">
                Short Bio / Introduction
              </label>
              <textarea
                id="bio"
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Briefly describe your career aspirations and work interests..."
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm sm:text-sm text-slate-900"
              />
            </div>
          </div>
        </section>
      )}

      {/* STEP 2: DISABILITY & ACCESSIBILITY ACCOMMODATIONS */}
      {currentStep === 2 && (
        <section aria-labelledby="step2-heading" className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm space-y-8">
          <div>
            <h2 id="step2-heading" className="text-xl font-bold text-slate-900">
              Section 2: Disability Profile & Accommodations
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Your accommodation requirements are used to arrange scribes, exam extra time, and accessible workstations.
            </p>
          </div>

          {/* Primary Disability Selection */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Disability Classification</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="disability-cat" className="block text-sm font-semibold text-slate-800">
                  Primary Disability Category
                </label>
                <select
                  id="disability-cat"
                  value={primaryDisability}
                  onChange={(e) => setPrimaryDisability(e.target.value as DisabilityCategory)}
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm sm:text-sm text-slate-900"
                >
                  <option value="intellectual_disability">Intellectual Disability</option>
                  <option value="autism_spectrum">Autism Spectrum Disorder</option>
                  <option value="multiple_disabilities">Multiple Disabilities</option>
                  <option value="mental_illness">Mental Illness</option>
                  <option value="specific_learning">Specific Learning Disabilities</option>
                  <option value="locomotor">Locomotor Disability</option>
                  <option value="visual_impairment">Visual Impairment (Blindness / Low Vision)</option>
                  <option value="hearing_impairment">Hearing Impairment (Deaf / Hard of Hearing)</option>
                  <option value="speech_language">Speech and Language Disability</option>
                  <option value="other">Other Disability</option>
                </select>
                <span className="text-xs text-slate-500 mt-1 block">Categories aligned with RPwD Guidelines.</span>
              </div>

              <div>
                <label htmlFor="disability-pct" className="block text-sm font-semibold text-slate-800">
                  Certified Disability Percentage (%)
                </label>
                <input
                  id="disability-pct"
                  type="number"
                  min="0"
                  max="100"
                  value={disabilityPercentage}
                  onChange={(e) => setDisabilityPercentage(e.target.value)}
                  placeholder="e.g. 40"
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm sm:text-sm text-slate-900"
                />
                <span className="text-xs text-slate-500 mt-1 block">Government reservation typically applies for 40% and above.</span>
              </div>
            </div>

            {/* UDID Privacy Box */}
            <div className="pt-2 border-t border-slate-200">
              <label htmlFor="udid" className="block text-sm font-semibold text-slate-800">
                UDID Number (Unique Disability Identity Card)
              </label>
              <input
                id="udid"
                type="text"
                value={udidNumber}
                onChange={(e) => setUdidNumber(e.target.value)}
                placeholder="e.g. DL01234567890123"
                className="mt-1 block w-full sm:w-80 px-3 py-2 border border-slate-300 rounded-md shadow-sm sm:text-sm text-slate-900"
              />
              <div className="mt-2 text-xs text-amber-900 bg-amber-50 p-2.5 rounded border border-amber-200">
                <strong className="block mb-0.5">Confidentiality Guarantee:</strong>
                Your UDID number is encrypted and stored carefully. It is strictly never exposed to public APIs or unauthorized candidates.
              </div>
            </div>
          </div>

          {/* Washington Group Functional Difficulties */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Functional Difficulties (Washington Group Extended Set)
            </h3>
            <p className="text-xs text-slate-600">
              Select your self-assessed level of difficulty performing daily work and study tasks:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="diff-seeing" className="block text-xs font-semibold text-slate-800">
                  Difficulty Seeing (even when wearing glasses)
                </label>
                <select
                  id="diff-seeing"
                  value={diffSeeing}
                  onChange={(e) => setDiffSeeing(e.target.value as DifficultyLevel)}
                  className="mt-1 block w-full px-3 py-1.5 border border-slate-300 rounded text-xs text-slate-900"
                >
                  <option value="none">No difficulty</option>
                  <option value="some_difficulty">Some difficulty</option>
                  <option value="lot_of_difficulty">A lot of difficulty</option>
                  <option value="cannot_do_at_all">Cannot do at all</option>
                </select>
              </div>

              <div>
                <label htmlFor="diff-hearing" className="block text-xs font-semibold text-slate-800">
                  Difficulty Hearing (even when using a hearing aid)
                </label>
                <select
                  id="diff-hearing"
                  value={diffHearing}
                  onChange={(e) => setDiffHearing(e.target.value as DifficultyLevel)}
                  className="mt-1 block w-full px-3 py-1.5 border border-slate-300 rounded text-xs text-slate-900"
                >
                  <option value="none">No difficulty</option>
                  <option value="some_difficulty">Some difficulty</option>
                  <option value="lot_of_difficulty">A lot of difficulty</option>
                  <option value="cannot_do_at_all">Cannot do at all</option>
                </select>
              </div>

              <div>
                <label htmlFor="diff-walking" className="block text-xs font-semibold text-slate-800">
                  Difficulty Walking or Climbing Steps
                </label>
                <select
                  id="diff-walking"
                  value={diffWalking}
                  onChange={(e) => setDiffWalking(e.target.value as DifficultyLevel)}
                  className="mt-1 block w-full px-3 py-1.5 border border-slate-300 rounded text-xs text-slate-900"
                >
                  <option value="none">No difficulty</option>
                  <option value="some_difficulty">Some difficulty</option>
                  <option value="lot_of_difficulty">A lot of difficulty</option>
                  <option value="cannot_do_at_all">Cannot do at all</option>
                </select>
              </div>

              <div>
                <label htmlFor="diff-remembering" className="block text-xs font-semibold text-slate-800">
                  Difficulty Remembering or Concentrating
                </label>
                <select
                  id="diff-remembering"
                  value={diffRemembering}
                  onChange={(e) => setDiffRemembering(e.target.value as DifficultyLevel)}
                  className="mt-1 block w-full px-3 py-1.5 border border-slate-300 rounded text-xs text-slate-900"
                >
                  <option value="none">No difficulty</option>
                  <option value="some_difficulty">Some difficulty</option>
                  <option value="lot_of_difficulty">A lot of difficulty</option>
                  <option value="cannot_do_at_all">Cannot do at all</option>
                </select>
              </div>

              <div>
                <label htmlFor="diff-communicating" className="block text-xs font-semibold text-slate-800">
                  Difficulty Communicating (understanding or being understood)
                </label>
                <select
                  id="diff-communicating"
                  value={diffCommunicating}
                  onChange={(e) => setDiffCommunicating(e.target.value as DifficultyLevel)}
                  className="mt-1 block w-full px-3 py-1.5 border border-slate-300 rounded text-xs text-slate-900"
                >
                  <option value="none">No difficulty</option>
                  <option value="some_difficulty">Some difficulty</option>
                  <option value="lot_of_difficulty">A lot of difficulty</option>
                  <option value="cannot_do_at_all">Cannot do at all</option>
                </select>
              </div>

              <div>
                <label htmlFor="diff-upperbody" className="block text-xs font-semibold text-slate-800">
                  Difficulty with Upper Body / Hands (typing, writing, holding objects)
                </label>
                <select
                  id="diff-upperbody"
                  value={diffUpperBody}
                  onChange={(e) => setDiffUpperBody(e.target.value as DifficultyLevel)}
                  className="mt-1 block w-full px-3 py-1.5 border border-slate-300 rounded text-xs text-slate-900"
                >
                  <option value="none">No difficulty</option>
                  <option value="some_difficulty">Some difficulty</option>
                  <option value="lot_of_difficulty">A lot of difficulty</option>
                  <option value="cannot_do_at_all">Cannot do at all</option>
                </select>
              </div>
            </div>
          </div>

          {/* Assistive Devices */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <h3 className="text-base font-bold text-slate-900">Assistive Devices & Aids</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="devices-used" className="block text-sm font-semibold text-slate-800">
                  Assistive Devices You Currently Use
                </label>
                <input
                  id="devices-used"
                  type="text"
                  value={devicesUsedText}
                  onChange={(e) => setDevicesUsedText(e.target.value)}
                  placeholder="e.g. Screen reader, Wheelchair, Crutches (comma separated)"
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md text-sm text-slate-900"
                />
              </div>

              <div>
                <label htmlFor="devices-req" className="block text-sm font-semibold text-slate-800">
                  Assistive Devices Required at Work / Exam
                </label>
                <input
                  id="devices-req"
                  type="text"
                  value={devicesRequiredText}
                  onChange={(e) => setDevicesRequiredText(e.target.value)}
                  placeholder="e.g. Accessible desk, Large keyboard, Audio reader"
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md text-sm text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Human Assistance & Exam Accommodations */}
          <div className="space-y-3 pt-4 border-t border-slate-200">
            <h3 className="text-base font-bold text-slate-900">Human Assistance & Exam Logistics</h3>
            <p className="text-xs text-slate-600">
              Check all accommodations you will need for competitive examinations and interviews:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-100">
                <input
                  type="checkbox"
                  checked={needsScribe}
                  onChange={(e) => setNeedsScribe(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm font-medium text-slate-800">Scribe for Examinations</span>
              </label>

              <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-100">
                <input
                  type="checkbox"
                  checked={needsExtraTime}
                  onChange={(e) => setNeedsExtraTime(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm font-medium text-slate-800">Compensatory Extra Time (20 min/hr)</span>
              </label>

              <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-100">
                <input
                  type="checkbox"
                  checked={needsSignInterpreter}
                  onChange={(e) => setNeedsSignInterpreter(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm font-medium text-slate-800">Sign Language Interpreter</span>
              </label>

              <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-100">
                <input
                  type="checkbox"
                  checked={needsGroundFloor}
                  onChange={(e) => setNeedsGroundFloor(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm font-medium text-slate-800">Ground Floor Seating / Ramp Access</span>
              </label>
            </div>
          </div>
        </section>
      )}

      {/* STEP 3: EDUCATION */}
      {currentStep === 3 && (
        <section aria-labelledby="step3-heading" className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm space-y-6">
          <div>
            <h2 id="step3-heading" className="text-xl font-bold text-slate-900">
              Section 3: Education & Academic History
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Add your school, diploma, or university qualifications.
            </p>
          </div>

          {/* List of current educations */}
          {profile.educations && profile.educations.length > 0 ? (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-800">Added Qualifications ({profile.educations.length})</h3>
              <ul className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                {profile.educations.map((edu) => (
                  <li key={edu.id} className="p-4 flex items-center justify-between bg-white hover:bg-slate-50">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{edu.qualification}</h4>
                      <p className="text-xs text-slate-600">
                        {edu.institution} • Passing Year: {edu.year_of_passing}
                        {edu.percentage_or_cgpa && ` • Score: ${edu.percentage_or_cgpa}`}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteEducation(edu.id)}
                      className="text-xs text-red-600 hover:text-red-800 font-semibold px-2.5 py-1 border border-red-200 rounded hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-lg text-center text-sm text-slate-500">
              No educational qualifications added yet. Use the form below to add your first qualification.
            </div>
          )}

          {/* Add Education Form */}
          <form onSubmit={handleAddEducation} className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-4">
            <h3 className="text-sm font-bold text-blue-900">Add New Qualification</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <label htmlFor="edu-qual" className="block text-xs font-semibold text-slate-800">
                  Qualification / Degree <span className="text-red-600">*</span>
                </label>
                <input
                  id="edu-qual"
                  type="text"
                  required
                  placeholder="e.g. 10th Standard / B.Com / ITI"
                  value={newQualification}
                  onChange={(e) => setNewQualification(e.target.value)}
                  className="mt-1 block w-full px-3 py-1.5 border border-slate-300 rounded text-xs text-slate-900"
                />
              </div>

              <div>
                <label htmlFor="edu-inst" className="block text-xs font-semibold text-slate-800">
                  School / College / Institute <span className="text-red-600">*</span>
                </label>
                <input
                  id="edu-inst"
                  type="text"
                  required
                  placeholder="e.g. Delhi University / Kendriya Vidyalaya"
                  value={newInstitution}
                  onChange={(e) => setNewInstitution(e.target.value)}
                  className="mt-1 block w-full px-3 py-1.5 border border-slate-300 rounded text-xs text-slate-900"
                />
              </div>

              <div>
                <label htmlFor="edu-year" className="block text-xs font-semibold text-slate-800">
                  Year of Passing <span className="text-red-600">*</span>
                </label>
                <input
                  id="edu-year"
                  type="number"
                  required
                  placeholder="e.g. 2022"
                  value={newPassingYear}
                  onChange={(e) => setNewPassingYear(e.target.value)}
                  className="mt-1 block w-full px-3 py-1.5 border border-slate-300 rounded text-xs text-slate-900"
                />
              </div>

              <div>
                <label htmlFor="edu-score" className="block text-xs font-semibold text-slate-800">
                  Percentage / CGPA
                </label>
                <input
                  id="edu-score"
                  type="text"
                  placeholder="e.g. 75% or 7.8 CGPA"
                  value={newPercentage}
                  onChange={(e) => setNewPercentage(e.target.value)}
                  className="mt-1 block w-full px-3 py-1.5 border border-slate-300 rounded text-xs text-slate-900"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={addingEdu}
              className="py-1.5 px-4 bg-blue-700 hover:bg-blue-800 text-white rounded font-bold text-xs shadow-sm"
            >
              {addingEdu ? 'Adding...' : '+ Add Qualification'}
            </button>
          </form>
        </section>
      )}

      {/* STEP 4: SKILLS */}
      {currentStep === 4 && (
        <section aria-labelledby="step4-heading" className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm space-y-6">
          <div>
            <h2 id="step4-heading" className="text-xl font-bold text-slate-900">
              Section 4: Skills & Abilities
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Add technical, computer, vocational, or soft skills to match with job requirements.
            </p>
          </div>

          {/* List of current skills */}
          {profile.skills && profile.skills.length > 0 ? (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-800">Your Added Skills ({profile.skills.length})</h3>
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill) => (
                  <div
                    key={skill.id}
                    className="inline-flex items-center gap-2 bg-slate-100 border border-slate-300 px-3 py-1.5 rounded-full text-xs"
                  >
                    <span className="font-bold text-slate-800">{skill.name}</span>
                    <span className="text-slate-500 capitalize">({skill.proficiency})</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteSkill(skill.id)}
                      className="text-slate-400 hover:text-red-600 font-bold ml-1 text-sm leading-none"
                      aria-label={`Remove ${skill.name}`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-lg text-center text-sm text-slate-500">
              No skills added yet. Use the form below to add computer, technical, or workplace skills.
            </div>
          )}

          {/* Add Skill Form */}
          <form onSubmit={handleAddSkill} className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-4">
            <h3 className="text-sm font-bold text-blue-900">Add a New Skill</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              <div>
                <label htmlFor="skill-name" className="block text-xs font-semibold text-slate-800">
                  Skill Name <span className="text-red-600">*</span>
                </label>
                <input
                  id="skill-name"
                  type="text"
                  required
                  placeholder="e.g. MS Office / Data Entry / Python"
                  value={newSkillName}
                  onChange={(e) => setNewSkillName(e.target.value)}
                  className="mt-1 block w-full px-3 py-1.5 border border-slate-300 rounded text-xs text-slate-900"
                />
              </div>

              <div>
                <label htmlFor="skill-cat" className="block text-xs font-semibold text-slate-800">
                  Category
                </label>
                <select
                  id="skill-cat"
                  value={newSkillCategory}
                  onChange={(e) => setNewSkillCategory(e.target.value as any)}
                  className="mt-1 block w-full px-3 py-1.5 border border-slate-300 rounded text-xs text-slate-900"
                >
                  <option value="computer">Computer & Office</option>
                  <option value="technical">Technical / IT</option>
                  <option value="communication">Communication</option>
                  <option value="vocational">Vocational / Handicraft</option>
                  <option value="soft_skill">Workplace Soft Skills</option>
                  <option value="general">General</option>
                </select>
              </div>

              <div>
                <label htmlFor="skill-prof" className="block text-xs font-semibold text-slate-800">
                  Proficiency Level
                </label>
                <select
                  id="skill-prof"
                  value={newSkillProficiency}
                  onChange={(e) => setNewSkillProficiency(e.target.value as any)}
                  className="mt-1 block w-full px-3 py-1.5 border border-slate-300 rounded text-xs text-slate-900"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={addingSkill}
              className="py-1.5 px-4 bg-blue-700 hover:bg-blue-800 text-white rounded font-bold text-xs shadow-sm"
            >
              {addingSkill ? 'Adding...' : '+ Add Skill'}
            </button>
          </form>
        </section>
      )}

      {/* STEP 5: CAREER PREFERENCES */}
      {currentStep === 5 && (
        <section aria-labelledby="step5-heading" className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm space-y-6">
          <div>
            <h2 id="step5-heading" className="text-xl font-bold text-slate-900">
              Section 5: Career & Employment Preferences
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Specify your preferred sectors and locations for personalized job matching.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="pref-sector" className="block text-sm font-semibold text-slate-800">
                Preferred Job Sector
              </label>
              <select
                id="pref-sector"
                value={preferredSector}
                onChange={(e) => setPreferredSector(e.target.value as any)}
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm sm:text-sm text-slate-900"
              >
                <option value="any">Open to All Sectors</option>
                <option value="govt">Government Departments</option>
                <option value="psu">Public Sector Undertakings (PSUs)</option>
                <option value="private">Private Sector (Equal Opportunity)</option>
              </select>
            </div>

            <div>
              <label htmlFor="pref-mode" className="block text-sm font-semibold text-slate-800">
                Preferred Work Mode
              </label>
              <select
                id="pref-mode"
                value={preferredWorkMode}
                onChange={(e) => setPreferredWorkMode(e.target.value as any)}
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm sm:text-sm text-slate-900"
              >
                <option value="any">Any Mode</option>
                <option value="on_site">On-site Office</option>
                <option value="remote">Work From Home (Remote)</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="pref-loc" className="block text-sm font-semibold text-slate-800">
                Preferred Job Locations
              </label>
              <input
                id="pref-loc"
                type="text"
                value={preferredLocationsText}
                onChange={(e) => setPreferredLocationsText(e.target.value)}
                placeholder="e.g. Delhi NCR, Mumbai, Bengaluru, Remote (comma-separated)"
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm sm:text-sm text-slate-900"
              />
            </div>

            <div>
              <label htmlFor="min-sal" className="block text-sm font-semibold text-slate-800">
                Expected Minimum Salary (₹ / month)
              </label>
              <input
                id="min-sal"
                type="number"
                value={expectedSalaryMin}
                onChange={(e) => setExpectedSalaryMin(e.target.value)}
                placeholder="e.g. 25000"
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm sm:text-sm text-slate-900"
              />
            </div>
          </div>
        </section>
      )}

      {/* STEP 6: SUPPORTING DOCUMENTS */}
      {currentStep === 6 && (
        <section aria-labelledby="step6-heading" className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm space-y-6">
          <div>
            <h2 id="step6-heading" className="text-xl font-bold text-slate-900">
              Section 6: Supporting Documents
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Upload your resume and educational/training certificates. These documents can be attached when applying for jobs.
            </p>
          </div>

          <DocumentManager />
        </section>
      )}

      {/* Wizard Footer Controls (Save and Continue Later / Previous / Next) */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {currentStep > 1 && (
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => prev - 1)}
              className="px-4 py-2 border border-slate-300 rounded-md text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              ← Previous Section
            </button>
          )}

          <button
            type="button"
            disabled={saving}
            onClick={() => saveCurrentStep(false)}
            className="px-4 py-2 border border-blue-600 rounded-md text-sm font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save & Continue Later'}
          </button>
        </div>

        <div>
          {currentStep < 6 ? (
            <button
              type="button"
              disabled={saving}
              onClick={() => saveCurrentStep(true)}
              className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-md text-sm font-bold shadow-sm disabled:opacity-50"
            >
              Save & Next Section →
            </button>
          ) : (
            <button
              type="button"
              disabled={saving}
              onClick={async () => {
                await saveCurrentStep(false);
                router.push('/dashboard');
              }}
              className="px-5 py-2 bg-green-700 hover:bg-green-800 text-white rounded-md text-sm font-bold shadow-sm disabled:opacity-50"
            >
              Finish & View Dashboard ✓
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
