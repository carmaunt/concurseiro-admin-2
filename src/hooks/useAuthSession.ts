import { useSyncExternalStore } from 'react';
import { getCurrentUserRole } from '@/services/auth';

function subscribe(callback: () => void) {
  window.addEventListener('storage', callback);

  return () => window.removeEventListener('storage', callback);
}

function getServerSnapshot() {
  return null;
}

export function useCurrentUserRole() {
  return useSyncExternalStore(subscribe, getCurrentUserRole, getServerSnapshot);
}
