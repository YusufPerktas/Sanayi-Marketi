'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Box, Button, CircularProgress, IconButton, Typography } from '@mui/material';
import FactoryIcon from '@mui/icons-material/Factory';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import FavoriteIcon from '@mui/icons-material/Favorite';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { favoriteService } from '@/services/favorite.service';
import { ROUTES } from '@/utils/constants';
import { colors } from '@/utils/colors';
import { useSearchParams } from 'next/navigation';

type TabType = 'companies' | 'materials';

export default function FavoritesPage() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<TabType>(
    (searchParams.get('tab') as TabType) ?? 'companies',
  );
  const qc = useQueryClient();

  const { data: favCompanies, isLoading: loadingComp } = useQuery({
    queryKey: ['favorites', 'companies'],
    queryFn: favoriteService.getCompanies,
  });

  const { data: favMaterials, isLoading: loadingMat } = useQuery({
    queryKey: ['favorites', 'materials'],
    queryFn: favoriteService.getMaterials,
  });

  const removeCompany = useMutation({
    mutationFn: favoriteService.removeCompany,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['favorites', 'companies'] }),
  });

  const removeMaterial = useMutation({
    mutationFn: favoriteService.removeMaterial,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['favorites', 'materials'] }),
  });

  const TABS = [
    { key: 'companies' as TabType, label: 'Favori Firmalar', count: favCompanies?.length ?? 0 },
    { key: 'materials' as TabType, label: 'Favori Malzemeler', count: favMaterials?.length ?? 0 },
  ];

  return (
    <DashboardLayout variant="user">
      <Typography variant="h4" sx={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, color: colors.onSurface, mb: 1 }}>
        Favorilerim
      </Typography>
      <Typography sx={{ color: colors.onSurfaceVariant, mb: 5 }}>
        Kaydettiğiniz firmalar ve malzemeler
      </Typography>

      {/* Tabs */}
      <Box
        sx={{
          display: 'inline-flex',
          bgcolor: colors.surfaceContainerLow,
          borderRadius: 2,
          p: 0.75,
          mb: 5,
          gap: 0.5,
        }}
      >
        {TABS.map((t) => (
          <Button
            key={t.key}
            onClick={() => setTab(t.key)}
            sx={{
              px: 3,
              py: 1,
              borderRadius: 1.5,
              fontWeight: 700,
              fontSize: '0.875rem',
              bgcolor: tab === t.key ? colors.surfaceContainerHighest : 'transparent',
              color: tab === t.key ? colors.primary : colors.onSurfaceVariant,
              boxShadow: tab === t.key ? colors.shadowSm : 'none',
              '&:hover': { bgcolor: tab === t.key ? colors.surfaceContainerHighest : `${colors.surfaceContainerHigh}50` },
            }}
          >
            {t.label}
            {t.count > 0 && (
              <Box
                component="span"
                sx={{
                  ml: 1,
                  px: 1,
                  py: 0.25,
                  bgcolor: tab === t.key ? colors.primary : colors.outline,
                  color: '#fff',
                  borderRadius: 99,
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  lineHeight: 1.5,
                }}
              >
                {t.count}
              </Box>
            )}
          </Button>
        ))}
      </Box>

      {/* Company list */}
      {tab === 'companies' && (
        <>
          {loadingComp && <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>}
          {!loadingComp && favCompanies?.length === 0 && (
            <EmptyState
              icon={<FactoryIcon sx={{ fontSize: '3rem', color: colors.outline }} />}
              message="Favori firma eklenmemiş"
              ctaHref={ROUTES.COMPANIES}
              ctaLabel="Firmaları Keşfet"
            />
          )}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2,1fr)', xl: 'repeat(3,1fr)' }, gap: 3 }}>
            {favCompanies?.map((c) => {
              const loc = [c.district, c.city].filter(Boolean).join(', ');
              return (
                <Box
                  key={c.id}
                  sx={{
                    bgcolor: colors.surfaceContainerLowest,
                    borderRadius: 3,
                    p: 3,
                    border: `1px solid rgba(195,198,215,0.15)`,
                    boxShadow: colors.shadowSm,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    position: 'relative',
                  }}
                >
                  <IconButton
                    size="small"
                    onClick={() => removeCompany.mutate(c.id)}
                    sx={{ position: 'absolute', top: 12, right: 12, color: colors.error, '&:hover': { transform: 'scale(1.1)' } }}
                  >
                    <FavoriteIcon fontSize="small" />
                  </IconButton>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ width: 48, height: 48, bgcolor: colors.surfaceContainerLow, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                      {c.logoUrl ? (
                        <img src={`http://localhost:8080${c.logoUrl}`} alt={c.companyName} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '4px' }} />
                      ) : (
                        <FactoryIcon sx={{ color: colors.onSurfaceVariant }} />
                      )}
                    </Box>
                    <Box>
                      <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: colors.onSurface }}>{c.companyName}</Typography>
                      {loc && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: colors.outline, fontSize: '0.8rem' }}>
                          <LocationOnIcon sx={{ fontSize: '0.85rem' }} />{loc}
                        </Box>
                      )}
                    </Box>
                  </Box>
                  {c.description && (
                    <Typography sx={{ fontSize: '0.875rem', color: colors.onSurfaceVariant, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {c.description}
                    </Typography>
                  )}
                  <Button
                    component={Link}
                    href={ROUTES.COMPANY_DETAIL(c.id)}
                    variant="outlined"
                    fullWidth
                    size="small"
                    endIcon={<ArrowForwardIcon />}
                    sx={{ borderColor: 'rgba(195,198,215,0.3)', color: colors.onSurface, fontWeight: 700, '&:hover': { bgcolor: colors.surfaceContainerLow } }}
                  >
                    Firmayı İncele
                  </Button>
                </Box>
              );
            })}
          </Box>
        </>
      )}

      {/* Material list */}
      {tab === 'materials' && (
        <>
          {loadingMat && <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>}
          {!loadingMat && favMaterials?.length === 0 && (
            <EmptyState
              icon={<Inventory2Icon sx={{ fontSize: '3rem', color: colors.outline }} />}
              message="Favori malzeme eklenmemiş"
              ctaHref={ROUTES.MATERIALS}
              ctaLabel="Malzemeleri Keşfet"
            />
          )}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2,1fr)', md: 'repeat(3,1fr)' }, gap: 3 }}>
            {favMaterials?.map((m) => (
              <Box
                key={m.id}
                sx={{
                  bgcolor: colors.surfaceContainerLowest,
                  borderRadius: 3,
                  p: 3,
                  border: `1px solid rgba(195,198,215,0.15)`,
                  boxShadow: colors.shadowSm,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  position: 'relative',
                }}
              >
                <IconButton
                  size="small"
                  onClick={() => removeMaterial.mutate(m.id)}
                  sx={{ position: 'absolute', top: 12, right: 12, color: colors.error, '&:hover': { transform: 'scale(1.1)' } }}
                >
                  <FavoriteIcon fontSize="small" />
                </IconButton>
                <Box sx={{ width: 48, height: 48, bgcolor: colors.surfaceContainerLow, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Inventory2Icon sx={{ color: colors.onSurfaceVariant }} />
                </Box>
                <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: colors.onSurface }}>{m.materialName}</Typography>
                <Button
                  component={Link}
                  href={ROUTES.MATERIAL_DETAIL(m.id)}
                  variant="outlined"
                  fullWidth
                  size="small"
                  endIcon={<ArrowForwardIcon />}
                  sx={{ borderColor: 'rgba(195,198,215,0.3)', color: colors.onSurface, fontWeight: 700, '&:hover': { bgcolor: colors.surfaceContainerLow } }}
                >
                  Ürüne Git
                </Button>
              </Box>
            ))}
          </Box>
        </>
      )}
    </DashboardLayout>
  );
}

function EmptyState({ icon, message, ctaHref, ctaLabel }: { icon: React.ReactNode; message: string; ctaHref: string; ctaLabel: string }) {
  return (
    <Box sx={{ textAlign: 'center', py: 10, bgcolor: colors.surfaceContainerLowest, borderRadius: 3, border: `1px solid rgba(195,198,215,0.15)` }}>
      {icon}
      <Typography sx={{ color: colors.onSurfaceVariant, mt: 2, mb: 2 }}>{message}</Typography>
      <Button component={Link} href={ctaHref} variant="outlined" size="small">{ctaLabel}</Button>
    </Box>
  );
}
