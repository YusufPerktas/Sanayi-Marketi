'use client';

import React, { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
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
  Typography,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import LanguageIcon from '@mui/icons-material/Language';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
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

function InfoItem({ icon, label, value, href }: { icon: React.ReactNode; label: string; value: string | null; href?: string }) {
  if (!value) return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
      <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: colors.outline, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</Typography>
      <Typography sx={{ fontSize: '0.8rem', color: colors.outline, fontStyle: 'italic' }}>Girilmedi</Typography>
    </Box>
  );
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Box sx={{ color: colors.outline, display: 'flex', fontSize: '0.8rem' }}>{icon}</Box>
        <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: colors.outline, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</Typography>
      </Box>
      {href ? (
        <Typography component="a" href={href} sx={{ fontSize: '0.875rem', color: colors.primary, textDecoration: 'none', fontWeight: 600, '&:hover': { textDecoration: 'underline' } }}>
          {value}
        </Typography>
      ) : (
        <Typography sx={{ fontSize: '0.875rem', color: colors.onSurface }}>{value}</Typography>
      )}
    </Box>
  );
}

function DetailRow({ app }: { app: CompanyApplication }) {
  const location = [app.city, app.district].filter(Boolean).join(' / ') || null;
  return (
    <Box sx={{ px: 2, py: 2.5, bgcolor: colors.surfaceContainerLow, borderRadius: 2, mx: 1, mb: 1 }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 2.5 }}>
        <InfoItem icon={<EmailIcon sx={{ fontSize: '0.9rem' }} />} label="Giriş E-postası" value={app.userEmail} href={app.userEmail ? `mailto:${app.userEmail}` : undefined} />
        <InfoItem icon={<PhoneIcon sx={{ fontSize: '0.9rem' }} />} label="Telefon" value={app.phone} href={app.phone ? `tel:${app.phone}` : undefined} />
        <InfoItem icon={<EmailIcon sx={{ fontSize: '0.9rem' }} />} label="Firma E-postası" value={app.companyEmail} href={app.companyEmail ? `mailto:${app.companyEmail}` : undefined} />
        <InfoItem icon={<LanguageIcon sx={{ fontSize: '0.9rem' }} />} label="Web Sitesi" value={app.website} href={app.website ?? undefined} />
        <InfoItem icon={<LocationOnIcon sx={{ fontSize: '0.9rem' }} />} label="Konum" value={location} />
      </Box>

      {app.description && (
        <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid rgba(195,198,215,0.15)` }}>
          <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: colors.outline, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.5 }}>Açıklama</Typography>
          <Typography sx={{ fontSize: '0.875rem', color: colors.onSurface, lineHeight: 1.6 }}>{app.description}</Typography>
        </Box>
      )}

      {app.rejectionReason && (
        <Box sx={{ mt: 2, p: 2, bgcolor: colors.errorContainer, borderRadius: 1.5 }}>
          <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: colors.error, mb: 0.5 }}>Red Sebebi:</Typography>
          <Typography sx={{ fontSize: '0.875rem', color: colors.onErrorContainer }}>{app.rejectionReason}</Typography>
        </Box>
      )}
    </Box>
  );
}

function AppRow({
  app,
  onApprove,
  onReject,
  approving,
}: {
  app: CompanyApplication;
  onApprove: (id: number) => void;
  onReject: (app: CompanyApplication) => void;
  approving: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const st = STATUS_CONFIG[app.status] ?? STATUS_CONFIG.PENDING;
  const tp = TYPE_CONFIG[app.applicationType] ?? TYPE_CONFIG.MANUAL_NEW;

  return (
    <>
      <TableRow
        sx={{
          '&:hover': { bgcolor: `${colors.surfaceContainerLow}50` },
          borderBottom: expanded ? 'none' : `1px solid rgba(195,198,215,0.1)`,
          cursor: 'pointer',
        }}
        onClick={() => setExpanded((v) => !v)}
      >
        <TableCell sx={{ fontWeight: 600, color: colors.onSurface, fontSize: '0.875rem', width: 48 }}>
          #{app.id}
        </TableCell>
        <TableCell>
          <Typography sx={{ fontWeight: 600, color: colors.onSurface, fontSize: '0.9rem' }}>
            {app.proposedCompanyName ?? `Başvuru #${app.id}`}
          </Typography>
          <Typography sx={{ fontSize: '0.78rem', color: colors.onSurfaceVariant, mt: 0.25 }}>
            {app.userEmail ?? '—'}
          </Typography>
        </TableCell>
        <TableCell>
          <Typography sx={{ fontSize: '0.875rem', color: colors.onSurface, fontWeight: 500 }}>
            {app.phone ?? <span style={{ color: colors.outline }}>—</span>}
          </Typography>
        </TableCell>
        <TableCell>
          <Typography sx={{ fontSize: '0.875rem', color: colors.onSurface }}>
            {app.city ?? <span style={{ color: colors.outline }}>—</span>}
          </Typography>
        </TableCell>
        <TableCell>
          <Chip label={tp.label} size="small" sx={{ bgcolor: tp.bg, color: tp.color, fontWeight: 700, fontSize: '0.65rem', height: 22 }} />
        </TableCell>
        <TableCell sx={{ color: colors.onSurfaceVariant, fontSize: '0.875rem' }}>
          {new Date(app.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}
        </TableCell>
        <TableCell>
          <Chip label={st.label} size="small" sx={{ bgcolor: st.bg, color: st.color, fontWeight: 700, fontSize: '0.7rem', height: 22 }} />
        </TableCell>
        <TableCell onClick={(e) => e.stopPropagation()}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {app.status === 'PENDING' && (
              <>
                <Button
                  size="small"
                  startIcon={<CheckIcon />}
                  onClick={() => onApprove(app.id)}
                  disabled={approving}
                  sx={{ bgcolor: '#dcfce7', color: '#166534', fontWeight: 700, fontSize: '0.75rem', '&:hover': { bgcolor: '#bbf7d0' } }}
                >
                  Onayla
                </Button>
                <Button
                  size="small"
                  startIcon={<CloseIcon />}
                  onClick={() => onReject(app)}
                  sx={{ bgcolor: colors.errorContainer, color: colors.error, fontWeight: 700, fontSize: '0.75rem', '&:hover': { bgcolor: '#fca5a5' } }}
                >
                  Reddet
                </Button>
              </>
            )}
            <IconButton size="small" sx={{ color: colors.outline }}>
              {expanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
            </IconButton>
          </Box>
        </TableCell>
      </TableRow>

      {/* Expandable detail row */}
      <TableRow sx={{ borderBottom: `1px solid rgba(195,198,215,0.1)` }}>
        <TableCell colSpan={8} sx={{ p: 0, border: 'none' }}>
          <Collapse in={expanded} timeout="auto" unmountOnExit>
            <DetailRow app={app} />
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

export default function AdminApprovalsPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<Filter>('PENDING');
  const [search, setSearch] = useState('');
  const [rejectTarget, setRejectTarget] = useState<CompanyApplication | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [snack, setSnack] = useState<{ msg: string; severity: 'success' | 'error' } | null>(null);

  const { data: applications, isLoading } = useQuery({
    queryKey: ['admin-applications'],
    queryFn: companyApplicationService.getAll,
  });

  const approveMutation = useMutation({
    mutationFn: companyApplicationService.approve,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-applications'] });
      setSnack({ msg: 'Başvuru onaylandı — kullanıcı rolü COMPANY_USER olarak güncellendi', severity: 'success' });
    },
    onError: () => setSnack({ msg: 'Onaylama sırasında hata oluştu', severity: 'error' }),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      companyApplicationService.reject(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-applications'] });
      setRejectTarget(null);
      setRejectReason('');
      setSnack({ msg: 'Başvuru reddedildi', severity: 'success' });
    },
    onError: () => setSnack({ msg: 'Reddetme sırasında hata oluştu', severity: 'error' }),
  });

  const counts = {
    PENDING: applications?.filter((a) => a.status === 'PENDING').length ?? 0,
    APPROVED: applications?.filter((a) => a.status === 'APPROVED').length ?? 0,
    REJECTED: applications?.filter((a) => a.status === 'REJECTED').length ?? 0,
    ALL: applications?.length ?? 0,
  };

  const filtered = (applications ?? []).filter((a) => {
    const matchesFilter = filter === 'ALL' || a.status === filter;
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      (a.proposedCompanyName ?? '').toLowerCase().includes(q) ||
      (a.userEmail ?? '').toLowerCase().includes(q) ||
      (a.phone ?? '').includes(q) ||
      (a.city ?? '').toLowerCase().includes(q);
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
          Satıra tıklayarak e-posta, telefon ve şehir bilgilerini genişletin.
        </Typography>
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
          maxWidth: 440,
        }}
      >
        <SearchIcon sx={{ color: colors.outline }} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Firma, e-posta, telefon veya şehir ara..."
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

      {/* Tab filter */}
      <Box sx={{ display: 'flex', gap: 1, mb: 5, bgcolor: colors.surfaceContainerLow, p: 0.75, borderRadius: 2, width: 'max-content' }}>
        {TABS.map((t) => (
          <Button
            key={t.key}
            onClick={() => setFilter(t.key)}
            sx={{
              px: 3, py: 1, borderRadius: 1.5, fontWeight: 700, fontSize: '0.875rem',
              bgcolor: filter === t.key ? colors.surfaceContainerHighest : 'transparent',
              color: filter === t.key ? colors.primary : colors.onSurfaceVariant,
              boxShadow: filter === t.key ? colors.shadowSm : 'none',
              gap: 1,
              '&:hover': { bgcolor: filter === t.key ? colors.surfaceContainerHighest : `${colors.surfaceContainerHigh}50` },
            }}
          >
            {t.label}
            {counts[t.key] > 0 && (
              <Box
                component="span"
                sx={{
                  width: 20, height: 20,
                  bgcolor: filter === t.key ? colors.primary : colors.outline,
                  color: '#fff', borderRadius: '50%',
                  fontSize: '0.7rem', fontWeight: 700,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
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
                {['#', 'Firma / E-posta', 'Telefon', 'Şehir', 'Tür', 'Tarih', 'Durum', 'İşlemler'].map((h) => (
                  <TableCell
                    key={h}
                    sx={{
                      fontWeight: 600, color: colors.onSurfaceVariant,
                      fontSize: '0.75rem', textTransform: 'uppercase',
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
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 8, color: colors.onSurfaceVariant }}>
                    Başvuru bulunamadı
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((app) => (
                  <AppRow
                    key={app.id}
                    app={app}
                    onApprove={(id) => approveMutation.mutate(id)}
                    onReject={setRejectTarget}
                    approving={approveMutation.isPending}
                  />
                ))
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
          <Box sx={{ mb: 3, p: 2, bgcolor: colors.surfaceContainerLow, borderRadius: 2 }}>
            <Typography sx={{ fontWeight: 700, color: colors.onSurface, mb: 0.5 }}>
              {rejectTarget?.proposedCompanyName}
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              {rejectTarget?.userEmail && (
                <Typography sx={{ fontSize: '0.825rem', color: colors.onSurfaceVariant }}>
                  📧 {rejectTarget.userEmail}
                </Typography>
              )}
              {rejectTarget?.phone && (
                <Typography sx={{ fontSize: '0.825rem', color: colors.onSurfaceVariant }}>
                  📞 {rejectTarget.phone}
                </Typography>
              )}
              {rejectTarget?.city && (
                <Typography sx={{ fontSize: '0.825rem', color: colors.onSurfaceVariant }}>
                  📍 {rejectTarget.city}
                </Typography>
              )}
            </Box>
          </Box>
          <OutlinedInput
            multiline
            rows={3}
            fullWidth
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Red sebebi (opsiyonel — başvuru sahibine gösterilecek)..."
            sx={{ '& fieldset': { borderColor: 'rgba(195,198,215,0.3)' } }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button onClick={() => setRejectTarget(null)} sx={{ color: colors.onSurfaceVariant }}>İptal</Button>
          <Button
            variant="contained"
            color="error"
            onClick={() =>
              rejectTarget && rejectMutation.mutate({ id: rejectTarget.id, reason: rejectReason })
            }
            disabled={rejectMutation.isPending}
          >
            Reddet
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!snack}
        autoHideDuration={4000}
        onClose={() => setSnack(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snack?.severity} onClose={() => setSnack(null)} sx={{ width: '100%' }}>
          {snack?.msg}
        </Alert>
      </Snackbar>
    </AdminLayout>
  );
}
