'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CategoryIcon from '@mui/icons-material/Category';
import { useQuery } from '@tanstack/react-query';
import MainLayout from '@/components/layout/MainLayout';
import { materialService, Material } from '@/services/material.service';
import { ROUTES } from '@/utils/constants';
import { colors } from '@/utils/colors';

export default function MaterialsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [page, setPage] = useState(0);

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

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(0);
    router.replace(`${ROUTES.MATERIALS}?q=${encodeURIComponent(query)}`);
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
            <MaterialCard key={m.id} material={m} />
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

function MaterialCard({ material }: { material: Material }) {
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
        transition: 'all 0.15s',
        '&:hover': { boxShadow: colors.shadow, bgcolor: colors.surfaceContainerLow },
      }}
    >
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
