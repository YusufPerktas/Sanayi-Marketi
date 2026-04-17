'use client';

import React, { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Snackbar,
  Typography,
} from '@mui/material';
import MergeIcon from '@mui/icons-material/Merge';
import BlockIcon from '@mui/icons-material/Block';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import AdminLayout from '@/components/layout/AdminLayout';
import { colors } from '@/utils/colors';

// Placeholder data — needs backend duplicate detection endpoint
const MOCK_PAIRS = [
  {
    id: 1,
    a: { id: 101, companyName: 'Demirbağ Çelik A.Ş.', city: 'İstanbul', district: 'Gebze', phone: '+90 216 456 78 90', email: 'info@demirbagscelik.com', status: 'ACTIVE', createdAt: '2024-02-15' },
    b: { id: 205, companyName: 'Demirbag Celik Sanayi', city: 'İstanbul', district: 'Gebze', phone: '+90 216 456 78 91', email: 'iletisim@demirbagcelik.net', status: 'INACTIVE', createdAt: '2024-03-22' },
    similarity: 92,
  },
  {
    id: 2,
    a: { id: 88, companyName: 'Kuzey Alüminyum Ltd.', city: 'Bursa', district: 'Nilüfer', phone: '+90 224 333 22 11', email: 'satis@kuzeyaluminyum.com', status: 'ACTIVE', createdAt: '2023-09-01' },
    b: { id: 312, companyName: 'Kuzey Alüminyum Ve Metal', city: 'Bursa', district: 'Nilüfer', phone: null, email: 'kuzeyal@gmail.com', status: 'INACTIVE', createdAt: '2024-01-10' },
    similarity: 87,
  },
];

export default function AdminDuplicatesPage() {
  const [resolved, setResolved] = useState<Set<number>>(new Set());
  const [snack, setSnack] = useState<string | null>(null);

  function handleMerge(pairId: number) {
    setResolved((prev) => new Set([...prev, pairId]));
    setSnack('Firmalar başarıyla birleştirildi');
  }

  function handleDeactivate(pairId: number) {
    setResolved((prev) => new Set([...prev, pairId]));
    setSnack('Tekrarlı kayıt devre dışı bırakıldı');
  }

  const activePairs = MOCK_PAIRS.filter((p) => !resolved.has(p.id));

  return (
    <AdminLayout title="Duplikat Firmalar">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography sx={{ color: colors.onSurfaceVariant, maxWidth: 600, lineHeight: 1.6 }}>
            Sistem tarafından tespit edilen benzer firma kayıtlarını inceleyin. Aynı kuruluşa ait olanları birleştirebilir veya hatalı kayıtları devre dışı bırakabilirsiniz.
          </Typography>
        </Box>
        {activePairs.length > 0 && (
          <Chip
            icon={<WarningAmberIcon sx={{ fontSize: '1rem' }} />}
            label={`${activePairs.length} Bekleyen İşlem`}
            sx={{ bgcolor: colors.errorContainer, color: colors.error, fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}
          />
        )}
      </Box>

      {activePairs.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 12, bgcolor: colors.surfaceContainerLowest, borderRadius: 3, border: `1px solid rgba(195,198,215,0.15)` }}>
          <MergeIcon sx={{ fontSize: '3rem', color: colors.outline, mb: 2 }} />
          <Typography sx={{ color: colors.onSurfaceVariant }}>Bekleyen duplikat kaydı yok</Typography>
        </Box>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {activePairs.map((pair) => (
          <Box
            key={pair.id}
            sx={{
              bgcolor: colors.surfaceContainerLowest,
              borderRadius: 3,
              overflow: 'hidden',
              border: `1px solid rgba(195,198,215,0.15)`,
              boxShadow: colors.shadowSm,
            }}
          >
            {/* Header */}
            <Box
              sx={{
                bgcolor: colors.surfaceContainerLow,
                borderBottom: `1px solid rgba(195,198,215,0.15)`,
                p: 3,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 2,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <WarningAmberIcon sx={{ color: '#d97706' }} />
                <Typography sx={{ fontWeight: 700, color: colors.onSurface }}>
                  Olası Duplikat — Benzerlik: %{pair.similarity}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<MergeIcon />}
                  onClick={() => handleMerge(pair.id)}
                  sx={{ px: 3 }}
                >
                  Birleştir
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<BlockIcon />}
                  color="error"
                  onClick={() => handleDeactivate(pair.id)}
                  sx={{ px: 3 }}
                >
                  Devre Dışı Bırak
                </Button>
              </Box>
            </Box>

            {/* Comparison grid */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 0 }}>
              {[pair.a, pair.b].map((company, idx) => (
                <Box
                  key={company.id}
                  sx={{
                    p: 4,
                    borderRight: idx === 0 ? { md: `1px solid rgba(195,198,215,0.15)` } : undefined,
                    borderBottom: idx === 0 ? { xs: `1px solid rgba(195,198,215,0.15)`, md: 'none' } : undefined,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                    <Typography sx={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: '1.1rem', color: colors.onSurface }}>
                      {company.companyName}
                    </Typography>
                    <Chip
                      label={company.status === 'ACTIVE' ? 'Aktif' : 'Pasif'}
                      size="small"
                      sx={{
                        bgcolor: company.status === 'ACTIVE' ? colors.tertiaryFixed : colors.surfaceContainerHigh,
                        color: company.status === 'ACTIVE' ? colors.tertiary : colors.onSurfaceVariant,
                        fontWeight: 700,
                        fontSize: '0.65rem',
                        height: 20,
                      }}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {(company.city || company.district) && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: colors.onSurfaceVariant, fontSize: '0.875rem' }}>
                        <LocationOnIcon sx={{ fontSize: '1rem', color: colors.outline }} />
                        {[company.district, company.city].filter(Boolean).join(', ')}
                      </Box>
                    )}
                    {company.phone && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: colors.onSurfaceVariant, fontSize: '0.875rem' }}>
                        <PhoneIcon sx={{ fontSize: '1rem', color: colors.outline }} />
                        {company.phone}
                      </Box>
                    )}
                    {company.email && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: colors.onSurfaceVariant, fontSize: '0.875rem' }}>
                        <EmailIcon sx={{ fontSize: '1rem', color: colors.outline }} />
                        {company.email}
                      </Box>
                    )}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: colors.onSurfaceVariant, fontSize: '0.875rem' }}>
                      <Typography sx={{ fontSize: '0.75rem', color: colors.outline }}>Kayıt: </Typography>
                      {new Date(company.createdAt).toLocaleDateString('tr-TR')}
                    </Box>
                    <Typography sx={{ fontSize: '0.75rem', color: colors.outline }}>ID: #{company.id}</Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        ))}
      </Box>

      <Snackbar open={!!snack} autoHideDuration={3000} onClose={() => setSnack(null)} message={snack} />
    </AdminLayout>
  );
}
