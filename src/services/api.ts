// src/services/api.ts
import axios from 'axios';

export const api = axios.create({
  baseURL: 'https://concurseiro-api-lnae.onrender.com',
});

// interceptor para enviar o token automaticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});