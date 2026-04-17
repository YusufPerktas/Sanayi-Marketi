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
  FormControl,
  FormLabel,
  IconButton,
  MenuItem,
  OutlinedInput,
  Select,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { companyService, CompanyMaterial } from '@/services/company.service';
import { materialService } from '@/services/material.service';
import { colors } from '@/utils/colors';

const MY_COMPANY_ID = 1; // Placeholder — needs backend endpoint to get company ID

const ROLE_OPTIONS = [
  { value: 'PRODUCER', label: 'Üretici' },
  { value: 'SELLER', label: 'Satıcı' },
  { value: 'BOTH', label: 'Her İkisi' },
];

const ROLE_CHIP: Record<string, { label: string; color: string; bg: string }> = {
  PRODUCER: { label: 'Üretici', color: colors.primary, bg: colors.primaryFixed },
  SELLER: { label: 'Satıcı', color: colors.tertiary, bg: colors.tertiaryFixed },
  BOTH: { label: 'Her İkisi', color: colors.secondary, bg: colors.secondaryFixed },
};

type ModalMode = 'add' | 'edit' | null;

export default function CompanyMaterialsPage() {
  const qc = useQueryClient();
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editTarget, setEditTarget] = useState<CompanyMaterial | null>(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ materialName: '', role: 'PRODUCER', price: '' });
  const [snack, setSnack] = useState<string | null>(null);

  const { data: materials, isLoading } = useQuery({
    queryKey: ['company-materials', MY_COMPANY_ID],
    queryFn: () => companyService.getMaterials(MY_COMPANY_ID),
  });

  const { data: searchResults } = useQuery({
    queryKey: ['materials-search', search],
    queryFn: () => materialService.search(search),
    enabled: search.length >= 2 && modalMode === 'add',
  });

  const deleteMutation = useMutation({
    mutationFn: (materialId: number) => companyService.deleteMaterial(MY_COMPANY_ID, materialId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['company-materials', MY_COMPANY_ID] });
      setSnack('Malzeme silindi');
    },
  });

  const addMutation = useMutation({
    mutationFn: (data: { materialId: number; role: 'PRODUCER' | 'SELLER' | 'BOTH'; price?: number }) =>
      companyService.addMaterial(MY_COMPANY_ID, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['company-materials', MY_COMPANY_ID] });
      setModalMode(null);
      setSnack('Malzeme eklendi');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ materialId, data }: { materialId: number; data: { role?: 'PRODUCER' | 'SELLER' | 'BOTH'; price?: number } }) =>
      companyService.updateMaterial(MY_COMPANY_ID, materialId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['company-materials', MY_COMPANY_ID] });
      setModalMode(null);
      setSnack('Malzeme güncellendi');
    },
  });

  function openEdit(m: CompanyMaterial) {
    setEditTarget(m);
    setForm({ materialName: m.materialName, role: m.role, price: m.price?.toString() ?? '' });
    setModalMode('edit');
  }

  function openAdd() {
    setEditTarget(null);
    setForm({ materialName: '', role: 'PRODUCER', price: '' });
    setModalMode('add');
  }

  function handleSave() {
    const price = form.price ? parseFloat(form.price) : undefined;
    if (modalMode === 'edit' && editTarget) {
      updateMutation.mutate({
        materialId: editTarget.materialId,
        data: { role: form.role as 'PRODUCER' | 'SELLER' | 'BOTH', price },
      });
    }
    // Add mode: user must select from searchResults
  }

  function handleAddFromSearch(m: { id: number; name: string }) {
    const price = form.price ? parseFloat(form.price) : undefined;
    addMutation.mutate({ materialId: m.id, role: form.role as 'PRODUCER' | 'SELLER' | 'BOTH', price });
  }

  const filtered = materials?.filter((m) =>
    !search || m.materialName.toLowerCase().includes(search.toLowerCase()),
  ) ?? [];

  return (
    <DashboardLayout variant="company">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 5, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, color: colors.onSurface, mb: 0.5 }}>
            Malzeme Listesi
          </Typography>
          <Typography sx={{ color: colors.onSurfaceVariant }}>
            Firmanızın sunduğu malzemeleri yönetin
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd}>
          Malzeme Ekle
        </Button>
      </Box>

      {/* Search */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          bgcolor: colors.surfaceContainerLow,
          border: `1px solid rgba(195,198,215,0.15)`,
          borderRadius: 2,
          px: 2,
          mb: 4,
          maxWidth: 400,
        }}
      >
        <SearchIcon sx={{ color: colors.outline }} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Malzeme adı filtrele..."
          style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '0.875rem', color: colors.onSurface, padding: '10px 0', width: '100%', fontFamily: 'var(--font-inter)' }}
        />
      </Box>

      {/* Table */}
      <Box sx={{ bgcolor: colors.surfaceContainerLowest, borderRadius: 3, overflow: 'hidden', border: `1px solid rgba(195,198,215,0.15)`, boxShadow: colors.shadowSm }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
        ) : filtered.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 10 }}>
            <Typography sx={{ color: colors.onSurfaceVariant }}>Malzeme bulunamadı</Typography>
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: colors.surfaceContainerLow }}>
                <TableCell sx={{ fontWeight: 600, color: colors.onSurfaceVariant, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Malzeme Adı</TableCell>
                <TableCell sx={{ fontWeight: 600, color: colors.onSurfaceVariant, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Rolü</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, color: colors.onSurfaceVariant, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fiyat (TL)</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, color: colors.onSurfaceVariant, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>İşlemler</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((m) => {
                const role = ROLE_CHIP[m.role] ?? ROLE_CHIP.BOTH;
                return (
                  <TableRow
                    key={m.materialId}
                    sx={{ '&:hover': { bgcolor: `${colors.surfaceContainerLow}50` }, borderBottom: `1px solid rgba(195,198,215,0.1)` }}
                  >
                    <TableCell sx={{ color: colors.onSurface, fontWeight: 500 }}>{m.materialName}</TableCell>
                    <TableCell>
                      <Chip label={role.label} size="small" sx={{ bgcolor: role.bg, color: role.color, fontWeight: 700, fontSize: '0.65rem', textTransform: 'uppercase', height: 22 }} />
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: colors.onSurface }}>
                      {m.price != null ? `${m.price.toLocaleString('tr-TR')} ₺` : '—'}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => openEdit(m)} sx={{ color: colors.primary, mr: 0.5 }}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => deleteMutation.mutate(m.materialId)}
                        disabled={deleteMutation.isPending}
                        sx={{ color: colors.error }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Box>

      {/* Add/Edit dialog */}
      <Dialog open={modalMode !== null} onClose={() => setModalMode(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontFamily: 'var(--font-manrope)', fontWeight: 700 }}>
          {modalMode === 'add' ? 'Malzeme Ekle' : 'Malzeme Düzenle'}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: '16px !important' }}>
          {modalMode === 'add' && (
            <FormControl>
              <FormLabel sx={{ fontSize: '0.75rem', fontWeight: 600, color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.08em', mb: 1 }}>
                Malzeme Ara
              </FormLabel>
              <OutlinedInput
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Malzeme adı yazın..."
                size="small"
              />
              {searchResults && searchResults.length > 0 && (
                <Box sx={{ mt: 1, border: `1px solid rgba(195,198,215,0.2)`, borderRadius: 2, overflow: 'hidden' }}>
                  {searchResults.slice(0, 6).map((m) => (
                    <Box
                      key={m.id}
                      onClick={() => handleAddFromSearch(m)}
                      sx={{
                        px: 2,
                        py: 1.5,
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        color: colors.onSurface,
                        '&:hover': { bgcolor: colors.surfaceContainerLow },
                        borderBottom: `1px solid rgba(195,198,215,0.1)`,
                        '&:last-child': { borderBottom: 'none' },
                      }}
                    >
                      {m.name}
                    </Box>
                  ))}
                </Box>
              )}
            </FormControl>
          )}

          {modalMode === 'edit' && (
            <Typography sx={{ fontWeight: 600, color: colors.onSurface }}>
              {editTarget?.materialName}
            </Typography>
          )}

          <FormControl>
            <FormLabel sx={{ fontSize: '0.75rem', fontWeight: 600, color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.08em', mb: 1 }}>
              Rol
            </FormLabel>
            <Select
              value={form.role}
              onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
              size="small"
            >
              {ROLE_OPTIONS.map((r) => <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>)}
            </Select>
          </FormControl>

          <FormControl>
            <FormLabel sx={{ fontSize: '0.75rem', fontWeight: 600, color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.08em', mb: 1 }}>
              Fiyat (TL) — opsiyonel
            </FormLabel>
            <OutlinedInput
              type="number"
              value={form.price}
              onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
              placeholder="0"
              size="small"
              inputProps={{ min: 0 }}
            />
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button onClick={() => setModalMode(null)} sx={{ color: colors.onSurfaceVariant }}>İptal</Button>
          {modalMode === 'edit' && (
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={updateMutation.isPending}
            >
              Kaydet
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <Snackbar open={!!snack} autoHideDuration={3000} onClose={() => setSnack(null)} message={snack} />
    </DashboardLayout>
  );
}
