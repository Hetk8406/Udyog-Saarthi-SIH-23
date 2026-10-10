import { apiRequest } from './api';
import { CandidateDocument, DocumentDownloadResponse, DocumentType } from '@/types/document';

export async function getDocuments(candidateId?: string): Promise<CandidateDocument[]> {
  const query = candidateId ? `?candidate_id=${encodeURIComponent(candidateId)}` : '';
  return apiRequest<CandidateDocument[]>(`/profiles/me/documents/${query}`, {
    method: 'GET',
    requiresAuth: true,
  });
}

export async function uploadDocument(
  file: File,
  documentType: DocumentType,
  applicationId?: string
): Promise<CandidateDocument> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('document_type', documentType);
  if (applicationId) {
    formData.append('application_id', applicationId);
  }

  return apiRequest<CandidateDocument>('/profiles/me/documents/', {
    method: 'POST',
    body: formData,
    requiresAuth: true,
  });
}

export async function deleteDocument(id: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/profiles/me/documents/${id}/`, {
    method: 'DELETE',
    requiresAuth: true,
  });
}

export async function getDocumentDownloadUrl(id: string): Promise<DocumentDownloadResponse> {
  return apiRequest<DocumentDownloadResponse>(`/profiles/documents/${id}/download/`, {
    method: 'GET',
    requiresAuth: true,
  });
}

export const documentService = {
  getDocuments,
  uploadDocument,
  deleteDocument,
  getDocumentDownloadUrl,
};
