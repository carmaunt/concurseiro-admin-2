import { api } from '@/services/api';
import axios from 'axios';
import { parseUserRole } from '@/services/auth';
import { stringProp, unwrapApiData } from '@/utils/unknown';

export type LoginPayload = {
  email: string;
  senha: string;
};

export type RegisterPayload = {
  nome: string;
  email: string;
  senha: string;
};

export async function login(payload: LoginPayload) {
  let response;
  try {
    response = await api.post('/api/v1/auth/login', payload);
  } catch (error) {
    const status = axios.isAxiosError(error) ? error.response?.status : undefined;
    if (status && status < 500) throw error;
    await new Promise((resolve) => setTimeout(resolve, 2000));
    response = await api.post('/api/v1/auth/login', payload);
  }
  const data = unwrapApiData<unknown>(response.data);

  return {
    email: stringProp(data, ['email']),
    role: parseUserRole(stringProp(data, ['role'])),
  };
}

export async function register(payload: RegisterPayload) {
  await api.post('/api/v1/auth/register', payload);
}

export async function logout() {
  await api.post('/api/v1/auth/logout');
}


export async function me() {
  const response = await api.get('/api/v1/auth/me');
  const data = unwrapApiData<unknown>(response.data);

  return {
    email: stringProp(data, ['email']),
    role: parseUserRole(stringProp(data, ['role'])),
    tipoConta: stringProp(data, ['tipoConta']),
  };
}
