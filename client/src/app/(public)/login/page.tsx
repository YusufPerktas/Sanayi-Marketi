'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Box, Button, CircularProgress, Alert, Typography, InputAdornment, IconButton, OutlinedInput, FormControl, FormHelperText, FormLabel } from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import BusinessIcon from '@mui/icons-material/Business';
import { useAuth } from '@/context/useAuth';
import { authService } from '@/services/auth.service';
import { ROUTES, USER_ROLES } from '@/utils/constants';
import { AxiosError } from 'axios';
import { colors } from '@/utils/colors';

interface ApiError { error: string; message: string; fieldErrors?: Record<string, string> }

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const redirectTo = searchParams.get('redirect') ?? null;

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

      <Box sx={{ bgcolor: colors.surfaceContainerLowest, width: '100%', maxWidth: 448, p: { xs: 4, sm: 6 }, borderRadius: 3, boxShadow: colors.shadow, position: 'relative', zIndex: 1 }}>
        {/* Brand */}
        <Box sx={{ textAlign: 'center', mb: 5 }}>
          <Typography sx={{ fontFamily: 'var(--font-manrope)', fontWeight: 900, fontSize: '1.35rem', color: colors.onSurface, mb: 0.5 }}>Sanayi Marketi</Typography>
          <Typography sx={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: '1.75rem', color: colors.primary }}>Giriş Yap</Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Email */}
          <FormControl error={!!fieldErrors.email}>
            <FormLabel sx={{ fontSize: '0.75rem', fontWeight: 600, color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.08em', mb: 1 }}>E-posta Adresi</FormLabel>
            <OutlinedInput
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ornek@firma.com"
              required
              startAdornment={<InputAdornment position="start"><EmailIcon sx={{ color: colors.outline, fontSize: '1.1rem' }} /></InputAdornment>}
              sx={{ bgcolor: colors.surfaceBright, '& fieldset': { borderColor: 'rgba(195,198,215,0.3)' } }}
            />
            {fieldErrors.email && <FormHelperText>{fieldErrors.email}</FormHelperText>}
          </FormControl>

          {/* Password */}
          <FormControl error={!!fieldErrors.password}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <FormLabel sx={{ fontSize: '0.75rem', fontWeight: 600, color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Şifre</FormLabel>
              <Typography component={Link} href="#" sx={{ fontSize: '0.8rem', fontWeight: 600, color: colors.primary, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>Şifremi unuttum</Typography>
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
              sx={{ bgcolor: colors.surfaceBright, '& fieldset': { borderColor: 'rgba(195,198,215,0.3)' } }}
            />
            {fieldErrors.password && <FormHelperText>{fieldErrors.password}</FormHelperText>}
          </FormControl>

          <Button type="submit" variant="contained" fullWidth size="large" disabled={loading} sx={{ mt: 1, py: 1.75, fontSize: '1rem', fontFamily: 'var(--font-manrope)', borderRadius: 2 }}>
            {loading ? <CircularProgress size={22} color="inherit" /> : 'Giriş Yap'}
          </Button>
        </Box>

        {/* Register link */}
        <Box sx={{ mt: 4, pt: 3, borderTop: `1px solid rgba(195,198,215,0.2)`, textAlign: 'center' }}>
          <Typography sx={{ fontSize: '0.875rem', color: colors.onSurfaceVariant }}>
            Hesabınız yok mu?{' '}
            <Typography component={Link} href={ROUTES.REGISTER} sx={{ fontWeight: 700, color: colors.primary, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>Kayıt olun</Typography>
          </Typography>
        </Box>

        {/* Company apply link */}
        <Box sx={{ mt: 2, p: 2.5, bgcolor: colors.surfaceContainerLow, borderRadius: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <BusinessIcon sx={{ color: colors.secondary, fontSize: '1.2rem', flexShrink: 0 }} />
          <Typography sx={{ fontSize: '0.8rem', color: colors.onSurfaceVariant, lineHeight: 1.5 }}>
            Firmanızı sisteme eklemek mi istiyorsunuz?{' '}
            <Typography component={Link} href={ROUTES.COMPANY_APPLY} sx={{ fontWeight: 700, color: colors.secondary, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>Firma başvurusu yapın</Typography>
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
