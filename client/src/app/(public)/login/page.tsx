'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Box, Button, CircularProgress, Alert, Typography,
  InputAdornment, IconButton, OutlinedInput, FormControl,
  FormHelperText, FormLabel,
} from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import PersonIcon from '@mui/icons-material/Person';
import BusinessIcon from '@mui/icons-material/Business';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import { useAuth } from '@/context/useAuth';
import { authService } from '@/services/auth.service';
import { ROUTES, USER_ROLES } from '@/utils/constants';
import { AxiosError } from 'axios';
import { colors } from '@/utils/colors';

interface ApiError { error: string; message: string; fieldErrors?: Record<string, string> }

type LoginTab = 'user' | 'company' | 'admin';

const tabs: { key: LoginTab; label: string; icon: React.ReactNode; description: string; emailPlaceholder: string }[] = [
  {
    key: 'user',
    label: 'Kullanıcı',
    icon: <PersonIcon sx={{ fontSize: '1.1rem' }} />,
    description: 'Malzeme arayın, firmaları karşılaştırın, favorilerinizi kaydedin.',
    emailPlaceholder: 'kullanici@ornek.com',
  },
  {
    key: 'company',
    label: 'Firma',
    icon: <BusinessIcon sx={{ fontSize: '1.1rem' }} />,
    description: 'Firmanızı yönetin, malzeme listenizi ve fiyatlarınızı güncelleyin.',
    emailPlaceholder: 'info@firmaniz.com.tr',
  },
  {
    key: 'admin',
    label: 'Yönetici',
    icon: <AdminPanelSettingsIcon sx={{ fontSize: '1.1rem' }} />,
    description: 'Başvuruları onaylayın, sistem verilerini yönetin.',
    emailPlaceholder: 'admin@sanayimarketi.com',
  },
];

const tabAccent: Record<LoginTab, string> = {
  user: colors.primary,
  company: '#0891b2',
  admin: '#263143',
};

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const [activeTab, setActiveTab] = useState<LoginTab>('user');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const redirectTo = searchParams.get('redirect') ?? null;
  const currentTab = tabs.find((t) => t.key === activeTab)!;
  const accent = tabAccent[activeTab];

  function handleTabChange(tab: LoginTab) {
    setActiveTab(tab);
    setError(null);
    setFieldErrors({});
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setLoading(true);
    try {
      const data = await authService.login({ email, password });
      login(data.accessToken, data.userId, data.role);
      if (redirectTo) { router.push(redirectTo); return; }
      switch (data.role) {
        case USER_ROLES.ADMIN: router.push(ROUTES.ADMIN); break;
        case USER_ROLES.COMPANY_USER: router.push(ROUTES.COMPANY_MANAGE); break;
        case USER_ROLES.PENDING_COMPANY_USER: router.push(ROUTES.APPLICATION_STATUS); break;
        default: router.push(ROUTES.DASHBOARD);
      }
    } catch (err) {
      const axiosError = err as AxiosError<ApiError>;
      if (axiosError.response?.data?.fieldErrors) setFieldErrors(axiosError.response.data.fieldErrors);
      else if (axiosError.response?.data?.message) setError(axiosError.response.data.message);
      else setError('Giriş yapılırken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: colors.surfaceContainerLow, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2, position: 'relative', overflow: 'hidden' }}>
      <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '50%', background: `linear-gradient(to bottom, ${colors.surfaceContainer}, transparent)`, opacity: 0.5, pointerEvents: 'none' }} />

      <Box sx={{ bgcolor: colors.surfaceContainerLowest, width: '100%', maxWidth: 460, borderRadius: 3, boxShadow: colors.shadow, position: 'relative', zIndex: 1, overflow: 'hidden' }}>

        {/* Tab header */}
        <Box sx={{ display: 'flex', borderBottom: `1px solid rgba(195,198,215,0.25)` }}>
          {tabs.map((tab) => {
            const isActive = tab.key === activeTab;
            const a = tabAccent[tab.key];
            return (
              <Box
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                sx={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 0.5,
                  py: 2,
                  px: 1,
                  cursor: 'pointer',
                  borderBottom: isActive ? `3px solid ${a}` : '3px solid transparent',
                  bgcolor: isActive ? `${a}0d` : 'transparent',
                  transition: 'all .18s',
                  '&:hover': { bgcolor: `${a}0d` },
                }}
              >
                <Box sx={{ color: isActive ? a : colors.outline, display: 'flex', alignItems: 'center' }}>
                  {tab.icon}
                </Box>
                <Typography sx={{ fontSize: '0.75rem', fontWeight: isActive ? 700 : 500, color: isActive ? a : colors.onSurfaceVariant, fontFamily: 'var(--font-manrope)', letterSpacing: '.01em' }}>
                  {tab.label}
                </Typography>
              </Box>
            );
          })}
        </Box>

        <Box sx={{ p: { xs: 4, sm: 5 } }}>
          {/* Title */}
          <Box sx={{ mb: 4 }}>
            <Typography sx={{ fontFamily: 'var(--font-manrope)', fontWeight: 900, fontSize: '1.55rem', color: accent, lineHeight: 1.2 }}>
              {currentTab.label} Girişi
            </Typography>
            <Typography sx={{ fontSize: '0.85rem', color: colors.onSurfaceVariant, mt: 0.75, lineHeight: 1.5 }}>
              {currentTab.description}
            </Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Email */}
            <FormControl error={!!fieldErrors.email}>
              <FormLabel sx={{ fontSize: '0.72rem', fontWeight: 700, color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.08em', mb: 1 }}>
                E-posta Adresi
              </FormLabel>
              <OutlinedInput
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={currentTab.emailPlaceholder}
                required
                startAdornment={<InputAdornment position="start"><EmailIcon sx={{ color: colors.outline, fontSize: '1.1rem' }} /></InputAdornment>}
                sx={{ bgcolor: colors.surfaceBright, '& fieldset': { borderColor: 'rgba(195,198,215,0.3)' }, '&:hover fieldset': { borderColor: accent }, '&.Mui-focused fieldset': { borderColor: accent } }}
              />
              {fieldErrors.email && <FormHelperText>{fieldErrors.email}</FormHelperText>}
            </FormControl>

            {/* Password */}
            <FormControl error={!!fieldErrors.password}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <FormLabel sx={{ fontSize: '0.72rem', fontWeight: 700, color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Şifre
                </FormLabel>
                <Typography component={Link} href="#" sx={{ fontSize: '0.78rem', fontWeight: 600, color: accent, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                  Şifremi unuttum
                </Typography>
              </Box>
              <OutlinedInput
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                startAdornment={<InputAdornment position="start"><LockIcon sx={{ color: colors.outline, fontSize: '1.1rem' }} /></InputAdornment>}
                endAdornment={
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setShowPw(!showPw)} sx={{ color: colors.outline }}>
                      {showPw ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                }
                sx={{ bgcolor: colors.surfaceBright, '& fieldset': { borderColor: 'rgba(195,198,215,0.3)' }, '&:hover fieldset': { borderColor: accent }, '&.Mui-focused fieldset': { borderColor: accent } }}
              />
              {fieldErrors.password && <FormHelperText>{fieldErrors.password}</FormHelperText>}
            </FormControl>

            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={loading}
              sx={{
                mt: 1, py: 1.75, fontSize: '1rem',
                fontFamily: 'var(--font-manrope)', fontWeight: 700,
                borderRadius: 2,
                bgcolor: accent,
                '&:hover': { bgcolor: accent, filter: 'brightness(1.1)' },
              }}
            >
              {loading ? <CircularProgress size={22} color="inherit" /> : `${currentTab.label} Olarak Giriş Yap`}
            </Button>
          </Box>

          {/* Footer links */}
          <Box sx={{ mt: 4, pt: 3, borderTop: `1px solid rgba(195,198,215,0.2)`, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {activeTab !== 'admin' && (
              <Typography sx={{ fontSize: '0.875rem', color: colors.onSurfaceVariant, textAlign: 'center' }}>
                Hesabınız yok mu?{' '}
                <Typography component={Link} href={ROUTES.REGISTER} sx={{ fontWeight: 700, color: accent, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                  Kayıt olun
                </Typography>
              </Typography>
            )}

            {activeTab === 'user' && (
              <Box sx={{ p: 2, bgcolor: colors.surfaceContainerLow, borderRadius: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <BusinessIcon sx={{ color: '#0891b2', fontSize: '1.1rem', flexShrink: 0 }} />
                <Typography sx={{ fontSize: '0.78rem', color: colors.onSurfaceVariant, lineHeight: 1.5 }}>
                  Firmanızı eklemek mi istiyorsunuz?{' '}
                  <Typography component={Link} href={ROUTES.COMPANY_APPLY} sx={{ fontWeight: 700, color: '#0891b2', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                    Firma başvurusu yapın
                  </Typography>
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
