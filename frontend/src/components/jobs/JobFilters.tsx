'use client';

import React, { useState } from 'react';
import { JobFilterParams } from '@/types/job';

interface JobFiltersProps {
  currentFilters: JobFilterParams;
  onFilterChange: (filters: JobFilterParams) => void;
  onReset: () => void;
  totalCount: number;
}

export default function JobFilters({
  currentFilters,
  onFilterChange,
  onReset,
  totalCount,
}: JobFiltersProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleInputChange = (field: keyof JobFilterParams, value: string) => {
    onFilterChange({
      ...currentFilters,
      [field]: value,
      page: 1, // Reset to first page whenever a filter changes
    });
  };

  return (
    <aside aria-label="Job filters" className="w-full lg:w-72 shrink-0">
      {/* Mobile Toggle Button */}
      <div className="lg:hidden mb-4">
        <button
          type="button"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          aria-expanded={isMobileOpen}
          className="w-full min-h-[44px] flex items-center justify-between px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-800 shadow-sm"
        >
          <span className="flex items-center gap-2">
            <span>⚙ Filter Vacancies</span>
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full font-bold">
              {totalCount} found
            </span>
          </span>
          <span>{isMobileOpen ? '▲ Hide' : '▼ Show'}</span>
        </button>
      </div>

      {/* Filter Body (Always visible on lg screen, toggleable on mobile) */}
      <div
        className={`${
          isMobileOpen ? 'block' : 'hidden'
        } lg:block bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-5`}
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-base font-bold text-slate-900">Filter Jobs</h2>
          <button
            type="button"
            onClick={onReset}
            className="min-h-[44px] px-2 text-xs text-blue-700 hover:text-blue-900 font-bold underline inline-flex items-center"
          >
            Reset Filters
          </button>
        </div>

        {/* 1. Keyword Search */}
        <div>
          <label htmlFor="filter-search" className="block text-xs font-bold text-slate-800 mb-1">
            Keyword / Job Role
          </label>
          <input
            id="filter-search"
            type="text"
            placeholder="e.g. Clerk, Assistant, Developer"
            value={currentFilters.search || ''}
            onChange={(e) => handleInputChange('search', e.target.value)}
            className="w-full min-h-[44px] px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900"
          />
        </div>

        {/* 2. Sector Filter */}
        <div>
          <label htmlFor="filter-sector" className="block text-xs font-bold text-slate-800 mb-1">
            Sector Category
          </label>
          <select
            id="filter-sector"
            value={currentFilters.sector || 'all'}
            onChange={(e) => handleInputChange('sector', e.target.value)}
            className="w-full min-h-[44px] px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900"
          >
            <option value="all">All Sectors</option>
            <option value="government">Government Ministries & Depts</option>
            <option value="psu">Public Sector Undertakings (PSUs)</option>
            <option value="private">Private Sector (Equal Opportunity)</option>
          </select>
        </div>

        {/* 3. Work Mode */}
        <div>
          <label htmlFor="filter-mode" className="block text-xs font-bold text-slate-800 mb-1">
            Work Mode
          </label>
          <select
            id="filter-mode"
            value={currentFilters.work_mode || 'all'}
            onChange={(e) => handleInputChange('work_mode', e.target.value)}
            className="w-full min-h-[44px] px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900"
          >
            <option value="all">Any Work Mode</option>
            <option value="on_site">On-site Office</option>
            <option value="remote">Remote (Work From Home)</option>
            <option value="hybrid">Hybrid</option>
          </select>
        </div>

        {/* 4. Location Search */}
        <div>
          <label htmlFor="filter-location" className="block text-xs font-bold text-slate-800 mb-1">
            City or State
          </label>
          <input
            id="filter-location"
            type="text"
            placeholder="e.g. Delhi, Bengaluru, Mumbai"
            value={currentFilters.location || ''}
            onChange={(e) => handleInputChange('location', e.target.value)}
            className="w-full min-h-[44px] px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900"
          />
        </div>

        {/* 5. Minimum Education */}
        <div>
          <label htmlFor="filter-education" className="block text-xs font-bold text-slate-800 mb-1">
            Minimum Qualification
          </label>
          <select
            id="filter-education"
            value={currentFilters.education || 'all'}
            onChange={(e) => handleInputChange('education', e.target.value)}
            className="w-full min-h-[44px] px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900"
          >
            <option value="all">Any Education Level</option>
            <option value="10th_pass">10th Standard Pass</option>
            <option value="12th_pass">12th Standard Pass</option>
            <option value="iti_diploma">ITI / Polytechnic Diploma</option>
            <option value="graduate">Graduate (Bachelor&apos;s)</option>
            <option value="post_graduate">Post Graduate (Master&apos;s)</option>
          </select>
        </div>

        {/* 6. Disability Eligibility Filter */}
        <div>
          <label htmlFor="filter-disability" className="block text-xs font-bold text-slate-800 mb-1">
            Suitable for Disability
          </label>
          <select
            id="filter-disability"
            value={currentFilters.disability || 'all'}
            onChange={(e) => handleInputChange('disability', e.target.value)}
            className="w-full min-h-[44px] px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900"
          >
            <option value="all">All Eligible Disability Categories</option>
            <option value="locomotor">Locomotor Disability</option>
            <option value="visual_impairment">Visual Impairment / Blindness</option>
            <option value="hearing_impairment">Hearing Impairment / Deaf</option>
            <option value="intellectual_disability">Intellectual Disability</option>
            <option value="autism_spectrum">Autism Spectrum</option>
            <option value="specific_learning">Specific Learning Disabilities</option>
            <option value="speech_language">Speech & Language</option>
            <option value="mental_illness">Mental Illness</option>
          </select>
        </div>

        <div className="pt-2 border-t border-slate-100">
          <p className="text-[11px] text-slate-500">
            Showing verified demo job postings. Results automatically update as you apply filters.
          </p>
        </div>
      </div>
    </aside>
  );
}
