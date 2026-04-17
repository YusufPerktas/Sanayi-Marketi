import apiClient from './api/client';
import type { Company } from './company.service';
import type { Material } from './material.service';

export const favoriteService = {
  getCompanies: () =>
    apiClient.get<Company[]>('/api/favorites/companies').then((r) => r.data),

  addCompany: (id: number | string) =>
    apiClient.post(`/api/favorites/companies/${id}`),

  removeCompany: (id: number | string) =>
    apiClient.delete(`/api/favorites/companies/${id}`),

  getMaterials: () =>
    apiClient.get<Material[]>('/api/favorites/materials').then((r) => r.data),

  addMaterial: (id: number | string) =>
    apiClient.post(`/api/favorites/materials/${id}`),

  removeMaterial: (id: number | string) =>
    apiClient.delete(`/api/favorites/materials/${id}`),
};
