import { api } from '@/services/api';
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
  const response = await api.post('/api/v1/auth/login', payload);
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
