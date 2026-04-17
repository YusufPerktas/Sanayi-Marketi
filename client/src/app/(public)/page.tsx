'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Box, Button, Container, Typography, Card, CardContent, Chip, IconButton } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import VerifiedIcon from '@mui/icons-material/Verified';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import HardwareIcon from '@mui/icons-material/Hardware';
import LayersIcon from '@mui/icons-material/Layers';
import RecyclingIcon from '@mui/icons-material/Recycling';
import CableIcon from '@mui/icons-material/Cable';
import ForestIcon from '@mui/icons-material/Forest';
import ViewInArIcon from '@mui/icons-material/ViewInAr';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import FactoryIcon from '@mui/icons-material/Factory';
import CategoryIcon from '@mui/icons-material/Category';
import MainLayout from '@/components/layout/MainLayout';
import { ROUTES } from '@/utils/constants';
import { colors } from '@/utils/colors';

const FEATURED = [
  { id: 1, name: 'Demirbağ Çelik', location: 'İstanbul, Gebze', tags: ['Çelik', 'Paslanmaz'], verified: true },
  { id: 2, name: 'Erpa Alüminyum', location: 'Bursa, Nilüfer', tags: ['Alüminyum', 'Profil'], verified: true },
  { id: 3, name: 'Mega Bakır', location: 'Ankara, Ostim', tags: ['Bakır', 'Kablo'], verified: false },
  { id: 4, name: 'Polimer Plastik', location: 'İzmir, Çiğli', tags: ['Plastik', 'Hammadde'], verified: true },
];

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
          <Box sx={{ maxWidth: 720, mx: 'auto', width: '100%' }}>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, bgcolor: colors.surfaceContainerLowest, borderRadius: 3, boxShadow: colors.shadow, border: `1px solid rgba(195,198,215,0.2)`, p: 1, gap: { xs: 1, sm: 0 } }}>
              <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', px: 2 }}>
                <SearchIcon sx={{ color: colors.outline, mr: 1.5 }} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Malzeme veya firma adı arayın..."
                  style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', fontSize: '1rem', color: colors.onSurface, fontFamily: 'var(--font-inter), sans-serif', padding: '10px 0' }}
                />
              </Box>
              <Button onClick={handleSearch} variant="contained" size="large" sx={{ px: 4, py: 1.5, borderRadius: 2, flexShrink: 0 }}>
                Ara
              </Button>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, mt: 3, justifyContent: 'center' }}>
              {(['companies', 'materials'] as const).map((t) => (
                <Button key={t} onClick={() => setTab(t)} startIcon={t === 'companies' ? <FactoryIcon /> : <CategoryIcon />}
                  sx={{ px: 3, py: 1, borderRadius: 99, bgcolor: tab === t ? colors.surfaceContainerHigh : colors.surfaceContainerLowest, color: tab === t ? colors.primary : colors.onSurfaceVariant, fontWeight: tab === t ? 700 : 500, border: `1px solid rgba(195,198,215,0.2)`, '&:hover': { bgcolor: colors.surfaceVariant } }}>
                  {t === 'companies' ? 'Firmalar' : 'Malzemeler'}
                </Button>
              ))}
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
            {FEATURED.map((c) => (
              <Card key={c.id} component={Link} href={ROUTES.COMPANY_DETAIL(c.id)}
                sx={{ scrollSnapAlign: 'start', flexShrink: 0, width: 300, bgcolor: colors.surfaceContainerLowest, border: `1px solid rgba(195,198,215,0.2)`, boxShadow: colors.shadow, textDecoration: 'none', position: 'relative', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' } }}>
                <IconButton size="small" sx={{ position: 'absolute', top: 8, right: 8, color: colors.outline, '&:hover': { color: colors.error } }} onClick={(e) => e.preventDefault()}>
                  <FavoriteBorderIcon fontSize="small" />
                </IconButton>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ width: 56, height: 56, bgcolor: colors.surfaceContainer, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                    <FactoryIcon sx={{ color: colors.outline }} />
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
                    <Typography sx={{ fontWeight: 700, color: colors.onSurface, fontSize: '1rem' }}>{c.name}</Typography>
                    {c.verified && <VerifiedIcon sx={{ color: colors.primary, fontSize: '1rem' }} />}
                  </Box>
                  <Typography sx={{ fontSize: '0.8rem', color: colors.outline, display: 'flex', alignItems: 'center', gap: 0.5, mb: 2 }}>
                    <LocationOnIcon sx={{ fontSize: '0.9rem' }} />{c.location}
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                    {c.tags.map((tag) => <Chip key={tag} label={tag} size="small" sx={{ bgcolor: colors.surfaceContainer, color: colors.onSurfaceVariant, fontSize: '0.7rem', fontWeight: 600, height: 24 }} />)}
                  </Box>
                </CardContent>
              </Card>
            ))}
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
