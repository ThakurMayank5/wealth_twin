import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_V1 } from '@/constants/api';

const api = axios.create({
  baseURL: API_V1,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach access token
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const fingerprint = await SecureStore.getItemAsync('device_fingerprint');
  if (fingerprint) {
    config.headers['X-Device-Fingerprint'] = fingerprint;
  }
  return config;
});

// Response interceptor — auto-refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = await SecureStore.getItemAsync('refresh_token');
        if (!refreshToken) throw new Error('No refresh token');

        const response = await axios.post(`${API_V1}/auth/refresh`, {
          refresh_token: refreshToken,
        });

        const { access_token, refresh_token: newRefresh } = response.data;
        await SecureStore.setItemAsync('access_token', access_token);
        await SecureStore.setItemAsync('refresh_token', newRefresh);

        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return api(originalRequest);
      } catch {
        await SecureStore.deleteItemAsync('access_token');
        await SecureStore.deleteItemAsync('refresh_token');
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
