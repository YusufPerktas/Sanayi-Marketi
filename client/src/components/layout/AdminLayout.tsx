'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Box, Typography, IconButton, Badge } from '@mui/material';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import FactoryIcon from '@mui/icons-material/Factory';
import MergeIcon from '@mui/icons-material/Merge';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import BarChartIcon from '@mui/icons-material/BarChart';
import NotificationsIcon from '@mui/icons-material/Notifications';
import LogoutIcon from '@mui/icons-material/Logout';
import ShieldIcon from '@mui/icons-material/Shield';
import { useAuth } from '@/context/useAuth';
import { authService } from '@/services/auth.service';
import { ROUTES } from '@/utils/constants';
import { colors } from '@/utils/colors';

const ADMIN_NAV = [
  { label: 'Genel Bakış', href: ROUTES.ADMIN, icon: <AnalyticsIcon /> },
  { label: 'Başvurular', href: ROUTES.ADMIN_APPROVALS, icon: <AssignmentIndIcon /> },
  { label: 'Firmalar', href: ROUTES.COMPANIES, icon: <FactoryIcon /> },
  { label: 'Duplikatlar', href: ROUTES.ADMIN_DUPLICATES, icon: <MergeIcon /> },
  { label: 'Scraper', href: ROUTES.ADMIN_SCRAPER, icon: <SmartToyIcon /> },
  { label: 'İstatistikler', href: ROUTES.ADMIN_STATISTICS, icon: <BarChartIcon /> },
];

export default function AdminLayout({ children, title }: { children: React.ReactNode; title?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

  async function handleLogout() {
    await authService.logout();
    logout();
    router.push(ROUTES.HOME);
  }

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Dark Sidebar */}
      <Box
        component="nav"
        sx={{
          width: 256,
          flexShrink: 0,
          bgcolor: colors.inverseSurface,
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 0.5,
          p: 2,
          zIndex: 50,
        }}
      >
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4, mt: 1, px: 1 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              bgcolor: colors.primary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <ShieldIcon sx={{ color: '#fff', fontSize: '1.2rem' }} />
          </Box>
          <Box>
            <Typography
              sx={{
                fontFamily: 'var(--font-manrope)',
                fontWeight: 700,
                color: '#fff',
                fontSize: '1rem',
                lineHeight: 1.2,
              }}
            >
              Yönetim Paneli
            </Typography>
            <Typography sx={{ fontSize: '0.75rem', color: 'rgba(148,163,184,1)' }}>
              Sistem Yöneticisi
            </Typography>
          </Box>
        </Box>

        {/* Nav Links */}
        <Box sx={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {ADMIN_NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Box
                key={item.href}
                component={Link}
                href={item.href}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  px: 1.5,
                  py: 1.25,
                  borderRadius: 1,
                  bgcolor: active ? colors.primary : 'transparent',
                  color: active ? '#fff' : 'rgba(148,163,184,1)',
                  fontWeight: active ? 700 : 500,
                  fontSize: '0.875rem',
                  textDecoration: 'none',
                  transition: 'all 0.15s',
                  '& svg': { fontSize: '1.2rem' },
                  '&:hover': {
                    bgcolor: active ? colors.primary : 'rgba(30,41,59,0.8)',
                    color: '#fff',
                  },
                }}
              >
                {item.icon}
                {item.label}
              </Box>
            );
          })}
        </Box>

        {/* Logout */}
        <Box sx={{ borderTop: '1px solid rgba(30,41,59,1)', pt: 1, mt: 1 }}>
          <Box
            onClick={handleLogout}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              px: 1.5,
              py: 1,
              borderRadius: 1,
              color: 'rgba(148,163,184,1)',
              fontSize: '0.875rem',
              cursor: 'pointer',
              '& svg': { fontSize: '1.2rem' },
              '&:hover': { bgcolor: 'rgba(30,41,59,0.8)', color: '#fff' },
              transition: 'all 0.15s',
            }}
          >
            <LogoutIcon />
            Çıkış Yap
          </Box>
        </Box>
      </Box>

      {/* Main Content */}
      <Box sx={{ ml: '256px', flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        {/* Top Header */}
        <Box
          component="header"
          sx={{
            height: 80,
            bgcolor: 'rgba(249,249,255,0.85)',
            backdropFilter: 'blur(12px)',
            position: 'sticky',
            top: 0,
            zIndex: 30,
            px: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: `1px solid rgba(195,198,215,0.3)`,
            boxShadow: colors.shadow,
          }}
        >
          <Typography
            sx={{
              fontFamily: 'var(--font-manrope)',
              fontWeight: 700,
              fontSize: '1.25rem',
              color: colors.onSurface,
            }}
          >
            {title ?? 'Yönetim'}
          </Typography>
          <IconButton size="small" sx={{ color: colors.outline }}>
            <NotificationsIcon />
          </IconButton>
        </Box>

        {/* Scrollable Content */}
        <Box sx={{ flex: 1, overflowY: 'auto', p: 4 }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}
