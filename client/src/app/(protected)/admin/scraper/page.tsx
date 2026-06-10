'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Drawer,
  FormControl,
  FormControlLabel,
  InputLabel,
  Link,
  MenuItem,
  OutlinedInput,
  Select,
  Snackbar,
  Switch,
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
import AnalyticsIcon from '@mui/icons-material/Analytics';
import AddCircleOutlinedIcon from '@mui/icons-material/AddCircleOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import DescriptionIcon from '@mui/icons-material/Description';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import CancelIcon from '@mui/icons-material/Cancel';
import ReplayIcon from '@mui/icons-material/Replay';
import LaunchIcon from '@mui/icons-material/Launch';
import DownloadIcon from '@mui/icons-material/Download';
import AdminLayout from '@/components/layout/AdminLayout';
import { colors } from '@/utils/colors';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  adminService,
  ScraperResult,
  ScraperImportRequest,
  MaterialsCandidates,
  MaterialCandidate,
} from '@/services/admin.service';
import { useRouter } from 'next/navigation';
import axios from 'axios';

// ── Constants ─────────────────────────────────────────────────────

const SECTORS = [
  'Çelik', 'Metal', 'Alüminyum', 'Demir', 'Dökme Demir', 'Bakır', 'Pirinç',
  'Plastik', 'Polimer', 'İnşaat Malzemeleri', 'Elektrik', 'Elektronik',
  'Makine', 'Endüstriyel Ekipman', 'Pompa', 'Vana', 'Boru',
  'Bağlantı Elemanları', 'Kimya', 'Boya', 'Ahşap', 'Mobilya', 'Çeşitli',
];

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080').replace(/\/$/, '');

// ── Types ─────────────────────────────────────────────────────────

type JobStatus = 'running' | 'completed' | 'partial' | 'failed' | 'error' | 'cancelled';

interface ScrapeJob {
  id: string;
  companyName: string;
  website: string;
  sectors: string[];
  status: JobStatus;
  startedAt: number;
  endedAt?: number;
  result?: ScraperResult;
  errorMessage?: string;
}

type SnackbarState = { message: string; severity: 'success' | 'error' | 'info' };

// ── Helpers ───────────────────────────────────────────────────────

function sanitizeDescription(text: string | null | undefined): string | null {
  if (!text || text.length < 10) return null;
  const alphaCount = [...text].filter((c) => /\p{L}/u.test(c)).length;
  if (alphaCount / text.length < 0.5) return null;
  return text;
}

function sanitizeFilename(name: string): string {
  return name.replace(/[<>:"/\\|?* ]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '') || 'unnamed_file';
}

function scraperFileUrl(companyName: string, filename: string): string {
  return `${API_BASE}/scraper-files/${encodeURIComponent(sanitizeFilename(companyName))}/${encodeURIComponent(filename)}`;
}

function formatElapsed(startedAt: number, endedAt?: number, now?: number): string {
  const ms = (endedAt ?? now ?? Date.now()) - startedAt;
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return m > 0 ? `${m}dk ${s}s` : `${s}s`;
}

// ── StatusChip ────────────────────────────────────────────────────

const STATUS_STYLE: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  SUCCESS:   { label: 'Başarılı',   color: '#166534', bg: '#dcfce7', icon: <CheckCircleIcon sx={{ fontSize: '0.9rem' }} /> },
  PARTIAL:   { label: 'Kısmi',      color: '#92400e', bg: '#fef3c7', icon: <WarningAmberIcon sx={{ fontSize: '0.9rem' }} /> },
  FAILED:    { label: 'Başarısız',  color: colors.error, bg: '#fee2e2', icon: <ErrorOutlinedIcon sx={{ fontSize: '0.9rem' }} /> },
  ERROR:     { label: 'Hata',       color: colors.error, bg: '#fee2e2', icon: <ErrorOutlinedIcon sx={{ fontSize: '0.9rem' }} /> },
  completed: { label: 'Başarılı',   color: '#166534', bg: '#dcfce7', icon: <CheckCircleIcon sx={{ fontSize: '0.9rem' }} /> },
  partial:   { label: 'Kısmi',      color: '#92400e', bg: '#fef3c7', icon: <WarningAmberIcon sx={{ fontSize: '0.9rem' }} /> },
  failed:    { label: 'Başarısız',  color: colors.error, bg: '#fee2e2', icon: <ErrorOutlinedIcon sx={{ fontSize: '0.9rem' }} /> },
  error:     { label: 'Hata',       color: colors.error, bg: '#fee2e2', icon: <ErrorOutlinedIcon sx={{ fontSize: '0.9rem' }} /> },
  running:   { label: 'Taranıyor',  color: colors.primary, bg: '#e0eaff', icon: <CircularProgress size={10} sx={{ color: colors.primary }} /> },
  cancelled: { label: 'İptal',      color: colors.onSurfaceVariant, bg: colors.surfaceContainerHigh, icon: <CancelIcon sx={{ fontSize: '0.9rem' }} /> },
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

// ── ImportDialog (editable fields) ────────────────────────────────

interface ImportDialogProps {
  open: boolean;
  result: ScraperResult | null;
  onClose: () => void;
  onSuccess: () => void;
}

function ImportDialog({ open, result, onClose, onSuccess }: ImportDialogProps) {
  const router = useRouter();
  const [fields, setFields] = useState({
    companyName: '', phone: '', email: '', city: '', district: '', address: '',
  });
  const [selectedCatalog, setSelectedCatalog] = useState<string>('');

  useEffect(() => {
    if (result) {
      setFields({
        companyName: result.companyName ?? '',
        phone: result.phone ?? '',
        email: result.email ?? '',
        city: result.city ?? '',
        district: result.district ?? '',
        address: result.address ?? '',
      });
      setSelectedCatalog(result.catalogFiles?.[0] ?? '');
    }
  }, [result]);

  const importMutation = useMutation({
    mutationFn: (req: ScraperImportRequest) => adminService.importCompany(req),
    onSuccess: () => {
      onSuccess();
      onClose();
      router.push('/admin/approvals');
    },
  });

  if (!result) return null;

  function field(key: keyof typeof fields) {
    return (
      <TextField
        label={({ companyName: 'Firma Adı', phone: 'Telefon', email: 'E-posta', city: 'Şehir', district: 'İlçe', address: 'Adres' })[key]}
        value={fields[key]}
        onChange={(e) => setFields((p) => ({ ...p, [key]: e.target.value }))}
        size="small"
        fullWidth
      />
    );
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
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
          {field('companyName')}
          {field('phone')}
          {field('email')}
          {field('city')}
          {field('district')}
        </Box>
        {field('address')}
        {(result.catalogFiles?.length ?? 0) > 0 && (
          <FormControl size="small" fullWidth>
            <InputLabel>Katalog Dosyası</InputLabel>
            <Select value={selectedCatalog} label="Katalog Dosyası" onChange={(e) => setSelectedCatalog(e.target.value)}>
              <MenuItem value=""><em>Katalog aktarma</em></MenuItem>
              {result.catalogFiles.map((f) => <MenuItem key={f} value={f}>{f}</MenuItem>)}
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
          onClick={() => importMutation.mutate({
            companyName: fields.companyName,
            website: result.website,
            sectors: result.sectors,
            phone: fields.phone || null,
            email: fields.email || null,
            city: fields.city || null,
            district: fields.district || null,
            address: fields.address || null,
            catalogFile: selectedCatalog || null,
            logoUrl: result.logoUrl,
            description: result.description,
          })}
          disabled={importMutation.isPending || !fields.companyName.trim()}
          startIcon={importMutation.isPending ? <CircularProgress size={16} color="inherit" /> : <CloudUploadIcon />}
        >
          {importMutation.isPending ? 'Aktarılıyor...' : 'Sisteme Aktar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Result Detail Drawer ──────────────────────────────────────────

function ResultDetailDrawer({ open, result, onClose, onImport }: {
  open: boolean;
  result: ScraperResult | null;
  onClose: () => void;
  onImport: (r: ScraperResult) => void;
}) {
  if (!result) return null;

  function DetailRow({ icon, label, value, href }: { icon: React.ReactNode; label: string; value?: string | null; href?: string }) {
    if (!value) return null;
    return (
      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
        <Box sx={{ color: colors.onSurfaceVariant, mt: 0.25, flexShrink: 0 }}>{icon}</Box>
        <Box>
          <Typography sx={{ fontSize: '0.7rem', color: colors.onSurfaceVariant }}>{label}</Typography>
          {href ? (
            <Typography component="a" href={href} sx={{ fontSize: '0.875rem', color: colors.primary, textDecoration: 'none', fontWeight: 500, wordBreak: 'break-word', '&:hover': { textDecoration: 'underline' } }}>
              {value}
            </Typography>
          ) : (
            <Typography sx={{ fontSize: '0.875rem', color: colors.onSurface, fontWeight: 500, wordBreak: 'break-word' }}>
              {value}
            </Typography>
          )}
        </Box>
      </Box>
    );
  }

  return (
    <Drawer anchor="right" open={open} onClose={onClose}
      slotProps={{ paper: { sx: { width: { xs: '100%', sm: 520 }, display: 'flex', flexDirection: 'column' } } }}>

      {/* Başlık */}
      <Box sx={{ px: 3, py: 2.5, borderBottom: `1px solid rgba(195,198,215,0.2)`, bgcolor: colors.surfaceContainerLow, flexShrink: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography sx={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: '1rem', color: colors.onSurface }}>
            {result.companyName ?? '—'}
          </Typography>
          <StatusChip status={result.status} />
        </Box>
        {result.website && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography component="a" href={result.website} target="_blank" rel="noopener noreferrer"
              sx={{ fontSize: '0.78rem', color: colors.primary, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
              {result.website}
            </Typography>
            <OpenInNewIcon sx={{ fontSize: '0.75rem', color: colors.primary }} />
          </Box>
        )}
        {result.scrapeDate && (
          <Typography sx={{ fontSize: '0.7rem', color: colors.onSurfaceVariant, mt: 0.5 }}>
            {result.scrapeDate.substring(0, 10)} tarihinde tarandı
          </Typography>
        )}
      </Box>

      {/* İçerik */}
      <Box sx={{ flex: 1, overflow: 'auto', px: 3, py: 2.5, display: 'flex', flexDirection: 'column', gap: 3 }}>

        {/* Logo */}
        {result.logoUrl && (
          <Box>
            <Typography sx={{ fontSize: '0.7rem', color: colors.onSurfaceVariant, mb: 1, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Logo</Typography>
            <Box component="img" src={result.logoUrl} alt={result.companyName ?? ''}
              sx={{ maxHeight: 60, maxWidth: 200, objectFit: 'contain', bgcolor: '#fff', p: 1, borderRadius: 1, border: `1px solid rgba(195,198,215,0.3)` }}
              onError={(e: React.SyntheticEvent<HTMLImageElement>) => { e.currentTarget.style.display = 'none'; }}
            />
          </Box>
        )}

        {/* İletişim */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Typography sx={{ fontSize: '0.7rem', color: colors.onSurfaceVariant, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            İletişim Bilgileri
          </Typography>
          <DetailRow icon={<PhoneIcon sx={{ fontSize: '1rem' }} />} label="Telefon" value={result.phone} href={result.phone ? `tel:${result.phone}` : undefined} />
          <DetailRow icon={<EmailIcon sx={{ fontSize: '1rem' }} />} label="E-posta" value={result.email} href={result.email ? `mailto:${result.email}` : undefined} />
          <DetailRow icon={<LocationOnIcon sx={{ fontSize: '1rem' }} />} label="Adres" value={result.address} />
          {(result.city || result.district) && (
            <DetailRow icon={<LocationOnIcon sx={{ fontSize: '1rem' }} />} label="Şehir / İlçe"
              value={[result.city, result.district].filter(Boolean).join(' / ')} />
          )}
          {!result.phone && !result.email && !result.address && (
            <Typography sx={{ fontSize: '0.8rem', color: colors.outline, fontStyle: 'italic' }}>İletişim bilgisi bulunamadı</Typography>
          )}
        </Box>

        <Divider />

        {/* Sektörler */}
        {result.sectors?.length > 0 && (
          <Box>
            <Typography sx={{ fontSize: '0.7rem', color: colors.onSurfaceVariant, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1 }}>Sektörler</Typography>
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              {result.sectors.map((s) => <Chip key={s} label={s} size="small" sx={{ bgcolor: colors.surfaceContainerHigh, fontSize: '0.75rem' }} />)}
            </Box>
          </Box>
        )}

        {/* Açıklama */}
        {sanitizeDescription(result.description) && (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 }}>
              <DescriptionIcon sx={{ fontSize: '0.9rem', color: colors.onSurfaceVariant }} />
              <Typography sx={{ fontSize: '0.7rem', color: colors.onSurfaceVariant, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Firma Açıklaması
              </Typography>
            </Box>
            <Typography sx={{ fontSize: '0.85rem', color: colors.onSurface, lineHeight: 1.65, whiteSpace: 'pre-line' }}>
              {sanitizeDescription(result.description)}
            </Typography>
          </Box>
        )}

        <Divider />

        {/* Katalog dosyaları */}
        <Box>
          <Typography sx={{ fontSize: '0.7rem', color: colors.onSurfaceVariant, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1 }}>
            İndirilen Kataloglar ({result.catalogCount})
          </Typography>
          {result.catalogFiles?.length > 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {result.catalogFiles.map((f) => (
                <Box key={f} component="a"
                  href={scraperFileUrl(result.companyName ?? '', f)}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    display: 'flex', alignItems: 'center', gap: 1, p: 1, borderRadius: 1,
                    bgcolor: colors.surfaceContainerLow, border: `1px solid rgba(195,198,215,0.2)`,
                    textDecoration: 'none', cursor: 'pointer',
                    '&:hover': { bgcolor: colors.surfaceContainer, borderColor: colors.primary + '40' },
                  }}>
                  <DescriptionIcon sx={{ fontSize: '0.9rem', color: colors.onSurfaceVariant, flexShrink: 0 }} />
                  <Typography sx={{ fontSize: '0.78rem', color: colors.onSurface, flex: 1, wordBreak: 'break-all' }}>{f}</Typography>
                  <DownloadIcon sx={{ fontSize: '0.85rem', color: colors.onSurfaceVariant, flexShrink: 0 }} />
                </Box>
              ))}
            </Box>
          ) : (
            <Typography sx={{ fontSize: '0.8rem', color: colors.outline, fontStyle: 'italic' }}>Katalog indirilmedi</Typography>
          )}
        </Box>
      </Box>

      {/* Footer */}
      <Box sx={{ px: 3, py: 2, borderTop: `1px solid rgba(195,198,215,0.2)`, display: 'flex', gap: 1.5, flexShrink: 0 }}>
        <Button variant="outlined" onClick={onClose} sx={{ flex: 1 }}>Kapat</Button>
        {!result.imported && (result.status === 'SUCCESS' || result.status === 'PARTIAL') && (
          <Button variant="contained" startIcon={<CloudUploadIcon />} onClick={() => { onClose(); onImport(result); }} sx={{ flex: 1 }}>
            Sisteme Aktar
          </Button>
        )}
        {result.imported && result.companyId ? (
          <Button variant="outlined" component="a" href={`/admin/companies`} startIcon={<LaunchIcon />} sx={{ flex: 1 }}>
            Firmayı Gör
          </Button>
        ) : result.imported ? (
          <Chip label="Aktarıldı" sx={{ alignSelf: 'center', bgcolor: '#dcfce7', color: '#166534', fontWeight: 700 }} />
        ) : null}
      </Box>
    </Drawer>
  );
}

// ── ConfirmDialog ─────────────────────────────────────────────────

function ConfirmDialog({ open, title, body, confirmLabel, onConfirm, onClose }: {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontFamily: 'var(--font-manrope)', fontWeight: 700 }}>{title}</DialogTitle>
      <DialogContent>
        <Typography sx={{ fontSize: '0.875rem', color: colors.onSurface }}>{body}</Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Vazgeç</Button>
        <Button variant="contained" onClick={() => { onConfirm(); onClose(); }}>{confirmLabel}</Button>
      </DialogActions>
    </Dialog>
  );
}

// ── JobCard (Tab 1) ───────────────────────────────────────────────

function JobCard({ job, now, onCancel, onRetry, onGoToTab2 }: {
  job: ScrapeJob;
  now: number;
  onCancel: () => void;
  onRetry: () => void;
  onGoToTab2: () => void;
}) {
  const isRunning = job.status === 'running';
  const isDone = job.status === 'completed' || job.status === 'partial';
  const isBad = job.status === 'failed' || job.status === 'error' || job.status === 'cancelled';

  const borderColor = isRunning ? colors.primary + '60'
    : isDone ? '#86efac'
    : '#fca5a5';
  const bgColor = isRunning ? '#f0f5ff'
    : isDone ? '#f0fdf4'
    : '#fff1f2';

  return (
    <Box sx={{ borderRadius: 2, border: `1px solid ${borderColor}`, bgcolor: bgColor, p: 2, display: 'flex', gap: 2, alignItems: 'flex-start' }}>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: colors.onSurface, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {job.companyName}
          </Typography>
          <StatusChip status={job.status} />
        </Box>
        <Typography sx={{ fontSize: '0.75rem', color: colors.onSurfaceVariant, mb: 0.75 }}>{job.website}</Typography>

        {isRunning && (
          <Typography sx={{ fontSize: '0.75rem', color: colors.primary, fontWeight: 600 }}>
            {formatElapsed(job.startedAt, undefined, now)} geçti — lütfen bekleyin...
          </Typography>
        )}
        {isDone && job.result && (
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <Typography sx={{ fontSize: '0.75rem', color: colors.onSurfaceVariant }}>
              {job.result.catalogCount} katalog
            </Typography>
            {job.result.phone && <Typography sx={{ fontSize: '0.75rem', color: colors.onSurfaceVariant }}>· {job.result.phone}</Typography>}
            {job.result.email && <Typography sx={{ fontSize: '0.75rem', color: colors.onSurfaceVariant }}>· {job.result.email}</Typography>}
            <Typography sx={{ fontSize: '0.75rem', color: colors.onSurfaceVariant }}>
              · {formatElapsed(job.startedAt, job.endedAt)}
            </Typography>
          </Box>
        )}
        {isBad && job.errorMessage && (
          <Typography sx={{ fontSize: '0.75rem', color: colors.error }}>{job.errorMessage}</Typography>
        )}
        {isBad && !job.errorMessage && job.status === 'cancelled' && (
          <Typography sx={{ fontSize: '0.75rem', color: colors.onSurfaceVariant }}>Kullanıcı tarafından iptal edildi</Typography>
        )}
        {isBad && !job.errorMessage && job.status !== 'cancelled' && (
          <Typography sx={{ fontSize: '0.75rem', color: colors.error }}>Katalog veya iletişim bilgisi bulunamadı</Typography>
        )}
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, flexShrink: 0 }}>
        {isRunning && (
          <Button size="small" variant="outlined" startIcon={<CancelIcon sx={{ fontSize: '0.85rem' }} />} onClick={onCancel}
            sx={{ fontSize: '0.72rem', py: 0.5, borderColor: colors.error, color: colors.error }}>
            İptal
          </Button>
        )}
        {(isBad) && (
          <Button size="small" variant="outlined" startIcon={<ReplayIcon sx={{ fontSize: '0.85rem' }} />} onClick={onRetry}
            sx={{ fontSize: '0.72rem', py: 0.5 }}>
            Tekrar Dene
          </Button>
        )}
        {isDone && (
          <Button size="small" variant="outlined" startIcon={<LaunchIcon sx={{ fontSize: '0.85rem' }} />} onClick={onGoToTab2}
            sx={{ fontSize: '0.72rem', py: 0.5, borderColor: colors.primary, color: colors.primary }}>
            Tarananlar
          </Button>
        )}
      </Box>
    </Box>
  );
}

// ── Tab 1: Tara ───────────────────────────────────────────────────

function TabFirmaTara({ jobs, onStart, onCancel, onRetry, now, onGoToTab2 }: {
  jobs: ScrapeJob[];
  onStart: (companyName: string, website: string, sectors: string[]) => void;
  onCancel: (id: string) => void;
  onRetry: (id: string) => void;
  now: number;
  onGoToTab2: () => void;
}) {
  const [companyName, setCompanyName] = useState('');
  const [website, setWebsite] = useState('');
  const [sectors, setSectors] = useState<string[]>([]);

  const canSubmit = companyName.trim().length > 0 && website.trim().length > 0;
  const runningCount = jobs.filter((j) => j.status === 'running').length;

  function handleStart() {
    if (!canSubmit) return;
    onStart(companyName.trim(), website.trim(), sectors);
    setCompanyName('');
    setWebsite('');
    setSectors([]);
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 720 }}>
      {/* Form */}
      <Box sx={{ bgcolor: colors.surfaceContainerLowest, borderRadius: 3, p: 4, border: `1px solid rgba(195,198,215,0.15)`, boxShadow: colors.shadowSm, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <Typography sx={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: '1rem', color: colors.onSurface }}>
          Firma Bilgileri
        </Typography>
        <TextField label="Firma Adı" value={companyName} onChange={(e) => setCompanyName(e.target.value)} fullWidth size="small" placeholder="Örn: Borusan Boru"
          onKeyDown={(e) => e.key === 'Enter' && handleStart()} />
        <TextField label="Website URL" value={website} onChange={(e) => setWebsite(e.target.value)} fullWidth size="small" placeholder="https://..."
          onKeyDown={(e) => e.key === 'Enter' && handleStart()} />
        <FormControl size="small" fullWidth>
          <InputLabel>Sektörler</InputLabel>
          <Select multiple value={sectors}
            onChange={(e) => { const v = e.target.value; setSectors(typeof v === 'string' ? v.split(',') : v as string[]); }}
            input={<OutlinedInput label="Sektörler" />}
            renderValue={(sel) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {(sel as string[]).map((v) => <Chip key={v} label={v} size="small" />)}
              </Box>
            )}>
            {SECTORS.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </Select>
        </FormControl>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button variant="contained" startIcon={<PlayArrowIcon />} onClick={handleStart} disabled={!canSubmit}
            sx={{ alignSelf: 'flex-start', px: 4, py: 1.25 }}>
            Tara
          </Button>
          {runningCount > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={14} sx={{ color: colors.primary }} />
              <Typography sx={{ fontSize: '0.8rem', color: colors.primary, fontWeight: 600 }}>
                {runningCount} aktif tarama devam ediyor
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* İşler listesi */}
      {jobs.length > 0 && (
        <Box>
          <Typography sx={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: '0.9rem', color: colors.onSurface, mb: 1.5 }}>
            Aktif / Son İşler
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {[...jobs].reverse().map((job) => (
              <JobCard
                key={job.id}
                job={job}
                now={now}
                onCancel={() => onCancel(job.id)}
                onRetry={() => onRetry(job.id)}
                onGoToTab2={onGoToTab2}
              />
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
}

// ── Tab 2: Tarananlar ─────────────────────────────────────────────

type ResultFilter = 'ALL' | 'NOT_IMPORTED' | 'PARTIAL' | 'FAILED';

function TabTarananFirmalar({ onStartScrape, onSnackbar }: {
  onStartScrape: (companyName: string, website: string, sectors: string[]) => void;
  onSnackbar: (msg: string, sev: SnackbarState['severity']) => void;
}) {
  const [filter, setFilter] = useState<ResultFilter>('ALL');
  const [search, setSearch] = useState('');
  const [importTarget, setImportTarget] = useState<ScraperResult | null>(null);
  const [detailTarget, setDetailTarget] = useState<ScraperResult | null>(null);
  const [rescrapeTarget, setRescrapeTarget] = useState<ScraperResult | null>(null);
  const queryClient = useQueryClient();

  const { data: results = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['scraper-results'],
    queryFn: adminService.getScraperResults,
  });

  const counts: Record<ResultFilter, number> = {
    ALL: results.length,
    NOT_IMPORTED: results.filter((r) => !r.imported).length,
    PARTIAL: results.filter((r) => r.status === 'PARTIAL').length,
    FAILED: results.filter((r) => r.status === 'FAILED' || r.status === 'ERROR').length,
  };

  const filtered = results.filter((r) => {
    const matchesSearch = !search || (r.companyName ?? '').toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      filter === 'ALL' ? true :
      filter === 'NOT_IMPORTED' ? !r.imported :
      filter === 'PARTIAL' ? r.status === 'PARTIAL' :
      r.status === 'FAILED' || r.status === 'ERROR';
    return matchesSearch && matchesFilter;
  });

  if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>;
  if (isError) return <Alert severity="error">Sonuçlar yüklenemedi.</Alert>;

  const FILTERS: { key: ResultFilter; label: string }[] = [
    { key: 'ALL', label: 'Tümü' },
    { key: 'NOT_IMPORTED', label: 'Aktarılmamış' },
    { key: 'PARTIAL', label: 'Kısmi' },
    { key: 'FAILED', label: 'Başarısız' },
  ];

  return (
    <Box>
      {/* Özet bar */}
      {results.length > 0 && (
        <Box sx={{ display: 'flex', gap: 1.5, mb: 3, flexWrap: 'wrap' }}>
          <Chip label={`${results.length} tarandı`} size="small" sx={{ bgcolor: colors.surfaceContainerHigh }} />
          <Chip label={`${results.filter((r) => r.imported).length} aktarıldı`} size="small" sx={{ bgcolor: '#dcfce7', color: '#166534' }} />
          <Chip label={`${counts.NOT_IMPORTED} bekliyor`} size="small" sx={{ bgcolor: '#fef3c7', color: '#92400e' }} />
          <Chip label={`${counts.FAILED} başarısız`} size="small" sx={{ bgcolor: '#fee2e2', color: colors.error }} />
        </Box>
      )}

      {/* Arama + filtreler + yenile */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2.5, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder="Firma ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ width: 220, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
        />
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {FILTERS.map((f) => (
            <Button key={f.key} variant={filter === f.key ? 'contained' : 'outlined'} size="small"
              onClick={() => setFilter(f.key)}
              sx={filter !== f.key ? { borderColor: 'rgba(195,198,215,0.4)', color: colors.onSurface } : {}}>
              {f.label}
              <Chip label={counts[f.key]} size="small" sx={{ ml: 0.75, height: 18, fontSize: '0.65rem',
                bgcolor: filter === f.key ? 'rgba(255,255,255,0.25)' : colors.surfaceContainerHigh,
                color: filter === f.key ? '#fff' : colors.onSurface }} />
            </Button>
          ))}
        </Box>
        <Button variant="outlined" size="small" startIcon={<RefreshIcon />} onClick={() => refetch()}
          sx={{ ml: 'auto', borderColor: 'rgba(195,198,215,0.4)', color: colors.onSurface }}>
          Yenile
        </Button>
      </Box>

      {filtered.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8, color: colors.onSurfaceVariant }}>
          <FolderOpenIcon sx={{ fontSize: '3rem', mb: 2, opacity: 0.4 }} />
          <Typography>{search ? 'Arama sonucu bulunamadı.' : 'Sonuç bulunamadı.'}</Typography>
        </Box>
      ) : (
        <Box sx={{ bgcolor: colors.surfaceContainerLowest, borderRadius: 3, overflow: 'hidden', border: `1px solid rgba(195,198,215,0.15)` }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: colors.surfaceContainerLow }}>
                {['Firma Adı', 'Sektörler', 'Katalog', 'İletişim', 'Durum', 'Tarih', ''].map((h) => (
                  <TableCell key={h} sx={{ fontSize: '0.75rem', fontWeight: 700, color: colors.onSurfaceVariant, py: 2 }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((r, i) => (
                <TableRow key={i} sx={{ '&:hover': { bgcolor: colors.surfaceContainerLow } }}>
                  <TableCell sx={{ py: 2 }}>
                    <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: colors.onSurface }}>{r.companyName || '—'}</Typography>
                    {r.imported && (
                      r.companyId ? (
                        <Chip component="a" href={`/admin/companies`} label="Aktarıldı" clickable size="small"
                          icon={<LaunchIcon sx={{ fontSize: '0.65rem !important' }} />}
                          sx={{ mt: 0.5, height: 20, fontSize: '0.65rem', bgcolor: '#dcfce7', color: '#166534', cursor: 'pointer' }} />
                      ) : (
                        <Chip label="Aktarıldı" size="small" sx={{ mt: 0.5, height: 20, fontSize: '0.65rem', bgcolor: '#dcfce7', color: '#166534' }} />
                      )
                    )}
                  </TableCell>
                  <TableCell sx={{ py: 2 }}>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {r.sectors.slice(0, 2).map((s) => <Chip key={s} label={s} size="small" sx={{ height: 22, fontSize: '0.7rem', bgcolor: colors.surfaceContainerHigh }} />)}
                      {r.sectors.length > 2 && <Chip label={`+${r.sectors.length - 2}`} size="small" sx={{ height: 22, fontSize: '0.7rem', bgcolor: colors.surfaceContainerHigh, color: colors.onSurfaceVariant }} />}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.875rem', color: r.catalogCount > 0 ? colors.onSurface : colors.outline, py: 2 }}>
                    {r.catalogCount} dosya
                  </TableCell>
                  <TableCell sx={{ py: 2 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                      {r.phone && (
                        <Typography component="a" href={`tel:${r.phone}`} sx={{ fontSize: '0.78rem', color: colors.onSurface, textDecoration: 'none', '&:hover': { color: colors.primary } }}>{r.phone}</Typography>
                      )}
                      {r.email && (
                        <Typography component="a" href={`mailto:${r.email}`} sx={{ fontSize: '0.78rem', color: colors.onSurface, textDecoration: 'none', '&:hover': { color: colors.primary } }}>{r.email}</Typography>
                      )}
                      {!r.phone && !r.email && <Typography sx={{ fontSize: '0.78rem', color: colors.outline }}>—</Typography>}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ py: 2 }}><StatusChip status={r.status} /></TableCell>
                  <TableCell sx={{ fontSize: '0.8rem', color: colors.onSurfaceVariant, py: 2 }}>
                    {r.scrapeDate ? r.scrapeDate.substring(0, 10) : '—'}
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap', py: 2 }}>
                    <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center' }}>
                      <Tooltip title="Detayları görüntüle">
                        <Button size="small" variant="outlined" onClick={() => setDetailTarget(r)}
                          sx={{ minWidth: 0, px: 1.25, py: 0.5, borderColor: 'rgba(195,198,215,0.5)', color: colors.onSurface }}>
                          <InfoOutlinedIcon sx={{ fontSize: '1rem' }} />
                        </Button>
                      </Tooltip>
                      {!r.imported && (r.status === 'SUCCESS' || r.status === 'PARTIAL') && (
                        <Button size="small" variant="outlined" onClick={() => setImportTarget(r)}
                          sx={{ fontSize: '0.75rem', px: 1.5, py: 0.5, borderColor: colors.primary, color: colors.primary }}>
                          Aktar
                        </Button>
                      )}
                      <Tooltip title="Tekrar tara">
                        <Button size="small" variant="outlined" onClick={() => setRescrapeTarget(r)}
                          sx={{ minWidth: 0, px: 1.25, py: 0.5, borderColor: 'rgba(195,198,215,0.5)', color: colors.onSurface }}>
                          <RefreshIcon sx={{ fontSize: '1rem' }} />
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

      <ResultDetailDrawer
        open={Boolean(detailTarget)}
        result={detailTarget}
        onClose={() => setDetailTarget(null)}
        onImport={(r) => { setDetailTarget(null); setImportTarget(r); }}
      />

      <ConfirmDialog
        open={Boolean(rescrapeTarget)}
        title="Firmayı Tekrar Tara"
        body={`"${rescrapeTarget?.companyName}" için yeni bir tarama başlatılacak. Bu işlem 5–10 dakika sürebilir. Tab 1'den ilerlemeyi takip edebilirsiniz.`}
        confirmLabel="Tara"
        onConfirm={() => {
          if (!rescrapeTarget) return;
          onStartScrape(rescrapeTarget.companyName ?? '', rescrapeTarget.website ?? '', rescrapeTarget.sectors);
          onSnackbar('Tarama başlatıldı. Tab 1\'den takip edebilirsiniz.', 'info');
        }}
        onClose={() => setRescrapeTarget(null)}
      />
    </Box>
  );
}

// ── Catalog Candidate Drawer ──────────────────────────────────────

function CandidateDrawer({ open, companyName, companyId, onClose, onSnackbar }: {
  open: boolean;
  companyName: string;
  companyId: number | null;
  onClose: () => void;
  onSnackbar: (msg: string, sev: SnackbarState['severity']) => void;
}) {
  const [linkToCompany, setLinkToCompany] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [candidates, setCandidates] = useState<MaterialsCandidates | null>(null);
  const [autoFetching, setAutoFetching] = useState(false);
  const queryClient = useQueryClient();

  // Drawer açılınca önceki analiz sonuçlarını kontrol et
  useEffect(() => {
    if (!open || !companyName) return;
    setCandidates(null);
    setSelected(new Set());
    setLinkToCompany(false);
    setAutoFetching(true);
    adminService.getCatalogCandidates(companyName)
      .then((data) => {
        if (data?.candidates?.length > 0) {
          setCandidates(data);
          setSelected(new Set(data.candidates.map((_, i) => i).filter((i) => data.candidates[i].confidence >= 0.85)));
        }
      })
      .catch(() => { /* henüz analiz edilmemiş */ })
      .finally(() => setAutoFetching(false));
  }, [open, companyName]);

  const analyzeMutation = useMutation({
    mutationFn: () => adminService.analyzeCatalog({ companyName }),
    onSuccess: (data) => {
      setCandidates(data);
      setSelected(new Set(data.candidates.map((_, i) => i).filter((i) => data.candidates[i].confidence >= 0.85)));
    },
  });

  const importMutation = useMutation({
    mutationFn: () => {
      if (!candidates) return Promise.reject('Aday yok');
      const items = candidates.candidates
        .filter((_, i) => selected.has(i))
        .map((c) => ({ materialName: c.name, companyId: linkToCompany && companyId ? companyId : undefined }));
      return adminService.importMaterials(items);
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['admin-materials'] });
      onSnackbar(
        `${result.created} malzeme eklendi${result.duplicates.length ? `, ${result.duplicates.length} zaten mevcut` : ''}.`,
        'success',
      );
      onClose();
    },
    onError: (err) => {
      onSnackbar(`Hata: ${(err as Error).message}`, 'error');
    },
  });

  function toggleAll(checked: boolean) {
    if (!candidates) return;
    setSelected(checked ? new Set(candidates.candidates.map((_, i) => i)) : new Set());
  }

  function toggleOne(i: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  }

  const allChecked = candidates ? selected.size === candidates.candidates.length : false;
  const highConf = candidates?.candidates.filter((c) => c.confidence >= 0.85).length ?? 0;

  return (
    <Drawer anchor="right" open={open} onClose={onClose}
      slotProps={{ paper: { sx: { width: { xs: '100%', sm: 560 }, p: 0, display: 'flex', flexDirection: 'column' } } }}>

      {/* Başlık */}
      <Box sx={{ px: 3, py: 2.5, borderBottom: `1px solid rgba(195,198,215,0.2)`, bgcolor: colors.surfaceContainerLow, flexShrink: 0 }}>
        <Typography sx={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: '1rem', color: colors.onSurface }}>
          Katalog Analizi
        </Typography>
        <Typography sx={{ fontSize: '0.8rem', color: colors.onSurfaceVariant, mt: 0.5 }}>{companyName}</Typography>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', px: 3, py: 2 }}>
        {/* Yükleniyor */}
        {autoFetching && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={28} />
          </Box>
        )}

        {/* Analiz edilmemiş */}
        {!autoFetching && !candidates && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center', py: 4 }}>
            <AnalyticsIcon sx={{ fontSize: '3rem', color: colors.onSurfaceVariant, opacity: 0.4 }} />
            <Typography sx={{ color: colors.onSurfaceVariant, fontSize: '0.875rem', textAlign: 'center' }}>
              PDF katalogları henüz analiz edilmemiş.<br />Malzeme adaylarını çıkarmak için analiz başlatın.
            </Typography>
            <Button
              variant="contained"
              startIcon={analyzeMutation.isPending ? <CircularProgress size={16} color="inherit" /> : <AnalyticsIcon />}
              onClick={() => analyzeMutation.mutate()}
              disabled={analyzeMutation.isPending}
            >
              {analyzeMutation.isPending ? 'Analiz Ediliyor...' : 'Analiz Et'}
            </Button>
            {analyzeMutation.isError && (
              <Alert severity="error" sx={{ fontSize: '0.8rem', width: '100%' }}>
                Analiz başarısız: {String((analyzeMutation.error as Error)?.message)}
              </Alert>
            )}
          </Box>
        )}

        {/* Sonuçlar */}
        {candidates && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Özet */}
            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
              <Chip label={`Toplam: ${candidates.totalCandidates}`} size="small" sx={{ bgcolor: colors.surfaceContainerHigh, fontSize: '0.75rem' }} />
              <Chip label={`Yüksek güven: ${highConf}`} size="small" sx={{ bgcolor: '#dcfce7', color: '#166534', fontSize: '0.75rem' }} />
              <Chip label={`Seçili: ${selected.size}`} size="small" sx={{ bgcolor: colors.primaryContainer, color: colors.primary, fontSize: '0.75rem' }} />
              {candidates.analyzedAt && (
                <Typography sx={{ fontSize: '0.72rem', color: colors.onSurfaceVariant, ml: 'auto' }}>
                  {candidates.analyzedAt.substring(0, 10)}
                </Typography>
              )}
            </Box>

            {/* Firma bağlantısı */}
            {companyId ? (
              <Box sx={{ bgcolor: colors.surfaceContainerLow, borderRadius: 2, px: 2, py: 1.5 }}>
                <FormControlLabel
                  control={<Switch checked={linkToCompany} onChange={(e) => setLinkToCompany(e.target.checked)} size="small" />}
                  label={
                    <Typography sx={{ fontSize: '0.85rem', color: colors.onSurface }}>
                      Firma bağlantısı oluştur
                      <Typography component="span" sx={{ fontSize: '0.75rem', color: colors.onSurfaceVariant, ml: 1 }}>
                        (company_materials tablosuna ekler)
                      </Typography>
                    </Typography>
                  }
                />
              </Box>
            ) : (
              <Box sx={{ bgcolor: '#fef3c7', borderRadius: 2, px: 2, py: 1.5 }}>
                <Typography sx={{ fontSize: '0.8rem', color: '#92400e' }}>
                  Firma bağlantısı oluşturmak için önce Tab 2&apos;den firmayı sisteme aktarın.
                </Typography>
              </Box>
            )}

            <Divider />

            {/* Seç tümünü */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Checkbox checked={allChecked} indeterminate={selected.size > 0 && !allChecked}
                onChange={(e) => toggleAll(e.target.checked)} size="small" />
              <Typography sx={{ fontSize: '0.8rem', color: colors.onSurfaceVariant }}>Tümünü seç / kaldır</Typography>
            </Box>

            {/* Aday listesi */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {candidates.candidates.map((c: MaterialCandidate, i: number) => (
                <Box key={i} onClick={() => toggleOne(i)}
                  sx={{
                    display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 1, borderRadius: 2, cursor: 'pointer',
                    bgcolor: selected.has(i) ? colors.primaryFixed : 'transparent',
                    '&:hover': { bgcolor: selected.has(i) ? colors.primaryFixed : colors.surfaceContainerLow },
                    border: `1px solid ${selected.has(i) ? colors.primary + '40' : 'transparent'}`,
                  }}>
                  <Checkbox checked={selected.has(i)} onChange={() => toggleOne(i)} size="small"
                    onClick={(e) => e.stopPropagation()} sx={{ p: 0.5 }} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontSize: '0.85rem', color: colors.onSurface, fontWeight: 500 }}>{c.name}</Typography>
                    {c.category && <Typography sx={{ fontSize: '0.7rem', color: colors.onSurfaceVariant }}>{c.category}</Typography>}
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexShrink: 0 }}>
                    <Chip label={c.confidence.toFixed(2)} size="small" sx={{ height: 18, fontSize: '0.65rem',
                      bgcolor: c.confidence >= 0.85 ? '#dcfce7' : '#fef3c7',
                      color: c.confidence >= 0.85 ? '#166534' : '#92400e' }} />
                    <Typography sx={{ fontSize: '0.7rem', color: colors.onSurfaceVariant }}>s.{c.sourcePage}</Typography>
                  </Box>
                </Box>
              ))}
            </Box>

            {/* Yeniden analiz */}
            <Button size="small" variant="text" startIcon={<ReplayIcon sx={{ fontSize: '0.85rem' }} />}
              onClick={() => analyzeMutation.mutate()} disabled={analyzeMutation.isPending}
              sx={{ alignSelf: 'flex-start', fontSize: '0.75rem', color: colors.onSurfaceVariant }}>
              {analyzeMutation.isPending ? 'Analiz Ediliyor...' : 'Yeniden Analiz Et'}
            </Button>
          </Box>
        )}
      </Box>

      {/* Alt butonlar */}
      {candidates && (
        <Box sx={{ px: 3, py: 2, borderTop: `1px solid rgba(195,198,215,0.2)`, display: 'flex', gap: 1.5, flexShrink: 0 }}>
          <Button variant="outlined" onClick={onClose} sx={{ flex: 1 }}>İptal</Button>
          <Button variant="contained"
            disabled={selected.size === 0 || importMutation.isPending}
            startIcon={importMutation.isPending ? <CircularProgress size={16} color="inherit" /> : <AddCircleOutlinedIcon />}
            onClick={() => importMutation.mutate()}
            sx={{ flex: 2 }}>
            {importMutation.isPending ? 'Ekleniyor...' : `${selected.size} Malzemeyi Havuza Ekle`}
          </Button>
        </Box>
      )}
    </Drawer>
  );
}

// ── Tab 3: Katalog Analizi ────────────────────────────────────────

function TabKatalogAnalizi({ onSnackbar }: { onSnackbar: (msg: string, sev: SnackbarState['severity']) => void }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeCompany, setActiveCompany] = useState<{ name: string; companyId: number | null } | null>(null);

  const { data: results = [], isLoading } = useQuery({
    queryKey: ['scraper-results'],
    queryFn: adminService.getScraperResults,
  });

  const withCatalogs = results.filter((r) => r.catalogCount > 0);

  return (
    <Box>
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
      ) : withCatalogs.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8, color: colors.onSurfaceVariant }}>
          <FolderOpenIcon sx={{ fontSize: '3rem', mb: 2, opacity: 0.4 }} />
          <Typography>Katalog bulunan firma yok. Önce Tab 1&apos;den firma tarayın.</Typography>
        </Box>
      ) : (
        <Box sx={{ bgcolor: colors.surfaceContainerLowest, borderRadius: 3, overflow: 'hidden', border: `1px solid rgba(195,198,215,0.15)` }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: colors.surfaceContainerLow }}>
                {['Firma Adı', 'Katalog', 'Sisteme Aktarıldı', 'İşlemler'].map((h) => (
                  <TableCell key={h} sx={{ fontSize: '0.75rem', fontWeight: 700, color: colors.onSurfaceVariant, py: 1.5 }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {withCatalogs.map((r, i) => (
                <TableRow key={i} sx={{ '&:hover': { bgcolor: colors.surfaceContainerLow } }}>
                  <TableCell sx={{ fontSize: '0.85rem', fontWeight: 600, color: colors.onSurface }}>{r.companyName || '—'}</TableCell>
                  <TableCell>
                    <Chip label={`${r.catalogCount} dosya`} size="small" sx={{ bgcolor: colors.surfaceContainerHigh, fontSize: '0.7rem' }} />
                  </TableCell>
                  <TableCell>
                    {r.imported
                      ? <Chip label="Aktarıldı" size="small" sx={{ bgcolor: '#dcfce7', color: '#166534', fontSize: '0.7rem' }} />
                      : <Chip label="Aktarılmadı" size="small" sx={{ bgcolor: colors.surfaceContainerHigh, color: colors.onSurfaceVariant, fontSize: '0.7rem' }} />}
                  </TableCell>
                  <TableCell>
                    <Button size="small" variant="outlined"
                      startIcon={<AnalyticsIcon sx={{ fontSize: '0.9rem' }} />}
                      onClick={() => { setActiveCompany({ name: r.companyName ?? '', companyId: r.companyId ? Number(r.companyId) : null }); setDrawerOpen(true); }}
                      sx={{ fontSize: '0.7rem', py: 0.25, borderColor: colors.primary, color: colors.primary }}>
                      Analiz Et
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}

      {activeCompany && (
        <CandidateDrawer
          open={drawerOpen}
          companyName={activeCompany.name}
          companyId={activeCompany.companyId}
          onClose={() => setDrawerOpen(false)}
          onSnackbar={onSnackbar}
        />
      )}
    </Box>
  );
}

// ── Ana sayfa ─────────────────────────────────────────────────────

export default function AdminScraperPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [jobs, setJobs] = useState<ScrapeJob[]>([]);
  const [snackbar, setSnackbar] = useState<SnackbarState | null>(null);
  const abortRefs = useRef<Record<string, AbortController>>({});
  const [now, setNow] = useState(Date.now());
  const queryClient = useQueryClient();

  // Canlı saat — sadece aktif iş varsa çalışır
  useEffect(() => {
    if (!jobs.some((j) => j.status === 'running')) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [jobs]);

  function startScrape(companyName: string, website: string, sectors: string[]) {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const controller = new AbortController();
    abortRefs.current[id] = controller;

    setJobs((prev) => [...prev, { id, companyName, website, sectors, status: 'running', startedAt: Date.now() }]);

    adminService.runScraper({ companyName, website, sectors }, controller.signal)
      .then((result) => {
        const status: JobStatus =
          result.status === 'SUCCESS' ? 'completed' :
          result.status === 'PARTIAL' ? 'partial' :
          result.status === 'FAILED' ? 'failed' : 'error';
        setJobs((prev) => prev.map((j) => j.id === id ? { ...j, status, endedAt: Date.now(), result } : j));
        queryClient.invalidateQueries({ queryKey: ['scraper-results'] });
      })
      .catch((err) => {
        if (axios.isCancel(err) || err?.name === 'CanceledError' || err?.name === 'AbortError') {
          setJobs((prev) => prev.map((j) => j.id === id ? { ...j, status: 'cancelled', endedAt: Date.now() } : j));
        } else {
          setJobs((prev) => prev.map((j) => j.id === id
            ? { ...j, status: 'error', endedAt: Date.now(), errorMessage: err?.message || 'Bilinmeyen hata' }
            : j));
        }
        queryClient.invalidateQueries({ queryKey: ['scraper-results'] });
      });
  }

  function cancelJob(id: string) {
    abortRefs.current[id]?.abort();
  }

  function retryJob(id: string) {
    const job = jobs.find((j) => j.id === id);
    if (!job) return;
    setJobs((prev) => prev.filter((j) => j.id !== id));
    startScrape(job.companyName, job.website, job.sectors);
  }

  const { data: results = [] } = useQuery({
    queryKey: ['scraper-results'],
    queryFn: adminService.getScraperResults,
  });

  return (
    <AdminLayout title="Scraper Kontrol Paneli">
      <Box sx={{ borderBottom: `1px solid rgba(195,198,215,0.2)`, mb: 4 }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}
          sx={{
            '& .MuiTab-root': { fontSize: '0.875rem', fontWeight: 600, textTransform: 'none', color: colors.onSurfaceVariant },
            '& .Mui-selected': { color: colors.primary },
            '& .MuiTabs-indicator': { bgcolor: colors.primary },
          }}>
          <Tab label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              Tara
              {jobs.filter((j) => j.status === 'running').length > 0 && (
                <Chip label={jobs.filter((j) => j.status === 'running').length} size="small"
                  sx={{ height: 18, fontSize: '0.65rem', bgcolor: colors.primary, color: '#fff', ml: 0.5 }} />
              )}
            </Box>
          } />
          <Tab label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              Tarananlar
              {results.length > 0 && (
                <Chip label={results.length} size="small"
                  sx={{ height: 18, fontSize: '0.65rem', bgcolor: colors.surfaceContainerHigh, color: colors.onSurface, ml: 0.5 }} />
              )}
            </Box>
          } />
          <Tab label="Katalog Analizi" />
        </Tabs>
      </Box>

      {activeTab === 0 && (
        <TabFirmaTara
          jobs={jobs}
          onStart={startScrape}
          onCancel={cancelJob}
          onRetry={retryJob}
          now={now}
          onGoToTab2={() => setActiveTab(1)}
        />
      )}
      {activeTab === 1 && (
        <TabTarananFirmalar
          onStartScrape={startScrape}
          onSnackbar={(msg, sev) => setSnackbar({ message: msg, severity: sev })}
        />
      )}
      {activeTab === 2 && (
        <TabKatalogAnalizi
          onSnackbar={(msg, sev) => setSnackbar({ message: msg, severity: sev })}
        />
      )}

      <Snackbar
        open={Boolean(snackbar)}
        autoHideDuration={4000}
        onClose={() => setSnackbar(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbar(null)} severity={snackbar?.severity ?? 'info'} sx={{ width: '100%' }}>
          {snackbar?.message}
        </Alert>
      </Snackbar>
    </AdminLayout>
  );
}
