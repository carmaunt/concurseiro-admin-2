export type UserRole = 'ADMIN' | 'VISITANTE' | string;

export type AuthSession = {
  accessToken: string;
  refreshToken?: string | null;
  email?: string | null;
};

const STORAGE_KEYS = {
  accessToken: 'token',
  refreshToken: 'refreshToken',
  userEmail: 'userEmail',
  userRole: 'userRole',
} as const;

const SESSION_STORAGE_KEYS = Object.values(STORAGE_KEYS);

function isBrowser() {
  return typeof window !== 'undefined';
}

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalized.length % 4;
  const padded = padding ? normalized.padEnd(normalized.length + 4 - padding, '=') : normalized;

  return atob(padded);
}

function parseJwtPayload(token: string | null): Record<string, unknown> | null {
  if (!token || !isBrowser()) return null;

  try {
    const payloadBase64 = token.split('.')[1];
    if (!payloadBase64) return null;

    return JSON.parse(decodeBase64Url(payloadBase64)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function getStoredAccessToken() {
  if (!isBrowser()) return null;

  return localStorage.getItem(STORAGE_KEYS.accessToken);
}

export function hasAuthSession() {
  return Boolean(getStoredAccessToken());
}

export function saveAuthSession({ accessToken, refreshToken, email }: AuthSession) {
  if (!isBrowser()) return;

  localStorage.setItem(STORAGE_KEYS.accessToken, accessToken);

  if (refreshToken) {
    localStorage.setItem(STORAGE_KEYS.refreshToken, refreshToken);
  }

  if (email) {
    localStorage.setItem(STORAGE_KEYS.userEmail, email);
  }

  const role = getRoleFromToken(accessToken);

  if (role) {
    localStorage.setItem(STORAGE_KEYS.userRole, role);
  }
}

export function clearAuthSession() {
  if (!isBrowser()) return;

  SESSION_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
}

export function getRoleFromToken(token: string | null): UserRole | null {
  const payload = parseJwtPayload(token);
  const role = payload?.role;
  const authorities = payload?.authorities;

  if (typeof role === 'string') return role;

  if (Array.isArray(authorities) && typeof authorities[0] === 'string') {
    return authorities[0];
  }

  return null;
}

export function getCurrentUserRole() {
  if (!isBrowser()) return null;

  return getRoleFromToken(getStoredAccessToken()) ?? localStorage.getItem(STORAGE_KEYS.userRole);
}
