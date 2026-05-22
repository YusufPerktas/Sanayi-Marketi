'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  IconButton,
  Tooltip,
  Typography,
} from '@mui/material';
import CategoryIcon from '@mui/icons-material/Category';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FactoryIcon from '@mui/icons-material/Factory';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import MainLayout from '@/components/layout/MainLayout';
import { materialService, MaterialCompany } from '@/services/material.service';
import { favoriteService } from '@/services/favorite.service';
import { useAuth } from '@/context/useAuth';
import { ROUTES, API_BASE_URL } from '@/utils/constants';
import { colors } from '@/utils/colors';

const ROLE_CHIP: Record<string, { label: string; color: string; bg: string }> = {
  PRODUCER: { label: 'Üretici', color: colors.primary, bg: colors.primaryFixed },
  SELLER: { label: 'Satıcı', color: colors.tertiary, bg: colors.tertiaryFixed },
  BOTH: { label: 'Her İkisi', color: colors.secondary, bg: colors.secondaryFixed },
};

export default function MaterialDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const qc = useQueryClient();
  const [isFav, setIsFav] = useState(false);

  const { data: material, isLoading: loadingMaterial } = useQuery({
    queryKey: ['material', id],
    queryFn: () => materialService.getById(id),
    enabled: !!id,
  });

  const { data: sellers, isLoading: loadingSellers } = useQuery({
    queryKey: ['material-companies', id],
    queryFn: () => materialService.getSuppliers(id),
    enabled: !!id,
  });

  const { data: favMaterials } = useQuery({
    queryKey: ['favorites', 'materials'],
    queryFn: favoriteService.getMaterials,
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (favMaterials && material) {
      setIsFav(favMaterials.some((m) => m.id === material.id));
    }
  }, [favMaterials, material]);

  async function toggleFav() {
    if (!isAuthenticated) {
      router.push(`${ROUTES.LOGIN}?redirect=${ROUTES.MATERIAL_DETAIL(id)}`);
      return;
    }
    if (isFav) {
      setIsFav(false);
      await favoriteService.removeMaterial(Number(id));
    } else {
      setIsFav(true);
      await favoriteService.addMaterial(Number(id));
    }
    qc.invalidateQueries({ queryKey: ['favorites', 'materials'] });
  }

  if (loadingMaterial) {
    return (
      <MainLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 16 }}>
          <CircularProgress />
        </Box>
      </MainLayout>
    );
  }

  if (!material) {
    return (
      <MainLayout>
        <Box sx={{ textAlign: 'center', py: 16 }}>
          <Typography sx={{ color: colors.onSurfaceVariant }}>Malzeme bulunamadı.</Typography>
          <Button component={Link} href={ROUTES.MATERIALS} sx={{ mt: 2 }}>
            Malzemelere Dön
          </Button>
        </Box>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Container maxWidth={false} sx={{ maxWidth: 1440, px: { xs: 2, md: 4 }, py: 6 }}>
        {/* Breadcrumb */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 4 }}>
          <Button
            component={Link}
            href={ROUTES.MATERIALS}
            startIcon={<ArrowBackIcon />}
            sx={{ color: colors.primary, fontWeight: 600, p: 0 }}
          >
            Malzemeler
          </Button>
          <Typography sx={{ color: colors.outline }}>/</Typography>
          <Typography sx={{ color: colors.onSurfaceVariant }}>{material.materialName}</Typography>
        </Box>

        {/* Material header */}
        <Box
          sx={{
            bgcolor: colors.surfaceContainerLowest,
            borderRadius: 3,
            p: 5,
            boxShadow: colors.shadow,
            mb: 4,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            flexWrap: 'wrap',
          }}
        >
          <Box
            sx={{
              width: 80,
              height: 80,
              bgcolor: colors.surfaceContainerHigh,
              borderRadius: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <CategoryIcon sx={{ fontSize: '2.5rem', color: colors.outline }} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="h4"
              sx={{ fontFamily: 'var(--font-manrope)', fontWeight: 800, color: colors.onSurface, mb: 0.5 }}
            >
              {material.materialName}
            </Typography>
            {material.parentMaterialName && (
              <Typography sx={{ fontSize: '0.875rem', color: colors.onSurfaceVariant }}>
                Üst kategori: {material.parentMaterialName}
              </Typography>
            )}
          </Box>
          <Tooltip title={isFav ? 'Favorilerden çıkar' : 'Favorilere ekle'}>
            <IconButton
              onClick={toggleFav}
              sx={{
                color: isFav ? colors.error : colors.outline,
                border: `1px solid`,
                borderColor: isFav ? colors.error : 'rgba(195,198,215,0.4)',
                borderRadius: 2,
                p: 1.25,
                '&:hover': { color: colors.error, borderColor: colors.error },
              }}
            >
              {isFav ? <FavoriteIcon /> : <FavoriteBorderIcon />}
            </IconButton>
          </Tooltip>
        </Box>

        {/* Sellers section */}
        <Box sx={{ mb: 2 }}>
          <Typography
            variant="h5"
            sx={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, color: colors.onSurface, mb: 1 }}
          >
            Bu Malzemeyi Sunan Firmalar
          </Typography>
          <Typography sx={{ color: colors.onSurfaceVariant, fontSize: '0.9rem', mb: 3 }}>
            {material.materialName} malzemesini üreten veya satan tedarikçiler
          </Typography>
        </Box>

        {loadingSellers && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        )}

        {!loadingSellers && (!sellers || sellers.length === 0) && (
          <Box
            sx={{
              textAlign: 'center',
              py: 10,
              bgcolor: colors.surfaceContainerLowest,
              borderRadius: 3,
              border: `1px solid rgba(195,198,215,0.15)`,
            }}
          >
            <FactoryIcon sx={{ fontSize: '3rem', color: colors.outline, mb: 2 }} />
            <Typography sx={{ color: colors.onSurfaceVariant }}>
              Bu malzeme için henüz firma kaydı yok
            </Typography>
          </Box>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {sellers?.map((mc: MaterialCompany) => {
            const role = ROLE_CHIP[mc.role] ?? ROLE_CHIP.BOTH;
            const loc = [mc.companyDistrict, mc.companyCity].filter(Boolean).join(', ');
            const priceLabel = mc.price != null
              ? `${mc.price} TL${mc.unit ? ` / ${mc.unit}` : ''}`
              : null;
            return (
              <Box
                key={mc.id}
                sx={{
                  bgcolor: colors.surfaceContainerLowest,
                  borderRadius: 3,
                  p: 3,
                  border: `1px solid rgba(195,198,215,0.15)`,
                  boxShadow: colors.shadowSm,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3,
                  flexWrap: 'wrap',
                }}
              >
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    bgcolor: colors.surfaceContainer,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    overflow: 'hidden',
                  }}
                >
                  {mc.companyLogoUrl ? (
                    <img src={`${API_BASE_URL}${mc.companyLogoUrl}`} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '4px' }} />
                  ) : (
                    <FactoryIcon sx={{ color: colors.outline }} />
                  )}
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5, flexWrap: 'wrap' }}>
                    <Typography sx={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, color: colors.onSurface }}>
                      {mc.companyName}
                    </Typography>
                    <Chip
                      label={role.label}
                      size="small"
                      sx={{ bgcolor: role.bg, color: role.color, fontWeight: 700, fontSize: '0.65rem', textTransform: 'uppercase', height: 20 }}
                    />
                  </Box>
                  {loc && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: colors.onSurfaceVariant, fontSize: '0.8rem' }}>
                      <LocationOnIcon sx={{ fontSize: '0.9rem' }} />
                      {loc}
                    </Box>
                  )}
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0, flexWrap: 'wrap' }}>
                  {priceLabel && (
                    <Typography sx={{ fontWeight: 700, color: colors.onSurface, fontSize: '1.1rem' }}>
                      {priceLabel}
                    </Typography>
                  )}
                  <Button
                    component={Link}
                    href={ROUTES.COMPANY_DETAIL(mc.companyId)}
                    variant="contained"
                    endIcon={<ArrowForwardIcon />}
                    size="small"
                    sx={{ px: 2.5 }}
                  >
                    Profili Gör
                  </Button>
                </Box>
              </Box>
            );
          })}
        </Box>
      </Container>
    </MainLayout>
  );
}
