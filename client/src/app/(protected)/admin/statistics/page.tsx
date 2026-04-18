'use client';

import React from 'react';
import { Box, CircularProgress, Divider, Typography } from '@mui/material';
import ApartmentIcon from '@mui/icons-material/Apartment';
import CategoryIcon from '@mui/icons-material/Category';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import CancelIcon from '@mui/icons-material/Cancel';
import { useQuery } from '@tanstack/react-query';
import AdminLayout from '@/components/layout/AdminLayout';
import { companyService } from '@/services/company.service';
import { materialService } from '@/services/material.service';
import { companyApplicationService } from '@/services/companyApplication.service';
import { colors } from '@/utils/colors';

function StatCard({
  label,
  value,
  icon,
  color,
  loading,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  loading?: boolean;
}) {
  return (
    <Box
      sx={{
        bgcolor: colors.surfaceContainerLowest,
        borderRadius: 3,
        p: 3,
        border: `1px solid rgba(195,198,215,0.15)`,
        boxShadow: colors.shadowSm,
        display: 'flex',
        alignItems: 'center',
        gap: 3,
      }}
    >
      <Box
        sx={{
          width: 52,
          height: 52,
          bgcolor: `${color}15`,
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          '& svg': { color, fontSize: '1.5rem' },
        }}
      >
        {icon}
      </Box>
      <Box sx={{ flex: 1 }}>
        <Typography
          sx={{
            fontSize: '0.75rem',
            fontWeight: 700,
            color: colors.onSurfaceVariant,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            mb: 0.5,
          }}
        >
          {label}
        </Typography>
        {loading ? (
          <CircularProgress size={20} />
        ) : (
          <Typography
            sx={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: '1.75rem', color: colors.onSurface, lineHeight: 1 }}
          >
            {value}
          </Typography>
        )}
      </Box>
    </Box>
  );
}

export default function AdminStatisticsPage() {
  const { data: companiesPage, isLoading: loadingCompanies } = useQuery({
    queryKey: ['admin-stats-companies'],
    queryFn: () => companyService.getAll({ page: 0, size: 200 }),
  });

  const { data: materialsPage, isLoading: loadingMaterials } = useQuery({
    queryKey: ['admin-stats-materials'],
    queryFn: () => materialService.getAll({ page: 0, size: 1 }),
  });

  const { data: applications, isLoading: loadingApps } = useQuery({
    queryKey: ['admin-applications'],
    queryFn: companyApplicationService.getAll,
  });

  const totalCompanies = companiesPage?.totalElements ?? 0;
  const activeCompanies = (companiesPage?.content ?? []).filter((c) => c.status === 'ACTIVE').length;
  const totalMaterials = materialsPage?.totalElements ?? 0;

  const totalApps = applications?.length ?? 0;
  const pendingApps = (applications ?? []).filter((a) => a.status === 'PENDING').length;
  const approvedApps = (applications ?? []).filter((a) => a.status === 'APPROVED').length;
  const rejectedApps = (applications ?? []).filter((a) => a.status === 'REJECTED').length;
  const approvalRate =
    totalApps > 0 ? Math.round(((approvedApps) / (approvedApps + rejectedApps || 1)) * 100) : 0;

  // City distribution from loaded companies
  const cityMap: Record<string, number> = {};
  for (const c of companiesPage?.content ?? []) {
    if (c.city) cityMap[c.city] = (cityMap[c.city] ?? 0) + 1;
  }
  const cityData = Object.entries(cityMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const maxCity = cityData[0]?.[1] ?? 1;

  const loading = loadingCompanies || loadingMaterials || loadingApps;

  return (
    <AdminLayout title="İstatistikler">
      {/* Stat cards */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2,1fr)', lg: 'repeat(3,1fr)' },
          gap: 3,
          mb: 6,
        }}
      >
        <StatCard label="Toplam Firma" value={totalCompanies} icon={<ApartmentIcon />} color={colors.primary} loading={loadingCompanies} />
        <StatCard label="Aktif Firma" value={activeCompanies} icon={<ApartmentIcon />} color={colors.tertiary} loading={loadingCompanies} />
        <StatCard label="Toplam Malzeme" value={totalMaterials} icon={<CategoryIcon />} color={colors.secondary} loading={loadingMaterials} />
        <StatCard label="Toplam Başvuru" value={totalApps} icon={<AssignmentIndIcon />} color={colors.primary} loading={loadingApps} />
        <StatCard label="Onaylanan Başvuru" value={approvedApps} icon={<CheckCircleIcon />} color={colors.tertiary} loading={loadingApps} />
        <StatCard label="Onay Oranı" value={totalApps === 0 ? '—' : `%${approvalRate}`} icon={<AssignmentIndIcon />} color={colors.secondary} loading={loadingApps} />
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 4 }}>
        {/* Application breakdown */}
        <Box
          sx={{
            bgcolor: colors.surfaceContainerLowest,
            borderRadius: 3,
            p: 4,
            border: `1px solid rgba(195,198,215,0.15)`,
            boxShadow: colors.shadowSm,
          }}
        >
          <Typography sx={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, color: colors.onSurface, mb: 4 }}>
            Başvuru Dağılımı
          </Typography>
          {loadingApps ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
          ) : totalApps === 0 ? (
            <Typography sx={{ color: colors.onSurfaceVariant, fontSize: '0.875rem', py: 2 }}>Henüz başvuru yok</Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {[
                { label: 'Bekleyen', count: pendingApps, icon: <HourglassEmptyIcon />, color: '#d97706' },
                { label: 'Onaylanan', count: approvedApps, icon: <CheckCircleIcon />, color: '#16a34a' },
                { label: 'Reddedilen', count: rejectedApps, icon: <CancelIcon />, color: colors.error },
              ].map((row, i, arr) => (
                <React.Fragment key={row.label}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, py: 2.5 }}>
                    <Box sx={{ color: row.color, display: 'flex', '& svg': { fontSize: '1.25rem' } }}>{row.icon}</Box>
                    <Typography sx={{ flex: 1, fontWeight: 600, color: colors.onSurface }}>{row.label}</Typography>
                    <Typography sx={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: '1.5rem', color: colors.onSurface }}>
                      {row.count}
                    </Typography>
                    <Typography sx={{ fontSize: '0.8rem', color: colors.onSurfaceVariant, minWidth: 36, textAlign: 'right' }}>
                      %{totalApps > 0 ? Math.round((row.count / totalApps) * 100) : 0}
                    </Typography>
                  </Box>
                  {i < arr.length - 1 && <Divider sx={{ borderColor: `rgba(195,198,215,0.1)` }} />}
                </React.Fragment>
              ))}
            </Box>
          )}
        </Box>

        {/* City distribution */}
        <Box
          sx={{
            bgcolor: colors.surfaceContainerLowest,
            borderRadius: 3,
            p: 4,
            border: `1px solid rgba(195,198,215,0.15)`,
            boxShadow: colors.shadowSm,
          }}
        >
          <Typography sx={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, color: colors.onSurface, mb: 4 }}>
            Şehir Dağılımı
          </Typography>
          {loadingCompanies ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
          ) : cityData.length === 0 ? (
            <Typography sx={{ color: colors.onSurfaceVariant, fontSize: '0.875rem', py: 2 }}>
              Henüz şehir verisi yok
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {cityData.map(([city, count]) => {
                const pct = Math.round((count / maxCity) * 100);
                return (
                  <Box key={city}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: colors.onSurface }}>{city}</Typography>
                      <Typography sx={{ fontSize: '0.875rem', fontWeight: 700, color: colors.primary }}>{count}</Typography>
                    </Box>
                    <Box sx={{ height: 6, bgcolor: colors.surfaceContainerHigh, borderRadius: 3, overflow: 'hidden' }}>
                      <Box sx={{ height: '100%', width: `${pct}%`, background: colors.gradientPrimary, borderRadius: 3 }} />
                    </Box>
                  </Box>
                );
              })}
            </Box>
          )}
        </Box>
      </Box>
    </AdminLayout>
  );
}
