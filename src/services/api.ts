// src/services/api.ts
import axios from 'axios';
import { clearAuthSession } from './auth';

const PUBLIC_AUTH_PATHS = ['/login', '/cadastro'];

type ApiErrorPayload = {
  detail?: unknown;
  message?: unknown;
  error?: unknown;
};

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});

function isBrowser() {
  return typeof window !== 'undefined';
}

function shouldRedirectToLogin() {
  if (!isBrowser()) return false;

  return !PUBLIC_AUTH_PATHS.includes(window.location.pathname);
}

export function getApiErrorStatus(error: unknown) {
  if (!axios.isAxiosError(error)) return undefined;

  return error.response?.status;
}

export function getApiErrorMessage(error: unknown, fallback = 'Não foi possível concluir a operação.') {
  if (!axios.isAxiosError<ApiErrorPayload>(error)) return fallback;

  const data = error.response?.data;

  if (typeof data?.detail === 'string') return data.detail;
  if (typeof data?.message === 'string') return data.message;
  if (typeof data?.error === 'string') return data.error;
  if (error.message) return error.message;

  return fallback;
}

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (getApiErrorStatus(error) === 401) {
      clearAuthSession();

      if (shouldRedirectToLogin()) {
        window.location.assign('/login');
      }
    }

    return Promise.reject(error);
  }
);
