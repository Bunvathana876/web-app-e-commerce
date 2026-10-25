import type { ApiUser } from "./api";

export const AUTH_KEY = "isLoggedIn";
export const TOKEN_KEY = "accessToken";
export const USER_KEY = "currentUser";

/**
 * Checks whether a given JWT token string is structurally valid and not expired.
 */
export function isTokenExpired(token: string | null): boolean {
  if (!token) return true;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return true;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const decoded = JSON.parse(jsonPayload);
    if (!decoded.exp) return false;
    // Buffer by 10 seconds to avoid race condition near expiration
    return Date.now() >= (decoded.exp * 1000 - 10000);
  } catch {
    return true;
  }
}

export function isLoggedIn(): boolean {
  if (typeof window === "undefined") return false;
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token || localStorage.getItem(AUTH_KEY) !== "true") return false;
  if (isTokenExpired(token)) {
    logout();
    return false;
  }
  return true;
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return null;
  if (isTokenExpired(token)) {
    logout();
    return null;
  }
  return token;
}

export function saveAuthSession(token: string, user: ApiUser) {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTH_KEY, "true");
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event("auth-changed"));
}

export function getCurrentUser(): ApiUser | null {
  if (typeof window === "undefined") return null;
  const userStr = localStorage.getItem(USER_KEY);
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

export function logout() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  window.dispatchEvent(new Event("auth-changed"));
}