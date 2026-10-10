export type DocumentType = 'resume' | 'certificate' | 'other';

export interface CandidateDocument {
  id: string;
  document_type: DocumentType;
  document_type_display: string;
  original_filename: string;
  content_type: string;
  size: number;
  formatted_size: string;
  uploaded_at: string;
  application?: string | null;
}

export interface DocumentDownloadResponse {
  download_url: string;
  expires_in: number;
  filename: string;
}
