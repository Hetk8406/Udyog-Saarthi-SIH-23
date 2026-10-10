// Authentication service calling Django auth endpoints

import { apiRequest } from './api';
import { AuthResponse, User, UserRole } from '@/types/user';

export interface RegisterPayload {
  email: string;
  full_name: string;
  phone?: string;
  role: UserRole;
  password: string;
  password_confirm: string;
  terms_accepted: boolean;
  turnstile_token?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
  turnstile_token?: string;
}

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/auth/register/', {
    method: 'POST',
    body: JSON.stringify(payload),
    requiresAuth: false,
  });
}

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/auth/login/', {
    method: 'POST',
    body: JSON.stringify(payload),
    requiresAuth: false,
  });
}

export async function logout(): Promise<{ message: string }> {
  return apiRequest<{ message: string }>('/auth/logout/', {
    method: 'POST',
    body: JSON.stringify({}),
    requiresAuth: false,
  });
}

export async function getCurrentUser(): Promise<User> {
  return apiRequest<User>('/auth/me/', {
    method: 'GET',
    requiresAuth: true,
  });
}

export async function requestPasswordReset(email: string, turnstile_token?: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>('/auth/password-reset/', {
    method: 'POST',
    body: JSON.stringify({ email, turnstile_token }),
    requiresAuth: false,
  });
}

export async function confirmPasswordReset(data: {
  uid: string;
  token: string;
  new_password: string;
  new_password_confirm: string;
}): Promise<{ message: string }> {
  return apiRequest<{ message: string }>('/auth/password-reset-confirm/', {
    method: 'POST',
    body: JSON.stringify(data),
    requiresAuth: false,
  });
}
