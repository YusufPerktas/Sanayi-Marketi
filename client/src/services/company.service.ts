import apiClient from './api/client';

export interface Company {
  id: number;
  companyName: string;
  description: string | null;
  country: string | null;
  city: string | null;
  district: string | null;
  fullAddress: string | null;
  latitude: number | null;
  longitude: number | null;
  googleMapsEmbedUrl: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  logoUrl: string | null;
  catalogFileUrl: string | null;
  catalogFileType: 'PDF' | 'DOC' | 'DOCX' | null;
  status: 'ACTIVE' | 'INACTIVE' | 'MERGED';
  createdAt: string;
}

export interface CompanyMaterial {
  id: number;
  companyId: number;
  materialId: number;
  materialName: string;
  role: 'PRODUCER' | 'SELLER' | 'BOTH';
  price: number | null;
  unit: string | null;
  createdAt: string;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface CompanyUpdateRequest {
  companyName?: string;
  description?: string;
  country?: string;
  city?: string;
  district?: string;
  fullAddress?: string;
  phone?: string;
  email?: string;
  website?: string;
  googleMapsEmbedUrl?: string;
}

export const companyService = {
  getAll: (params?: { page?: number; size?: number; city?: string; q?: string }) =>
    apiClient.get<PageResponse<Company>>('/api/companies', { params }).then((r) => r.data),

  getById: (id: number | string) =>
    apiClient.get<Company>(`/api/companies/${id}`).then((r) => r.data),

  getMe: () =>
    apiClient.get<Company>('/api/company-users/me').then((r) => r.data),

  search: (name: string) =>
    apiClient.get<Company[]>('/api/companies/search', { params: { name } }).then((r) => r.data),

  getMaterials: (companyId: number | string) =>
    apiClient.get<CompanyMaterial[]>(`/api/materials/companies/${companyId}`).then((r) => r.data),

  update: (id: number | string, data: CompanyUpdateRequest) =>
    apiClient.put<Company>(`/api/companies/${id}`, data).then((r) => r.data),

  addMaterial: (
    companyId: number | string,
    data: { materialId: number; role: 'PRODUCER' | 'SELLER' | 'BOTH'; price?: number; unit?: string },
  ) =>
    apiClient
      .post<CompanyMaterial>(`/api/materials/companies/${companyId}`, data)
      .then((r) => r.data),

  updateMaterial: (
    id: number | string,
    data: { role?: 'PRODUCER' | 'SELLER' | 'BOTH'; price?: number; unit?: string },
  ) =>
    apiClient
      .put<CompanyMaterial>(`/api/materials/companies/materials/${id}`, data)
      .then((r) => r.data),

  deleteMaterial: (id: number | string) =>
    apiClient.delete(`/api/materials/companies/materials/${id}`),

  uploadLogo: (companyId: number | string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return apiClient.post<Company>(`/api/companies/${companyId}/logo`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data);
  },

  deleteLogo: (companyId: number | string) =>
    apiClient.delete<Company>(`/api/companies/${companyId}/logo`).then((r) => r.data),

  uploadCatalog: (companyId: number | string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return apiClient.post<Company>(`/api/companies/${companyId}/catalog`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data);
  },

  deleteCatalog: (companyId: number | string) =>
    apiClient.delete<Company>(`/api/companies/${companyId}/catalog`).then((r) => r.data),
};
