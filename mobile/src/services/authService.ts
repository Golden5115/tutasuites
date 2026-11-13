import * as FileSystem from "expo-file-system";
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

const memoryVault = new Map<string, string>();
const FALLBACK_SESSION_FILE = `${(FileSystem as any).documentDirectory || ""}tuta_auth_vault.json`;

let inMemoryAccessToken: string | null = null;
let inMemoryAccessExpiresAt: number = 0;
let inMemoryRefreshToken: string | null = null;
let inMemoryUser: AuthenticatedCustomer | null = null;
let activeRefreshPromise: Promise<AuthSessionPayload | null> | null = null;

function getNativeSecureStore(): any | null {
  if (Platform.OS === "web") return null;
  try {
    // Dynamic require prevents crash in Expo Go if native module wasn't loaded before Metro restart
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("expo-secure-store");
    if (mod && typeof mod.setItemAsync === "function") {
      return mod;
    }
    return null;
  } catch {
    return null;
  }
}

async function readFallbackFileVault(): Promise<Record<string, string>> {
  try {
    if (Platform.OS === "web" || !(FileSystem as any).documentDirectory) {
      return {};
    }
    const info = await FileSystem.getInfoAsync(FALLBACK_SESSION_FILE);
    if (!info.exists) return {};
    const raw = await FileSystem.readAsStringAsync(FALLBACK_SESSION_FILE);
    return JSON.parse(raw) || {};
  } catch {
    return {};
  }
}

async function writeFallbackFileVault(data: Record<string, string>): Promise<void> {
  try {
    if (Platform.OS === "web" || !(FileSystem as any).documentDirectory) {
      return;
    }
    await FileSystem.writeAsStringAsync(FALLBACK_SESSION_FILE, JSON.stringify(data));
  } catch {
    // Ignore file write errors
  }
}

async function setSecureItem(key: string, value: string): Promise<void> {
  memoryVault.set(key, value);

  if (Platform.OS === "web") {
    try {
      (globalThis as any).localStorage?.setItem(key, value);
    } catch {}
    return;
  }

  const secureStore = getNativeSecureStore();
  if (secureStore) {
    try {
      await secureStore.setItemAsync(key, value);
      return;
    } catch {
      // Fall through to app-private FileSystem vault if Expo Go SecureStore throws
    }
  }

  const vault = await readFallbackFileVault();
  vault[key] = value;
  await writeFallbackFileVault(vault);
}

async function getSecureItem(key: string): Promise<string | null> {
  if (Platform.OS === "web") {
    try {
      return (globalThis as any).localStorage?.getItem(key) ?? memoryVault.get(key) ?? null;
    } catch {
      return memoryVault.get(key) ?? null;
    }
  }

  const secureStore = getNativeSecureStore();
  if (secureStore) {
    try {
      const val = await secureStore.getItemAsync(key);
      if (val !== null && val !== undefined) {
        memoryVault.set(key, val);
        return val;
      }
    } catch {
      // Fall through to app-private FileSystem vault
    }
  }

  const vault = await readFallbackFileVault();
  if (vault[key]) {
    memoryVault.set(key, vault[key]);
    return vault[key];
  }

  return memoryVault.get(key) ?? null;
}

async function deleteSecureItem(key: string): Promise<void> {
  memoryVault.delete(key);

  if (Platform.OS === "web") {
    try {
      (globalThis as any).localStorage?.removeItem(key);
    } catch {}
    return;
  }

  const secureStore = getNativeSecureStore();
  if (secureStore) {
    try {
      await secureStore.deleteItemAsync(key);
    } catch {}
  }

  const vault = await readFallbackFileVault();
  if (key in vault) {
    delete vault[key];
    await writeFallbackFileVault(vault);
  }
}

/**
 * Persist authenticated session tokens & safe customer profile in Expo SecureStore
 * (with automatic fallback so it never throws in Expo Go or Web).
 */
export async function saveAuthSession(session: AuthSessionPayload): Promise<void> {
  try {
    inMemoryAccessToken = session.accessToken;
    inMemoryAccessExpiresAt =
      new Date(session.accessTokenExpiresAt).getTime() ||
      Date.now() + 15 * 60 * 1000;
    inMemoryRefreshToken = session.refreshToken;
    inMemoryUser = session.user;

    await Promise.all([
      setSecureItem(SECURE_KEYS.ACCESS_TOKEN, session.accessToken),
      setSecureItem(SECURE_KEYS.ACCESS_EXPIRES_AT, session.accessTokenExpiresAt),
      setSecureItem(SECURE_KEYS.REFRESH_TOKEN, session.refreshToken),
      setSecureItem(SECURE_KEYS.REFRESH_EXPIRES_AT, session.refreshTokenExpiresAt),
      setSecureItem(SECURE_KEYS.USER_PROFILE, JSON.stringify(session.user)),
    ]);
    console.log("[AUTH] Session saved securely for:", session.user.email || session.user.phone);
  } catch (err) {
    console.warn("[AUTH] Non-fatal storage warning:", err);
  }
}

/**
 * Update stored customer profile metadata in SecureStore.
 */
export async function updateStoredCustomerProfile(
  user: AuthenticatedCustomer
): Promise<void> {
  try {
    inMemoryUser = user;
    await setSecureItem(SECURE_KEYS.USER_PROFILE, JSON.stringify(user));
  } catch {}
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
        await clearAuthSession();
        return null;
      }

      if (!response.ok) {
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
      return null;
    } finally {
      activeRefreshPromise = null;
    }
  })();

  return activeRefreshPromise;
}

/**
 * Restore persistent session on app startup.
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

    if (!storedRefreshToken) {
      return null;
    }

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

    const rotated = await rotateSessionTokens();
    if (rotated?.user) {
      return rotated.user;
    }

    const stillHasRefresh = await getSecureItem(SECURE_KEYS.REFRESH_TOKEN);
    if (stillHasRefresh && cachedUser) {
      return cachedUser;
    }

    return null;
  } catch {
    return null;
  }
}

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
