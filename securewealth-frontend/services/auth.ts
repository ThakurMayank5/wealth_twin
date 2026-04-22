import api from './api';
import axios from 'axios';
import { API_V1 } from '@/constants/api';

export interface LoginPayload {
  phone: string;
  password: string;
  device_fingerprint: string;
}

export interface RegisterPayload {
  email: string;
  phone: string;
  full_name: string;
  password: string;
  device_fingerprint: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user_id: string;
  expires_in: number;
  is_trusted_device: boolean;
}

export const authService = {
  login: (data: LoginPayload) =>
    axios.post<AuthResponse>(`${API_V1}/auth/login`, data),

  register: (data: RegisterPayload) =>
    axios.post<AuthResponse>(`${API_V1}/auth/register`, data),

  refresh: (refreshToken: string) =>
    axios.post(`${API_V1}/auth/refresh`, { refresh_token: refreshToken }),

  logout: () => api.post('/auth/logout'),

  sendOTP: () => api.post('/auth/otp/send'),

  verifyOTP: (otp: string) => api.post('/auth/otp/verify', { otp }),
};
