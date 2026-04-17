'use client';

import React from 'react';
import Link from 'next/link';
import { Box, Button, CircularProgress, Typography } from '@mui/material';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import LogoutIcon from '@mui/icons-material/Logout';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { companyApplicationService } from '@/services/companyApplication.service';
import { authService } from '@/services/auth.service';
import { useAuth } from '@/context/useAuth';
import { ROUTES } from '@/utils/constants';
import { colors } from '@/utils/colors';

const STATUS_CONFIG = {
  PENDING: {
    icon: <HourglassEmptyIcon sx={{ fontSize: '3.5rem', color: '#d97706' }} />,
    title: 'Başvurunuz İnceleniyor',
    description: 'Başvurunuz yöneticilerimiz tarafından incelenmektedir. İnceleme süreci genellikle 24–48 saat sürmektedir.',
    color: '#d97706',
    bg: '#fef3c7',
  },
  APPROVED: {
    icon: <CheckCircleIcon sx={{ fontSize: '3.5rem', color: colors.tertiary }} />,
    title: 'Başvurunuz Onaylandı!',
    description: 'Tebrikler! Firma başvurunuz onaylandı. Artık firma yönetim paneline erişebilirsiniz.',
    color: colors.tertiary,
    bg: colors.tertiaryFixed,
  },
  REJECTED: {
    icon: <CancelIcon sx={{ fontSize: '3.5rem', color: colors.error }} />,
    title: 'Başvurunuz Reddedildi',
    description: 'Maalesef başvurunuz reddedildi.',
    color: colors.error,
    bg: colors.errorContainer,
  },
};

export default function ApplicationStatusPage() {
  const { logout } = useAuth();
  const router = useRouter();

  const { data: applications, isLoading } = useQuery({
    queryKey: ['my-applications'],
    queryFn: companyApplicationService.getMyApplications,
  });

  async function handleLogout() {
    await authService.logout();
    logout();
    router.push(ROUTES.HOME);
  }

  const latest = applications?.[applications.length - 1];
  const status = latest?.status ?? 'PENDING';
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.PENDING;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: colors.surfaceContainerLow,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <Box
        sx={{
          bgcolor: colors.surfaceContainerLowest,
          width: '100%',
          maxWidth: 520,
          p: { xs: 4, sm: 6 },
          borderRadius: 3,
          boxShadow: colors.shadow,
          textAlign: 'center',
        }}
      >
        <Typography
          sx={{
            fontFamily: 'var(--font-manrope)',
            fontWeight: 900,
            fontSize: '1.35rem',
            color: colors.onSurface,
            mb: 6,
          }}
        >
          Sanayi Marketi
        </Typography>

        {isLoading ? (
          <Box sx={{ py: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Status icon */}
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                bgcolor: config.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 3,
              }}
            >
              {config.icon}
            </Box>

            <Typography
              sx={{
                fontFamily: 'var(--font-manrope)',
                fontWeight: 700,
                fontSize: '1.5rem',
                color: config.color,
                mb: 2,
              }}
            >
              {config.title}
            </Typography>

            <Typography sx={{ color: colors.onSurfaceVariant, lineHeight: 1.7, mb: 2 }}>
              {config.description}
            </Typography>

            {status === 'REJECTED' && latest?.rejectionReason && (
              <Box
                sx={{
                  p: 3,
                  bgcolor: colors.errorContainer,
                  borderRadius: 2,
                  mb: 3,
                  textAlign: 'left',
                }}
              >
                <Typography sx={{ fontWeight: 700, color: colors.error, fontSize: '0.875rem', mb: 0.5 }}>
                  Red Sebebi:
                </Typography>
                <Typography sx={{ color: colors.onErrorContainer, fontSize: '0.875rem' }}>
                  {latest.rejectionReason}
                </Typography>
              </Box>
            )}

            {latest && (
              <Box
                sx={{
                  p: 2.5,
                  bgcolor: colors.surfaceContainerLow,
                  borderRadius: 2,
                  mb: 4,
                  textAlign: 'left',
                }}
              >
                <Typography sx={{ fontSize: '0.8rem', color: colors.onSurfaceVariant, mb: 0.5 }}>
                  Başvuru No: <strong>#{latest.id}</strong>
                </Typography>
                <Typography sx={{ fontSize: '0.8rem', color: colors.onSurfaceVariant }}>
                  Gönderim: {new Date(latest.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </Typography>
              </Box>
            )}

            {status === 'APPROVED' && (
              <Button
                component={Link}
                href={ROUTES.COMPANY_MANAGE}
                variant="contained"
                fullWidth
                size="large"
                sx={{ mb: 2 }}
              >
                Firma Paneline Git
              </Button>
            )}

            {status === 'REJECTED' && (
              <Button
                component={Link}
                href={ROUTES.COMPANY_APPLY}
                variant="contained"
                fullWidth
                size="large"
                sx={{ mb: 2 }}
              >
                Yeni Başvuru Yap
              </Button>
            )}
          </>
        )}

        <Button
          onClick={handleLogout}
          startIcon={<LogoutIcon />}
          sx={{ color: colors.onSurfaceVariant, '&:hover': { color: colors.error } }}
        >
          Çıkış Yap
        </Button>
      </Box>
    </Box>
  );
}
