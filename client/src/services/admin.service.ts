import apiClient from './api/client';
import { Company } from './company.service';
import type { PageResponse } from './company.service';

// ── Scraper types ──────────────────────────────────────────────────

export interface ScraperRunRequest {
  companyName: string;
  website: string;
  sectors: string[];
}

export interface ScraperResult {
  companyName: string | null;
  website: string | null;
  sectors: string[];
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED' | 'ERROR';
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  district: string | null;
  logoUrl: string | null;
  description: string | null;
  catalogCount: number;
  catalogFiles: string[];
  imported: boolean;
  companyId: number | null;
  scrapeDate: string | null;
  errorMessage: string | null;
}

export interface ScraperImportRequest {
  companyName: string;
  website: string | null;
  sectors: string[];
  phone: string | null;
  email: string | null;
  city: string | null;
  district: string | null;
  address: string | null;
  catalogFile: string | null;
  logoUrl: string | null;
  description: string | null;
}

export interface ScraperImportResult {
  companyId: number;
  applicationId: number;
}

export interface MaterialImportItem {
  materialName: string;
  companyId?: number | null;
}

export interface MaterialImportResult {
  created: number;
  duplicates: string[];
  errors: string[];
}

export interface DuplicatePair {
  companyA: Company;
  companyB: Company;
  similarityPercent: number;
}

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

export type AdminMaterialFilter = 'ALL' | 'USER_CREATED' | 'UNUSED' | 'SUSPICIOUS';

// ── Catalog analysis types ─────────────────────────────────────────

export interface CatalogAnalyzeRequest {
  companyName: string;
  testDir?: number | null;
}

export interface MaterialCandidate {
  name: string;
  confidence: number;
  sourcePage: number;
  category: string | null;
}

export interface MaterialsCandidates {
  companyName: string;
  catalogFile: string | null;
  analyzedAt: string | null;
  extractionMethod: string;
  candidates: MaterialCandidate[];
  totalCandidates: number;
  status: 'PENDING_REVIEW' | 'REVIEWED' | 'NOT_ANALYZED';
}

// ── Company update (admin) ─────────────────────────────────────────

export interface AdminCompanyUpdateRequest {
  companyName?: string;
  description?: string;
  country?: string;
  city?: string;
  district?: string;
  fullAddress?: string;
  phone?: string;
  email?: string;
  website?: string;
  latitude?: number | null;
  longitude?: number | null;
  googleMapsEmbedUrl?: string | null;
}

export const adminService = {
  getCompanyDuplicates: () =>
    apiClient.get<DuplicatePair[]>('/api/admin/companies/duplicates').then((r) => r.data),

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

  // ── Scraper ────────────────────────────────────────────────────

  runScraper: (request: ScraperRunRequest, signal?: AbortSignal) =>
    apiClient.post<ScraperResult>('/api/admin/scraper/run', request, { timeout: 660_000, signal }).then((r) => r.data),

  getScraperResults: () =>
    apiClient.get<ScraperResult[]>('/api/admin/scraper/results').then((r) => r.data),

  importCompany: (request: ScraperImportRequest) =>
    apiClient.post<ScraperImportResult>('/api/admin/scraper/companies/import', request).then((r) => r.data),

  importMaterials: (items: MaterialImportItem[]) =>
    apiClient.post<MaterialImportResult>('/api/admin/scraper/materials/import', items).then((r) => r.data),

  analyzeCatalog: (request: CatalogAnalyzeRequest) =>
    apiClient.post<MaterialsCandidates>('/api/admin/scraper/catalogs/analyze', request, { timeout: 180_000 }).then((r) => r.data),

  getCatalogCandidates: (companyName: string, testDir?: number) =>
    apiClient
      .get<MaterialsCandidates>(`/api/admin/scraper/catalogs/candidates/${encodeURIComponent(companyName)}`, {
        params: testDir != null ? { testDir } : {},
      })
      .then((r) => r.data),

  adminUpdateCompany: (id: number, data: AdminCompanyUpdateRequest) =>
    apiClient.put<Company>(`/api/admin/companies/${id}`, data).then((r) => r.data),

  getOwnedCompanyIds: () =>
    apiClient.get<number[]>('/api/admin/companies/owned-ids').then((r) => r.data),
};
