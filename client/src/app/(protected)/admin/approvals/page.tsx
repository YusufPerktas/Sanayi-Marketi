'use client';

import React, { useState } from 'react';
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
  OutlinedInput,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '@/components/layout/AdminLayout';
import { companyApplicationService, CompanyApplication } from '@/services/companyApplication.service';
import { colors } from '@/utils/colors';

type Filter = 'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: 'Beklemede', color: '#92400e', bg: '#fef3c7' },
  APPROVED: { label: 'Onaylandı', color: '#166534', bg: '#dcfce7' },
  REJECTED: { label: 'Reddedildi', color: colors.error, bg: colors.errorContainer },
};

const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  MANUAL_NEW: { label: 'Yeni Kayıt', color: colors.primary, bg: colors.primaryFixed },
  MANUAL_EXISTING: { label: 'Mevcut', color: colors.secondary, bg: colors.secondaryFixed },
  AUTO_IMPORTED: { label: 'Otomatik', color: colors.tertiary, bg: colors.tertiaryFixed },
};

export default function AdminApprovalsPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<Filter>('PENDING');
  const [search, setSearch] = useState('');
  const [rejectTarget, setRejectTarget] = useState<CompanyApplication | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [snack, setSnack] = useState<string | null>(null);

  const { data: applications, isLoading } = useQuery({
    queryKey: ['admin-applications'],
    queryFn: companyApplicationService.getAll,
  });

  const approveMutation = useMutation({
    mutationFn: companyApplicationService.approve,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-applications'] });
      setSnack('Başvuru onaylandı');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      companyApplicationService.reject(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-applications'] });
      setRejectTarget(null);
      setRejectReason('');
      setSnack('Başvuru reddedildi');
    },
  });

  const counts = {
    PENDING: applications?.filter((a) => a.status === 'PENDING').length ?? 0,
    APPROVED: applications?.filter((a) => a.status === 'APPROVED').length ?? 0,
    REJECTED: applications?.filter((a) => a.status === 'REJECTED').length ?? 0,
    ALL: applications?.length ?? 0,
  };

  const filtered = (applications ?? []).filter((a) => {
    const matchesFilter = filter === 'ALL' || a.status === filter;
    const name = a.proposedCompanyName?.toLowerCase() ?? '';
    const matchesSearch = !search || name.includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const TABS: { key: Filter; label: string }[] = [
    { key: 'PENDING', label: 'Bekleyen' },
    { key: 'APPROVED', label: 'Onaylanan' },
    { key: 'REJECTED', label: 'Reddedilen' },
    { key: 'ALL', label: 'Tümü' },
  ];

  return (
    <AdminLayout title="Başvuru Onayları">
      <Box sx={{ mb: 3 }}>
        <Typography sx={{ color: colors.onSurfaceVariant, fontSize: '0.9rem' }}>
          Sistem üzerindeki yeni kayıt ve talep başvurularını yönetin.
        </Typography>
      </Box>

      {/* Search */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, bgcolor: colors.surfaceContainerLow, border: `1px solid rgba(195,198,215,0.15)`, borderRadius: 2, px: 2, mb: 4, maxWidth: 400 }}>
        <SearchIcon sx={{ color: colors.outline }} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Firma veya email ara..."
          style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '0.875rem', color: colors.onSurface, padding: '10px 0', width: '100%', fontFamily: 'var(--font-inter)' }}
        />
      </Box>

      {/* Tab filter */}
      <Box sx={{ display: 'flex', gap: 1, mb: 5, bgcolor: colors.surfaceContainerLow, p: 0.75, borderRadius: 2, width: 'max-content' }}>
        {TABS.map((t) => (
          <Button
            key={t.key}
            onClick={() => setFilter(t.key)}
            sx={{
              px: 3,
              py: 1,
              borderRadius: 1.5,
              fontWeight: 700,
              fontSize: '0.875rem',
              bgcolor: filter === t.key ? colors.surfaceContainerHighest : 'transparent',
              color: filter === t.key ? colors.primary : colors.onSurfaceVariant,
              boxShadow: filter === t.key ? colors.shadowSm : 'none',
              gap: 1,
              '&:hover': { bgcolor: filter === t.key ? colors.surfaceContainerHighest : `${colors.surfaceContainerHigh}50` },
            }}
          >
            {t.label}
            {counts[t.key] > 0 && (
              <Box component="span" sx={{ width: 20, height: 20, bgcolor: filter === t.key ? colors.primary : colors.outline, color: '#fff', borderRadius: '50%', fontSize: '0.7rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                {counts[t.key]}
              </Box>
            )}
          </Button>
        ))}
      </Box>

      {/* Table */}
      <Box sx={{ bgcolor: colors.surfaceContainerLowest, borderRadius: 3, overflow: 'hidden', border: `1px solid rgba(195,198,215,0.15)` }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: colors.surface }}>
                {['#', 'Firma Adı', 'Tür', 'Tarih', 'Durum', 'İşlemler'].map((h) => (
                  <TableCell key={h} sx={{ fontWeight: 600, color: colors.onSurfaceVariant, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: `1px solid rgba(195,198,215,0.15)` }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 8, color: colors.onSurfaceVariant }}>
                    Başvuru bulunamadı
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((app) => {
                  const st = STATUS_CONFIG[app.status] ?? STATUS_CONFIG.PENDING;
                  const tp = TYPE_CONFIG[app.applicationType] ?? TYPE_CONFIG.MANUAL_NEW;
                  return (
                    <TableRow key={app.id} sx={{ '&:hover': { bgcolor: `${colors.surfaceContainerLow}50` }, borderBottom: `1px solid rgba(195,198,215,0.1)` }}>
                      <TableCell sx={{ fontWeight: 600, color: colors.onSurface, fontSize: '0.875rem' }}>#{app.id}</TableCell>
                      <TableCell sx={{ fontWeight: 500, color: colors.onSurface }}>{app.proposedCompanyName ?? `Başvuru #${app.id}`}</TableCell>
                      <TableCell>
                        <Chip label={tp.label} size="small" sx={{ bgcolor: tp.bg, color: tp.color, fontWeight: 700, fontSize: '0.65rem', height: 22 }} />
                      </TableCell>
                      <TableCell sx={{ color: colors.onSurfaceVariant, fontSize: '0.875rem' }}>
                        {new Date(app.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                      </TableCell>
                      <TableCell>
                        <Chip label={st.label} size="small" sx={{ bgcolor: st.bg, color: st.color, fontWeight: 700, fontSize: '0.7rem', height: 22 }} />
                      </TableCell>
                      <TableCell>
                        {app.status === 'PENDING' && (
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                              size="small"
                              startIcon={<CheckIcon />}
                              onClick={() => approveMutation.mutate(app.id)}
                              disabled={approveMutation.isPending}
                              sx={{
                                bgcolor: '#dcfce7',
                                color: '#166534',
                                fontWeight: 700,
                                fontSize: '0.75rem',
                                '&:hover': { bgcolor: '#bbf7d0' },
                              }}
                            >
                              Onayla
                            </Button>
                            <Button
                              size="small"
                              startIcon={<CloseIcon />}
                              onClick={() => setRejectTarget(app)}
                              sx={{
                                bgcolor: colors.errorContainer,
                                color: colors.error,
                                fontWeight: 700,
                                fontSize: '0.75rem',
                                '&:hover': { bgcolor: '#fca5a5' },
                              }}
                            >
                              Reddet
                            </Button>
                          </Box>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        )}
      </Box>

      {/* Reject dialog */}
      <Dialog open={!!rejectTarget} onClose={() => setRejectTarget(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontFamily: 'var(--font-manrope)', fontWeight: 700 }}>
          Başvuruyu Reddet
        </DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          <Typography sx={{ color: colors.onSurfaceVariant, mb: 2, fontSize: '0.9rem' }}>
            <strong>{rejectTarget?.proposedCompanyName}</strong> başvurusunu reddetmek istediğinize emin misiniz?
          </Typography>
          <OutlinedInput
            multiline
            rows={3}
            fullWidth
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Red sebebi (opsiyonel)..."
            sx={{ '& fieldset': { borderColor: 'rgba(195,198,215,0.3)' } }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button onClick={() => setRejectTarget(null)} sx={{ color: colors.onSurfaceVariant }}>İptal</Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => rejectTarget && rejectMutation.mutate({ id: rejectTarget.id, reason: rejectReason })}
            disabled={rejectMutation.isPending}
          >
            Reddet
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!snack} autoHideDuration={3000} onClose={() => setSnack(null)} message={snack} />
    </AdminLayout>
  );
}
