'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  FormControl,
  IconButton,
  MenuItem,
  Select,
  Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FactoryIcon from '@mui/icons-material/Factory';
import { useQuery } from '@tanstack/react-query';
import MainLayout from '@/components/layout/MainLayout';
import { companyService, Company } from '@/services/company.service';
import { favoriteService } from '@/services/favorite.service';
import { useAuth } from '@/context/useAuth';
import { ROUTES } from '@/utils/constants';
import { colors } from '@/utils/colors';

const CITIES = ['İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Kocaeli', 'Antalya', 'Gaziantep'];
const SORT_OPTIONS = [
  { value: 'relevance', label: 'En İlgili' },
  { value: 'name_asc', label: 'İsme Göre (A-Z)' },
  { value: 'newest', label: 'En Yeni' },
];

const ROLE_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  PRODUCER: { label: 'Üretici', color: colors.primary, bg: `${colors.primaryFixed}` },
  SELLER: { label: 'Satıcı', color: colors.tertiary, bg: `${colors.tertiaryFixed}` },
  BOTH: { label: 'Her İkisi', color: colors.secondary, bg: `${colors.secondaryFixed}` },
};

export default function CompaniesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuth();

  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [city, setCity] = useState('');
  const [page, setPage] = useState(0);
  const [favIds, setFavIds] = useState<Set<number>>(new Set());

  const { data, isLoading } = useQuery({
    queryKey: ['companies', query, city, page],
    queryFn: () =>
      companyService.getAll({ page, size: 10, ...(query && { q: query }), ...(city && { city }) }),
  });

  const { data: favCompanies } = useQuery({
    queryKey: ['favorites', 'companies'],
    queryFn: favoriteService.getCompanies,
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (favCompanies) setFavIds(new Set(favCompanies.map((c) => c.id)));
  }, [favCompanies]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(0);
    router.replace(`${ROUTES.COMPANIES}?q=${encodeURIComponent(query)}`);
  }

  async function toggleFav(e: React.MouseEvent, company: Company) {
    e.preventDefault();
    if (!isAuthenticated) { router.push(`${ROUTES.LOGIN}?redirect=${ROUTES.COMPANIES}`); return; }
    const next = new Set(favIds);
    if (next.has(company.id)) {
      next.delete(company.id);
      await favoriteService.removeCompany(company.id);
    } else {
      next.add(company.id);
      await favoriteService.addCompany(company.id);
    }
    setFavIds(next);
  }

  const companies = data?.content ?? [];
  const totalPages = data?.totalPages ?? 1;

  return (
    <MainLayout>
      <Container maxWidth={false} sx={{ maxWidth: 1440, px: { xs: 2, md: 4 }, py: 6 }}>
        {/* Page header */}
        <Box sx={{ mb: 6 }}>
          <Typography
            variant="h4"
            sx={{
              fontFamily: 'var(--font-manrope)',
              fontWeight: 800,
              color: colors.onSurface,
              mb: 1,
            }}
          >
            Firmalar
          </Typography>
          <Typography sx={{ color: colors.onSurfaceVariant }}>
            Türkiye genelindeki endüstriyel tedarikçileri keşfedin
          </Typography>
        </Box>

        {/* Search bar */}
        <Box
          component="form"
          onSubmit={handleSearch}
          sx={{
            display: 'flex',
            gap: 1,
            mb: 5,
            bgcolor: colors.surfaceContainerLowest,
            border: `1px solid rgba(195,198,215,0.2)`,
            borderRadius: 3,
            boxShadow: colors.shadow,
            p: 1,
          }}
        >
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', px: 2 }}>
            <SearchIcon sx={{ color: colors.outline, mr: 1.5 }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Firma adı veya sektör ara..."
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

        <Box sx={{ display: 'flex', gap: 4 }}>
          {/* Sidebar filters */}
          <Box
            component="aside"
            sx={{
              width: 280,
              flexShrink: 0,
              display: { xs: 'none', md: 'flex' },
              flexDirection: 'column',
              gap: 4,
            }}
          >
            <Box
              sx={{
                bgcolor: colors.surfaceContainerLowest,
                borderRadius: 3,
                p: 3,
                border: `1px solid rgba(195,198,215,0.15)`,
                boxShadow: colors.shadowSm,
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}
            >
              {/* City filter */}
              <Box>
                <Typography
                  sx={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    color: colors.onSurfaceVariant,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    mb: 1.5,
                  }}
                >
                  Şehir Seçimi
                </Typography>
                <FormControl fullWidth size="small">
                  <Select
                    value={city}
                    onChange={(e) => { setCity(e.target.value); setPage(0); }}
                    displayEmpty
                    sx={{ bgcolor: colors.surfaceContainerLow, '& fieldset': { border: 'none' } }}
                  >
                    <MenuItem value="">Tüm Şehirler</MenuItem>
                    {CITIES.map((c) => (
                      <MenuItem key={c} value={c}>{c}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              {/* Sort */}
              <Box sx={{ pt: 2, borderTop: `1px solid rgba(195,198,215,0.15)` }}>
                <Typography
                  sx={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    color: colors.onSurfaceVariant,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    mb: 1.5,
                  }}
                >
                  Sıralama
                </Typography>
                <FormControl fullWidth size="small">
                  <Select
                    defaultValue="relevance"
                    sx={{ bgcolor: colors.surfaceContainerLow, '& fieldset': { border: 'none' } }}
                  >
                    {SORT_OPTIONS.map((o) => (
                      <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Box>
          </Box>

          {/* Results */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
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
              {isLoading ? '...' : `${data?.totalElements ?? 0} firma bulundu`}
            </Typography>

            {/* Loading */}
            {isLoading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
                <CircularProgress />
              </Box>
            )}

            {/* Empty */}
            {!isLoading && companies.length === 0 && (
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
                <Typography sx={{ color: colors.onSurfaceVariant }}>Firma bulunamadı</Typography>
              </Box>
            )}

            {/* Cards */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {companies.map((company) => (
                <CompanyCard
                  key={company.id}
                  company={company}
                  isFav={favIds.has(company.id)}
                  onToggleFav={(e) => toggleFav(e, company)}
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
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i).map((i) => (
                    <Button
                      key={i}
                      onClick={() => setPage(i)}
                      sx={{
                        minWidth: 40,
                        height: 40,
                        borderRadius: 2,
                        fontWeight: 700,
                        background: page === i ? colors.gradientPrimary : 'transparent',
                        color: page === i ? '#fff' : colors.onSurface,
                        '&:hover': { bgcolor: page === i ? undefined : colors.surfaceContainerHigh },
                      }}
                    >
                      {i + 1}
                    </Button>
                  ))}
                </Box>
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
          </Box>
        </Box>
      </Container>
    </MainLayout>
  );
}

function CompanyCard({
  company,
  isFav,
  onToggleFav,
}: {
  company: Company;
  isFav: boolean;
  onToggleFav: (e: React.MouseEvent) => void;
}) {
  const location = [company.district, company.city].filter(Boolean).join(', ');

  return (
    <Box
      component={Link}
      href={ROUTES.COMPANY_DETAIL(company.id)}
      sx={{
        bgcolor: colors.surfaceContainerLowest,
        borderRadius: 3,
        p: 3,
        border: `1px solid rgba(195,198,215,0.15)`,
        boxShadow: colors.shadowSm,
        display: 'flex',
        gap: 3,
        position: 'relative',
        textDecoration: 'none',
        transition: 'box-shadow 0.2s',
        '&:hover': { boxShadow: colors.shadow },
        flexDirection: { xs: 'column', md: 'row' },
      }}
    >
      {/* Fav button */}
      <IconButton
        size="small"
        onClick={onToggleFav}
        sx={{
          position: 'absolute',
          top: 16,
          right: 16,
          color: isFav ? colors.error : colors.outline,
          '&:hover': { color: colors.error },
        }}
      >
        {isFav ? <FavoriteIcon /> : <FavoriteBorderIcon />}
      </IconButton>

      {/* Logo placeholder */}
      <Box
        sx={{
          width: 88,
          height: 88,
          bgcolor: colors.surfaceContainer,
          borderRadius: 2,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: `1px solid rgba(195,198,215,0.15)`,
        }}
      >
        <FactoryIcon sx={{ color: colors.outline, fontSize: '2.5rem' }} />
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.75, flexWrap: 'wrap' }}>
          <Typography
            sx={{
              fontFamily: 'var(--font-manrope)',
              fontWeight: 700,
              fontSize: '1.1rem',
              color: colors.onSurface,
            }}
          >
            {company.companyName}
          </Typography>
          <Chip
            label="Aktif"
            size="small"
            sx={{
              bgcolor: `${colors.tertiaryFixed}`,
              color: colors.tertiary,
              fontWeight: 700,
              fontSize: '0.65rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              height: 20,
            }}
          />
        </Box>

        {location && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: colors.onSurfaceVariant, mb: 1.5 }}>
            <LocationOnIcon sx={{ fontSize: '1rem' }} />
            <Typography sx={{ fontSize: '0.875rem' }}>{location}</Typography>
          </Box>
        )}

        {company.description && (
          <Typography
            sx={{
              fontSize: '0.875rem',
              color: colors.onSurfaceVariant,
              lineHeight: 1.6,
              mb: 2,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {company.description}
          </Typography>
        )}
      </Box>

      {/* CTA */}
      <Box
        sx={{
          display: 'flex',
          alignItems: { xs: 'flex-start', md: 'flex-end' },
          justifyContent: 'flex-end',
          flexShrink: 0,
          mt: { xs: 1, md: 0 },
        }}
      >
        <Button
          variant="contained"
          endIcon={<ArrowForwardIcon />}
          sx={{ px: 3, py: 1.5 }}
          onClick={(e) => e.stopPropagation()}
          component={Link}
          href={ROUTES.COMPANY_DETAIL(company.id)}
        >
          Profili Gör
        </Button>
      </Box>
    </Box>
  );
}
