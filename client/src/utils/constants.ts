export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';

export const ROUTES = {
  HOME: '/',
  SEARCH: '/search',
  LOGIN: '/login',
  REGISTER: '/register',
  COMPANY_DETAIL: (id: number | string) => `/companies/${id}`,

  DASHBOARD: '/dashboard',
  FAVORITES: '/favorites',

  COMPANY_MANAGE: '/company/manage',
  COMPANY_EDIT: '/company/edit',
  COMPANY_MATERIALS: '/company/materials',
  COMPANY_CATALOG: '/company/catalog',

  ADMIN: '/admin',
  ADMIN_APPROVALS: '/admin/approvals',
  ADMIN_DUPLICATES: '/admin/duplicates',
  ADMIN_SCRAPER: '/admin/scraper',
  ADMIN_STATISTICS: '/admin/statistics',
} as const;

export const USER_ROLES = {
  BASIC_USER: 'BASIC_USER',
  COMPANY_USER: 'COMPANY_USER',
  ADMIN: 'ADMIN',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];
