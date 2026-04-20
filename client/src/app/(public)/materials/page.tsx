'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Box,
  Button,
  CircularProgress,
  Container,
  IconButton,
  Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CategoryIcon from '@mui/icons-material/Category';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import MainLayout from '@/components/layout/MainLayout';
import { materialService, Material } from '@/services/material.service';
import { favoriteService } from '@/services/favorite.service';
import { useAuth } from '@/context/useAuth';
import { ROUTES } from '@/utils/constants';
import { colors } from '@/utils/colors';

export default function MaterialsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuth();

  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [page, setPage] = useState(0);
  const [favIds, setFavIds] = useState<Set<number>>(new Set());
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['materials', query, page],
    queryFn: () =>
      query
        ? materialService.search(query).then((items) => ({
            content: items,
            page: 0,
            size: items.length,
            totalElements: items.length,
            totalPages: 1,
            first: true,
            last: true,
          }))
        : materialService.getAll({ page, size: 20 }),
  });

  const { data: favMaterials } = useQuery({
    queryKey: ['favorites', 'materials'],
    queryFn: favoriteService.getMaterials,
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (favMaterials) setFavIds(new Set(favMaterials.map((m) => m.id)));
  }, [favMaterials]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(0);
    router.replace(`${ROUTES.MATERIALS}?q=${encodeURIComponent(query)}`);
  }

  async function toggleFav(e: React.MouseEvent, material: Material) {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      router.push(`${ROUTES.LOGIN}?redirect=${ROUTES.MATERIALS}`);
      return;
    }
    const next = new Set(favIds);
    if (next.has(material.id)) {
      next.delete(material.id);
      await favoriteService.removeMaterial(material.id);
    } else {
      next.add(material.id);
      await favoriteService.addMaterial(material.id);
    }
    setFavIds(next);
    qc.invalidateQueries({ queryKey: ['favorites', 'materials'] });
  }

  const materials = data?.content ?? [];
  const totalPages = data?.totalPages ?? 1;

  return (
    <MainLayout>
      <Container maxWidth={false} sx={{ maxWidth: 1440, px: { xs: 2, md: 4 }, py: 6 }}>
        <Box sx={{ mb: 6 }}>
          <Typography
            variant="h4"
            sx={{ fontFamily: 'var(--font-manrope)', fontWeight: 800, color: colors.onSurface, mb: 1 }}
          >
            Malzemeler
          </Typography>
          <Typography sx={{ color: colors.onSurfaceVariant }}>
            Endüstriyel malzemeleri arayın ve tedarikçilerini keşfedin
          </Typography>
        </Box>

        {/* Search */}
        <Box
          component="form"
          onSubmit={handleSearch}
          sx={{
            display: 'flex',
            gap: 1,
            mb: 6,
            bgcolor: colors.surfaceContainerLowest,
            border: `1px solid rgba(195,198,215,0.2)`,
            borderRadius: 3,
            boxShadow: colors.shadow,
            p: 1,
            maxWidth: 720,
          }}
        >
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', px: 2 }}>
            <SearchIcon sx={{ color: colors.outline, mr: 1.5 }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Malzeme adı ara... (örn: çelik, alüminyum, plastik)"
              style={{
                width: '100%',
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontSize: '1rem',
                color: colors.onSurface,
                fontFamily: 'var(--font-inter), sans-serif',
                padding: '10px 0',
              }}
            />
          </Box>
          <Button type="submit" variant="contained" sx={{ px: 4, py: 1.5, borderRadius: 2, flexShrink: 0 }}>
            Ara
          </Button>
        </Box>

        {/* Result count */}
        <Typography
          sx={{
            fontFamily: 'var(--font-manrope)',
            fontWeight: 700,
            fontSize: '1.1rem',
            color: colors.onSurfaceVariant,
            mb: 3,
          }}
        >
          {isLoading ? '...' : `${data?.totalElements ?? 0} malzeme bulundu`}
        </Typography>

        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
            <CircularProgress />
          </Box>
        )}

        {!isLoading && materials.length === 0 && (
          <Box
            sx={{
              textAlign: 'center',
              py: 10,
              bgcolor: colors.surfaceContainerLowest,
              borderRadius: 3,
              border: `1px solid rgba(195,198,215,0.15)`,
            }}
          >
            <CategoryIcon sx={{ fontSize: '3rem', color: colors.outline, mb: 2 }} />
            <Typography sx={{ color: colors.onSurfaceVariant }}>Malzeme bulunamadı</Typography>
          </Box>
        )}

        {/* Grid */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2,1fr)', md: 'repeat(3,1fr)', lg: 'repeat(4,1fr)' },
            gap: 2,
          }}
        >
          {materials.map((m) => (
            <MaterialCard
              key={m.id}
              material={m}
              isFav={favIds.has(m.id)}
              onToggleFav={(e) => toggleFav(e, m)}
            />
          ))}
        </Box>

        {/* Pagination */}
        {totalPages > 1 && (
          <Box
            sx={{
              mt: 6,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              bgcolor: colors.surfaceContainerLow,
              borderRadius: 3,
              p: 1.5,
              px: 3,
              border: `1px solid rgba(195,198,215,0.15)`,
            }}
          >
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              sx={{ color: colors.onSurfaceVariant, fontWeight: 700 }}
            >
              Önceki
            </Button>
            <Typography sx={{ fontSize: '0.875rem', color: colors.onSurfaceVariant }}>
              {page + 1} / {totalPages}
            </Typography>
            <Button
              endIcon={<ArrowForwardIcon />}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              sx={{ color: colors.onSurface, fontWeight: 700 }}
            >
              Sonraki
            </Button>
          </Box>
        )}
      </Container>
    </MainLayout>
  );
}

function MaterialCard({
  material,
  isFav,
  onToggleFav,
}: {
  material: Material;
  isFav: boolean;
  onToggleFav: (e: React.MouseEvent) => void;
}) {
  return (
    <Box
      component={Link}
      href={ROUTES.MATERIAL_DETAIL(material.id)}
      sx={{
        bgcolor: colors.surfaceContainerLowest,
        border: `1px solid rgba(195,198,215,0.15)`,
        borderRadius: 3,
        p: 3,
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        textDecoration: 'none',
        position: 'relative',
        transition: 'all 0.15s',
        '&:hover': { boxShadow: colors.shadow, bgcolor: colors.surfaceContainerLow },
      }}
    >
      <IconButton
        size="small"
        onClick={onToggleFav}
        sx={{
          position: 'absolute',
          top: 10,
          right: 10,
          color: isFav ? colors.error : colors.outline,
          '&:hover': { color: colors.error },
        }}
      >
        {isFav ? <FavoriteIcon fontSize="small" /> : <FavoriteBorderIcon fontSize="small" />}
      </IconButton>

      <Box
        sx={{
          width: 48,
          height: 48,
          bgcolor: colors.surfaceContainerHigh,
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CategoryIcon sx={{ color: colors.outline }} />
      </Box>
      <Typography
        sx={{
          fontFamily: 'var(--font-manrope)',
          fontWeight: 700,
          color: colors.onSurface,
          fontSize: '1rem',
          pr: 3,
        }}
      >
        {material.materialName}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: colors.primary, fontSize: '0.8rem', fontWeight: 600 }}>
        <ArrowForwardIcon sx={{ fontSize: '0.9rem' }} />
        Tedarikçileri Gör
      </Box>
    </Box>
  );
}
