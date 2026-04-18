'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useQuery } from '@tanstack/react-query';
import AdminLayout from '@/components/layout/AdminLayout';
import { companyService, Company } from '@/services/company.service';
import { ROUTES } from '@/utils/constants';
import { colors } from '@/utils/colors';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  ACTIVE: { label: 'Aktif', color: '#166534', bg: '#dcfce7' },
  INACTIVE: { label: 'Pasif', color: '#92400e', bg: '#fef3c7' },
  MERGED: { label: 'Birleştirildi', color: colors.outline, bg: colors.surfaceContainerHigh },
};

const PAGE_SIZE = 20;

function CompanyTable({ companies }: { companies: Company[] }) {
  if (companies.length === 0) {
    return (
      <TableRow>
        <TableCell colSpan={7} align="center" sx={{ py: 8, color: colors.onSurfaceVariant }}>
          Firma bulunamadı
        </TableCell>
      </TableRow>
    );
  }
  return (
    <>
      {companies.map((company) => {
        const st = STATUS_CONFIG[company.status] ?? STATUS_CONFIG.INACTIVE;
        return (
          <TableRow
            key={company.id}
            sx={{ '&:hover': { bgcolor: `${colors.surfaceContainerLow}50` }, borderBottom: `1px solid rgba(195,198,215,0.1)` }}
          >
            <TableCell sx={{ fontWeight: 600, color: colors.onSurface, fontSize: '0.875rem', width: 60 }}>
              {company.id}
            </TableCell>
            <TableCell sx={{ fontWeight: 600, color: colors.onSurface, maxWidth: 220 }}>
              {company.companyName}
            </TableCell>
            <TableCell sx={{ color: colors.onSurfaceVariant, fontSize: '0.875rem' }}>
              {company.city ?? '—'}
              {company.district ? `, ${company.district}` : ''}
            </TableCell>
            <TableCell sx={{ color: colors.onSurfaceVariant, fontSize: '0.875rem' }}>
              {company.phone ?? '—'}
            </TableCell>
            <TableCell>
              <Chip label={st.label} size="small" sx={{ bgcolor: st.bg, color: st.color, fontWeight: 700, fontSize: '0.7rem', height: 22 }} />
            </TableCell>
            <TableCell sx={{ color: colors.onSurfaceVariant, fontSize: '0.875rem' }}>
              {new Date(company.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}
            </TableCell>
            <TableCell>
              <Button
                component={Link}
                href={ROUTES.COMPANY_DETAIL(company.id)}
                target="_blank"
                size="small"
                endIcon={<OpenInNewIcon sx={{ fontSize: '0.85rem !important' }} />}
                sx={{ color: colors.primary, fontWeight: 600, fontSize: '0.8rem', p: 0, minWidth: 0 }}
              >
                Görüntüle
              </Button>
            </TableCell>
          </TableRow>
        );
      })}
    </>
  );
}

export default function AdminCompaniesPage() {
  const [page, setPage] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [activeSearch, setActiveSearch] = useState('');

  // Paginated list (no search active)
  const { data: pagedData, isLoading: loadingList } = useQuery({
    queryKey: ['admin-companies-list', page],
    queryFn: () => companyService.getAll({ page, size: PAGE_SIZE }),
    enabled: !activeSearch,
  });

  // Search results
  const { data: searchResults, isLoading: loadingSearch } = useQuery({
    queryKey: ['admin-companies-search', activeSearch],
    queryFn: () => companyService.search(activeSearch),
    enabled: !!activeSearch,
  });

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = searchInput.trim();
    setActiveSearch(trimmed);
    setPage(0);
  }

  function handleClear() {
    setSearchInput('');
    setActiveSearch('');
  }

  const isLoading = activeSearch ? loadingSearch : loadingList;
  const companies: Company[] = activeSearch ? (searchResults ?? []) : (pagedData?.content ?? []);
  const totalElements = activeSearch ? searchResults?.length : pagedData?.totalElements;
  const totalPages = pagedData?.totalPages ?? 0;

  return (
    <AdminLayout title="Firmalar">
      <Box sx={{ mb: 3 }}>
        <Typography sx={{ color: colors.onSurfaceVariant, fontSize: '0.9rem' }}>
          {activeSearch ? (
            <>
              <strong style={{ color: colors.onSurface }}>&quot;{activeSearch}&quot;</strong> için{' '}
              {isLoading ? '...' : totalElements} sonuç bulundu —{' '}
              <Box component="span" onClick={handleClear} sx={{ color: colors.primary, cursor: 'pointer', fontWeight: 700 }}>
                Temizle
              </Box>
            </>
          ) : (
            <>
              Sistemdeki tüm firmalar — toplam{' '}
              <strong style={{ color: colors.onSurface }}>{isLoading ? '...' : totalElements ?? '...'}</strong> firma
            </>
          )}
        </Typography>
      </Box>

      {/* Search */}
      <Box
        component="form"
        onSubmit={handleSearch}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          bgcolor: colors.surfaceContainerLow,
          border: `1px solid rgba(195,198,215,0.15)`,
          borderRadius: 2,
          px: 2,
          mb: 4,
          maxWidth: 440,
        }}
      >
        <SearchIcon sx={{ color: colors.outline, flexShrink: 0 }} />
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Firma adı ara... (Enter ile ara)"
          style={{
            border: 'none',
            outline: 'none',
            background: 'transparent',
            fontSize: '0.875rem',
            color: colors.onSurface,
            padding: '10px 0',
            width: '100%',
            fontFamily: 'var(--font-inter)',
          }}
        />
      </Box>

      {/* Table */}
      <Box sx={{ bgcolor: colors.surfaceContainerLowest, borderRadius: 3, overflow: 'hidden', border: `1px solid rgba(195,198,215,0.15)` }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: colors.surface }}>
                {['#', 'Firma Adı', 'Şehir', 'Telefon', 'Durum', 'Kayıt Tarihi', ''].map((h) => (
                  <TableCell
                    key={h}
                    sx={{
                      fontWeight: 600,
                      color: colors.onSurfaceVariant,
                      fontSize: '0.75rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      borderBottom: `1px solid rgba(195,198,215,0.15)`,
                    }}
                  >
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              <CompanyTable companies={companies} />
            </TableBody>
          </Table>
        )}
      </Box>

      {/* Pagination — only in list mode */}
      {!activeSearch && totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mt: 4 }}>
          <Button
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
            variant="outlined"
            size="small"
            sx={{ borderColor: 'rgba(195,198,215,0.3)', color: colors.onSurfaceVariant }}
          >
            Önceki
          </Button>
          <Typography sx={{ fontSize: '0.875rem', color: colors.onSurfaceVariant }}>
            {page + 1} / {totalPages}
          </Typography>
          <Button
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
            variant="outlined"
            size="small"
            sx={{ borderColor: 'rgba(195,198,215,0.3)', color: colors.onSurfaceVariant }}
          >
            Sonraki
          </Button>
        </Box>
      )}
    </AdminLayout>
  );
}
