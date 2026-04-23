import { apiRequest } from "@/services/http";

export interface AuthPayload {
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

export interface OtpVerifyResponse {
  verified: boolean;
  attempts_remaining?: number;
}

export const authService = {
  login: (payload: AuthPayload) =>
    apiRequest<AuthResponse>("/auth/login", {
      method: "POST",
      auth: false,
      body: payload,
    }),

  register: (payload: RegisterPayload) =>
    apiRequest<AuthResponse>("/auth/register", {
      method: "POST",
      auth: false,
      body: payload,
    }),

  refresh: (refreshToken: string) =>
    apiRequest<Pick<AuthResponse, "access_token" | "refresh_token" | "expires_in">>(
      "/auth/refresh",
      {
        method: "POST",
        auth: false,
        body: { refresh_token: refreshToken },
      },
    ),

  sendOtp: () => apiRequest<{ success: boolean; expires_in: number }>("/auth/otp/send", { method: "POST" }),

  verifyOtp: (otp: string) =>
    apiRequest<OtpVerifyResponse>("/auth/otp/verify", {
      method: "POST",
      body: { otp },
    }),

  logout: () => apiRequest<{ success: boolean }>("/auth/logout", { method: "POST" }),
};
