'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import FactoryIcon from '@mui/icons-material/Factory';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import LanguageIcon from '@mui/icons-material/Language';
import ContactsIcon from '@mui/icons-material/Contacts';
import BusinessIcon from '@mui/icons-material/Business';
import DownloadIcon from '@mui/icons-material/Download';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ForwardToInboxIcon from '@mui/icons-material/ForwardToInbox';
import VerifiedIcon from '@mui/icons-material/Verified';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import MainLayout from '@/components/layout/MainLayout';
import { companyService } from '@/services/company.service';
import { favoriteService } from '@/services/favorite.service';
import { useAuth } from '@/context/useAuth';
import { ROUTES } from '@/utils/constants';
import { colors } from '@/utils/colors';

type Tab = 'general' | 'materials' | 'catalog' | 'location';

const ROLE_CHIP: Record<string, { label: string; color: string; bg: string }> = {
  PRODUCER: { label: 'Üretici', color: colors.primary, bg: colors.primaryFixed },
  SELLER: { label: 'Satıcı', color: colors.tertiary, bg: colors.tertiaryFixed },
  BOTH: { label: 'Her İkisi', color: colors.secondary, bg: colors.secondaryFixed },
};

export default function CompanyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const qc = useQueryClient();

  const [tab, setTab] = useState<Tab>('general');

  const { data: company, isLoading } = useQuery({
    queryKey: ['company', id],
    queryFn: () => companyService.getById(id),
    enabled: !!id,
  });

  const { data: materials } = useQuery({
    queryKey: ['company-materials', id],
    queryFn: () => companyService.getMaterials(id),
    enabled: !!id && tab === 'materials',
  });

  const { data: favCompanies } = useQuery({
    queryKey: ['favorites', 'companies'],
    queryFn: favoriteService.getCompanies,
    enabled: isAuthenticated,
  });

  const isFav = favCompanies?.some((c) => c.id === Number(id)) ?? false;

  const favMutation = useMutation({
    mutationFn: () =>
      isFav ? favoriteService.removeCompany(id) : favoriteService.addCompany(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['favorites', 'companies'] }),
  });

  function handleFav() {
    if (!isAuthenticated) { router.push(`${ROUTES.LOGIN}?redirect=${ROUTES.COMPANY_DETAIL(id)}`); return; }
    favMutation.mutate();
  }

  if (isLoading) {
    return (
      <MainLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 16 }}>
          <CircularProgress />
        </Box>
      </MainLayout>
    );
  }

  if (!company) {
    return (
      <MainLayout>
        <Box sx={{ textAlign: 'center', py: 16 }}>
          <Typography sx={{ color: colors.onSurfaceVariant }}>Firma bulunamadı.</Typography>
          <Button component={Link} href={ROUTES.COMPANIES} sx={{ mt: 2 }}>
            Firmalara Dön
          </Button>
        </Box>
      </MainLayout>
    );
  }

  const location = [company.district, company.city].filter(Boolean).join(', ');

  const TABS: { key: Tab; label: string }[] = [
    { key: 'general', label: 'Genel Bilgiler' },
    { key: 'materials', label: 'Malzemeler & Fiyatlar' },
    { key: 'catalog', label: 'Katalog' },
    { key: 'location', label: 'Konum' },
  ];

  return (
    <MainLayout>
      <Container maxWidth={false} sx={{ maxWidth: 1440, px: { xs: 2, md: 4 }, py: 6 }}>
        <Box sx={{ display: 'flex', gap: 4, flexDirection: { xs: 'column', lg: 'row' } }}>
          {/* Left column */}
          <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Company header card */}
            <Box
              sx={{
                bgcolor: colors.surfaceContainerLowest,
                borderRadius: 3,
                p: 5,
                boxShadow: colors.shadow,
                position: 'relative',
              }}
            >
              {/* Status badges */}
              <Box sx={{ position: 'absolute', top: 24, right: 24, display: 'flex', gap: 1 }}>
                <Chip
                  label="Aktif"
                  size="small"
                  sx={{ bgcolor: colors.surfaceContainerHighest, color: colors.tertiary, fontWeight: 700, fontSize: '0.65rem', textTransform: 'uppercase' }}
                />
              </Box>

              {/* Logo + name */}
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 4, mb: 4, flexWrap: 'wrap' }}>
                <Box
                  sx={{
                    width: 112,
                    height: 112,
                    borderRadius: 2,
                    bgcolor: colors.surfaceContainerLow,
                    border: `1px solid rgba(195,198,215,0.15)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <FactoryIcon sx={{ fontSize: '3rem', color: colors.outline }} />
                </Box>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1, flexWrap: 'wrap' }}>
                    <Typography
                      variant="h4"
                      sx={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, color: colors.onSurface, letterSpacing: '-0.5px' }}
                    >
                      {company.companyName}
                    </Typography>
                    <VerifiedIcon sx={{ color: colors.primary, fontSize: '1.4rem' }} />
                  </Box>
                  {location && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: colors.onSurfaceVariant }}>
                      <LocationOnIcon sx={{ fontSize: '1.1rem' }} />
                      <Typography sx={{ fontSize: '1rem' }}>{location}</Typography>
                    </Box>
                  )}
                </Box>
              </Box>

              {/* Tabs */}
              <Box sx={{ display: 'flex', gap: 4, borderBottom: `1px solid rgba(195,198,215,0.15)` }}>
                {TABS.map((t) => (
                  <Box
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    sx={{
                      pb: 2,
                      fontFamily: 'var(--font-manrope)',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      color: tab === t.key ? colors.primary : colors.onSurfaceVariant,
                      borderBottom: tab === t.key ? `2px solid ${colors.primary}` : '2px solid transparent',
                      cursor: 'pointer',
                      '&:hover': { color: colors.primary },
                      transition: 'color 0.15s',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {t.label}
                  </Box>
                ))}
              </Box>
            </Box>

            {/* Tab content */}
            {tab === 'general' && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {company.description && (
                  <Box
                    sx={{
                      bgcolor: colors.surfaceContainerLowest,
                      borderRadius: 3,
                      p: 4,
                      boxShadow: colors.shadow,
                    }}
                  >
                    <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', color: colors.onSurface, mb: 2 }}>
                      Hakkımızda
                    </Typography>
                    <Typography sx={{ color: colors.onSurfaceVariant, lineHeight: 1.7 }}>
                      {company.description}
                    </Typography>
                  </Box>
                )}

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                  {/* Contact */}
                  <Box
                    sx={{
                      bgcolor: colors.surfaceContainerLow,
                      borderRadius: 3,
                      p: 4,
                      border: `1px solid rgba(195,198,215,0.15)`,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 3,
                    }}
                  >
                    <Typography sx={{ fontWeight: 700, fontSize: '1.05rem', color: colors.onSurface, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ContactsIcon sx={{ color: colors.primary, fontSize: '1.2rem' }} />
                      İletişim Bilgileri
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {company.phone && (
                        <Box component="a" href={`tel:${company.phone}`} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, color: colors.onSurfaceVariant, textDecoration: 'none', '&:hover': { color: colors.primary }, fontSize: '0.9rem' }}>
                          <PhoneIcon sx={{ color: colors.outline, fontSize: '1.1rem' }} />
                          {company.phone}
                        </Box>
                      )}
                      {company.email && (
                        <Box component="a" href={`mailto:${company.email}`} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, color: colors.onSurfaceVariant, textDecoration: 'none', '&:hover': { color: colors.primary }, fontSize: '0.9rem' }}>
                          <EmailIcon sx={{ color: colors.outline, fontSize: '1.1rem' }} />
                          {company.email}
                        </Box>
                      )}
                      {company.website && (
                        <Box component="a" href={company.website} target="_blank" rel="noopener noreferrer" sx={{ display: 'flex', alignItems: 'center', gap: 1.5, color: colors.onSurfaceVariant, textDecoration: 'none', '&:hover': { color: colors.primary }, fontSize: '0.9rem' }}>
                          <LanguageIcon sx={{ color: colors.outline, fontSize: '1.1rem' }} />
                          {company.website.replace(/^https?:\/\//, '')}
                        </Box>
                      )}
                      {!company.phone && !company.email && !company.website && (
                        <Typography sx={{ fontSize: '0.875rem', color: colors.outline }}>İletişim bilgisi eklenmemiş</Typography>
                      )}
                    </Box>
                  </Box>

                  {/* Address */}
                  <Box
                    sx={{
                      bgcolor: colors.surfaceContainerLow,
                      borderRadius: 3,
                      p: 4,
                      border: `1px solid rgba(195,198,215,0.15)`,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 3,
                    }}
                  >
                    <Typography sx={{ fontWeight: 700, fontSize: '1.05rem', color: colors.onSurface, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <BusinessIcon sx={{ color: colors.primary, fontSize: '1.2rem' }} />
                      Adres
                    </Typography>
                    {company.fullAddress ? (
                      <Typography sx={{ color: colors.onSurfaceVariant, lineHeight: 1.7, fontSize: '0.9rem' }}>
                        {company.fullAddress}
                        {company.district && <><br />{company.district}</>}
                        {company.city && <><br />{company.city}</>}
                        {company.country && <><br />{company.country}</>}
                      </Typography>
                    ) : (
                      <Typography sx={{ fontSize: '0.875rem', color: colors.outline }}>Adres bilgisi eklenmemiş</Typography>
                    )}
                  </Box>
                </Box>
              </Box>
            )}

            {tab === 'materials' && (
              <Box
                sx={{
                  bgcolor: colors.surfaceContainerLowest,
                  borderRadius: 3,
                  overflow: 'hidden',
                  boxShadow: colors.shadow,
                }}
              >
                <Box
                  sx={{
                    p: 3,
                    borderBottom: `1px solid rgba(195,198,215,0.15)`,
                    bgcolor: colors.surfaceContainerLow,
                  }}
                >
                  <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', color: colors.onSurface }}>
                    Malzeme Fiyat Listesi
                  </Typography>
                </Box>
                {!materials ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                    <CircularProgress size={28} />
                  </Box>
                ) : materials.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 8 }}>
                    <Typography sx={{ color: colors.onSurfaceVariant }}>Malzeme listesi henüz eklenmemiş</Typography>
                  </Box>
                ) : (
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: colors.surface }}>
                        <TableCell sx={{ fontWeight: 600, color: colors.onSurfaceVariant, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Malzeme Adı</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: colors.onSurfaceVariant, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Rolü</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, color: colors.onSurfaceVariant, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fiyat (TL)</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {materials.map((m, idx) => {
                        const role = ROLE_CHIP[m.role] ?? ROLE_CHIP.BOTH;
                        return (
                          <TableRow
                            key={`${m.materialId}-${idx}`}
                            sx={{
                              '&:nth-of-type(even)': { bgcolor: `${colors.surfaceContainerLow}30` },
                              '&:hover': { bgcolor: `${colors.surfaceContainerLow}50` },
                            }}
                          >
                            <TableCell sx={{ color: colors.onSurface }}>{m.materialName}</TableCell>
                            <TableCell>
                              <Chip
                                label={role.label}
                                size="small"
                                sx={{ bgcolor: role.bg, color: role.color, fontWeight: 700, fontSize: '0.65rem', textTransform: 'uppercase', height: 22 }}
                              />
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600, color: colors.onSurface }}>
                              {m.price != null ? `${m.price.toLocaleString('tr-TR')} ₺` : '—'}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </Box>
            )}

            {tab === 'catalog' && (
              <Box
                sx={{
                  bgcolor: colors.surfaceContainerLowest,
                  borderRadius: 3,
                  p: 5,
                  boxShadow: colors.shadow,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  py: 10,
                }}
              >
                {company.catalogFileUrl ? (
                  <>
                    <Box
                      sx={{
                        width: 64,
                        height: 64,
                        borderRadius: '50%',
                        bgcolor: colors.surfaceContainerLow,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 2,
                      }}
                    >
                      <DownloadIcon sx={{ color: colors.primary, fontSize: '2rem' }} />
                    </Box>
                    <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', color: colors.onSurface, mb: 1 }}>
                      Ürün Kataloğu
                    </Typography>
                    <Typography sx={{ color: colors.onSurfaceVariant, fontSize: '0.875rem', maxWidth: 400, mb: 3 }}>
                      Tüm teknik spesifikasyonları içeren güncel ürün kataloğunu indirebilirsiniz.
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<DownloadIcon />}
                      component="a"
                      href={company.catalogFileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ px: 4 }}
                    >
                      Kataloğu İndir ({company.catalogFileType ?? 'PDF'})
                    </Button>
                  </>
                ) : (
                  <Typography sx={{ color: colors.onSurfaceVariant }}>Katalog henüz yüklenmemiş</Typography>
                )}
              </Box>
            )}

            {tab === 'location' && (
              <Box
                sx={{
                  bgcolor: colors.surfaceContainerLowest,
                  borderRadius: 3,
                  p: 1,
                  boxShadow: colors.shadow,
                  overflow: 'hidden',
                }}
              >
                {company.googleMapsEmbedUrl ? (
                  <Box
                    component="iframe"
                    src={company.googleMapsEmbedUrl}
                    sx={{ width: '100%', height: 400, border: 'none', display: 'block' }}
                    loading="lazy"
                    allowFullScreen
                  />
                ) : (
                  <Box
                    sx={{
                      height: 300,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: colors.surfaceContainerLow,
                      borderRadius: 3,
                    }}
                  >
                    <Box sx={{ textAlign: 'center' }}>
                      <LocationOnIcon sx={{ fontSize: '3rem', color: colors.outline, mb: 1 }} />
                      <Typography sx={{ color: colors.onSurfaceVariant }}>
                        {location || 'Konum bilgisi girilmemiş'}
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Box>
            )}
          </Box>

          {/* Right sidebar */}
          <Box sx={{ width: { xs: '100%', lg: 340 }, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Action buttons */}
            <Box
              sx={{
                bgcolor: colors.surfaceContainerLowest,
                borderRadius: 3,
                p: 3,
                boxShadow: colors.shadow,
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
              }}
            >
              {company.email && (
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<ForwardToInboxIcon />}
                  component="a"
                  href={`mailto:${company.email}?subject=Sanayi Marketi - İletişim Talebi`}
                  sx={{ py: 1.5 }}
                >
                  Mesaj Gönder
                </Button>
              )}
              <Box sx={{ display: 'flex', gap: 1.5 }}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={isFav ? <FavoriteIcon sx={{ color: colors.error }} /> : <FavoriteBorderIcon />}
                  onClick={handleFav}
                  disabled={favMutation.isPending}
                  sx={{
                    borderColor: 'rgba(195,198,215,0.3)',
                    color: colors.onSurface,
                    py: 1.25,
                    '&:hover': { bgcolor: colors.surfaceContainerLow },
                  }}
                >
                  {isFav ? 'Favoride' : 'Favorile'}
                </Button>
              </Box>
            </Box>

            {/* Meta info */}
            <Box
              sx={{
                bgcolor: colors.surfaceContainerLowest,
                borderRadius: 3,
                p: 3,
                boxShadow: colors.shadow,
              }}
            >
              <Typography
                sx={{
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  color: colors.onSurface,
                  pb: 2,
                  mb: 2,
                  borderBottom: `1px solid rgba(195,198,215,0.15)`,
                }}
              >
                Firma Bilgileri
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                  <Typography sx={{ color: colors.onSurfaceVariant, fontSize: '0.875rem' }}>Durum</Typography>
                  <Chip
                    label={company.status === 'ACTIVE' ? 'Aktif' : company.status}
                    size="small"
                    sx={{
                      bgcolor: company.status === 'ACTIVE' ? colors.tertiaryFixed : colors.surfaceContainerHigh,
                      color: company.status === 'ACTIVE' ? colors.tertiary : colors.onSurfaceVariant,
                      fontWeight: 700,
                      fontSize: '0.7rem',
                      height: 22,
                    }}
                  />
                </Box>
                <Divider sx={{ borderColor: `rgba(195,198,215,0.15)` }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                  <Typography sx={{ color: colors.onSurfaceVariant, fontSize: '0.875rem' }}>Kayıt Tarihi</Typography>
                  <Typography sx={{ fontWeight: 600, color: colors.onSurface, fontSize: '0.875rem' }}>
                    {new Date(company.createdAt).toLocaleDateString('tr-TR')}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </Container>
    </MainLayout>
  );
}
