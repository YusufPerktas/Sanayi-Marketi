import apiClient from './api/client';
import type { PageResponse } from './company.service';

export interface Material {
  id: number;
  materialName: string;
  normalizedName: string;
  parentMaterialId: number | null;
  parentMaterialName: string | null;
}

export interface MaterialCompany {
  id: number;
  companyId: number;
  companyName: string;
  companyCity: string | null;
  companyDistrict: string | null;
  companyLogoUrl: string | null;
  materialId: number;
  materialName: string;
  role: 'PRODUCER' | 'SELLER' | 'BOTH';
  price: number | null;
  unit: string | null;
}

export const materialService = {
  getAll: (params?: { page?: number; size?: number }) =>
    apiClient.get<PageResponse<Material>>('/api/materials', { params }).then((r) => r.data),

  getById: (id: number | string) =>
    apiClient.get<Material>(`/api/materials/${id}`).then((r) => r.data),

  search: (name: string) =>
    apiClient.get<Material[]>('/api/materials/search', { params: { name } }).then((r) => r.data),

  getSuppliers: (id: number | string) =>
    apiClient.get<MaterialCompany[]>(`/api/materials/${id}/suppliers`).then((r) => r.data),

  create: (materialName: string, parentMaterialId?: number) =>
    apiClient.post<Material>('/api/materials', { materialName, parentMaterialId }).then((r) => r.data),
};
