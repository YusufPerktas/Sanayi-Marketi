'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Avatar,
  Divider,
  IconButton,
  Badge,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import FavoriteIcon from '@mui/icons-material/Favorite';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import BusinessIcon from '@mui/icons-material/Business';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import CategoryIcon from '@mui/icons-material/Category';
import LogoutIcon from '@mui/icons-material/Logout';
import StorefrontIcon from '@mui/icons-material/Storefront';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AddIcon from '@mui/icons-material/Add';
import { useAuth } from '@/context/useAuth';
import { authService } from '@/services/auth.service';
import { ROUTES, USER_ROLES } from '@/utils/constants';
import { colors } from '@/utils/colors';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const USER_NAV: NavItem[] = [
  { label: 'Panelim', href: ROUTES.DASHBOARD, icon: <DashboardIcon /> },
  { label: 'Favori Firmalar', href: ROUTES.FAVORITES + '?tab=companies', icon: <FavoriteIcon /> },
  { label: 'Favori Materyaller', href: ROUTES.FAVORITES + '?tab=materials', icon: <Inventory2Icon /> },
];

const COMPANY_NAV: NavItem[] = [
  { label: 'Panelim', href: ROUTES.COMPANY_MANAGE, icon: <DashboardIcon /> },
  { label: 'Firma Bilgileri', href: ROUTES.COMPANY_EDIT, icon: <BusinessIcon /> },
  { label: 'Malzemeler', href: ROUTES.COMPANY_MATERIALS, icon: <CategoryIcon /> },
  { label: 'Katalog', href: ROUTES.COMPANY_CATALOG, icon: <MenuBookIcon /> },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
  variant?: 'user' | 'company';
}

export default function DashboardLayout({ children, variant = 'user' }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();

  React.useEffect(() => {
    if (!isLoading && !user) {
      router.replace(`${ROUTES.LOGIN}?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, user, router, pathname]);

  if (isLoading || !user) return null;

  const navItems = variant === 'company' ? COMPANY_NAV : USER_NAV;
  const initials = user?.role ? user.role.charAt(0) : 'U';
  const displayName = 'Kullanıcı';
  const roleLabel = variant === 'company' ? 'Firma Yöneticisi' : 'Standart Üye';

  async function handleLogout() {
    await authService.logout();
    logout();
    router.push(ROUTES.HOME);
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: colors.surface }}>
      {/* Sidebar */}
      <Box
        component="nav"
        sx={{
          width: 288,
          flexShrink: 0,
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100vh',
          bgcolor: colors.surfaceContainerLow,
          borderRight: `1px solid rgba(17,28,45,0.1)`,
          display: 'flex',
          flexDirection: 'column',
          p: 3,
          zIndex: 40,
        }}
      >
        {/* User Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4, px: 0.5 }}>
          <Avatar
            sx={{
              bgcolor: colors.surfaceContainerHigh,
              color: colors.primary,
              fontFamily: 'var(--font-manrope)',
              fontWeight: 700,
              fontSize: '1.1rem',
              width: 48,
              height: 48,
              flexShrink: 0,
            }}
          >
            {initials}
          </Avatar>
          <Box>
            <Typography
              sx={{
                fontFamily: 'var(--font-manrope)',
                fontWeight: 700,
                color: colors.onSurface,
                fontSize: '1rem',
                lineHeight: 1.2,
              }}
            >
              {displayName}
            </Typography>
            <Typography sx={{ fontSize: '0.8rem', color: colors.outline }}>
              {roleLabel}
            </Typography>
          </Box>
        </Box>

        {/* Nav Links */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href.split('?')[0] + '/');
            return (
              <Box
                key={item.href}
                component={Link}
                href={item.href}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  px: 2,
                  py: 1.5,
                  borderRadius: '0 8px 8px 0',
                  bgcolor: active ? colors.surfaceContainerHigh : 'transparent',
                  color: active ? colors.primary : colors.onSurface,
                  fontWeight: active ? 700 : 500,
                  fontSize: '0.875rem',
                  textDecoration: 'none',
                  transition: 'all 0.15s',
                  '& svg': { fontSize: '1.25rem' },
                  '&:hover': {
                    bgcolor: `${colors.surfaceContainerHigh}80`,
                    transform: 'translateX(2px)',
                  },
                }}
              >
                {item.icon}
                {item.label}
              </Box>
            );
          })}
        </Box>

        {/* Bottom Actions */}
        {variant === 'company' && (
          <Box
            component={Link}
            href={ROUTES.COMPANY_MATERIALS}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              px: 2,
              py: 1.5,
              mb: 1,
              borderRadius: 2,
              background: colors.gradientPrimary,
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.875rem',
              cursor: 'pointer',
              justifyContent: 'center',
              textDecoration: 'none',
              '& svg': { fontSize: '1.1rem' },
            }}
          >
            <AddIcon />
            Malzeme Ekle
          </Box>
        )}

        <Divider sx={{ borderColor: `rgba(17,28,45,0.1)`, mb: 1 }} />

        <Box
          component="a"
          href={ROUTES.HOME}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            px: 2,
            py: 1.5,
            borderRadius: 2,
            color: colors.onSurfaceVariant,
            fontSize: '0.875rem',
            textDecoration: 'none',
            '&:hover': { color: colors.primary },
          }}
        >
          <StorefrontIcon sx={{ fontSize: '1.1rem' }} />
          Markete Dön
        </Box>

        <Box
          onClick={handleLogout}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            px: 2,
            py: 1.5,
            borderRadius: 2,
            color: colors.onSurfaceVariant,
            fontSize: '0.875rem',
            cursor: 'pointer',
            '&:hover': { color: colors.error },
            transition: 'color 0.15s',
          }}
        >
          <LogoutIcon sx={{ fontSize: '1.1rem' }} />
          Çıkış Yap
        </Box>
      </Box>

      {/* Main Content */}
      <Box sx={{ ml: '288px', flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {/* Top Header */}
        <Box
          component="header"
          sx={{
            position: 'sticky',
            top: 0,
            zIndex: 30,
            bgcolor: 'rgba(249,249,255,0.85)',
            backdropFilter: 'blur(12px)',
            borderBottom: `1px solid rgba(195,198,215,0.3)`,
            boxShadow: colors.shadow,
            px: 4,
            py: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Typography
            sx={{
              fontFamily: 'var(--font-manrope)',
              fontWeight: 900,
              fontSize: '1.35rem',
              color: colors.onSurface,
              letterSpacing: '-0.5px',
            }}
          >
            Sanayi Marketi
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton size="small" sx={{ color: colors.outline }}>
              <Badge color="error" variant="dot">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Box>
        </Box>

        {/* Page Content */}
        <Box sx={{ flex: 1, p: 4, maxWidth: 1440, mx: 'auto', width: '100%' }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}
