import apiClient from './api/client';
import { Company } from './company.service';
import type { PageResponse } from './company.service';

export interface AdminMaterial {
  id: number;
  materialName: string;
  normalizedName: string | null;
  parentMaterialId: number | null;
  parentMaterialName: string | null;
  usageCount: number;
  createdAt: string | null;
  createdByCompanyId: number | null;
  createdByCompanyName: string | null;
  userCreated: boolean;
  suspicious: boolean;
}

export interface AdminMaterialStats {
  total: number;
  userCreated: number;
  unused: number;
  suspicious: number;
}

export type AdminMaterialFilter = 'ALL' | 'USER_CREATED' | 'UNUSED';

export const adminService = {
  mergeCompanies: (primaryId: number, secondaryId: number) =>
    apiClient.post(`/api/admin/companies/${primaryId}/merge/${secondaryId}`),

  changeCompanyStatus: (companyId: number, status: 'ACTIVE' | 'INACTIVE' | 'MERGED') =>
    apiClient.put<Company>(`/api/admin/companies/${companyId}/status`, { status }).then((r) => r.data),

  getMaterials: (params: { filter?: AdminMaterialFilter; search?: string; page?: number; size?: number }) =>
    apiClient.get<PageResponse<AdminMaterial>>('/api/admin/materials', { params }).then((r) => r.data),

  getMaterialStats: () =>
    apiClient.get<AdminMaterialStats>('/api/admin/materials/stats').then((r) => r.data),

  updateMaterial: (id: number, materialName: string, parentMaterialId?: number | null) =>
    apiClient.put<AdminMaterial>(`/api/admin/materials/${id}`, { materialName, parentMaterialId }).then((r) => r.data),

  deleteMaterial: (id: number) =>
    apiClient.delete(`/api/admin/materials/${id}`),

  mergeMaterials: (targetId: number, sourceId: number) =>
    apiClient.post(`/api/admin/materials/${targetId}/merge/${sourceId}`),
};
