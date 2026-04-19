import apiClient from './api/client';

export interface UserProfile {
  id: number;
  email: string;
  role: string;
  createdAt: string;
}

export interface UpdateCredentialsRequest {
  currentPassword: string;
  newEmail?: string;
  newPassword?: string;
}

export const userService = {
  getMe: () =>
    apiClient.get<UserProfile>('/api/users/me').then((r) => r.data),

  updateCredentials: (data: UpdateCredentialsRequest) =>
    apiClient.put<UserProfile>('/api/users/me', data).then((r) => r.data),
};
