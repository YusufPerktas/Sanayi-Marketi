'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  AppBar,
  Box,
  Button,
  Container,
  Toolbar,
  Typography,
  IconButton,
  Divider,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useAuth } from '@/context/useAuth';
import { ROUTES } from '@/utils/constants';
import { colors } from '@/utils/colors';

const NAV_LINKS = [
  { label: 'Firmalar', href: ROUTES.COMPANIES },
  { label: 'Materyaller', href: ROUTES.MATERIALS },
];

const FOOTER_LINKS = [
  { label: 'Hizmet Şartları', href: '#' },
  { label: 'Gizlilik Politikası', href: '#' },
  { label: 'İletişim', href: '#' },
  { label: 'SSS', href: '#' },
];

function getDashboardRoute(role: string | undefined): string {
  switch (role) {
    case 'ADMIN': return ROUTES.ADMIN;
    case 'COMPANY_USER': return ROUTES.COMPANY_MANAGE;
    case 'PENDING_COMPANY_USER': return ROUTES.APPLICATION_STATUS;
    default: return ROUTES.DASHBOARD;
  }
}

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isAuthenticated, user } = useAuth();

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: colors.surface }}>
      {/* Sticky Navbar */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: 'rgba(249,249,255,0.85)',
          backdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${colors.surfaceContainerLow}`,
          boxShadow: colors.shadow,
          color: colors.onSurface,
        }}
      >
        <Container maxWidth={false} sx={{ maxWidth: 1440 }}>
          <Toolbar disableGutters sx={{ py: 1, gap: 4 }}>
            {/* Logo */}
            <Typography
              component={Link}
              href={ROUTES.HOME}
              variant="h6"
              sx={{
                fontFamily: 'var(--font-manrope), sans-serif',
                fontWeight: 900,
                color: colors.onSurface,
                textDecoration: 'none',
                letterSpacing: '-0.5px',
                fontSize: '1.35rem',
                flexShrink: 0,
              }}
            >
              Sanayi Marketi
            </Typography>

            {/* Nav Links */}
            <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 3, flex: 1 }}>
              {NAV_LINKS.map((link) => {
                const active = pathname.startsWith(link.href);
                return (
                  <Typography
                    key={link.href}
                    component={Link}
                    href={link.href}
                    sx={{
                      fontFamily: 'var(--font-manrope), sans-serif',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      color: active ? colors.primary : colors.onSurface,
                      textDecoration: 'none',
                      opacity: active ? 1 : 0.7,
                      borderBottom: active ? `2px solid ${colors.primary}` : '2px solid transparent',
                      pb: 0.5,
                      '&:hover': { color: colors.primaryContainer, opacity: 1 },
                      transition: 'all 0.15s',
                    }}
                  >
                    {link.label}
                  </Typography>
                );
              })}
            </Box>

            <Box sx={{ flex: 1 }} />

            {/* Auth Buttons */}
            {isAuthenticated ? (
              <Button
                component={Link}
                href={getDashboardRoute(user?.role)}
                variant="contained"
                size="small"
                sx={{ px: 2.5, py: 1 }}
              >
                Panelim
              </Button>
            ) : (
              <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                <Button
                  component={Link}
                  href={ROUTES.LOGIN}
                  variant="text"
                  sx={{
                    color: colors.primary,
                    fontWeight: 700,
                    border: `1px solid rgba(195,198,215,0.3)`,
                    px: 2.5,
                    py: 1,
                    borderRadius: 2,
                    '&:hover': { bgcolor: colors.surfaceContainerLow },
                  }}
                >
                  Giriş Yap
                </Button>
                <Button
                  component={Link}
                  href={ROUTES.REGISTER}
                  variant="contained"
                  sx={{ px: 2.5, py: 1 }}
                >
                  Kayıt Ol
                </Button>
              </Box>
            )}
          </Toolbar>
        </Container>
        <Divider sx={{ borderColor: colors.surfaceContainerLow }} />
      </AppBar>

      {/* Page Content */}
      <Box component="main" sx={{ flex: 1 }}>
        {children}
      </Box>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          bgcolor: colors.inverseSurface,
          color: '#f9f9ff',
          py: 6,
          mt: 'auto',
          borderTop: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <Container maxWidth={false} sx={{ maxWidth: 1440, textAlign: 'center' }}>
          <Typography
            sx={{
              fontFamily: 'var(--font-manrope), sans-serif',
              fontWeight: 700,
              fontSize: '1.25rem',
              mb: 3,
            }}
          >
            Sanayi Marketi
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 3, mb: 3 }}>
            {FOOTER_LINKS.map((link) => (
              <Typography
                key={link.label}
                component={Link}
                href={link.href}
                sx={{
                  fontSize: '0.875rem',
                  color: 'rgba(148,163,184,1)',
                  textDecoration: 'none',
                  '&:hover': { color: colors.surfaceContainerHigh },
                  transition: 'color 0.15s',
                }}
              >
                {link.label}
              </Typography>
            ))}
          </Box>
          <Typography sx={{ fontSize: '0.875rem', color: 'rgba(100,116,139,1)' }}>
            © 2024 Sanayi Marketi - Endüstriyel Çözümler Merkezi
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}
