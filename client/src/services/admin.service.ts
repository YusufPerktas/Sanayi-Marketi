import apiClient from './api/client';
import { Company } from './company.service';

export const adminService = {
  mergeCompanies: (primaryId: number, secondaryId: number) =>
    apiClient.post(`/api/admin/companies/${primaryId}/merge/${secondaryId}`),

  changeCompanyStatus: (companyId: number, status: 'ACTIVE' | 'INACTIVE' | 'MERGED') =>
    apiClient.put<Company>(`/api/admin/companies/${companyId}/status`, { status }).then((r) => r.data),
};
