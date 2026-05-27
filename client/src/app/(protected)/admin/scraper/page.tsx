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
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,

  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorOutlinedIcon from '@mui/icons-material/ErrorOutlined';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import RefreshIcon from '@mui/icons-material/Refresh';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import AdminLayout from '@/components/layout/AdminLayout';
import { colors } from '@/utils/colors';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminService, ScraperResult, ScraperImportRequest } from '@/services/admin.service';
import { useRouter } from 'next/navigation';

const SECTORS = [
  'Çelik', 'Metal', 'Alüminyum', 'Demir', 'Dökme Demir', 'Bakır', 'Pirinç',
  'Plastik', 'Polimer', 'İnşaat Malzemeleri', 'Elektrik', 'Elektronik',
  'Makine', 'Endüstriyel Ekipman', 'Pompa', 'Vana', 'Boru',
  'Bağlantı Elemanları', 'Kimya', 'Boya', 'Ahşap', 'Mobilya', 'Çeşitli',
];

const STATUS_STYLE: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  SUCCESS: { label: 'Başarılı', color: '#166534', bg: '#dcfce7', icon: <CheckCircleIcon sx={{ fontSize: '0.9rem' }} /> },
  PARTIAL: { label: 'Kısmi', color: '#92400e', bg: '#fef3c7', icon: <WarningAmberIcon sx={{ fontSize: '0.9rem' }} /> },
  FAILED:  { label: 'Başarısız', color: colors.error, bg: '#fee2e2', icon: <ErrorOutlinedIcon sx={{ fontSize: '0.9rem' }} /> },
  ERROR:   { label: 'Hata', color: colors.error, bg: '#fee2e2', icon: <ErrorOutlinedIcon sx={{ fontSize: '0.9rem' }} /> },
};

function StatusChip({ status }: { status: string }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.ERROR;
  return (
    <Chip
      icon={<Box sx={{ color: s.color, display: 'flex', ml: '6px !important' }}>{s.icon}</Box>}
      label={s.label}
      size="small"
      sx={{ bgcolor: s.bg, color: s.color, fontWeight: 700, fontSize: '0.7rem', height: 24 }}
    />
  );
}

// ── Import Dialog ─────────────────────────────────────────────────

interface ImportDialogProps {
  open: boolean;
  result: ScraperResult | null;
  onClose: () => void;
  onSuccess: (companyId: number) => void;
}

function ImportDialog({ open, result, onClose, onSuccess }: ImportDialogProps) {
  const [selectedCatalog, setSelectedCatalog] = useState<string>('');
  const router = useRouter();

  const importMutation = useMutation({
    mutationFn: (req: ScraperImportRequest) => adminService.importCompany(req),
    onSuccess: (data) => {
      onSuccess(data.companyId);
      onClose();
      router.push('/admin/approvals');
    },
  });

  React.useEffect(() => {
    if (result?.catalogFiles?.length) {
      setSelectedCatalog(result.catalogFiles[0]);
    } else {
      setSelectedCatalog('');
    }
  }, [result]);

  if (!result) return null;

  function handleImport() {
    if (!result) return;
    importMutation.mutate({
      companyName: result.companyName ?? '',
      website: result.website,
      sectors: result.sectors,
      phone: result.phone,
      email: result.email,
      city: result.city,
      district: result.district,
      address: result.address,
      catalogFile: selectedCatalog || null,
      logoUrl: result.logoUrl,
      description: result.description,
    });
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontFamily: 'var(--font-manrope)', fontWeight: 700 }}>
        Firmayı Sisteme Aktar
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '12px !important' }}>
        <Alert severity="info" sx={{ fontSize: '0.8rem' }}>
          Firma <strong>INACTIVE</strong> statüsüyle oluşturulur ve onay için <strong>/admin/approvals</strong> sayfasına düşer.
        </Alert>

        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, fontSize: '0.85rem' }}>
          {[
            ['Firma Adı', result.companyName],
            ['Website', result.website],
            ['Şehir', result.city],
            ['İlçe', result.district],
            ['Telefon', result.phone],
            ['E-posta', result.email],
          ].map(([label, value]) => (
            <Box key={label}>
              <Typography sx={{ fontSize: '0.7rem', color: colors.onSurfaceVariant, mb: 0.25 }}>{label}</Typography>
              <Typography sx={{ fontSize: '0.85rem', color: colors.onSurface, fontWeight: 500 }}>
                {value || '—'}
              </Typography>
            </Box>
          ))}
        </Box>

        {result.catalogFiles.length > 0 && (
          <FormControl size="small" fullWidth>
            <InputLabel>Katalog Dosyası</InputLabel>
            <Select
              value={selectedCatalog}
              label="Katalog Dosyası"
              onChange={(e) => setSelectedCatalog(e.target.value)}
            >
              <MenuItem value=""><em>Katalog aktarma</em></MenuItem>
              {result.catalogFiles.map((f) => (
                <MenuItem key={f} value={f}>{f}</MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {importMutation.isError && (
          <Alert severity="error">Aktarım başarısız: {String((importMutation.error as Error)?.message)}</Alert>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={importMutation.isPending}>İptal</Button>
        <Button
          variant="contained"
          onClick={handleImport}
          disabled={importMutation.isPending}
          startIcon={importMutation.isPending ? <CircularProgress size={16} color="inherit" /> : <CloudUploadIcon />}
        >
          {importMutation.isPending ? 'Aktarılıyor...' : 'Sisteme Aktar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Tab 1: Firma Tara ─────────────────────────────────────────────

function TabFirmaTara() {
  const [companyName, setCompanyName] = useState('');
  const [website, setWebsite] = useState('');
  const [sectors, setSectors] = useState<string[]>([]);
  const [result, setResult] = useState<ScraperResult | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const queryClient = useQueryClient();

  const scrapeMutation = useMutation({
    mutationFn: () => adminService.runScraper({ companyName, website, sectors }),
    onSuccess: (data) => {
      setResult(data);
      queryClient.invalidateQueries({ queryKey: ['scraper-results'] });
    },
  });

  const canSubmit = companyName.trim().length > 0 && website.trim().length > 0;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 680 }}>
      {/* Form */}
      <Box
        sx={{
          bgcolor: colors.surfaceContainerLowest,
          borderRadius: 3,
          p: 4,
          border: `1px solid rgba(195,198,215,0.15)`,
          boxShadow: colors.shadowSm,
          display: 'flex',
          flexDirection: 'column',
          gap: 2.5,
        }}
      >
        <Typography sx={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: '1rem', color: colors.onSurface }}>
          Firma Bilgileri
        </Typography>

        <TextField
          label="Firma Adı"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          fullWidth
          size="small"
          placeholder="Örn: Borusan Boru"
        />
        <TextField
          label="Website URL"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          fullWidth
          size="small"
          placeholder="https://..."
        />
        <FormControl size="small" fullWidth>
          <InputLabel>Sektörler</InputLabel>
          <Select
            multiple
            value={sectors}
            onChange={(e) => {
              const val = e.target.value as unknown as string | string[];
              setSectors(typeof val === 'string' ? val.split(',') : val);
            }}
            input={<OutlinedInput label="Sektörler" />}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {(selected as string[]).map((v) => <Chip key={v} label={v} size="small" />)}
              </Box>
            )}
          >
            {SECTORS.map((s) => (
              <MenuItem key={s} value={s}>{s}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button
          variant="contained"
          startIcon={scrapeMutation.isPending ? <CircularProgress size={18} color="inherit" /> : <PlayArrowIcon />}
          onClick={() => scrapeMutation.mutate()}
          disabled={!canSubmit || scrapeMutation.isPending}
          sx={{ alignSelf: 'flex-start', px: 4, py: 1.25 }}
        >
          {scrapeMutation.isPending ? 'Taranıyor... (birkaç dakika)' : 'Tara'}
        </Button>

        {scrapeMutation.isError && (
          <Alert severity="error">
            İstek hatası: {String((scrapeMutation.error as Error)?.message)}
          </Alert>
        )}
      </Box>

      {/* Sonuç kartı */}
      {result && (
        <Box
          sx={{
            bgcolor: colors.surfaceContainerLowest,
            borderRadius: 3,
            p: 4,
            border: `1px solid rgba(195,198,215,0.15)`,
            boxShadow: colors.shadowSm,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Typography sx={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: '1rem', color: colors.onSurface }}>
              Sonuç
            </Typography>
            <StatusChip status={result.status} />
          </Box>

          {result.status === 'ERROR' ? (
            <Alert severity="error">{result.errorMessage || 'Bilinmeyen hata'}</Alert>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                {[
                  ['Firma', result.companyName],
                  ['Katalog', `${result.catalogCount} dosya`],
                  ['Telefon', result.phone],
                  ['E-posta', result.email],
                  ['Şehir', result.city],
                  ['İlçe', result.district],
                ].map(([label, value]) => (
                  <Box key={label}>
                    <Typography sx={{ fontSize: '0.7rem', color: colors.onSurfaceVariant, mb: 0.25 }}>{label}</Typography>
                    <Typography sx={{ fontSize: '0.85rem', color: value ? colors.onSurface : colors.outline, fontWeight: value ? 500 : 400 }}>
                      {value || '—'}
                    </Typography>
                  </Box>
                ))}
              </Box>

              {result.description && (
                <Box>
                  <Typography sx={{ fontSize: '0.7rem', color: colors.onSurfaceVariant, mb: 0.25 }}>Açıklama</Typography>
                  <Typography sx={{ fontSize: '0.8rem', color: colors.onSurfaceVariant, lineHeight: 1.5 }}>
                    {result.description.substring(0, 200)}{result.description.length > 200 ? '...' : ''}
                  </Typography>
                </Box>
              )}

              {result.imported ? (
                <Alert severity="success" sx={{ fontSize: '0.8rem' }}>Bu firma zaten sisteme aktarılmış.</Alert>
              ) : (result.status === 'SUCCESS' || result.status === 'PARTIAL') && (
                <Button
                  variant="contained"
                  startIcon={<CloudUploadIcon />}
                  onClick={() => setImportOpen(true)}
                  sx={{ alignSelf: 'flex-start' }}
                >
                  Sisteme Aktar
                </Button>
              )}
            </Box>
          )}
        </Box>
      )}

      <ImportDialog
        open={importOpen}
        result={result}
        onClose={() => setImportOpen(false)}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['scraper-results'] })}
      />
    </Box>
  );
}

// ── Tab 2: Taranan Firmalar ───────────────────────────────────────

type ResultFilter = 'ALL' | 'NOT_IMPORTED' | 'FAILED';

function TabTarananFirmalar() {
  const [filter, setFilter] = useState<ResultFilter>('ALL');
  const [importTarget, setImportTarget] = useState<ScraperResult | null>(null);
  const queryClient = useQueryClient();

  const { data: results = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['scraper-results'],
    queryFn: adminService.getScraperResults,
  });

  const filtered = results.filter((r) => {
    if (filter === 'NOT_IMPORTED') return !r.imported;
    if (filter === 'FAILED') return r.status === 'FAILED' || r.status === 'ERROR';
    return true;
  });

  const scrapeMutation = useMutation({
    mutationFn: (r: ScraperResult) =>
      adminService.runScraper({ companyName: r.companyName ?? '', website: r.website ?? '', sectors: r.sectors }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['scraper-results'] }),
  });

  if (isLoading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>;
  }
  if (isError) {
    return <Alert severity="error">Sonuçlar yüklenemedi.</Alert>;
  }

  return (
    <Box>
      {/* Filtre + yenile */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        {(['ALL', 'NOT_IMPORTED', 'FAILED'] as ResultFilter[]).map((f) => (
          <Button
            key={f}
            variant={filter === f ? 'contained' : 'outlined'}
            size="small"
            onClick={() => setFilter(f)}
            sx={filter !== f ? { borderColor: 'rgba(195,198,215,0.4)', color: colors.onSurface } : {}}
          >
            {f === 'ALL' ? 'Tümü' : f === 'NOT_IMPORTED' ? 'Aktarılmamış' : 'Başarısız'}
            <Chip
              label={results.filter((r) =>
                f === 'ALL' ? true : f === 'NOT_IMPORTED' ? !r.imported : r.status === 'FAILED' || r.status === 'ERROR'
              ).length}
              size="small"
              sx={{ ml: 1, height: 18, fontSize: '0.65rem',
                bgcolor: filter === f ? 'rgba(255,255,255,0.2)' : colors.surfaceContainerHigh,
                color: filter === f ? '#fff' : colors.onSurface }}
            />
          </Button>
        ))}
        <Button
          variant="outlined"
          size="small"
          startIcon={<RefreshIcon />}
          onClick={() => refetch()}
          sx={{ ml: 'auto', borderColor: 'rgba(195,198,215,0.4)', color: colors.onSurface }}
        >
          Yenile
        </Button>
      </Box>

      {filtered.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8, color: colors.onSurfaceVariant }}>
          <FolderOpenIcon sx={{ fontSize: '3rem', mb: 2, opacity: 0.4 }} />
          <Typography>Sonuç bulunamadı.</Typography>
        </Box>
      ) : (
        <Box sx={{ bgcolor: colors.surfaceContainerLowest, borderRadius: 3, overflow: 'hidden', border: `1px solid rgba(195,198,215,0.15)` }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: colors.surfaceContainerLow }}>
                {['Firma Adı', 'Sektörler', 'Katalog', 'İletişim', 'Durum', 'Tarih', 'İşlemler'].map((h) => (
                  <TableCell key={h} sx={{ fontSize: '0.75rem', fontWeight: 700, color: colors.onSurfaceVariant, py: 1.5 }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((r, i) => (
                <TableRow key={i} sx={{ '&:hover': { bgcolor: colors.surfaceContainerLow } }}>
                  <TableCell sx={{ fontSize: '0.85rem', fontWeight: 600, color: colors.onSurface }}>
                    {r.companyName || '—'}
                    {r.imported && (
                      <Chip label="AKTARILDI" size="small" sx={{ ml: 1, height: 16, fontSize: '0.6rem', bgcolor: '#dcfce7', color: '#166534' }} />
                    )}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {r.sectors.slice(0, 3).map((s) => (
                        <Chip key={s} label={s} size="small" sx={{ height: 18, fontSize: '0.65rem', bgcolor: colors.surfaceContainerHigh }} />
                      ))}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.85rem', color: r.catalogCount > 0 ? colors.onSurface : colors.outline }}>
                    {r.catalogCount} dosya
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      {r.phone && <Chip label="Tel" size="small" sx={{ height: 16, fontSize: '0.6rem', bgcolor: '#dbeafe', color: '#1e40af' }} />}
                      {r.email && <Chip label="Email" size="small" sx={{ height: 16, fontSize: '0.6rem', bgcolor: '#dbeafe', color: '#1e40af' }} />}
                      {!r.phone && !r.email && <Typography sx={{ fontSize: '0.75rem', color: colors.outline }}>—</Typography>}
                    </Box>
                  </TableCell>
                  <TableCell><StatusChip status={r.status} /></TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', color: colors.onSurfaceVariant }}>
                    {r.scrapeDate ? r.scrapeDate.substring(0, 10) : '—'}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {!r.imported && (r.status === 'SUCCESS' || r.status === 'PARTIAL') && (
                        <Button size="small" variant="outlined" onClick={() => setImportTarget(r)}
                          sx={{ fontSize: '0.7rem', py: 0.25, borderColor: colors.primary, color: colors.primary }}>
                          Aktar
                        </Button>
                      )}
                      <Tooltip title="Tekrar tara">
                        <Button size="small" variant="outlined" onClick={() => scrapeMutation.mutate(r)}
                          disabled={scrapeMutation.isPending}
                          sx={{ fontSize: '0.7rem', py: 0.25, minWidth: 0, px: 1, borderColor: 'rgba(195,198,215,0.4)', color: colors.onSurface }}>
                          <RefreshIcon sx={{ fontSize: '0.9rem' }} />
                        </Button>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}

      <ImportDialog
        open={Boolean(importTarget)}
        result={importTarget}
        onClose={() => setImportTarget(null)}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['scraper-results'] })}
      />
    </Box>
  );
}

// ── Tab 3: Katalog Analizi ────────────────────────────────────────

function TabKatalogAnalizi() {
  const { data: results = [], isLoading } = useQuery({
    queryKey: ['scraper-results'],
    queryFn: adminService.getScraperResults,
  });

  const withCatalogs = results.filter((r) => r.catalogCount > 0);

  return (
    <Box>
      <Alert severity="info" sx={{ mb: 3, fontSize: '0.85rem' }}>
        <strong>Phase 9 — Geliştirme aşamasında.</strong> Katalog analiz modülü (catalog_analyzer.py)
        tamamlandığında bu panel aktif hale gelecek. Şu an mevcut katalog dosyaları görüntülenebilir.
      </Alert>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
      ) : withCatalogs.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8, color: colors.onSurfaceVariant }}>
          <FolderOpenIcon sx={{ fontSize: '3rem', mb: 2, opacity: 0.4 }} />
          <Typography>Katalog bulunan firma yok. Önce Tab 1'den firma tarayın.</Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {withCatalogs.map((r, i) => (
            <Box
              key={i}
              sx={{
                bgcolor: colors.surfaceContainerLowest,
                borderRadius: 3,
                p: 3,
                border: `1px solid rgba(195,198,215,0.15)`,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                <Typography sx={{ fontWeight: 700, color: colors.onSurface, fontSize: '0.9rem' }}>
                  {r.companyName}
                </Typography>
                <Chip label={`${r.catalogCount} katalog`} size="small"
                  sx={{ bgcolor: colors.surfaceContainerHigh, fontSize: '0.7rem' }} />
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {r.catalogFiles.map((f) => (
                  <Box key={f} sx={{ display: 'flex', alignItems: 'center', gap: 1,
                    bgcolor: colors.surfaceContainerLow, borderRadius: 2, px: 1.5, py: 0.75 }}>
                    <FolderOpenIcon sx={{ fontSize: '0.85rem', color: colors.onSurfaceVariant }} />
                    <Typography sx={{ fontSize: '0.75rem', color: colors.onSurface }}>{f}</Typography>
                    <Tooltip title="Phase 9 tamamlandığında kullanılabilir">
                      <Button size="small" disabled sx={{ fontSize: '0.65rem', py: 0, minWidth: 0, px: 1 }}>
                        Analiz Et
                      </Button>
                    </Tooltip>
                  </Box>
                ))}
              </Box>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}

// ── Ana sayfa ─────────────────────────────────────────────────────

export default function AdminScraperPage() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <AdminLayout title="Scraper Kontrol Paneli">
      <Box sx={{ borderBottom: `1px solid rgba(195,198,215,0.2)`, mb: 4 }}>
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          sx={{
            '& .MuiTab-root': { fontSize: '0.875rem', fontWeight: 600, textTransform: 'none', color: colors.onSurfaceVariant },
            '& .Mui-selected': { color: colors.primary },
            '& .MuiTabs-indicator': { bgcolor: colors.primary },
          }}
        >
          <Tab label="Firma Tara" />
          <Tab label="Taranan Firmalar" />
          <Tab label="Katalog Analizi" />
        </Tabs>
      </Box>

      {activeTab === 0 && <TabFirmaTara />}
      {activeTab === 1 && <TabTarananFirmalar />}
      {activeTab === 2 && <TabKatalogAnalizi />}
    </AdminLayout>
  );
}
