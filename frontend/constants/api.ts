const DEFAULT_API_BASE_URL = "http://10.44.123.151:42070";

export const API_BASE_URL =
//   process.env.EXPO_PUBLIC_API_BASE_URL?.trim() || 
  DEFAULT_API_BASE_URL;

export const API_V1 = `${API_BASE_URL}/api/v1`;
export const REQUEST_TIMEOUT_MS = 15000;
