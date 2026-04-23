import { API_V1, REQUEST_TIMEOUT_MS } from "@/constants/api";
import {
  clearAuthSession,
  ensureDeviceFingerprint,
  getAuthSession,
  updateAccessToken,
} from "@/services/storage";

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: any;
  headers?: Record<string, string>;
  auth?: boolean;
  retryOnUnauthorized?: boolean;
}

const isHttpLoggingEnabled =
  typeof __DEV__ !== "undefined" ? __DEV__ : true;

const httpLog = (...args: any[]) => {
  if (!isHttpLoggingEnabled) {
    return;
  }
  console.log("[HTTP]", ...args);
};

const withTimeout = async (
  input: RequestInfo | URL,
  init: RequestInit,
): Promise<Response> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
};

const parseResponse = async (response: Response): Promise<any> => {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  return text ? { message: text } : {};
};

const refreshAccessToken = async (): Promise<boolean> => {
  const session = await getAuthSession();
  if (!session?.refreshToken) {
    httpLog("refresh skipped: missing refresh token");
    return false;
  }

  try {
    httpLog("refresh token request started");
    const response = await withTimeout(`${API_V1}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: session.refreshToken }),
    });

    const data = await parseResponse(response);
    httpLog("refresh token response", { status: response.status, ok: response.ok });
    if (!response.ok || !data?.access_token || !data?.refresh_token) {
      httpLog("refresh token rejected", data);
      return false;
    }

    await updateAccessToken(data.access_token, data.refresh_token);
    httpLog("refresh token success");
    return true;
  } catch (error) {
    httpLog("refresh token failed", error);
    return false;
  }
};

export const apiRequest = async <T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> => {
  const {
    method = "GET",
    body,
    headers,
    auth = true,
    retryOnUnauthorized = true,
  } = options;

  const url = `${API_V1}${path}`;
  const session = await getAuthSession();
  const deviceFingerprint = await ensureDeviceFingerprint();

  const requestHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Device-Fingerprint": deviceFingerprint,
    ...(headers || {}),
  };

  if (auth && session?.accessToken) {
    requestHeaders.Authorization = `Bearer ${session.accessToken}`;
  }

  httpLog("request", {
    method,
    path,
    auth,
    retryOnUnauthorized,
    hasBody: body !== undefined,
  });

  const response = await withTimeout(url, {
    method,
    headers: requestHeaders,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const payload = await parseResponse(response);

  httpLog("response", {
    method,
    path,
    status: response.status,
    ok: response.ok,
  });

  if (
    response.status === 401 &&
    auth &&
    retryOnUnauthorized &&
    path !== "/auth/refresh"
  ) {
	  httpLog("received 401, attempting refresh", { path });
    const refreshed = await refreshAccessToken();
    if (refreshed) {
		  httpLog("retrying request after refresh", { path });
      return apiRequest<T>(path, {
        ...options,
        retryOnUnauthorized: false,
      });
    }

	httpLog("refresh failed, clearing session", { path });
    await clearAuthSession();
  }

  if (!response.ok) {
    const message = payload?.error || payload?.message || "Request failed";
	httpLog("request failed", {
	  method,
	  path,
	  status: response.status,
	  message,
	  payload,
	});
    throw new ApiError(message, response.status, payload);
  }

  return payload as T;
};
