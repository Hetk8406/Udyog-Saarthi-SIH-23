'use client';

import React, { useState } from 'react';

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
}

interface AccessibleAdminTableProps<T> {
  caption: string;
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  totalCount: number;
  currentPage: number;
  numPages: number;
  onPageChange: (newPage: number) => void;
  onSearch?: (query: string) => void;
  searchPlaceholder?: string;
  emptyMessage?: string;
}

export default function AccessibleAdminTable<T extends { id?: string | number }>({
  caption,
  columns,
  data,
  loading = false,
  totalCount,
  currentPage,
  numPages,
  onPageChange,
  onSearch,
  searchPlaceholder = 'Search records...',
  emptyMessage = 'No records found matching criteria.',
}: AccessibleAdminTableProps<T>) {
  const [searchInput, setSearchInput] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchInput.trim());
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      {/* Top Search & Actions Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-base font-bold text-slate-900">{caption}</h2>

        {onSearch && (
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 max-w-sm w-full">
            <label htmlFor="table-search" className="sr-only">
              {searchPlaceholder}
            </label>
            <div className="relative w-full">
              <input
                id="table-search"
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-3 pr-8 py-1.5 text-xs rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput('');
                    onSearch('');
                  }}
                  className="absolute right-2.5 top-1.5 text-slate-400 hover:text-slate-600 text-xs"
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
            <button
              type="submit"
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-700 hover:bg-blue-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-600 shrink-0"
            >
              Search
            </button>
          </form>
        )}
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="border-b border-slate-200 bg-slate-100/75 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
              {columns.map((col) => (
                <th key={col.key} scope="col" className="px-4 py-3">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-slate-500">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent mb-2" />
                  <p>Loading table records...</p>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-slate-500 italic">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item, idx) => (
                <tr key={item.id ? String(item.id) : idx} className="hover:bg-slate-50/80 transition-colors">
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3.5 text-slate-700 align-middle">
                      {col.render ? col.render(item) : (item as any)[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-slate-600">
        <div>
          Showing page <strong>{currentPage}</strong> of <strong>{numPages || 1}</strong> (
          <strong>{totalCount}</strong> total records)
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={currentPage <= 1 || loading}
            onClick={() => onPageChange(currentPage - 1)}
            className="min-h-[44px] px-4 py-2 border border-slate-300 rounded-lg bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600 inline-flex items-center justify-center"
          >
            ← Previous
          </button>
          <button
            type="button"
            disabled={currentPage >= numPages || loading}
            onClick={() => onPageChange(currentPage + 1)}
            className="min-h-[44px] px-4 py-2 border border-slate-300 rounded-lg bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600 inline-flex items-center justify-center"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}
