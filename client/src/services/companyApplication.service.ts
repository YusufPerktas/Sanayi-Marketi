import apiClient from './api/client';

export interface CompanyApplication {
  id: number;
  applicantUserId: number;
  applicationType: 'MANUAL_NEW' | 'MANUAL_EXISTING' | 'AUTO_IMPORTED';
  proposedCompanyName: string | null;
  targetCompanyId: number | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason: string | null;
  createdAt: string;
}

export interface RegisterCompanyRequest {
  email: string;
  password: string;
  companyName: string;
  phone?: string;
  city?: string;
}

export const companyApplicationService = {
  // POST /api/auth/register-company — backend endpoint henüz hazır değil
  registerCompany: (data: RegisterCompanyRequest) =>
    apiClient
      .post<{ accessToken: string; userId: number; role: string }>(
        '/api/auth/register-company',
        data,
      )
      .then((r) => r.data),

  getMyApplications: () =>
    apiClient.get<CompanyApplication[]>('/api/company-applications').then((r) => r.data),

  getById: (id: number | string) =>
    apiClient.get<CompanyApplication>(`/api/company-applications/${id}`).then((r) => r.data),

  getAll: () =>
    apiClient.get<CompanyApplication[]>('/api/company-applications').then((r) => r.data),

  approve: (id: number | string) =>
    apiClient.put(`/api/company-applications/${id}/approve`),

  reject: (id: number | string, reason: string) =>
    apiClient.put(`/api/company-applications/${id}/reject`, { reason }),
};
