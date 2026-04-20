'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Box, Button, Container, Typography, Card, CardContent, CircularProgress, IconButton } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import HardwareIcon from '@mui/icons-material/Hardware';
import LayersIcon from '@mui/icons-material/Layers';
import RecyclingIcon from '@mui/icons-material/Recycling';
import CableIcon from '@mui/icons-material/Cable';
import ForestIcon from '@mui/icons-material/Forest';
import ViewInArIcon from '@mui/icons-material/ViewInAr';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import FactoryIcon from '@mui/icons-material/Factory';
import CategoryIcon from '@mui/icons-material/Category';
import { useQuery } from '@tanstack/react-query';
import MainLayout from '@/components/layout/MainLayout';
import { companyService } from '@/services/company.service';
import { ROUTES } from '@/utils/constants';
import { colors } from '@/utils/colors';

const MATERIALS = [
  { name: 'Çelik', icon: <HardwareIcon />, href: `${ROUTES.MATERIALS}?q=çelik` },
  { name: 'Alüminyum', icon: <LayersIcon />, href: `${ROUTES.MATERIALS}?q=alüminyum` },
  { name: 'Plastik', icon: <RecyclingIcon />, href: `${ROUTES.MATERIALS}?q=plastik` },
  { name: 'Bakır', icon: <CableIcon />, href: `${ROUTES.MATERIALS}?q=bakır` },
  { name: 'Ahşap', icon: <ForestIcon />, href: `${ROUTES.MATERIALS}?q=ahşap` },
  { name: 'Cam & Kompozit', icon: <ViewInArIcon />, href: `${ROUTES.MATERIALS}?q=cam` },
];

export default function HomePage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<'companies' | 'materials'>('companies');

  const { data: featuredData, isLoading: loadingFeatured } = useQuery({
    queryKey: ['home-featured-companies'],
    queryFn: () => companyService.getAll({ page: 0, size: 4, sortBy: 'createdAt', sortDir: 'desc' }),
  });

  function handleSearch() {
    if (!query.trim()) return;
    const dest = tab === 'companies' ? ROUTES.COMPANIES : ROUTES.MATERIALS;
    router.push(`${dest}?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <MainLayout>
      {/* Hero */}
      <Box sx={{ py: { xs: 10, lg: 16 }, px: { xs: 2, md: 4 }, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', overflow: 'hidden', bgcolor: colors.surface }}>
        <Box sx={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 900, height: '100%', background: 'radial-gradient(circle at center, #dee8ff 0%, transparent 70%)', opacity: 0.35, pointerEvents: 'none' }} />
        <Box sx={{ zIndex: 1, textAlign: 'center', maxWidth: 900, width: '100%' }}>
          <Typography variant="h1" sx={{ fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: { xs: '2.5rem', md: '3.5rem', lg: '4.5rem' }, color: colors.onSurface, letterSpacing: '-1px', lineHeight: 1.1, mb: 3 }}>
            Malzeme Tedarikçilerini Keşfet
          </Typography>
          <Typography sx={{ fontSize: { xs: '1rem', md: '1.2rem' }, color: colors.onSurfaceVariant, maxWidth: 640, mx: 'auto', lineHeight: 1.7, mb: 6 }}>
            Binlerce firma ve malzeme — ücretsiz, kayıt gerektirmeden. Endüstriyel ihtiyaçlarınız için en doğru adres.
          </Typography>

          {/* Search */}
          <Box sx={{ maxWidth: 760, mx: 'auto', width: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: colors.surfaceContainerLowest, borderRadius: 3, boxShadow: colors.shadow, border: `1px solid rgba(195,198,215,0.2)`, p: 1, gap: 0 }}>

              {/* Category toggle — inside bar */}
              <Box sx={{ display: 'flex', gap: 0.5, p: 0.5, bgcolor: colors.surfaceContainerLow, borderRadius: 2, flexShrink: 0 }}>
                {(['companies', 'materials'] as const).map((t) => (
                  <Button
                    key={t}
                    onClick={() => setTab(t)}
                    startIcon={t === 'companies' ? <FactoryIcon sx={{ fontSize: '1rem !important' }} /> : <CategoryIcon sx={{ fontSize: '1rem !important' }} />}
                    size="small"
                    sx={{
                      px: 2, py: 0.875, borderRadius: 1.5,
                      bgcolor: tab === t ? '#fff' : 'transparent',
                      color: tab === t ? colors.primary : colors.onSurfaceVariant,
                      fontWeight: tab === t ? 700 : 500,
                      fontSize: '0.8rem',
                      boxShadow: tab === t ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                      transition: 'all 0.15s',
                      whiteSpace: 'nowrap',
                      '&:hover': { bgcolor: tab === t ? '#fff' : 'rgba(195,198,215,0.2)' },
                    }}
                  >
                    {t === 'companies' ? 'Firmalar' : 'Malzemeler'}
                  </Button>
                ))}
              </Box>

              {/* Divider */}
              <Box sx={{ width: '1px', height: 32, bgcolor: 'rgba(195,198,215,0.4)', mx: 1.5, flexShrink: 0 }} />

              {/* Input */}
              <Box sx={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                <SearchIcon sx={{ color: colors.outline, mr: 1.5, flexShrink: 0 }} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder={tab === 'companies' ? 'Firma adı veya sektör ara...' : 'Malzeme adı ara...'}
                  style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', fontSize: '1rem', color: colors.onSurface, fontFamily: 'var(--font-inter), sans-serif', padding: '10px 0' }}
                />
              </Box>

              <Button onClick={handleSearch} variant="contained" size="large" sx={{ px: 4, py: 1.5, borderRadius: 2, flexShrink: 0 }}>
                Ara
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Featured Companies */}
      <Box sx={{ bgcolor: colors.surfaceContainerLow, py: 8, px: { xs: 2, md: 4 } }}>
        <Container maxWidth={false} sx={{ maxWidth: 1440 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 5 }}>
            <Box>
              <Typography variant="h4" sx={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, color: colors.onSurface, mb: 0.5 }}>Öne Çıkan Firmalar</Typography>
              <Typography sx={{ color: colors.onSurfaceVariant, fontSize: '0.9rem' }}>Sektörün güvenilir tedarikçileri</Typography>
            </Box>
            <Button component={Link} href={ROUTES.COMPANIES} endIcon={<ArrowForwardIcon />} sx={{ color: colors.primary, fontWeight: 600, display: { xs: 'none', sm: 'flex' } }}>
              Tümünü Gör
            </Button>
          </Box>
          <Box sx={{ display: 'flex', gap: 3, overflowX: 'auto', pb: 2, scrollSnapType: 'x mandatory', '&::-webkit-scrollbar': { display: 'none' }, msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
            {loadingFeatured && (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', py: 6 }}>
                <CircularProgress />
              </Box>
            )}
            {!loadingFeatured && (featuredData?.content ?? []).length === 0 && (
              <Box sx={{ py: 6, color: colors.onSurfaceVariant, fontSize: '0.9rem' }}>
                Henüz firma kaydı yok.
              </Box>
            )}
            {(featuredData?.content ?? []).map((c) => {
              const location = [c.district, c.city].filter(Boolean).join(', ');
              return (
                <Card key={c.id} component={Link} href={ROUTES.COMPANY_DETAIL(c.id)}
                  sx={{ scrollSnapAlign: 'start', flexShrink: 0, width: 300, bgcolor: colors.surfaceContainerLowest, border: `1px solid rgba(195,198,215,0.2)`, boxShadow: colors.shadow, textDecoration: 'none', position: 'relative', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' } }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ width: 56, height: 56, bgcolor: colors.surfaceContainer, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2, overflow: 'hidden' }}>
                      {c.logoUrl ? (
                        <img src={`http://localhost:8080${c.logoUrl}`} alt={c.companyName} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '4px' }} />
                      ) : (
                        <FactoryIcon sx={{ color: colors.outline }} />
                      )}
                    </Box>
                    <Typography sx={{ fontWeight: 700, color: colors.onSurface, fontSize: '1rem', mb: 0.5 }}>{c.companyName}</Typography>
                    {location && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.8rem', color: colors.outline, mb: 1.5 }}>
                        <LocationOnIcon sx={{ fontSize: '0.9rem' }} />{location}
                      </Box>
                    )}
                    {c.description && (
                      <Typography sx={{ fontSize: '0.8rem', color: colors.onSurfaceVariant, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {c.description}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        </Container>
      </Box>

      {/* Popular Materials */}
      <Box sx={{ bgcolor: colors.surface, py: 10, px: { xs: 2, md: 4 } }}>
        <Container maxWidth={false} sx={{ maxWidth: 1440 }}>
          <Typography variant="h4" sx={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, color: colors.onSurface, textAlign: 'center', mb: 6 }}>
            Popüler Malzemeler
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2,1fr)', md: 'repeat(3,1fr)', lg: 'repeat(4,1fr)' }, gap: 2, maxWidth: 900, mx: 'auto' }}>
            {MATERIALS.map((m) => (
              <Box key={m.name} component={Link} href={m.href}
                sx={{ bgcolor: colors.surfaceContainerLowest, border: `1px solid rgba(195,198,215,0.2)`, borderRadius: 3, p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1.5, height: 120, textDecoration: 'none', transition: 'all 0.15s', '& svg': { fontSize: '1.75rem', color: colors.outline, transition: 'color 0.15s' }, '&:hover': { bgcolor: colors.surfaceContainerLow, '& svg': { color: colors.primary } } }}>
                {m.icon}
                <Typography sx={{ fontWeight: 700, color: colors.onSurface, fontSize: '0.9rem' }}>{m.name}</Typography>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>
    </MainLayout>
  );
}
