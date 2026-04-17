import apiClient from './api/client';
import type { PageResponse, Company } from './company.service';

export interface Material {
  id: number;
  name: string;
  normalizedName: string;
  parentMaterialId: number | null;
  createdAt: string;
}

export interface MaterialCompany {
  company: Company;
  role: 'PRODUCER' | 'SELLER' | 'BOTH';
  price: number | null;
}

export const materialService = {
  getAll: (params?: { page?: number; size?: number }) =>
    apiClient.get<PageResponse<Material>>('/api/materials', { params }).then((r) => r.data),

  getById: (id: number | string) =>
    apiClient.get<Material>(`/api/materials/${id}`).then((r) => r.data),

  search: (name: string) =>
    apiClient.get<Material[]>('/api/materials/search', { params: { name } }).then((r) => r.data),

  getCompanies: (id: number | string) =>
    apiClient.get<MaterialCompany[]>(`/api/materials/${id}/companies`).then((r) => r.data),
};
