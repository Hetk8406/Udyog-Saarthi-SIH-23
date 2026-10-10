export type UserRole = 'candidate' | 'guardian' | 'coach' | 'admin';

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: UserRole;
  role_display?: string;
  is_active: boolean;
  terms_accepted_at?: string;
  date_joined: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  access?: string;
  refresh?: string;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[] | string>;
}
