import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { authService, type AuthResponse } from '@/services/auth';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  userId: string | null;
  deviceFingerprint: string | null;

  initialize: () => Promise<void>;
  getDeviceFingerprint: () => Promise<string>;
  login: (phone: string, password: string) => Promise<void>;
  register: (email: string, phone: string, fullName: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  handleAuthResponse: (data: AuthResponse) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  isLoading: true,
  userId: null,
  deviceFingerprint: null,

  initialize: async () => {
    try {
      const token = await SecureStore.getItemAsync('access_token');
      const userId = await SecureStore.getItemAsync('user_id');
      const fingerprint = await get().getDeviceFingerprint();
      set({
        isAuthenticated: !!token,
        userId: userId || null,
        deviceFingerprint: fingerprint,
        isLoading: false,
      });
    } catch {
      set({ isAuthenticated: false, isLoading: false });
    }
  },

  getDeviceFingerprint: async () => {
    let fp = await SecureStore.getItemAsync('device_fingerprint');
    if (!fp) {
      fp = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        `twinvest-${Date.now()}-${Math.random()}`
      );
      await SecureStore.setItemAsync('device_fingerprint', fp);
    }
    set({ deviceFingerprint: fp });
    return fp;
  },

  handleAuthResponse: async (data: AuthResponse) => {
    await SecureStore.setItemAsync('access_token', data.access_token);
    await SecureStore.setItemAsync('refresh_token', data.refresh_token);
    await SecureStore.setItemAsync('user_id', data.user_id);
    set({
      isAuthenticated: true,
      userId: data.user_id,
    });
  },

  login: async (phone: string, password: string) => {
    const fp = await get().getDeviceFingerprint();
    const response = await authService.login({
      phone,
      password,
      device_fingerprint: fp,
    });
    await get().handleAuthResponse(response.data);
  },

  register: async (email: string, phone: string, fullName: string, password: string) => {
    const fp = await get().getDeviceFingerprint();
    const response = await authService.register({
      email,
      phone,
      full_name: fullName,
      password,
      device_fingerprint: fp,
    });
    await get().handleAuthResponse(response.data);
  },

  logout: async () => {
    try {
      await authService.logout();
    } catch { /* ignore */ }
    await SecureStore.deleteItemAsync('access_token');
    await SecureStore.deleteItemAsync('refresh_token');
    await SecureStore.deleteItemAsync('user_id');
    set({ isAuthenticated: false, userId: null });
  },
}));
