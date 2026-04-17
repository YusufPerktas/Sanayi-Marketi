'use client';

import React from 'react';
import Link from 'next/link';
import { Box, Button, CircularProgress, Typography } from '@mui/material';
import FactoryIcon from '@mui/icons-material/Factory';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import FavoriteIcon from '@mui/icons-material/Favorite';
import BusinessIcon from '@mui/icons-material/Business';
import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { favoriteService } from '@/services/favorite.service';
import { useAuth } from '@/context/useAuth';
import { ROUTES } from '@/utils/constants';
import { colors } from '@/utils/colors';

export default function DashboardPage() {
  const { user } = useAuth();

  const { data: favCompanies, isLoading: loadingComp } = useQuery({
    queryKey: ['favorites', 'companies'],
    queryFn: favoriteService.getCompanies,
  });

  const { data: favMaterials, isLoading: loadingMat } = useQuery({
    queryKey: ['favorites', 'materials'],
    queryFn: favoriteService.getMaterials,
  });

  const recentFavs = [
    ...(favCompanies?.slice(0, 2).map((c) => ({ type: 'company' as const, id: c.id, name: c.companyName, href: ROUTES.COMPANY_DETAIL(c.id) })) ?? []),
    ...(favMaterials?.slice(0, 2).map((m) => ({ type: 'material' as const, id: m.id, name: m.name, href: ROUTES.MATERIAL_DETAIL(m.id) })) ?? []),
  ].slice(0, 3);

  return (
    <DashboardLayout variant="user">
      {/* Welcome */}
      <Box sx={{ mb: 8 }}>
        <Typography
          variant="h4"
          sx={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, color: colors.onSurface, mb: 0.5 }}
        >
          Hoş Geldiniz.
        </Typography>
        <Typography sx={{ color: colors.onSurfaceVariant, fontSize: '1.05rem' }}>
          Platformdaki endüstriyel takip özetiniz.
        </Typography>
      </Box>

      {/* Stats */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mb: 8 }}>
        <StatCard
          icon={<FactoryIcon sx={{ fontSize: '2rem', color: colors.primary }} />}
          label="Favori Firma"
          value={loadingComp ? <CircularProgress size={24} /> : <>{favCompanies?.length ?? 0}</>}
          bg={colors.surfaceContainerHighest}
          decorIcon="factory"
        />
        <StatCard
          icon={<Inventory2Icon sx={{ fontSize: '2rem', color: colors.tertiary }} />}
          label="Favori Malzeme"
          value={loadingMat ? <CircularProgress size={24} /> : <>{favMaterials?.length ?? 0}</>}
          bg={colors.surfaceContainerHighest}
          decorIcon="inventory_2"
        />
      </Box>

      {/* Recent favorites */}
      <Box>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            borderBottom: `1px solid rgba(195,198,215,0.15)`,
            pb: 2,
            mb: 4,
          }}
        >
          <Typography variant="h5" sx={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, color: colors.onSurface }}>
            Son Eklenen Favoriler
          </Typography>
          <Button
            component={Link}
            href={ROUTES.FAVORITES}
            endIcon={<ArrowForwardIcon />}
            sx={{ color: colors.primary, fontWeight: 600, fontSize: '0.875rem' }}
          >
            Tümünü Gör
          </Button>
        </Box>

        {recentFavs.length === 0 ? (
          <Box
            sx={{
              textAlign: 'center',
              py: 8,
              bgcolor: colors.surfaceContainerLowest,
              borderRadius: 3,
              border: `1px solid rgba(195,198,215,0.15)`,
            }}
          >
            <FavoriteIcon sx={{ fontSize: '3rem', color: colors.outline, mb: 2 }} />
            <Typography sx={{ color: colors.onSurfaceVariant, mb: 1 }}>Henüz favori eklenmemiş</Typography>
            <Button component={Link} href={ROUTES.COMPANIES} variant="outlined" size="small" sx={{ mt: 1 }}>
              Firmaları Keşfet
            </Button>
          </Box>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2,1fr)', xl: 'repeat(3,1fr)' }, gap: 3 }}>
            {recentFavs.map((item) => (
              <Box
                key={`${item.type}-${item.id}`}
                sx={{
                  bgcolor: colors.surfaceContainerLowest,
                  borderRadius: 3,
                  p: 3,
                  border: `1px solid rgba(195,198,215,0.15)`,
                  boxShadow: colors.shadowSm,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      bgcolor: colors.surfaceContainerLow,
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {item.type === 'company'
                      ? <FactoryIcon sx={{ color: colors.onSurfaceVariant }} />
                      : <Inventory2Icon sx={{ color: colors.onSurfaceVariant }} />}
                  </Box>
                  <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: colors.onSurface }}>
                    {item.name}
                  </Typography>
                </Box>
                <Button
                  component={Link}
                  href={item.href}
                  variant="outlined"
                  fullWidth
                  size="small"
                  sx={{
                    borderColor: 'rgba(195,198,215,0.3)',
                    color: colors.onSurface,
                    fontWeight: 700,
                    mt: 'auto',
                    '&:hover': { bgcolor: colors.surfaceContainerLow },
                  }}
                >
                  {item.type === 'company' ? 'Firmayı İncele' : 'Ürüne Git'}
                </Button>
              </Box>
            ))}
          </Box>
        )}
      </Box>

      {/* Company apply CTA */}
      <Box
        sx={{
          mt: 6,
          p: 4,
          bgcolor: colors.surfaceContainerLow,
          borderRadius: 3,
          border: `1px solid rgba(195,198,215,0.15)`,
          display: 'flex',
          alignItems: 'center',
          gap: 3,
          flexWrap: 'wrap',
        }}
      >
        <Box
          sx={{
            width: 48,
            height: 48,
            bgcolor: colors.primaryFixed,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <BusinessIcon sx={{ color: colors.primary }} />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontWeight: 700, color: colors.onSurface, mb: 0.5 }}>
            Firmanızı platforma ekleyin
          </Typography>
          <Typography sx={{ fontSize: '0.875rem', color: colors.onSurfaceVariant }}>
            Sanayi Marketi&apos;nde firmanızı listeleyin, müşterilerinize ulaşın.
          </Typography>
        </Box>
        <Button
          component={Link}
          href={ROUTES.COMPANY_APPLY}
          variant="contained"
          sx={{ flexShrink: 0 }}
        >
          Başvuru Yap
        </Button>
      </Box>
    </DashboardLayout>
  );
}

function StatCard({
  icon,
  label,
  value,
  bg,
  decorIcon,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  bg: string;
  decorIcon: string;
}) {
  return (
    <Box
      sx={{
        bgcolor: colors.surfaceContainerLow,
        borderRadius: 3,
        p: 3,
        display: 'flex',
        alignItems: 'center',
        gap: 3,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Box sx={{ width: 64, height: 64, borderRadius: 2, bgcolor: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icon}
      </Box>
      <Box>
        <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.1em', mb: 0.5 }}>
          {label}
        </Typography>
        <Typography sx={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: '2.5rem', color: colors.onSurface, lineHeight: 1 }}>
          {value}
        </Typography>
      </Box>
    </Box>
  );
}
