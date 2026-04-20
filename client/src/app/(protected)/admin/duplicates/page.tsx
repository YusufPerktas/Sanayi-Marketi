'use client';

import React, { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
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
import { adminService, DuplicatePair } from '@/services/admin.service';
import { useQuery, useMutation } from '@tanstack/react-query';

export default function AdminDuplicatesPage() {
  const [resolved, setResolved] = useState<Set<string>>(new Set());
  const [snack, setSnack] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const { data: pairs = [], isLoading } = useQuery({
    queryKey: ['admin', 'company-duplicates'],
    queryFn: adminService.getCompanyDuplicates,
  });

  const mergeMutation = useMutation({
    mutationFn: ({ primaryId, secondaryId }: { primaryId: number; secondaryId: number }) =>
      adminService.mergeCompanies(primaryId, secondaryId),
    onSuccess: (_, vars) => {
      setResolved((prev) => new Set([...prev, `${vars.primaryId}-${vars.secondaryId}`]));
      setSnack('Firmalar başarıyla birleştirildi');
      setPendingAction(null);
    },
    onError: () => {
      setApiError('Birleştirme işlemi başarısız oldu.');
      setPendingAction(null);
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: ({ pairKey, secondaryId }: { pairKey: string; secondaryId: number }) =>
      adminService.changeCompanyStatus(secondaryId, 'INACTIVE'),
    onSuccess: (_, vars) => {
      setResolved((prev) => new Set([...prev, vars.pairKey]));
      setSnack('Tekrarlı kayıt devre dışı bırakıldı');
      setPendingAction(null);
    },
    onError: () => {
      setApiError('Devre dışı bırakma işlemi başarısız oldu.');
      setPendingAction(null);
    },
  });

  function pairKey(pair: DuplicatePair) {
    return `${pair.companyA.id}-${pair.companyB.id}`;
  }

  function handleMerge(pair: DuplicatePair) {
    const key = pairKey(pair);
    setPendingAction(key);
    setApiError(null);
    mergeMutation.mutate({ primaryId: pair.companyA.id, secondaryId: pair.companyB.id });
  }

  function handleDeactivate(pair: DuplicatePair) {
    const key = pairKey(pair);
    setPendingAction(key);
    setApiError(null);
    deactivateMutation.mutate({ pairKey: key, secondaryId: pair.companyB.id });
  }

  const activePairs = pairs.filter((p) => !resolved.has(pairKey(p)));

  return (
    <AdminLayout title="Duplikat Firmalar">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography sx={{ color: colors.onSurfaceVariant, maxWidth: 600, lineHeight: 1.6 }}>
            Sistem tarafından tespit edilen benzer firma kayıtlarını inceleyin. Aynı kuruluşa ait olanları birleştirebilir veya hatalı kayıtları devre dışı bırakabilirsiniz.
          </Typography>
        </Box>
        {!isLoading && activePairs.length > 0 && (
          <Chip
            icon={<WarningAmberIcon sx={{ fontSize: '1rem' }} />}
            label={`${activePairs.length} Bekleyen İşlem`}
            sx={{ bgcolor: colors.errorContainer, color: colors.error, fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}
          />
        )}
      </Box>

      {apiError && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setApiError(null)}>{apiError}</Alert>}

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress />
        </Box>
      )}

      {!isLoading && activePairs.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 12, bgcolor: colors.surfaceContainerLowest, borderRadius: 3, border: `1px solid rgba(195,198,215,0.15)` }}>
          <MergeIcon sx={{ fontSize: '3rem', color: colors.outline, mb: 2 }} />
          <Typography sx={{ color: colors.onSurfaceVariant }}>Bekleyen duplikat kaydı yok</Typography>
        </Box>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {activePairs.map((pair) => {
          const key = pairKey(pair);
          const isActionLoading = pendingAction === key;
          return (
            <Box
              key={key}
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
                    Olası Duplikat — Benzerlik: %{pair.similarityPercent}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="contained"
                    startIcon={isActionLoading ? <CircularProgress size={16} color="inherit" /> : <MergeIcon />}
                    onClick={() => handleMerge(pair)}
                    disabled={isActionLoading}
                    sx={{ px: 3 }}
                  >
                    Birleştir
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={isActionLoading ? <CircularProgress size={16} color="inherit" /> : <BlockIcon />}
                    color="error"
                    onClick={() => handleDeactivate(pair)}
                    disabled={isActionLoading}
                    sx={{ px: 3 }}
                  >
                    Devre Dışı Bırak
                  </Button>
                </Box>
              </Box>

              {/* Comparison grid */}
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 0 }}>
                {[pair.companyA, pair.companyB].map((company, idx) => (
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
                        {company.createdAt ? new Date(company.createdAt).toLocaleDateString('tr-TR') : '—'}
                      </Box>
                      <Typography sx={{ fontSize: '0.75rem', color: colors.outline }}>ID: #{company.id}</Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          );
        })}
      </Box>

      <Snackbar open={!!snack} autoHideDuration={3000} onClose={() => setSnack(null)} message={snack} />
    </AdminLayout>
  );
}
