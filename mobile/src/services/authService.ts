import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { ENDPOINTS } from "../constants/config";

export interface AuthenticatedCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  emailVerified?: boolean;
  googleLinked?: boolean;
  createdAt?: string;
}

export interface AuthSessionPayload {
  user: AuthenticatedCustomer;
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
}

const SECURE_KEYS = {
  ACCESS_TOKEN: "tuta_sec_access_token",
  ACCESS_EXPIRES_AT: "tuta_sec_access_expires_at",
  REFRESH_TOKEN: "tuta_sec_refresh_token",
  REFRESH_EXPIRES_AT: "tuta_sec_refresh_expires_at",
  USER_PROFILE: "tuta_sec_user_profile",
} as const;

const LEGACY_ASYNC_STORAGE_USER_KEY = "tuta_user";

let inMemoryAccessToken: string | null = null;
let inMemoryAccessExpiresAt: number = 0;
let inMemoryRefreshToken: string | null = null;
let inMemoryUser: AuthenticatedCustomer | null = null;
let activeRefreshPromise: Promise<AuthSessionPayload | null> | null = null;

async function setSecureItem(key: string, value: string): Promise<void> {
  if (Platform.OS === "web") {
    try {
      (globalThis as any).localStorage?.setItem(key, value);
    } catch {}
    return;
  }
  await SecureStore.setItemAsync(key, value, {
    keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
  });
}

async function getSecureItem(key: string): Promise<string | null> {
  if (Platform.OS === "web") {
    try {
      return (globalThis as any).localStorage?.getItem(key) ?? null;
    } catch {
      return null;
    }
  }
  return SecureStore.getItemAsync(key);
}

async function deleteSecureItem(key: string): Promise<void> {
  if (Platform.OS === "web") {
    try {
      (globalThis as any).localStorage?.removeItem(key);
    } catch {}
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

/**
 * Persist authenticated session tokens & safe customer profile in Expo SecureStore.
 */
export async function saveAuthSession(session: AuthSessionPayload): Promise<void> {
  inMemoryAccessToken = session.accessToken;
  inMemoryAccessExpiresAt = new Date(session.accessTokenExpiresAt).getTime() || Date.now() + 15 * 60 * 1000;
  inMemoryRefreshToken = session.refreshToken;
  inMemoryUser = session.user;

  await Promise.all([
    setSecureItem(SECURE_KEYS.ACCESS_TOKEN, session.accessToken),
    setSecureItem(SECURE_KEYS.ACCESS_EXPIRES_AT, session.accessTokenExpiresAt),
    setSecureItem(SECURE_KEYS.REFRESH_TOKEN, session.refreshToken),
    setSecureItem(SECURE_KEYS.REFRESH_EXPIRES_AT, session.refreshTokenExpiresAt),
    setSecureItem(SECURE_KEYS.USER_PROFILE, JSON.stringify(session.user)),
    deleteSecureItem(LEGACY_ASYNC_STORAGE_USER_KEY).catch(() => {}),
  ]);
}

/**
 * Update stored customer profile metadata in SecureStore.
 */
export async function updateStoredCustomerProfile(user: AuthenticatedCustomer): Promise<void> {
  inMemoryUser = user;
  await setSecureItem(SECURE_KEYS.USER_PROFILE, JSON.stringify(user));
}

/**
 * Clear all session tokens and profile from memory and Expo SecureStore.
 */
export async function clearAuthSession(): Promise<void> {
  inMemoryAccessToken = null;
  inMemoryAccessExpiresAt = 0;
  inMemoryRefreshToken = null;
  inMemoryUser = null;

  await Promise.all([
    deleteSecureItem(SECURE_KEYS.ACCESS_TOKEN).catch(() => {}),
    deleteSecureItem(SECURE_KEYS.ACCESS_EXPIRES_AT).catch(() => {}),
    deleteSecureItem(SECURE_KEYS.REFRESH_TOKEN).catch(() => {}),
    deleteSecureItem(SECURE_KEYS.REFRESH_EXPIRES_AT).catch(() => {}),
    deleteSecureItem(SECURE_KEYS.USER_PROFILE).catch(() => {}),
    deleteSecureItem(LEGACY_ASYNC_STORAGE_USER_KEY).catch(() => {}),
  ]);
}

/**
 * Perform single-flight refresh token rotation against POST /api/mobile/auth/refresh.
 */
export async function rotateSessionTokens(): Promise<AuthSessionPayload | null> {
  if (activeRefreshPromise) {
    return activeRefreshPromise;
  }

  activeRefreshPromise = (async () => {
    try {
      const refreshToken =
        inMemoryRefreshToken || (await getSecureItem(SECURE_KEYS.REFRESH_TOKEN));

      if (!refreshToken) {
        await clearAuthSession();
        return null;
      }

      const response = await fetch(ENDPOINTS.refresh, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          refreshToken,
          deviceName: `Tuta Grab-n-Go (${Platform.OS})`,
        }),
      });

      if (response.status === 401 || response.status === 403) {
        // Refresh token expired, revoked, or reused -> clear session
        await clearAuthSession();
        return null;
      }

      if (!response.ok) {
        // Transient server error -> keep cached session
        return null;
      }

      const data = await response.json();
      if (
        !data?.success ||
        !data?.accessToken ||
        !data?.refreshToken ||
        !data?.user
      ) {
        await clearAuthSession();
        return null;
      }

      const updatedSession: AuthSessionPayload = {
        user: data.user,
        accessToken: data.accessToken,
        accessTokenExpiresAt:
          data.accessTokenExpiresAt ||
          new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        refreshToken: data.refreshToken,
        refreshTokenExpiresAt:
          data.refreshTokenExpiresAt ||
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };

      await saveAuthSession(updatedSession);
      return updatedSession;
    } catch {
      // Network error while offline -> do not wipe stored credentials
      return null;
    } finally {
      activeRefreshPromise = null;
    }
  })();

  return activeRefreshPromise;
}

/**
 * Restore persistent session on app startup.
 * Automatically refreshes expired access tokens using the rotating refresh token.
 */
export async function restoreCustomerSession(): Promise<AuthenticatedCustomer | null> {
  try {
    const [
      storedAccessToken,
      storedAccessExpiresAt,
      storedRefreshToken,
      storedRefreshExpiresAt,
      storedUserJson,
    ] = await Promise.all([
      getSecureItem(SECURE_KEYS.ACCESS_TOKEN),
      getSecureItem(SECURE_KEYS.ACCESS_EXPIRES_AT),
      getSecureItem(SECURE_KEYS.REFRESH_TOKEN),
      getSecureItem(SECURE_KEYS.REFRESH_EXPIRES_AT),
      getSecureItem(SECURE_KEYS.USER_PROFILE),
    ]);

    // Clean up any legacy unauthenticated AsyncStorage user object if SecureStore has no refresh token
    if (!storedRefreshToken) {
      await deleteSecureItem(LEGACY_ASYNC_STORAGE_USER_KEY).catch(() => {});
      return null;
    }

    // Check if refresh token itself has passed expiration
    if (storedRefreshExpiresAt) {
      const refreshExpMs = new Date(storedRefreshExpiresAt).getTime();
      if (Number.isFinite(refreshExpMs) && refreshExpMs <= Date.now()) {
        await clearAuthSession();
        return null;
      }
    }

    let cachedUser: AuthenticatedCustomer | null = null;
    if (storedUserJson) {
      try {
        cachedUser = JSON.parse(storedUserJson);
      } catch {
        cachedUser = null;
      }
    }

    inMemoryAccessToken = storedAccessToken;
    inMemoryAccessExpiresAt = storedAccessExpiresAt
      ? new Date(storedAccessExpiresAt).getTime()
      : 0;
    inMemoryRefreshToken = storedRefreshToken;
    inMemoryUser = cachedUser;

    const accessValid =
      Boolean(storedAccessToken) &&
      inMemoryAccessExpiresAt > Date.now() + 60 * 1000;

    if (accessValid && cachedUser) {
      // Refresh profile in background without blocking startup UI
      fetch(ENDPOINTS.me, {
        headers: { Authorization: `Bearer ${storedAccessToken}` },
      })
        .then(async (res) => {
          if (res.ok) {
            const data = await res.json();
            if (data?.user) {
              await updateStoredCustomerProfile(data.user);
            }
          } else if (res.status === 401) {
            await rotateSessionTokens();
          }
        })
        .catch(() => {});

      return cachedUser;
    }

    // Access token expired or missing -> rotate using refresh token
    const rotated = await rotateSessionTokens();
    if (rotated?.user) {
      return rotated.user;
    }

    // If offline and we still have a non-expired refresh token + cachedUser, keep user signed in
    const stillHasRefresh = await getSecureItem(SECURE_KEYS.REFRESH_TOKEN);
    if (stillHasRefresh && cachedUser) {
      return cachedUser;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Retrieve a valid access token, automatically refreshing if expired.
 */
export async function getValidAccessToken(): Promise<string | null> {
  if (
    inMemoryAccessToken &&
    inMemoryAccessExpiresAt > Date.now() + 30 * 1000
  ) {
    return inMemoryAccessToken;
  }

  const rotated = await rotateSessionTokens();
  if (rotated?.accessToken) {
    return rotated.accessToken;
  }

  return inMemoryAccessToken;
}

/**
 * Perform an authenticated fetch with automatic Bearer token injection and 401 refresh retry.
 */
export async function authenticatedFetch(
  url: string,
  init: RequestInit = {}
): Promise<Response> {
  const token = await getValidAccessToken();
  const headers = new Headers(init.headers || {});
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response = await fetch(url, {
    ...init,
    headers,
  });

  if (response.status === 401 && inMemoryRefreshToken) {
    const rotated = await rotateSessionTokens();
    if (rotated?.accessToken) {
      const retryHeaders = new Headers(init.headers || {});
      retryHeaders.set("Authorization", `Bearer ${rotated.accessToken}`);
      response = await fetch(url, {
        ...init,
        headers: retryHeaders,
      });
    }
  }

  return response;
}

/**
 * Revoke the active session on the backend and wipe local SecureStore credentials.
 */
export async function logoutCustomerSession(): Promise<void> {
  const refreshToken =
    inMemoryRefreshToken || (await getSecureItem(SECURE_KEYS.REFRESH_TOKEN));
  const accessToken = inMemoryAccessToken;

  await clearAuthSession();

  try {
    await fetch(ENDPOINTS.logout, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify({ refreshToken }),
    });
  } catch {
    // Ignore network error during logout cleanup
  }
}
