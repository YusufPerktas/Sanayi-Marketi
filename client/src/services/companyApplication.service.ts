import apiClient from './api/client';

export interface CompanyApplication {
  id: number;
  userId: number;
  userEmail: string | null;
  applicationType: 'MANUAL_NEW' | 'MANUAL_EXISTING' | 'AUTO_IMPORTED';
  proposedCompanyName: string | null;
  description: string | null;
  phone: string | null;
  companyEmail: string | null;
  website: string | null;
  city: string | null;
  district: string | null;
  fullAddress: string | null;
  targetCompanyId: number | null;
  targetCompanyName: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason: string | null;
  createdAt: string;
}

export interface CompanyApplicationFormData {
  proposedCompanyName: string;
  description?: string;
  phone?: string;
  companyEmail?: string;
  website?: string;
  city?: string;
  district?: string;
  fullAddress?: string;
}

export interface RegisterCompanyRequest extends CompanyApplicationFormData {
  email: string;
  password: string;
  applicationType: 'MANUAL_NEW' | 'MANUAL_EXISTING';
  targetCompanyId?: number | null;
}

export const companyApplicationService = {
  registerCompany: (data: RegisterCompanyRequest) =>
    apiClient
      .post<{ accessToken: string; userId: number; role: string }>(
        '/api/auth/register-company',
        data,
      )
      .then((r) => r.data),

  getMyApplication: () =>
    apiClient.get<CompanyApplication>('/api/company-applications/mine').then((r) => r.data),

  reapply: (data: CompanyApplicationFormData) =>
    apiClient
      .post<CompanyApplication>('/api/company-applications/reapply', data)
      .then((r) => r.data),

  getById: (id: number | string) =>
    apiClient.get<CompanyApplication>(`/api/company-applications/${id}`).then((r) => r.data),

  getAll: () =>
    apiClient.get<CompanyApplication[]>('/api/company-applications').then((r) => r.data),

  approve: (id: number | string) =>
    apiClient.put(`/api/company-applications/${id}/approve`),

  reject: (id: number | string, reason: string) =>
    apiClient.put(`/api/company-applications/${id}/reject`, { reason }),
};
