'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormLabel,
  OutlinedInput,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import EditIcon from '@mui/icons-material/Edit';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '@/components/layout/AdminLayout';
import { companyService, Company } from '@/services/company.service';
import { adminService, AdminCompanyUpdateRequest } from '@/services/admin.service';
import { ROUTES } from '@/utils/constants';
import { colors } from '@/utils/colors';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  ACTIVE: { label: 'Aktif', color: '#166534', bg: '#dcfce7' },
  INACTIVE: { label: 'Pasif', color: '#92400e', bg: '#fef3c7' },
  MERGED: { label: 'Birleştirildi', color: colors.outline, bg: colors.surfaceContainerHigh },
};

const PAGE_SIZE = 20;
const labelSx = { fontSize: '0.75rem', fontWeight: 600, color: colors.onSurfaceVariant, mb: 0.5 };
const inputSx = { bgcolor: colors.surfaceBright, '& fieldset': { borderColor: 'rgba(195,198,215,0.3)' } };

// ── Edit Dialog ───────────────────────────────────────────────────

interface EditDialogProps {
  company: Company;
  onClose: () => void;
}

function EditDialog({ company, onClose }: EditDialogProps) {
  const qc = useQueryClient();
  const [form, setForm] = useState<AdminCompanyUpdateRequest>({
    companyName: company.companyName,
    description: company.description ?? '',
    city: company.city ?? '',
    district: company.district ?? '',
    phone: company.phone ?? '',
    email: company.email ?? '',
    website: company.website ?? '',
    fullAddress: company.fullAddress ?? '',
  });
  const [error, setError] = useState<string | null>(null);

  const updateMutation = useMutation({
    mutationFn: () => adminService.adminUpdateCompany(company.id, form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-companies-list'] });
      qc.invalidateQueries({ queryKey: ['admin-companies-search'] });
      onClose();
    },
    onError: () => setError('Güncelleme başarısız'),
  });

  function field(key: keyof AdminCompanyUpdateRequest) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((p) => ({ ...p, [key]: e.target.value }));
  }

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontFamily: 'var(--font-manrope)', fontWeight: 700 }}>
        Firma Düzenle
        <Typography sx={{ fontSize: '0.8rem', color: colors.onSurfaceVariant, fontWeight: 400, mt: 0.25 }}>
          #{company.id} — {company.companyName}
        </Typography>
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
        {error && <Alert severity="error">{error}</Alert>}

        <FormControl>
          <FormLabel sx={labelSx}>Firma Adı</FormLabel>
          <OutlinedInput size="small" value={form.companyName} onChange={field('companyName')} sx={inputSx} />
        </FormControl>

        <FormControl>
          <FormLabel sx={labelSx}>Açıklama</FormLabel>
          <OutlinedInput size="small" multiline rows={3} value={form.description} onChange={field('description')} sx={inputSx} />
        </FormControl>

        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
          <FormControl>
            <FormLabel sx={labelSx}>Şehir</FormLabel>
            <OutlinedInput size="small" value={form.city} onChange={field('city')} sx={inputSx} />
          </FormControl>
          <FormControl>
            <FormLabel sx={labelSx}>İlçe</FormLabel>
            <OutlinedInput size="small" value={form.district} onChange={field('district')} sx={inputSx} />
          </FormControl>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
          <FormControl>
            <FormLabel sx={labelSx}>Telefon</FormLabel>
            <OutlinedInput size="small" value={form.phone} onChange={field('phone')} sx={inputSx} />
          </FormControl>
          <FormControl>
            <FormLabel sx={labelSx}>E-posta</FormLabel>
            <OutlinedInput size="small" value={form.email} onChange={field('email')} sx={inputSx} />
          </FormControl>
        </Box>

        <FormControl>
          <FormLabel sx={labelSx}>Web Sitesi</FormLabel>
          <OutlinedInput size="small" value={form.website} onChange={field('website')} sx={inputSx} />
        </FormControl>

        <FormControl>
          <FormLabel sx={labelSx}>Tam Adres</FormLabel>
          <OutlinedInput size="small" multiline rows={2} value={form.fullAddress} onChange={field('fullAddress')} sx={inputSx} />
        </FormControl>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={updateMutation.isPending}>İptal</Button>
        <Button
          variant="contained"
          onClick={() => updateMutation.mutate()}
          disabled={updateMutation.isPending}
          startIcon={updateMutation.isPending ? <CircularProgress size={14} color="inherit" /> : undefined}
        >
          {updateMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Company Table Row ─────────────────────────────────────────────

function CompanyRow({ company, isOwned, onEdit }: { company: Company; isOwned: boolean; onEdit: (c: Company) => void }) {
  const st = STATUS_CONFIG[company.status] ?? STATUS_CONFIG.INACTIVE;
  return (
    <TableRow sx={{ '&:hover': { bgcolor: `${colors.surfaceContainerLow}50` }, borderBottom: `1px solid rgba(195,198,215,0.1)` }}>
      <TableCell sx={{ fontWeight: 600, color: colors.onSurface, fontSize: '0.875rem', width: 60 }}>
        {company.id}
      </TableCell>
      <TableCell sx={{ maxWidth: 240 }}>
        <Typography sx={{ fontWeight: 600, color: colors.onSurface, fontSize: '0.875rem' }}>
          {company.companyName}
        </Typography>
        {!isOwned && (
          <Tooltip title="Bu firmaya bağlı firma kullanıcısı yok (sahipsiz)">
            <Chip
              icon={<PersonOffIcon sx={{ fontSize: '0.7rem !important' }} />}
              label="Sahipsiz"
              size="small"
              sx={{ mt: 0.5, height: 18, fontSize: '0.6rem', bgcolor: '#fef3c7', color: '#92400e' }}
            />
          </Tooltip>
        )}
      </TableCell>
      <TableCell sx={{ color: colors.onSurfaceVariant, fontSize: '0.875rem' }}>
        {company.city ?? '—'}{company.district ? `, ${company.district}` : ''}
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
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            size="small"
            startIcon={<EditIcon sx={{ fontSize: '0.85rem !important' }} />}
            onClick={() => onEdit(company)}
            sx={{ fontSize: '0.75rem', color: colors.onSurfaceVariant, p: 0.5, minWidth: 0 }}
          >
            Düzenle
          </Button>
          <Button
            component={Link}
            href={ROUTES.COMPANY_DETAIL(company.id)}
            target="_blank"
            size="small"
            endIcon={<OpenInNewIcon sx={{ fontSize: '0.85rem !important' }} />}
            sx={{ color: colors.primary, fontWeight: 600, fontSize: '0.8rem', p: 0.5, minWidth: 0 }}
          >
            Gör
          </Button>
        </Box>
      </TableCell>
    </TableRow>
  );
}

// ── Page ──────────────────────────────────────────────────────────

export default function AdminCompaniesPage() {
  const [page, setPage] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [editTarget, setEditTarget] = useState<Company | null>(null);

  const { data: pagedData, isLoading: loadingList } = useQuery({
    queryKey: ['admin-companies-list', page],
    queryFn: () => companyService.getAll({ page, size: PAGE_SIZE }),
    enabled: !activeSearch,
  });

  const { data: searchResults, isLoading: loadingSearch } = useQuery({
    queryKey: ['admin-companies-search', activeSearch],
    queryFn: () => companyService.search(activeSearch),
    enabled: !!activeSearch,
  });

  const { data: ownedIds = [] } = useQuery({
    queryKey: ['admin-owned-company-ids'],
    queryFn: adminService.getOwnedCompanyIds,
  });

  const ownedSet = new Set(ownedIds);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setActiveSearch(searchInput.trim());
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
  const unownedCount = companies.filter((c) => !ownedSet.has(c.id)).length;

  return (
    <AdminLayout title="Firmalar">
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <Typography sx={{ color: colors.onSurfaceVariant, fontSize: '0.9rem' }}>
          {activeSearch ? (
            <>
              <strong style={{ color: colors.onSurface }}>&quot;{activeSearch}&quot;</strong> için{' '}
              {isLoading ? '...' : totalElements} sonuç —{' '}
              <Box component="span" onClick={handleClear} sx={{ color: colors.primary, cursor: 'pointer', fontWeight: 700 }}>
                Temizle
              </Box>
            </>
          ) : (
            <>Toplam <strong style={{ color: colors.onSurface }}>{isLoading ? '...' : totalElements ?? '...'}</strong> firma</>
          )}
        </Typography>
        {unownedCount > 0 && (
          <Chip
            icon={<PersonOffIcon sx={{ fontSize: '0.8rem !important' }} />}
            label={`${unownedCount} sahipsiz`}
            size="small"
            sx={{ bgcolor: '#fef3c7', color: '#92400e', fontSize: '0.75rem' }}
          />
        )}
      </Box>

      {/* Search */}
      <Box
        component="form"
        onSubmit={handleSearch}
        sx={{
          display: 'flex', alignItems: 'center', gap: 1.5,
          bgcolor: colors.surfaceContainerLow, border: `1px solid rgba(195,198,215,0.15)`,
          borderRadius: 2, px: 2, mb: 4, maxWidth: 440,
        }}
      >
        <SearchIcon sx={{ color: colors.outline, flexShrink: 0 }} />
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Firma adı ara... (Enter ile ara)"
          style={{
            border: 'none', outline: 'none', background: 'transparent',
            fontSize: '0.875rem', color: colors.onSurface, padding: '10px 0', width: '100%',
            fontFamily: 'var(--font-inter)',
          }}
        />
      </Box>

      {/* Table */}
      <Box sx={{ bgcolor: colors.surfaceContainerLowest, borderRadius: 3, overflow: 'hidden', border: `1px solid rgba(195,198,215,0.15)` }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
        ) : companies.length === 0 ? (
          <Box sx={{ py: 8, textAlign: 'center', color: colors.onSurfaceVariant }}>
            <Typography>Firma bulunamadı</Typography>
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: colors.surface }}>
                {['#', 'Firma Adı', 'Şehir', 'Telefon', 'Durum', 'Kayıt Tarihi', 'İşlemler'].map((h) => (
                  <TableCell key={h} sx={{ fontWeight: 600, color: colors.onSurfaceVariant, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: `1px solid rgba(195,198,215,0.15)` }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {companies.map((c) => (
                <CompanyRow
                  key={c.id}
                  company={c}
                  isOwned={ownedSet.has(c.id)}
                  onEdit={(co) => setEditTarget(co)}
                />
              ))}
            </TableBody>
          </Table>
        )}
      </Box>

      {/* Pagination */}
      {!activeSearch && totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mt: 4 }}>
          <Button disabled={page === 0} onClick={() => setPage((p) => p - 1)} variant="outlined" size="small" sx={{ borderColor: 'rgba(195,198,215,0.3)', color: colors.onSurfaceVariant }}>
            Önceki
          </Button>
          <Typography sx={{ fontSize: '0.875rem', color: colors.onSurfaceVariant }}>{page + 1} / {totalPages}</Typography>
          <Button disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)} variant="outlined" size="small" sx={{ borderColor: 'rgba(195,198,215,0.3)', color: colors.onSurfaceVariant }}>
            Sonraki
          </Button>
        </Box>
      )}

      {/* Edit dialog */}
      {editTarget && <EditDialog company={editTarget} onClose={() => setEditTarget(null)} />}
    </AdminLayout>
  );
}
