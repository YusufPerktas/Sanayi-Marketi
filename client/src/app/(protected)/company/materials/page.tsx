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
import AddCircleOutlinedIcon from '@mui/icons-material/AddCircleOutlined';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { companyService, CompanyMaterial } from '@/services/company.service';
import { materialService } from '@/services/material.service';
import { colors } from '@/utils/colors';

const ROLE_OPTIONS = [
  { value: 'PRODUCER', label: 'Üretici' },
  { value: 'SELLER', label: 'Satıcı' },
  { value: 'BOTH', label: 'Her İkisi' },
];

const UNIT_OPTIONS = [
  'Ton', 'Kg', 'Gram',
  'Adet', 'Paket', 'Kutu',
  'Metre', 'm²', 'm³',
  'Litre', 'Metreküp',
  'cm', 'mm',
];

const ROLE_CHIP: Record<string, { label: string; color: string; bg: string }> = {
  PRODUCER: { label: 'Üretici', color: colors.primary, bg: colors.primaryFixed },
  SELLER: { label: 'Satıcı', color: colors.tertiary, bg: colors.tertiaryFixed },
  BOTH: { label: 'Her İkisi', color: colors.secondary, bg: colors.secondaryFixed },
};

const labelSx = {
  fontSize: '0.75rem',
  fontWeight: 600,
  color: colors.onSurfaceVariant,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.08em',
  mb: 1,
};

type ModalMode = 'add' | 'edit' | null;

export default function CompanyMaterialsPage() {
  const qc = useQueryClient();
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editTarget, setEditTarget] = useState<CompanyMaterial | null>(null);
  const [tableSearch, setTableSearch] = useState('');
  const [modalSearch, setModalSearch] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState<{ id: number; materialName: string } | null>(null);
  const [form, setForm] = useState({ role: 'PRODUCER', price: '', unit: 'Ton' });
  const [snack, setSnack] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);

  const { data: myCompany } = useQuery({
    queryKey: ['my-company'],
    queryFn: () => companyService.getMe(),
  });
  const companyId = myCompany?.id;

  const { data: materials, isLoading } = useQuery({
    queryKey: ['company-materials', companyId],
    queryFn: () => companyService.getMaterials(companyId!),
    enabled: !!companyId,
  });

  const { data: searchResults } = useQuery({
    queryKey: ['materials-search', modalSearch],
    queryFn: () => materialService.search(modalSearch),
    enabled: modalSearch.length >= 2 && modalMode === 'add',
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => companyService.deleteMaterial(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['company-materials', companyId] });
      setSnack('Malzeme silindi');
    },
  });

  const createMaterialMutation = useMutation({
    mutationFn: (name: string) => materialService.create(name),
    onSuccess: (created) => {
      setSelectedMaterial({ id: created.id, materialName: created.materialName });
      setModalSearch('');
      setCreateError(null);
    },
    onError: () => setCreateError('Malzeme oluşturulamadı.'),
  });

  const addMutation = useMutation({
    mutationFn: (data: { materialId: number; role: 'PRODUCER' | 'SELLER' | 'BOTH'; price?: number; unit?: string }) =>
      companyService.addMaterial(companyId!, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['company-materials', companyId] });
      setModalMode(null);
      setModalSearch('');
      setSelectedMaterial(null);
      setCreateError(null);
      setSnack('Malzeme eklendi');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { role?: 'PRODUCER' | 'SELLER' | 'BOTH'; price?: number; unit?: string } }) =>
      companyService.updateMaterial(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['company-materials', companyId] });
      setModalMode(null);
      setSnack('Malzeme güncellendi');
    },
  });

  function openEdit(m: CompanyMaterial) {
    setEditTarget(m);
    setForm({ role: m.role, price: m.price?.toString() ?? '', unit: m.unit ?? 'Ton' });
    setModalMode('edit');
  }

  function openAdd() {
    setEditTarget(null);
    setForm({ role: 'PRODUCER', price: '', unit: 'Ton' });
    setModalSearch('');
    setSelectedMaterial(null);
    setCreateError(null);
    setModalMode('add');
  }

  function handleSave() {
    const price = form.price ? parseFloat(form.price) : undefined;
    const unit = form.unit || undefined;
    if (modalMode === 'add' && selectedMaterial) {
      addMutation.mutate({ materialId: selectedMaterial.id, role: form.role as 'PRODUCER' | 'SELLER' | 'BOTH', price, unit });
    } else if (modalMode === 'edit' && editTarget) {
      updateMutation.mutate({
        id: editTarget.id,
        data: { role: form.role as 'PRODUCER' | 'SELLER' | 'BOTH', price, unit },
      });
    }
  }

  function formatPrice(price: number | null, unit: string | null): string {
    if (price == null) return '—';
    const formatted = price.toLocaleString('tr-TR');
    return unit ? `${formatted} TL / ${unit}` : `${formatted} TL`;
  }

  const filtered = materials?.filter((m) =>
    !tableSearch || m.materialName.toLowerCase().includes(tableSearch.toLowerCase()),
  ) ?? [];

  const showCreateOption = modalSearch.length >= 2 && searchResults?.length === 0 && !createMaterialMutation.isPending;

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

      {/* Table search */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, bgcolor: colors.surfaceContainerLow, border: `1px solid rgba(195,198,215,0.15)`, borderRadius: 2, px: 2, mb: 4, maxWidth: 400 }}>
        <SearchIcon sx={{ color: colors.outline }} />
        <input
          value={tableSearch}
          onChange={(e) => setTableSearch(e.target.value)}
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
                <TableCell sx={{ fontWeight: 600, color: colors.onSurfaceVariant, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Birim</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, color: colors.onSurfaceVariant, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Liste Fiyatı</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, color: colors.onSurfaceVariant, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>İşlemler</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((m) => {
                const role = ROLE_CHIP[m.role] ?? ROLE_CHIP.BOTH;
                return (
                  <TableRow key={m.materialId} sx={{ '&:hover': { bgcolor: `${colors.surfaceContainerLow}50` }, borderBottom: `1px solid rgba(195,198,215,0.1)` }}>
                    <TableCell sx={{ color: colors.onSurface, fontWeight: 500 }}>{m.materialName}</TableCell>
                    <TableCell>
                      <Chip label={role.label} size="small" sx={{ bgcolor: role.bg, color: role.color, fontWeight: 700, fontSize: '0.65rem', textTransform: 'uppercase', height: 22 }} />
                    </TableCell>
                    <TableCell sx={{ color: colors.onSurfaceVariant, fontSize: '0.85rem' }}>
                      {m.unit ?? '—'}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: colors.onSurface }}>
                      {formatPrice(m.price, m.unit)}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => openEdit(m)} sx={{ color: colors.primary, mr: 0.5 }}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => deleteMutation.mutate(m.id)} disabled={deleteMutation.isPending} sx={{ color: colors.error }}>
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

          {/* ADD: search + select or create */}
          {modalMode === 'add' && (
            <FormControl>
              <FormLabel sx={labelSx}>Malzeme Seç</FormLabel>
              {selectedMaterial ? (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.5, bgcolor: colors.surfaceContainerLow, borderRadius: 2, border: `1px solid rgba(195,198,215,0.3)` }}>
                  <Typography sx={{ fontWeight: 600, color: colors.onSurface, fontSize: '0.9rem' }}>{selectedMaterial.materialName}</Typography>
                  <Button size="small" onClick={() => { setSelectedMaterial(null); setModalSearch(''); }} sx={{ color: colors.onSurfaceVariant, minWidth: 0, px: 1 }}>Değiştir</Button>
                </Box>
              ) : (
                <>
                  <OutlinedInput
                    value={modalSearch}
                    onChange={(e) => setModalSearch(e.target.value)}
                    placeholder="Malzeme adı yazın (min. 2 karakter)..."
                    size="small"
                    autoFocus
                  />
                  {searchResults && searchResults.length > 0 && (
                    <Box sx={{ mt: 1, border: `1px solid rgba(195,198,215,0.2)`, borderRadius: 2, overflow: 'hidden' }}>
                      {searchResults.slice(0, 6).map((m) => (
                        <Box
                          key={m.id}
                          onClick={() => { setSelectedMaterial(m); setModalSearch(''); }}
                          sx={{ px: 2, py: 1.5, cursor: 'pointer', fontSize: '0.875rem', color: colors.onSurface, '&:hover': { bgcolor: colors.surfaceContainerLow }, borderBottom: `1px solid rgba(195,198,215,0.1)`, '&:last-child': { borderBottom: 'none' } }}
                        >
                          {m.materialName}
                        </Box>
                      ))}
                    </Box>
                  )}
                  {showCreateOption && (
                    <Box
                      sx={{ mt: 1, border: `1px dashed rgba(195,198,215,0.4)`, borderRadius: 2, overflow: 'hidden' }}
                    >
                      <Box
                        onClick={() => createMaterialMutation.mutate(modalSearch.trim())}
                        sx={{ px: 2, py: 1.5, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 1, fontSize: '0.875rem', color: colors.primary, '&:hover': { bgcolor: colors.surfaceContainerLow } }}
                      >
                        <AddCircleOutlinedIcon sx={{ fontSize: '1rem' }} />
                        <Typography sx={{ fontSize: '0.875rem', color: colors.primary, fontWeight: 600 }}>
                          &quot;{modalSearch.trim()}&quot; adıyla yeni malzeme oluştur
                        </Typography>
                      </Box>
                    </Box>
                  )}
                  {createMaterialMutation.isPending && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                      <CircularProgress size={14} />
                      <Typography sx={{ fontSize: '0.8rem', color: colors.onSurfaceVariant }}>Malzeme oluşturuluyor...</Typography>
                    </Box>
                  )}
                  {createError && <Alert severity="error" sx={{ mt: 1, py: 0.5 }}>{createError}</Alert>}
                </>
              )}
            </FormControl>
          )}

          {/* EDIT: show material name */}
          {modalMode === 'edit' && (
            <Box sx={{ px: 2, py: 1.5, bgcolor: colors.surfaceContainerLow, borderRadius: 2 }}>
              <Typography sx={{ fontWeight: 600, color: colors.onSurface }}>{editTarget?.materialName}</Typography>
            </Box>
          )}

          <FormControl>
            <FormLabel sx={labelSx}>Fabrikanın Rolü</FormLabel>
            <Select
              value={form.role}
              onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
              size="small"
            >
              {ROLE_OPTIONS.map((r) => <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>)}
            </Select>
          </FormControl>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControl sx={{ flex: 1 }}>
              <FormLabel sx={labelSx}>Birim</FormLabel>
              <Select
                value={form.unit}
                onChange={(e) => setForm((p) => ({ ...p, unit: e.target.value }))}
                size="small"
              >
                {UNIT_OPTIONS.map((u) => <MenuItem key={u} value={u}>{u}</MenuItem>)}
              </Select>
            </FormControl>

            <FormControl sx={{ flex: 2 }}>
              <FormLabel sx={labelSx}>
                Liste Fiyatı (TL/{form.unit}) — opsiyonel
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
          </Box>

          {form.price && (
            <Typography sx={{ fontSize: '0.8rem', color: colors.onSurfaceVariant, mt: -1 }}>
              Önizleme: <strong style={{ color: colors.onSurface }}>{Number(form.price).toLocaleString('tr-TR')} TL / {form.unit}</strong>
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button onClick={() => setModalMode(null)} sx={{ color: colors.onSurfaceVariant }}>İptal</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={
              (addMutation.isPending || updateMutation.isPending) ||
              (modalMode === 'add' && !selectedMaterial)
            }
            startIcon={(addMutation.isPending || updateMutation.isPending) ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            {modalMode === 'add' ? 'Ekle' : 'Kaydet'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!snack} autoHideDuration={3000} onClose={() => setSnack(null)} message={snack} />
    </DashboardLayout>
  );
}
