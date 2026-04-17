import { API_BASE_URL } from '@/utils/constants';

export const apiConfig = {
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true, // HttpOnly refresh_token cookie'yi otomatik gönderir
} as const;
