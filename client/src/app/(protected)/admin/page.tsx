'use client';

import React from 'react';
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
import ApartmentIcon from '@mui/icons-material/Apartment';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useQuery } from '@tanstack/react-query';
import AdminLayout from '@/components/layout/AdminLayout';
import { companyApplicationService } from '@/services/companyApplication.service';
import { ROUTES } from '@/utils/constants';
import { colors } from '@/utils/colors';

const APP_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: 'Beklemede', color: '#92400e', bg: '#fef3c7' },
  APPROVED: { label: 'Onaylandı', color: '#166534', bg: '#dcfce7' },
  REJECTED: { label: 'Reddedildi', color: colors.error, bg: colors.errorContainer },
};

const APP_TYPE: Record<string, { label: string; color: string; bg: string }> = {
  MANUAL_NEW: { label: 'Yeni Kayıt', color: colors.primary, bg: colors.primaryFixed },
  MANUAL_EXISTING: { label: 'Mevcut Firma', color: colors.secondary, bg: colors.secondaryFixed },
  AUTO_IMPORTED: { label: 'Otomatik', color: colors.tertiary, bg: colors.tertiaryFixed },
};

export default function AdminOverviewPage() {
  const { data: applications, isLoading } = useQuery({
    queryKey: ['admin-applications'],
    queryFn: companyApplicationService.getAll,
  });

  const pending = applications?.filter((a) => a.status === 'PENDING') ?? [];
  const recent = applications?.slice(0, 5) ?? [];

  const STATS = [
    {
      label: 'Toplam Firma',
      value: '—',
      icon: <ApartmentIcon sx={{ fontSize: '1.5rem', color: colors.primary }} />,
      trend: '+12%',
      trendColor: colors.tertiary,
    },
    {
      label: 'Bekleyen Başvurular',
      value: isLoading ? '...' : pending.length.toString(),
      icon: <HourglassEmptyIcon sx={{ fontSize: '1.5rem', color: '#d97706' }} />,
      badge: pending.length > 0 ? `Öncelikli: ${Math.min(pending.length, 8)}` : null,
    },
    {
      label: 'Aktif Malzeme',
      value: '—',
      icon: <Inventory2Icon sx={{ fontSize: '1.5rem', color: colors.primary }} />,
      trend: '+5.4%',
      trendColor: colors.tertiary,
    },
    {
      label: 'Sistem Durumu',
      value: 'Optimal',
      icon: <CheckCircleIcon sx={{ fontSize: '1.5rem', color: colors.tertiary }} />,
      statusDot: true,
    },
  ];

  return (
    <AdminLayout title="Genel Bakış">
      {/* Stat cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2,1fr)', lg: 'repeat(4,1fr)' }, gap: 3, mb: 6 }}>
        {STATS.map((s) => (
          <Box
            key={s.label}
            sx={{
              bgcolor: colors.surfaceContainerLow,
              borderRadius: 3,
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: 140,
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.08em', mb: 0.5 }}>
                  {s.label}
                </Typography>
                <Typography sx={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: '2rem', color: colors.onSurface, lineHeight: 1 }}>
                  {s.value}
                </Typography>
              </Box>
              <Box sx={{ width: 48, height: 48, bgcolor: colors.surfaceContainerHigh, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {s.icon}
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.8rem' }}>
              {s.trend && (
                <>
                  <TrendingUpIcon sx={{ fontSize: '1rem', color: s.trendColor }} />
                  <Typography sx={{ color: s.trendColor, fontWeight: 600, fontSize: '0.8rem' }}>{s.trend}</Typography>
                  <Typography sx={{ color: colors.onSurfaceVariant, fontSize: '0.8rem' }}>geçen aya göre</Typography>
                </>
              )}
              {s.badge && (
                <Box sx={{ px: 1.5, py: 0.25, bgcolor: colors.surfaceContainerHighest, borderRadius: 1, fontSize: '0.7rem', color: colors.onSurfaceVariant, fontWeight: 600 }}>
                  {s.badge}
                </Box>
              )}
              {s.statusDot && (
                <>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: colors.tertiary }} />
                  <Typography sx={{ color: colors.onSurfaceVariant, fontSize: '0.8rem' }}>Tüm servisler çalışıyor</Typography>
                </>
              )}
            </Box>
          </Box>
        ))}
      </Box>

      {/* Recent applications */}
      <Box sx={{ bgcolor: colors.surfaceContainerLowest, borderRadius: 3, overflow: 'hidden', border: `1px solid rgba(195,198,215,0.15)` }}>
        <Box sx={{ p: 3, borderBottom: `1px solid rgba(195,198,215,0.15)`, bgcolor: colors.surfaceContainerLow, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: colors.onSurface }}>Son Başvurular</Typography>
          <Button
            component={Link}
            href={ROUTES.ADMIN_APPROVALS}
            endIcon={<ArrowForwardIcon />}
            sx={{ color: colors.primary, fontWeight: 600, fontSize: '0.875rem' }}
          >
            Tümünü Gör
          </Button>
        </Box>

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: colors.surface }}>
                {['Başvuru No', 'Firma Adı', 'Tür', 'Tarih', 'Durum', 'İşlem'].map((h) => (
                  <TableCell key={h} sx={{ fontWeight: 600, color: colors.onSurfaceVariant, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: `1px solid rgba(195,198,215,0.15)` }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {recent.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6, color: colors.onSurfaceVariant }}>
                    Başvuru bulunamadı
                  </TableCell>
                </TableRow>
              ) : (
                recent.map((app) => {
                  const status = APP_STATUS[app.status] ?? APP_STATUS.PENDING;
                  const type = APP_TYPE[app.applicationType] ?? APP_TYPE.MANUAL_NEW;
                  return (
                    <TableRow key={app.id} sx={{ '&:hover': { bgcolor: `${colors.surfaceContainerLow}50` }, borderBottom: `1px solid rgba(195,198,215,0.1)` }}>
                      <TableCell sx={{ fontWeight: 600, color: colors.onSurface, fontSize: '0.875rem' }}>#{app.id}</TableCell>
                      <TableCell sx={{ fontWeight: 500, color: colors.onSurface }}>{app.proposedCompanyName ?? `Başvuru #${app.id}`}</TableCell>
                      <TableCell>
                        <Chip label={type.label} size="small" sx={{ bgcolor: type.bg, color: type.color, fontWeight: 700, fontSize: '0.65rem', height: 22 }} />
                      </TableCell>
                      <TableCell sx={{ color: colors.onSurfaceVariant, fontSize: '0.875rem' }}>
                        {new Date(app.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </TableCell>
                      <TableCell>
                        <Chip label={status.label} size="small" sx={{ bgcolor: status.bg, color: status.color, fontWeight: 700, fontSize: '0.7rem', height: 22 }} />
                      </TableCell>
                      <TableCell>
                        <Button
                          component={Link}
                          href={ROUTES.ADMIN_APPROVALS}
                          sx={{ color: colors.primary, fontWeight: 600, fontSize: '0.8rem', p: 0 }}
                        >
                          İncele
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        )}
      </Box>
    </AdminLayout>
  );
}
