'use client';

import React from 'react';
import { Box, Divider, Typography } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ApartmentIcon from '@mui/icons-material/Apartment';
import CategoryIcon from '@mui/icons-material/Category';
import PeopleIcon from '@mui/icons-material/People';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import AdminLayout from '@/components/layout/AdminLayout';
import { colors } from '@/utils/colors';

const STATS = [
  { label: 'Toplam Firma', value: '1,248', change: '+12%', icon: <ApartmentIcon />, color: colors.primary },
  { label: 'Aktif Firma', value: '1,103', change: '+8%', icon: <ApartmentIcon />, color: colors.tertiary },
  { label: 'Toplam Malzeme', value: '8,905', change: '+5.4%', icon: <CategoryIcon />, color: colors.secondary },
  { label: 'Kayıtlı Kullanıcı', value: '3,241', change: '+22%', icon: <PeopleIcon />, color: colors.primary },
  { label: 'Toplam Başvuru', value: '412', change: '+3%', icon: <AssignmentIndIcon />, color: colors.secondary },
  { label: 'Onay Oranı', value: '%78', change: '+1.2%', icon: <TrendingUpIcon />, color: colors.tertiary },
];

const CITY_DATA = [
  { city: 'İstanbul', count: 487, pct: 39 },
  { city: 'Ankara', count: 198, pct: 16 },
  { city: 'İzmir', count: 156, pct: 12 },
  { city: 'Bursa', count: 124, pct: 10 },
  { city: 'Kocaeli', count: 98, pct: 8 },
  { city: 'Diğer', count: 185, pct: 15 },
];

const MATERIAL_DATA = [
  { name: 'Çelik', count: 1842 },
  { name: 'Alüminyum', count: 1456 },
  { name: 'Plastik', count: 987 },
  { name: 'Bakır', count: 654 },
  { name: 'Ahşap', count: 432 },
];

export default function AdminStatisticsPage() {
  return (
    <AdminLayout title="İstatistikler">
      {/* Stat cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2,1fr)', lg: 'repeat(3,1fr)' }, gap: 3, mb: 6 }}>
        {STATS.map((s) => (
          <Box
            key={s.label}
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
                bgcolor: `${s.color}15`,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                '& svg': { color: s.color, fontSize: '1.5rem' },
              }}
            >
              {s.icon}
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.08em', mb: 0.5 }}>
                {s.label}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5 }}>
                <Typography sx={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: '1.75rem', color: colors.onSurface, lineHeight: 1 }}>
                  {s.value}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                  <TrendingUpIcon sx={{ fontSize: '0.9rem', color: colors.tertiary }} />
                  <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: colors.tertiary }}>{s.change}</Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        ))}
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 4 }}>
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
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {CITY_DATA.map((c) => (
              <Box key={c.city}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: colors.onSurface }}>{c.city}</Typography>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Typography sx={{ fontSize: '0.875rem', color: colors.onSurfaceVariant }}>{c.count.toLocaleString('tr-TR')}</Typography>
                    <Typography sx={{ fontSize: '0.875rem', fontWeight: 700, color: colors.primary, minWidth: 36, textAlign: 'right' }}>%{c.pct}</Typography>
                  </Box>
                </Box>
                <Box sx={{ height: 6, bgcolor: colors.surfaceContainerHigh, borderRadius: 3, overflow: 'hidden' }}>
                  <Box
                    sx={{
                      height: '100%',
                      width: `${c.pct}%`,
                      background: colors.gradientPrimary,
                      borderRadius: 3,
                    }}
                  />
                </Box>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Popular materials */}
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
            En Çok Aranan Malzemeler
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {MATERIAL_DATA.map((m, i) => (
              <React.Fragment key={m.name}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, py: 2 }}>
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      bgcolor: i === 0 ? colors.primaryFixed : colors.surfaceContainerHigh,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Typography sx={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: '0.8rem', color: i === 0 ? colors.primary : colors.outline }}>
                      {i + 1}
                    </Typography>
                  </Box>
                  <Typography sx={{ flex: 1, fontWeight: 600, color: colors.onSurface }}>{m.name}</Typography>
                  <Typography sx={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, color: colors.primary }}>
                    {m.count.toLocaleString('tr-TR')}
                  </Typography>
                </Box>
                {i < MATERIAL_DATA.length - 1 && <Divider sx={{ borderColor: `rgba(195,198,215,0.1)` }} />}
              </React.Fragment>
            ))}
          </Box>
        </Box>
      </Box>
    </AdminLayout>
  );
}
