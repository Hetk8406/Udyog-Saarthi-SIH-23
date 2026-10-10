'use client';

import React, { useState, useEffect, useRef } from 'react';
import { CandidateDocument, DocumentType } from '@/types/document';
import { documentService } from '@/services/documentService';

interface DocumentManagerProps {
  candidateId?: string;
  readOnly?: boolean;
}

export default function DocumentManager({ candidateId, readOnly = false }: DocumentManagerProps) {
  const [documents, setDocuments] = useState<CandidateDocument[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [uploading, setUploading] = useState<boolean>(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [srAnnouncement, setSrAnnouncement] = useState<string>('');

  // Form state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<DocumentType>('resume');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Deletion modal state
  const [docToDelete, setDocToDelete] = useState<CandidateDocument | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);

  useEffect(() => {
    loadDocuments();
  }, [candidateId]);

  async function loadDocuments() {
    setLoading(true);
    setError(null);
    try {
      const data = await documentService.getDocuments(candidateId);
      setDocuments(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load documents.');
    } finally {
      setLoading(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (files && files[0]) {
      const file = files[0];
      // Quick client-side size check (5 MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('The selected file exceeds the 5 MB limit. Please select a smaller file.');
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      setSelectedFile(file);
      setError(null);
    }
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please select a file to upload.');
      return;
    }

    setUploading(true);
    setError(null);
    setSuccessMessage(null);
    setSrAnnouncement(`Uploading ${selectedFile.name}... Please wait.`);

    try {
      const uploaded = await documentService.uploadDocument(selectedFile, documentType);
      setDocuments((prev) => [uploaded, ...prev]);
      setSuccessMessage(`"${uploaded.original_filename}" has been successfully uploaded.`);
      setSrAnnouncement(`Upload completed. ${uploaded.original_filename} is now available.`);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      const msg = err.details?.file?.[0] || err.message || 'Upload failed. Please check your document and try again.';
      setError(msg);
      setSrAnnouncement(`Upload failed: ${msg}`);
    } finally {
      setUploading(false);
    }
  }

  async function handleDownload(doc: CandidateDocument) {
    setDownloadingId(doc.id);
    setSrAnnouncement(`Preparing secure download link for ${doc.original_filename}...`);
    try {
      const res = await documentService.getDocumentDownloadUrl(doc.id);
      setSrAnnouncement(`Download link ready. Opening ${doc.original_filename}.`);

      // Trigger browser download via invisible link
      const link = document.createElement('a');
      link.href = res.download_url;
      link.setAttribute('download', res.filename || doc.original_filename);
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      setError(`Failed to download ${doc.original_filename}: ${err.message}`);
      setSrAnnouncement(`Download failed for ${doc.original_filename}.`);
    } finally {
      setDownloadingId(null);
    }
  }

  async function confirmDelete() {
    if (!docToDelete) return;

    setDeleting(true);
    setSrAnnouncement(`Deleting ${docToDelete.original_filename}...`);
    try {
      await documentService.deleteDocument(docToDelete.id);
      setDocuments((prev) => prev.filter((d) => d.id !== docToDelete.id));
      setSuccessMessage(`"${docToDelete.original_filename}" was permanently deleted.`);
      setSrAnnouncement(`${docToDelete.original_filename} has been deleted.`);
      setDocToDelete(null);
    } catch (err: any) {
      setError(`Failed to delete document: ${err.message}`);
      setSrAnnouncement(`Delete failed for ${docToDelete.original_filename}.`);
    } finally {
      setDeleting(false);
    }
  }

  const getTypeBadge = (type: DocumentType) => {
    switch (type) {
      case 'resume':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800">Resume / CV</span>;
      case 'certificate':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800">Certificate</span>;
      case 'other':
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-800">Supporting Document</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Screen Reader Live Announcements */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {srAnnouncement}
      </div>

      {/* Header & Quota Information */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Career & Verification Documents</h2>
          <p className="text-sm text-slate-600 mt-0.5">
            Manage your resumes, educational certificates, and training documentation stored securely in your private vault.
          </p>
        </div>
        <div className="text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-md self-start sm:self-auto">
          Documents: <span className="text-slate-900 font-bold">{documents.length}</span> / 10 max
        </div>
      </div>

      {/* Status Notifications */}
      {error && (
        <div
          role="alert"
          className="p-4 bg-red-50 border border-red-200 text-red-800 text-sm rounded-lg flex items-start justify-between gap-3"
        >
          <div className="flex items-start gap-2">
            <span aria-hidden="true" className="font-bold text-base">⚠️</span>
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-red-700 hover:text-red-900 text-xs font-bold underline"
            aria-label="Dismiss error notification"
          >
            Dismiss
          </button>
        </div>
      )}

      {successMessage && (
        <div
          role="status"
          className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-lg flex items-start justify-between gap-3"
        >
          <div className="flex items-start gap-2">
            <span aria-hidden="true" className="font-bold text-base">✓</span>
            <span>{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-bold underline"
            aria-label="Dismiss success notification"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Upload Form (only shown if not read-only and under quota) */}
      {!readOnly && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-1">Upload New Document</h3>
          <p className="text-xs text-slate-600 mb-4" id="upload-guidance">
            Accepted file types: <strong>PDF, DOCX, JPG, PNG</strong>. Maximum file size: <strong>5 MB</strong>.
          </p>

          <form onSubmit={handleUpload} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="document-type-select" className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                  Document Category <span className="text-red-600" aria-hidden="true">*</span>
                </label>
                <select
                  id="document-type-select"
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value as DocumentType)}
                  disabled={uploading || documents.length >= 10}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="resume">Resume / Curriculum Vitae (CV)</option>
                  <option value="certificate">Education / Training Certificate</option>
                  <option value="other">Other Supporting Document</option>
                </select>
              </div>

              <div>
                <label htmlFor="document-file-input" className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                  Choose File <span className="text-red-600" aria-hidden="true">*</span>
                </label>
                <input
                  id="document-file-input"
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.jpg,.jpeg,.png,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png"
                  onChange={handleFileChange}
                  disabled={uploading || documents.length >= 10}
                  aria-describedby="upload-guidance"
                  className="block w-full text-sm text-slate-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer border border-slate-300 rounded-md bg-white p-1"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              {selectedFile ? (
                <p className="text-xs text-slate-700">
                  Selected: <span className="font-semibold text-slate-900">{selectedFile.name}</span> ({roundMb(selectedFile.size)} MB)
                </p>
              ) : (
                <span />
              )}

              <button
                type="submit"
                disabled={!selectedFile || uploading || documents.length >= 10}
                className="inline-flex items-center gap-2 px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold rounded-md shadow-sm transition focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <span aria-hidden="true">⬆</span>
                    <span>Upload Document</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Documents List */}
      <div>
        {loading ? (
          <div className="space-y-3 py-6 text-center" role="status">
            <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-2" />
            <p className="text-sm text-slate-600 font-medium">Loading documents...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-12 px-4 bg-slate-50 border border-dashed border-slate-300 rounded-xl">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl font-bold">
              📄
            </div>
            <h3 className="text-base font-bold text-slate-900">No Documents Uploaded Yet</h3>
            <p className="text-sm text-slate-600 mt-1 max-w-md mx-auto">
              Upload your resume and educational certificates to attach them directly when applying for accessible job positions.
            </p>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm" aria-label="Candidate Documents Table">
                <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-bold tracking-wider">
                  <tr>
                    <th scope="col" className="px-4 py-3">Document Name</th>
                    <th scope="col" className="px-4 py-3">Type</th>
                    <th scope="col" className="px-4 py-3">Size</th>
                    <th scope="col" className="px-4 py-3">Uploaded On</th>
                    <th scope="col" className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        <div className="flex items-center gap-2">
                          <span aria-hidden="true" className="text-slate-400 text-base">📄</span>
                          <span className="truncate max-w-xs">{doc.original_filename}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {getTypeBadge(doc.document_type)}
                      </td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                        {doc.formatted_size}
                      </td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                        {new Date(doc.uploaded_at).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleDownload(doc)}
                            disabled={downloadingId === doc.id}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50"
                            aria-label={`Download ${doc.original_filename}`}
                          >
                            {downloadingId === doc.id ? (
                              <span>Downloading...</span>
                            ) : (
                              <>
                                <span aria-hidden="true">⬇</span>
                                <span>Download</span>
                              </>
                            )}
                          </button>

                          {!readOnly && (
                            <button
                              type="button"
                              onClick={() => setDocToDelete(doc)}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-red-50 hover:bg-red-100 text-red-700 rounded text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-red-600"
                              aria-label={`Delete ${doc.original_filename}`}
                            >
                              <span aria-hidden="true">🗑</span>
                              <span>Delete</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {docToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
          aria-describedby="delete-dialog-description"
        >
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200 space-y-4">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
              🗑
            </div>
            <div className="text-center">
              <h3 id="delete-dialog-title" className="text-lg font-bold text-slate-900">
                Confirm Document Deletion
              </h3>
              <p id="delete-dialog-description" className="text-sm text-slate-600 mt-2">
                Are you sure you want to permanently delete <strong>{docToDelete.original_filename}</strong>?
                This will purge the file from private storage and cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDocToDelete(null)}
                disabled={deleting}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-slate-400"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-red-600 disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Yes, Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function roundMb(bytes: number): string {
  return (bytes / (1024 * 1024)).toFixed(2);
}
