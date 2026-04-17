import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { apiConfig } from './config';

// Axios instance
const apiClient = axios.create(apiConfig);

// In-memory access token referansı — AuthContext tarafından set edilir
let getAccessToken: (() => string | null) | null = null;
let setAccessToken: ((token: string) => void) | null = null;
let clearAuth: (() => void) | null = null;

export function registerAuthHandlers(
  getter: () => string | null,
  setter: (token: string) => void,
  clearer: () => void,
) {
  getAccessToken = getter;
  setAccessToken = setter;
  clearAuth = clearer;
}

// Request interceptor: her istekte Authorization header ekle
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken?.();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: 401 gelirse refresh → retry
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

function processQueue(error: AxiosError | null, token: string | null = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  failedQueue = [];
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Refresh endpoint'in kendisi 401 döndürdüyse → logout
    if (
      error.response?.status === 401 &&
      originalRequest.url?.includes('/api/auth/refresh')
    ) {
      clearAuth?.();
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Başka bir refresh devam ediyorsa kuyruğa ekle
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // refresh_token cookie'si otomatik gönderilir (withCredentials: true)
        const { data } = await apiClient.post<{ accessToken: string }>(
          '/api/auth/refresh',
        );
        const newToken = data.accessToken;
        setAccessToken?.(newToken);
        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as AxiosError, null);
        clearAuth?.();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
