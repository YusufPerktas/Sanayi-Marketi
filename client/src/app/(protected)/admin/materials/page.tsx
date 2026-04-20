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
  IconButton,
  OutlinedInput,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import MergeIcon from '@mui/icons-material/Merge';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '@/components/layout/AdminLayout';
import { adminService, AdminMaterial, AdminMaterialFilter } from '@/services/admin.service';
import { materialService } from '@/services/material.service';
import { colors } from '@/utils/colors';

const FILTERS: { value: AdminMaterialFilter; label: string }[] = [
  { value: 'ALL', label: 'Tümü' },
  { value: 'USER_CREATED', label: 'Firma Eklemeleri' },
  { value: 'UNUSED', label: 'Kullanılmayan' },
  { value: 'SUSPICIOUS', label: 'Şüpheli' },
];

export default function AdminMaterialsPage() {
  const qc = useQueryClient();

  const [filter, setFilter] = useState<AdminMaterialFilter>('ALL');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(0);

  const [editTarget, setEditTarget] = useState<AdminMaterial | null>(null);
  const [editName, setEditName] = useState('');

  const [deleteTarget, setDeleteTarget] = useState<AdminMaterial | null>(null);

  const [mergeSource, setMergeSource] = useState<AdminMaterial | null>(null);
  const [mergeSearch, setMergeSearch] = useState('');
  const [mergeTarget, setMergeTarget] = useState<AdminMaterial | null>(null);

  const [snack, setSnack] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-materials', filter, search, page],
    queryFn: () => adminService.getMaterials({ filter, search: search || undefined, page, size: 20 }),
  });

  const { data: stats } = useQuery({
    queryKey: ['admin-material-stats'],
    queryFn: adminService.getMaterialStats,
  });

  const { data: mergeSearchResults } = useQuery({
    queryKey: ['materials-merge-search', mergeSearch],
    queryFn: () => materialService.search(mergeSearch),
    enabled: mergeSearch.length >= 2 && !!mergeSource,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) =>
      adminService.updateMaterial(id, name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-materials'] });
      qc.invalidateQueries({ queryKey: ['admin-material-stats'] });
      setEditTarget(null);
      setSnack('Malzeme güncellendi');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminService.deleteMaterial(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-materials'] });
      qc.invalidateQueries({ queryKey: ['admin-material-stats'] });
      setDeleteTarget(null);
      setSnack('Malzeme silindi');
    },
  });

  const mergeMutation = useMutation({
    mutationFn: ({ targetId, sourceId }: { targetId: number; sourceId: number }) =>
      adminService.mergeMaterials(targetId, sourceId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-materials'] });
      qc.invalidateQueries({ queryKey: ['admin-material-stats'] });
      setMergeSource(null);
      setMergeTarget(null);
      setMergeSearch('');
      setSnack('Malzemeler birleştirildi');
    },
  });

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput);
    setPage(0);
  }

  function handleFilterChange(f: AdminMaterialFilter) {
    setFilter(f);
    setPage(0);
  }

  const materials = data?.content ?? [];
  const totalPages = data?.totalPages ?? 1;

  const STATS_CARDS = [
    { label: 'Toplam Malzeme', value: stats?.total ?? '...', color: colors.primary },
    { label: 'Firma Eklemeleri', value: stats?.userCreated ?? '...', color: colors.secondary },
    { label: 'Kullanılmayan', value: stats?.unused ?? '...', color: '#d97706' },
    { label: 'Şüpheli', value: stats?.suspicious ?? '...', color: colors.error },
  ];

  return (
    <AdminLayout title="Malzeme Yönetimi">

      {/* Stats */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 3, mb: 5 }}>
        {STATS_CARDS.map((s) => (
          <Box key={s.label} sx={{ bgcolor: colors.surfaceContainerLow, borderRadius: 3, p: 3, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {s.label}
            </Typography>
            <Typography sx={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: '2rem', color: s.color, lineHeight: 1 }}>
              {s.value.toString()}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Toolbar */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Search */}
        <Box component="form" onSubmit={handleSearch} sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: colors.surfaceContainerLowest, border: `1px solid rgba(195,198,215,0.2)`, borderRadius: 2, px: 2, flex: 1, maxWidth: 360 }}>
          <SearchIcon sx={{ color: colors.outline, fontSize: '1.1rem' }} />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Malzeme adı ara..."
            style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '0.875rem', color: colors.onSurface, padding: '10px 0', width: '100%', fontFamily: 'var(--font-inter)' }}
          />
        </Box>

        {/* Filter tabs */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          {FILTERS.map((f) => (
            <Button
              key={f.value}
              onClick={() => handleFilterChange(f.value)}
              size="small"
              sx={{
                px: 2,
                py: 0.75,
                borderRadius: 2,
                fontWeight: 600,
                fontSize: '0.8rem',
                bgcolor: filter === f.value ? colors.primary : colors.surfaceContainerLow,
                color: filter === f.value ? '#fff' : colors.onSurfaceVariant,
                '&:hover': { bgcolor: filter === f.value ? colors.primary : colors.surfaceContainerHigh },
              }}
            >
              {f.label}
            </Button>
          ))}
        </Box>
      </Box>

      {/* Table */}
      <Box sx={{ bgcolor: colors.surfaceContainerLowest, borderRadius: 3, overflow: 'hidden', border: `1px solid rgba(195,198,215,0.15)` }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
        ) : materials.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 10 }}>
            <Inventory2Icon sx={{ fontSize: '2.5rem', color: colors.outline, mb: 1 }} />
            <Typography sx={{ color: colors.onSurfaceVariant }}>Malzeme bulunamadı</Typography>
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: colors.surfaceContainerLow }}>
                {['Malzeme Adı', 'Ekleyen', 'Kullanım', 'Eklenme', 'İşlemler'].map((h) => (
                  <TableCell key={h} sx={{ fontWeight: 700, color: colors.onSurfaceVariant, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: `1px solid rgba(195,198,215,0.15)` }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {materials.map((m) => (
                <TableRow key={m.id} sx={{ '&:hover': { bgcolor: `${colors.surfaceContainerLow}60` }, borderBottom: `1px solid rgba(195,198,215,0.08)` }}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography sx={{ fontWeight: 500, color: colors.onSurface, fontSize: '0.875rem' }}>
                        {m.materialName}
                      </Typography>
                      {m.suspicious && (
                        <Tooltip title="Şüpheli giriş">
                          <WarningAmberIcon sx={{ fontSize: '1rem', color: '#d97706' }} />
                        </Tooltip>
                      )}
                    </Box>
                    {m.parentMaterialName && (
                      <Typography sx={{ fontSize: '0.75rem', color: colors.onSurfaceVariant, mt: 0.25 }}>
                        ↳ {m.parentMaterialName}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {m.userCreated ? (
                      <Chip
                        label={m.createdByCompanyName ?? 'Firma'}
                        size="small"
                        sx={{ bgcolor: colors.secondaryFixed, color: colors.secondary, fontWeight: 600, fontSize: '0.7rem', height: 22 }}
                      />
                    ) : (
                      <Typography sx={{ fontSize: '0.8rem', color: colors.onSurfaceVariant }}>Sistem</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: m.usageCount > 0 ? colors.tertiary : colors.outline }} />
                      <Typography sx={{ fontSize: '0.875rem', color: m.usageCount > 0 ? colors.onSurface : colors.onSurfaceVariant }}>
                        {m.usageCount} firma
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ color: colors.onSurfaceVariant, fontSize: '0.8rem' }}>
                    {m.createdAt
                      ? new Date(m.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })
                      : '—'}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="Düzenle">
                        <IconButton size="small" onClick={() => { setEditTarget(m); setEditName(m.materialName); }} sx={{ color: colors.primary }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Birleştir">
                        <IconButton size="small" onClick={() => { setMergeSource(m); setMergeSearch(''); setMergeTarget(null); }} sx={{ color: colors.secondary }}>
                          <MergeIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Sil">
                        <IconButton size="small" onClick={() => setDeleteTarget(m)} sx={{ color: colors.error }}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Box>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3 }}>
          <Button startIcon={<ArrowBackIcon />} onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} sx={{ color: colors.onSurfaceVariant, fontWeight: 700 }}>
            Önceki
          </Button>
          <Typography sx={{ fontSize: '0.875rem', color: colors.onSurfaceVariant }}>
            {page + 1} / {totalPages}
          </Typography>
          <Button endIcon={<ArrowForwardIcon />} onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} sx={{ color: colors.onSurface, fontWeight: 700 }}>
            Sonraki
          </Button>
        </Box>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editTarget} onClose={() => setEditTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontFamily: 'var(--font-manrope)', fontWeight: 700 }}>Malzeme Düzenle</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          <OutlinedInput
            fullWidth
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder="Malzeme adı"
            size="small"
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5, gap: 1 }}>
          <Button onClick={() => setEditTarget(null)} sx={{ color: colors.onSurfaceVariant }}>İptal</Button>
          <Button
            variant="contained"
            disabled={!editName.trim() || updateMutation.isPending}
            onClick={() => editTarget && updateMutation.mutate({ id: editTarget.id, name: editName.trim() })}
            startIcon={updateMutation.isPending ? <CircularProgress size={14} color="inherit" /> : undefined}
          >
            Kaydet
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontFamily: 'var(--font-manrope)', fontWeight: 700 }}>Malzemeyi Sil</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 1 }}>
            <strong>{deleteTarget?.materialName}</strong> silinecek.
            {deleteTarget && deleteTarget.usageCount > 0 && (
              <> Bu malzemeyi kullanan <strong>{deleteTarget.usageCount} firma</strong> etkilenecek.</>
            )}
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, gap: 1 }}>
          <Button onClick={() => setDeleteTarget(null)} sx={{ color: colors.onSurfaceVariant }}>İptal</Button>
          <Button
            variant="contained"
            color="error"
            disabled={deleteMutation.isPending}
            onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            startIcon={deleteMutation.isPending ? <CircularProgress size={14} color="inherit" /> : undefined}
          >
            Sil
          </Button>
        </DialogActions>
      </Dialog>

      {/* Merge Dialog */}
      <Dialog open={!!mergeSource} onClose={() => { setMergeSource(null); setMergeTarget(null); setMergeSearch(''); }} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontFamily: 'var(--font-manrope)', fontWeight: 700 }}>Malzeme Birleştir</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: '16px !important' }}>
          <Box>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.08em', mb: 1 }}>
              Kaynak (silinecek)
            </Typography>
            <Box sx={{ px: 2, py: 1.5, bgcolor: colors.errorContainer, borderRadius: 2 }}>
              <Typography sx={{ fontWeight: 600, color: colors.error }}>{mergeSource?.materialName}</Typography>
              <Typography sx={{ fontSize: '0.75rem', color: colors.onSurfaceVariant, mt: 0.25 }}>
                {mergeSource?.usageCount} firma kullanıyor
              </Typography>
            </Box>
          </Box>

          <Box>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.08em', mb: 1 }}>
              Hedef (korunacak)
            </Typography>
            {mergeTarget ? (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.5, bgcolor: colors.surfaceContainerLow, borderRadius: 2 }}>
                <Box>
                  <Typography sx={{ fontWeight: 600, color: colors.onSurface }}>{mergeTarget.materialName}</Typography>
                  <Typography sx={{ fontSize: '0.75rem', color: colors.onSurfaceVariant, mt: 0.25 }}>
                    {mergeTarget.usageCount} firma kullanıyor
                  </Typography>
                </Box>
                <Button size="small" onClick={() => { setMergeTarget(null); setMergeSearch(''); }} sx={{ color: colors.onSurfaceVariant, minWidth: 0 }}>
                  Değiştir
                </Button>
              </Box>
            ) : (
              <>
                <OutlinedInput
                  fullWidth
                  value={mergeSearch}
                  onChange={(e) => setMergeSearch(e.target.value)}
                  placeholder="Hedef malzeme ara..."
                  size="small"
                  autoFocus
                />
                {mergeSearchResults && mergeSearchResults.length > 0 && (
                  <Box sx={{ mt: 1, border: `1px solid rgba(195,198,215,0.2)`, borderRadius: 2, overflow: 'hidden' }}>
                    {mergeSearchResults
                      .filter((r) => r.id !== mergeSource?.id)
                      .slice(0, 6)
                      .map((r) => (
                        <Box
                          key={r.id}
                          onClick={() => setMergeTarget({ id: r.id, materialName: r.materialName, normalizedName: r.normalizedName, parentMaterialId: r.parentMaterialId ?? null, parentMaterialName: r.parentMaterialName ?? null, usageCount: 0, createdAt: null, createdByCompanyId: null, createdByCompanyName: null, userCreated: false, suspicious: false })}
                          sx={{ px: 2, py: 1.25, cursor: 'pointer', fontSize: '0.875rem', color: colors.onSurface, '&:hover': { bgcolor: colors.surfaceContainerLow }, borderBottom: `1px solid rgba(195,198,215,0.08)`, '&:last-child': { borderBottom: 'none' } }}
                        >
                          {r.materialName}
                        </Box>
                      ))}
                  </Box>
                )}
              </>
            )}
          </Box>

          {mergeTarget && (
            <Alert severity="info" sx={{ py: 0.5 }}>
              <strong>{mergeSource?.materialName}</strong> → <strong>{mergeTarget.materialName}</strong> olarak birleştirilecek.
              Kaynak silinecek, tüm firma bağlantıları hedefe taşınacak.
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5, gap: 1 }}>
          <Button onClick={() => { setMergeSource(null); setMergeTarget(null); setMergeSearch(''); }} sx={{ color: colors.onSurfaceVariant }}>İptal</Button>
          <Button
            variant="contained"
            disabled={!mergeTarget || mergeMutation.isPending}
            onClick={() => mergeSource && mergeTarget && mergeMutation.mutate({ targetId: mergeTarget.id, sourceId: mergeSource.id })}
            startIcon={mergeMutation.isPending ? <CircularProgress size={14} color="inherit" /> : undefined}
          >
            Birleştir
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!snack} autoHideDuration={3000} onClose={() => setSnack(null)} message={snack} />
    </AdminLayout>
  );
}
