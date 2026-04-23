import * as SecureStore from "expo-secure-store";

const STORAGE_KEYS = {
  accessToken: "access_token",
  refreshToken: "refresh_token",
  userId: "user_id",
  otpVerified: "otp_verified",
  deviceFingerprint: "device_fingerprint",
  appPin: "app_pin",
};

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  userId: string;
}

const randomToken = (): string => {
  const seed = Math.random().toString(36).slice(2, 12);
  return `${Date.now().toString(36)}_${seed}`;
};

export const ensureDeviceFingerprint = async (): Promise<string> => {
  const existing = await SecureStore.getItemAsync(STORAGE_KEYS.deviceFingerprint);
  if (existing && existing.trim().length > 0) {
    return existing;
  }

  const generated = `device_${randomToken()}`;
  await SecureStore.setItemAsync(STORAGE_KEYS.deviceFingerprint, generated);
  return generated;
};

export const getDeviceFingerprint = async (): Promise<string | null> => {
  return SecureStore.getItemAsync(STORAGE_KEYS.deviceFingerprint);
};

export const saveAuthSession = async (session: AuthSession): Promise<void> => {
  await Promise.all([
    SecureStore.setItemAsync(STORAGE_KEYS.accessToken, session.accessToken),
    SecureStore.setItemAsync(STORAGE_KEYS.refreshToken, session.refreshToken),
    SecureStore.setItemAsync(STORAGE_KEYS.userId, session.userId),
  ]);
};

export const getAuthSession = async (): Promise<AuthSession | null> => {
  const [accessToken, refreshToken, userId] = await Promise.all([
    SecureStore.getItemAsync(STORAGE_KEYS.accessToken),
    SecureStore.getItemAsync(STORAGE_KEYS.refreshToken),
    SecureStore.getItemAsync(STORAGE_KEYS.userId),
  ]);

  if (!accessToken || !refreshToken || !userId) {
    return null;
  }

  return { accessToken, refreshToken, userId };
};

export const updateAccessToken = async (
  accessToken: string,
  refreshToken: string,
): Promise<void> => {
  await Promise.all([
    SecureStore.setItemAsync(STORAGE_KEYS.accessToken, accessToken),
    SecureStore.setItemAsync(STORAGE_KEYS.refreshToken, refreshToken),
  ]);
};

export const markOtpVerified = async (verified: boolean): Promise<void> => {
  await SecureStore.setItemAsync(STORAGE_KEYS.otpVerified, verified ? "1" : "0");
};

export const isOtpVerified = async (): Promise<boolean> => {
  const value = await SecureStore.getItemAsync(STORAGE_KEYS.otpVerified);
  return value === "1";
};

export const saveAppPin = async (pin: string): Promise<void> => {
  await SecureStore.setItemAsync(STORAGE_KEYS.appPin, pin);
};

export const getAppPin = async (): Promise<string | null> => {
  return SecureStore.getItemAsync(STORAGE_KEYS.appPin);
};

export const clearAuthSession = async (): Promise<void> => {
  await Promise.all([
    SecureStore.deleteItemAsync(STORAGE_KEYS.accessToken),
    SecureStore.deleteItemAsync(STORAGE_KEYS.refreshToken),
    SecureStore.deleteItemAsync(STORAGE_KEYS.userId),
    SecureStore.deleteItemAsync(STORAGE_KEYS.otpVerified),
    SecureStore.deleteItemAsync(STORAGE_KEYS.appPin),
  ]);
};
