'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  FormHelperText,
  FormLabel,
  OutlinedInput,
  Typography,
  InputAdornment,
  IconButton,
} from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { AxiosError } from 'axios';
import { companyApplicationService } from '@/services/companyApplication.service';
import { useAuth } from '@/context/useAuth';
import { ROUTES, USER_ROLES, UserRole } from '@/utils/constants';
import { colors } from '@/utils/colors';

interface ApiError { error: string; message: string; fieldErrors?: Record<string, string> }

export default function CompanyApplyPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [form, setForm] = useState({
    email: '',
    password: '',
    companyName: '',
    phone: '',
    city: '',
  });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setLoading(true);
    try {
      const data = await companyApplicationService.registerCompany(form);
      login(data.accessToken, data.userId, data.role as UserRole);
      router.push(ROUTES.APPLICATION_STATUS);
    } catch (err) {
      const axiosError = err as AxiosError<ApiError>;
      if (axiosError.response?.status === 404 || axiosError.response?.status === 405) {
        setError('Bu özellik henüz aktif değil. Backend geliştirmesi bekleniyor.');
      } else if (axiosError.response?.data?.fieldErrors) {
        setFieldErrors(axiosError.response.data.fieldErrors);
      } else if (axiosError.response?.data?.message) {
        setError(axiosError.response.data.message);
      } else {
        setError('Başvuru gönderilirken bir hata oluştu. Lütfen tekrar deneyin.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: colors.surfaceContainerLow,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '50%',
          background: `linear-gradient(to bottom, ${colors.surfaceContainer}, transparent)`,
          opacity: 0.5,
          pointerEvents: 'none',
        }}
      />

      <Box
        sx={{
          bgcolor: colors.surfaceContainerLowest,
          width: '100%',
          maxWidth: 520,
          p: { xs: 4, sm: 6 },
          borderRadius: 3,
          boxShadow: colors.shadow,
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Brand */}
        <Box sx={{ textAlign: 'center', mb: 5 }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              bgcolor: colors.primaryFixed,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 2,
            }}
          >
            <BusinessIcon sx={{ color: colors.primary, fontSize: '1.75rem' }} />
          </Box>
          <Typography
            sx={{
              fontFamily: 'var(--font-manrope)',
              fontWeight: 900,
              fontSize: '1.35rem',
              color: colors.onSurface,
              mb: 0.5,
            }}
          >
            Sanayi Marketi
          </Typography>
          <Typography sx={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: '1.6rem', color: colors.primary }}>
            Firma Başvurusu
          </Typography>
          <Typography sx={{ fontSize: '0.875rem', color: colors.onSurfaceVariant, mt: 1 }}>
            Firmanızı platforma eklemek için aşağıdaki formu doldurun.
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Company name */}
          <FormControl error={!!fieldErrors.companyName}>
            <FormLabel sx={{ fontSize: '0.75rem', fontWeight: 600, color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.08em', mb: 1 }}>
              Firma Adı *
            </FormLabel>
            <OutlinedInput
              value={form.companyName}
              onChange={set('companyName')}
              placeholder="Firma adınız"
              required
              startAdornment={<InputAdornment position="start"><BusinessIcon sx={{ color: colors.outline, fontSize: '1.1rem' }} /></InputAdornment>}
              sx={{ bgcolor: colors.surfaceBright, '& fieldset': { borderColor: 'rgba(195,198,215,0.3)' } }}
            />
            {fieldErrors.companyName && <FormHelperText>{fieldErrors.companyName}</FormHelperText>}
          </FormControl>

          {/* Email */}
          <FormControl error={!!fieldErrors.email}>
            <FormLabel sx={{ fontSize: '0.75rem', fontWeight: 600, color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.08em', mb: 1 }}>
              E-posta Adresi *
            </FormLabel>
            <OutlinedInput
              type="email"
              value={form.email}
              onChange={set('email')}
              placeholder="firma@ornek.com"
              required
              startAdornment={<InputAdornment position="start"><EmailIcon sx={{ color: colors.outline, fontSize: '1.1rem' }} /></InputAdornment>}
              sx={{ bgcolor: colors.surfaceBright, '& fieldset': { borderColor: 'rgba(195,198,215,0.3)' } }}
            />
            {fieldErrors.email && <FormHelperText>{fieldErrors.email}</FormHelperText>}
          </FormControl>

          {/* Password */}
          <FormControl error={!!fieldErrors.password}>
            <FormLabel sx={{ fontSize: '0.75rem', fontWeight: 600, color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.08em', mb: 1 }}>
              Şifre *
            </FormLabel>
            <OutlinedInput
              type={showPw ? 'text' : 'password'}
              value={form.password}
              onChange={set('password')}
              placeholder="En az 8 karakter"
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

          {/* Phone */}
          <FormControl error={!!fieldErrors.phone}>
            <FormLabel sx={{ fontSize: '0.75rem', fontWeight: 600, color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.08em', mb: 1 }}>
              Telefon
            </FormLabel>
            <OutlinedInput
              type="tel"
              value={form.phone}
              onChange={set('phone')}
              placeholder="+90 5xx xxx xx xx"
              startAdornment={<InputAdornment position="start"><PhoneIcon sx={{ color: colors.outline, fontSize: '1.1rem' }} /></InputAdornment>}
              sx={{ bgcolor: colors.surfaceBright, '& fieldset': { borderColor: 'rgba(195,198,215,0.3)' } }}
            />
            {fieldErrors.phone && <FormHelperText>{fieldErrors.phone}</FormHelperText>}
          </FormControl>

          {/* City */}
          <FormControl error={!!fieldErrors.city}>
            <FormLabel sx={{ fontSize: '0.75rem', fontWeight: 600, color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.08em', mb: 1 }}>
              Şehir
            </FormLabel>
            <OutlinedInput
              value={form.city}
              onChange={set('city')}
              placeholder="İstanbul, Ankara..."
              startAdornment={<InputAdornment position="start"><LocationOnIcon sx={{ color: colors.outline, fontSize: '1.1rem' }} /></InputAdornment>}
              sx={{ bgcolor: colors.surfaceBright, '& fieldset': { borderColor: 'rgba(195,198,215,0.3)' } }}
            />
            {fieldErrors.city && <FormHelperText>{fieldErrors.city}</FormHelperText>}
          </FormControl>

          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={loading}
            sx={{ mt: 1, py: 1.75, fontSize: '1rem', fontFamily: 'var(--font-manrope)', borderRadius: 2 }}
          >
            {loading ? <CircularProgress size={22} color="inherit" /> : 'Başvuruyu Gönder'}
          </Button>
        </Box>

        {/* Info note */}
        <Box sx={{ mt: 3, p: 2.5, bgcolor: colors.surfaceContainerLow, borderRadius: 2 }}>
          <Typography sx={{ fontSize: '0.8rem', color: colors.onSurfaceVariant, lineHeight: 1.6 }}>
            Başvurunuz yönetici onayına gönderilecektir. Onay süreci genellikle 24–48 saat sürmektedir.
          </Typography>
        </Box>

        <Box sx={{ mt: 3, pt: 3, borderTop: `1px solid rgba(195,198,215,0.2)`, textAlign: 'center' }}>
          <Typography sx={{ fontSize: '0.875rem', color: colors.onSurfaceVariant }}>
            Zaten hesabınız var mı?{' '}
            <Typography component={Link} href={ROUTES.LOGIN} sx={{ fontWeight: 700, color: colors.primary, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
              Giriş yapın
            </Typography>
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
