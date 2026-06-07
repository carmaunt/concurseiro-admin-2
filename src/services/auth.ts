export type UserRole = 'ADMIN' | 'VISITANTE' | string;

export type AuthSession = {
  email?: string | null;
  role?: string | null;
};

const STORAGE_KEYS = {
  sessionActive: 'sessionActive',
  userEmail: 'userEmail',
  userRole: 'userRole',
} as const;

const LEGACY_STORAGE_KEYS = ['token', 'refreshToken'];

const SESSION_STORAGE_KEYS = [...Object.values(STORAGE_KEYS), ...LEGACY_STORAGE_KEYS];

function isBrowser() {
  return typeof window !== 'undefined';
}

export function hasAuthSession() {
  if (!isBrowser()) return false;

  return localStorage.getItem(STORAGE_KEYS.sessionActive) === 'true';
}

export function saveAuthSession({ email, role }: AuthSession) {
  if (!isBrowser()) return;

  LEGACY_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
  localStorage.setItem(STORAGE_KEYS.sessionActive, 'true');

  if (email) {
    localStorage.setItem(STORAGE_KEYS.userEmail, email);
  }

  if (role) {
    localStorage.setItem(STORAGE_KEYS.userRole, role);
  }
}

export function clearAuthSession() {
  if (!isBrowser()) return;

  SESSION_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
}

export function getCurrentUserRole() {
  if (!isBrowser()) return null;

  return localStorage.getItem(STORAGE_KEYS.userRole);
}
