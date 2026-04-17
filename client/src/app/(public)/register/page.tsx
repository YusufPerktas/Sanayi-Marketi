'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Box, Button, CircularProgress, Alert, Typography, OutlinedInput, FormControl, FormHelperText, FormLabel, InputAdornment, IconButton, Checkbox } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import FactoryIcon from '@mui/icons-material/Factory';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SecurityIcon from '@mui/icons-material/Security';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import EnhancedEncryptionIcon from '@mui/icons-material/EnhancedEncryption';
import { useAuth } from '@/context/useAuth';
import { authService } from '@/services/auth.service';
import { ROUTES, USER_ROLES } from '@/utils/constants';
import { AxiosError } from 'axios';
import { colors } from '@/utils/colors';

interface ApiError { error: string; message: string; fieldErrors?: Record<string, string> }

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '' });
  const [showPw, setShowPw] = useState(false);
  const [terms, setTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    if (form.password !== form.confirmPassword) { setFieldErrors({ confirmPassword: 'Şifreler eşleşmiyor' }); return; }
    if (!terms) { setError('Devam etmek için hizmet şartlarını kabul etmelisiniz.'); return; }
    setLoading(true);
    try {
      const data = await authService.register({ firstName: form.firstName, lastName: form.lastName, email: form.email, password: form.password });
      login(data.accessToken, data.userId, data.role);
      switch (data.role) {
        case USER_ROLES.ADMIN: router.push(ROUTES.ADMIN); break;
        case USER_ROLES.COMPANY_USER: router.push(ROUTES.COMPANY_MANAGE); break;
        default: router.push(ROUTES.DASHBOARD);
      }
    } catch (err) {
      const axiosError = err as AxiosError<ApiError>;
      if (axiosError.response?.data?.fieldErrors) setFieldErrors(axiosError.response.data.fieldErrors);
      else if (axiosError.response?.data?.message) setError(axiosError.response.data.message);
      else setError('Kayıt olurken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: colors.surface, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 2 }}>
      {/* Logo */}
      <Box sx={{ position: 'absolute', top: 0, left: 0, p: 4 }}>
        <Typography component={Link} href={ROUTES.HOME} sx={{ fontFamily: 'var(--font-manrope)', fontWeight: 900, fontSize: '1.35rem', color: colors.onSurface, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 1 }}>
          <FactoryIcon sx={{ color: colors.primary }} />
          Sanayi Marketi
        </Typography>
      </Box>

      <Box sx={{ width: '100%', maxWidth: 512, mt: 8 }}>
        <Box sx={{ bgcolor: colors.surfaceContainerLowest, borderRadius: 3, boxShadow: colors.shadow, overflow: 'hidden' }}>
          <Box sx={{ p: { xs: 4, sm: 6 } }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography sx={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: '2rem', color: colors.onSurface, mb: 0.5 }}>Kayıt Ol</Typography>
              <Typography sx={{ color: colors.onSurfaceVariant, fontSize: '0.9rem' }}>Endüstriyel çözümler merkezine katılın.</Typography>
            </Box>

            {/* Account type info */}
            <Box sx={{ mb: 4 }}>
              <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.08em', mb: 1.5 }}>Hesap Türü</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <Box sx={{ p: 2, borderRadius: 2, bgcolor: colors.surfaceContainerHigh, border: `2px solid ${colors.primary}`, textAlign: 'center' }}>
                  <PersonIcon sx={{ color: colors.primary, fontSize: '1.75rem', mb: 0.5 }} />
                  <Typography sx={{ fontWeight: 700, color: colors.primary, fontSize: '0.85rem' }}>Bireysel Kullanıcı</Typography>
                </Box>
                <Box component={Link} href={ROUTES.COMPANY_APPLY} sx={{ p: 2, borderRadius: 2, bgcolor: colors.surfaceContainerLow, border: `1px solid rgba(195,198,215,0.3)`, textAlign: 'center', textDecoration: 'none', transition: 'all 0.15s', '&:hover': { bgcolor: colors.surfaceContainer } }}>
                  <FactoryIcon sx={{ color: colors.onSurfaceVariant, fontSize: '1.75rem', mb: 0.5 }} />
                  <Typography sx={{ fontWeight: 600, color: colors.onSurfaceVariant, fontSize: '0.85rem' }}>Firma Kullanıcısı</Typography>
                </Box>
              </Box>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

            <Box component="form" onSubmit={handleSubmit} noValidate sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <FormControl error={!!fieldErrors.firstName}>
                  <FormLabel sx={{ fontSize: '0.75rem', fontWeight: 600, color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.08em', mb: 0.75 }}>Ad</FormLabel>
                  <OutlinedInput name="firstName" value={form.firstName} onChange={handleChange} placeholder="Ahmet" required sx={{ bgcolor: colors.surfaceContainerLow, '& fieldset': { borderColor: 'rgba(195,198,215,0.3)' } }} />
                  {fieldErrors.firstName && <FormHelperText>{fieldErrors.firstName}</FormHelperText>}
                </FormControl>
                <FormControl error={!!fieldErrors.lastName}>
                  <FormLabel sx={{ fontSize: '0.75rem', fontWeight: 600, color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.08em', mb: 0.75 }}>Soyad</FormLabel>
                  <OutlinedInput name="lastName" value={form.lastName} onChange={handleChange} placeholder="Yılmaz" required sx={{ bgcolor: colors.surfaceContainerLow, '& fieldset': { borderColor: 'rgba(195,198,215,0.3)' } }} />
                  {fieldErrors.lastName && <FormHelperText>{fieldErrors.lastName}</FormHelperText>}
                </FormControl>
              </Box>

              <FormControl error={!!fieldErrors.email}>
                <FormLabel sx={{ fontSize: '0.75rem', fontWeight: 600, color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.08em', mb: 0.75 }}>E-posta</FormLabel>
                <OutlinedInput type="email" name="email" value={form.email} onChange={handleChange} placeholder="ornek@sirket.com" required sx={{ bgcolor: colors.surfaceContainerLow, '& fieldset': { borderColor: 'rgba(195,198,215,0.3)' } }} />
                {fieldErrors.email && <FormHelperText>{fieldErrors.email}</FormHelperText>}
              </FormControl>

              <FormControl error={!!fieldErrors.password}>
                <FormLabel sx={{ fontSize: '0.75rem', fontWeight: 600, color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.08em', mb: 0.75 }}>Şifre</FormLabel>
                <OutlinedInput type={showPw ? 'text' : 'password'} name="password" value={form.password} onChange={handleChange} placeholder="••••••••" required
                  endAdornment={<InputAdornment position="end"><IconButton size="small" onClick={() => setShowPw(!showPw)} sx={{ color: colors.onSurfaceVariant }}>{showPw ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}</IconButton></InputAdornment>}
                  sx={{ bgcolor: colors.surfaceContainerLow, '& fieldset': { borderColor: 'rgba(195,198,215,0.3)' } }} />
                {fieldErrors.password && <FormHelperText>{fieldErrors.password}</FormHelperText>}
              </FormControl>

              <FormControl error={!!fieldErrors.confirmPassword}>
                <FormLabel sx={{ fontSize: '0.75rem', fontWeight: 600, color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.08em', mb: 0.75 }}>Şifre Tekrar</FormLabel>
                <OutlinedInput type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} placeholder="••••••••" required sx={{ bgcolor: colors.surfaceContainerLow, '& fieldset': { borderColor: 'rgba(195,198,215,0.3)' } }} />
                {fieldErrors.confirmPassword && <FormHelperText>{fieldErrors.confirmPassword}</FormHelperText>}
              </FormControl>

              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, pt: 0.5 }}>
                <Checkbox checked={terms} onChange={(e) => setTerms(e.target.checked)} size="small" sx={{ mt: -0.5, color: colors.outlineVariant, '&.Mui-checked': { color: colors.primary } }} />
                <Typography sx={{ fontSize: '0.8rem', color: colors.onSurfaceVariant, lineHeight: 1.6 }}>
                  <Typography component={Link} href="#" sx={{ color: colors.primary, fontWeight: 600, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>Hizmet Şartları</Typography>'nı ve{' '}
                  <Typography component={Link} href="#" sx={{ color: colors.primary, fontWeight: 600, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>Gizlilik Politikası</Typography>'nı okudum ve kabul ediyorum.
                </Typography>
              </Box>

              <Button type="submit" variant="contained" fullWidth size="large" disabled={loading} endIcon={!loading && <ArrowForwardIcon />} sx={{ mt: 0.5, py: 1.5, fontSize: '1rem', fontFamily: 'var(--font-manrope)', borderRadius: 2 }}>
                {loading ? <CircularProgress size={22} color="inherit" /> : 'Kayıt Ol'}
              </Button>
            </Box>
          </Box>

          {/* Card footer */}
          <Box sx={{ bgcolor: colors.surfaceContainerLow, p: 3, textAlign: 'center', borderTop: `1px solid rgba(195,198,215,0.2)` }}>
            <Typography sx={{ fontSize: '0.875rem', color: colors.onSurfaceVariant }}>
              Zaten hesabınız var mı?{' '}
              <Typography component={Link} href={ROUTES.LOGIN} sx={{ fontWeight: 700, color: colors.primary, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>Giriş yapın</Typography>
            </Typography>
          </Box>
        </Box>

        {/* Trust icons */}
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: 3 }}>
          {[<SecurityIcon key="s" />, <VerifiedUserIcon key="v" />, <EnhancedEncryptionIcon key="e" />].map((icon, i) => (
            <Box key={i} sx={{ color: `${colors.onSurfaceVariant}60` }}>{icon}</Box>
          ))}
        </Box>

        <Typography sx={{ textAlign: 'center', mt: 3, fontSize: '0.75rem', color: `${colors.onSurfaceVariant}60` }}>
          © 2024 Sanayi Marketi - Endüstriyel Çözümler Merkezi
        </Typography>
      </Box>
    </Box>
  );
}
