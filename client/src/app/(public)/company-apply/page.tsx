'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Alert, Box, Button, CircularProgress, FormControl, FormHelperText,
  FormLabel, IconButton, InputAdornment, MenuItem, OutlinedInput, Select, Typography,
} from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import LanguageIcon from '@mui/icons-material/Language';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { AxiosError } from 'axios';
import { companyApplicationService } from '@/services/companyApplication.service';
import { useAuth } from '@/context/useAuth';
import { ROUTES, UserRole, TURKISH_CITIES } from '@/utils/constants';
import { colors } from '@/utils/colors';

interface ApiError { error: string; message: string; fieldErrors?: Record<string, string> }

const labelSx = {
  fontSize: '0.75rem', fontWeight: 600, color: colors.onSurfaceVariant,
  textTransform: 'uppercase' as const, letterSpacing: '0.08em', mb: 1,
};
const inputSx = { bgcolor: colors.surfaceBright, '& fieldset': { borderColor: 'rgba(195,198,215,0.3)' } };

export default function CompanyApplyPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [form, setForm] = useState({
    email: '', password: '',
    companyName: '', description: '',
    phone: '', companyEmail: '', website: '',
    city: '', district: '',
  });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((p) => ({ ...p, [field]: e.target.value }));
  }

  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, '');
    let n = digits.startsWith('90') && digits.length > 10 ? digits.slice(2) : digits;
    if (n.startsWith('5')) n = '0' + n;
    n = n.slice(0, 11);
    let formatted = n;
    if (n.length > 9) formatted = `${n.slice(0, 4)} ${n.slice(4, 7)} ${n.slice(7, 9)} ${n.slice(9)}`;
    else if (n.length > 7) formatted = `${n.slice(0, 4)} ${n.slice(4, 7)} ${n.slice(7)}`;
    else if (n.length > 4) formatted = `${n.slice(0, 4)} ${n.slice(4)}`;
    setForm((p) => ({ ...p, phone: formatted }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    const rawPhone = form.phone.replace(/\D/g, '');
    if (form.phone && (rawPhone.length !== 11 || !rawPhone.startsWith('05'))) {
      setFieldErrors({ phone: 'Geçerli bir numara girin (05XX XXX XX XX)' });
      return;
    }
    setLoading(true);
    try {
      const data = await companyApplicationService.registerCompany({
        email: form.email,
        password: form.password,
        proposedCompanyName: form.companyName,
        applicationType: 'MANUAL_NEW',
        description: form.description || undefined,
        phone: rawPhone || undefined,
        companyEmail: form.companyEmail || undefined,
        website: form.website || undefined,
        city: form.city || undefined,
        district: form.district || undefined,
      });
      login(data.accessToken, data.userId, data.role as UserRole);
      router.push(ROUTES.APPLICATION_STATUS);
    } catch (err) {
      const axiosError = err as AxiosError<ApiError>;
      if (axiosError.response?.data?.fieldErrors) {
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
    <Box sx={{ minHeight: '100vh', bgcolor: colors.surfaceContainerLow, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
      <Box sx={{ bgcolor: colors.surfaceContainerLowest, width: '100%', maxWidth: 560, p: { xs: 4, sm: 6 }, borderRadius: 3, boxShadow: colors.shadow }}>

        {/* Brand */}
        <Box sx={{ textAlign: 'center', mb: 5 }}>
          <Box sx={{ width: 56, height: 56, bgcolor: colors.primaryFixed, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
            <BusinessIcon sx={{ color: colors.primary, fontSize: '1.75rem' }} />
          </Box>
          <Typography sx={{ fontFamily: 'var(--font-manrope)', fontWeight: 900, fontSize: '1.35rem', color: colors.onSurface, mb: 0.5 }}>
            Sanayi Marketi
          </Typography>
          <Typography sx={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: '1.6rem', color: colors.primary }}>
            Firma Başvurusu
          </Typography>
          <Typography sx={{ fontSize: '0.875rem', color: colors.onSurfaceVariant, mt: 1 }}>
            Firmanızı platforma eklemek için formu doldurun. * ile işaretli alanlar zorunludur.
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>

          {/* HESAP BİLGİLERİ */}
          <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.1em', pt: 1 }}>
            Hesap Bilgileri
          </Typography>

          <FormControl error={!!fieldErrors.email}>
            <FormLabel sx={labelSx}>Giriş E-postası *</FormLabel>
            <OutlinedInput type="email" value={form.email} onChange={set('email')} placeholder="giris@ornek.com" required
              startAdornment={<InputAdornment position="start"><EmailIcon sx={{ color: colors.outline, fontSize: '1.1rem' }} /></InputAdornment>} sx={inputSx} />
            {fieldErrors.email && <FormHelperText>{fieldErrors.email}</FormHelperText>}
          </FormControl>

          <FormControl error={!!fieldErrors.password}>
            <FormLabel sx={labelSx}>Şifre *</FormLabel>
            <OutlinedInput type={showPw ? 'text' : 'password'} value={form.password} onChange={set('password')} placeholder="En az 8 karakter" required
              startAdornment={<InputAdornment position="start"><LockIcon sx={{ color: colors.outline, fontSize: '1.1rem' }} /></InputAdornment>}
              endAdornment={<InputAdornment position="end"><IconButton size="small" onClick={() => setShowPw(!showPw)} sx={{ color: colors.outline }}>{showPw ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}</IconButton></InputAdornment>}
              sx={inputSx} />
            {fieldErrors.password && <FormHelperText>{fieldErrors.password}</FormHelperText>}
          </FormControl>

          {/* FİRMA BİLGİLERİ */}
          <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.1em', pt: 1.5 }}>
            Firma Bilgileri
          </Typography>

          <FormControl error={!!fieldErrors.proposedCompanyName}>
            <FormLabel sx={labelSx}>Firma Adı *</FormLabel>
            <OutlinedInput value={form.companyName} onChange={set('companyName')} placeholder="Firma adınız" required
              startAdornment={<InputAdornment position="start"><BusinessIcon sx={{ color: colors.outline, fontSize: '1.1rem' }} /></InputAdornment>} sx={inputSx} />
            {fieldErrors.proposedCompanyName && <FormHelperText>{fieldErrors.proposedCompanyName}</FormHelperText>}
          </FormControl>

          <FormControl>
            <FormLabel sx={labelSx}>Firma Açıklaması</FormLabel>
            <OutlinedInput multiline rows={3} value={form.description} onChange={set('description')}
              placeholder="Firmanız ve ürettiğiniz / sattığınız ürünler hakkında kısa bilgi..." sx={inputSx} />
          </FormControl>

          <FormControl error={!!fieldErrors.phone}>
            <FormLabel sx={labelSx}>Telefon</FormLabel>
            <OutlinedInput type="tel" value={form.phone} onChange={handlePhoneChange} placeholder="0532 123 45 67"
              inputProps={{ maxLength: 14 }}
              startAdornment={<InputAdornment position="start"><PhoneIcon sx={{ color: colors.outline, fontSize: '1.1rem' }} /></InputAdornment>} sx={inputSx} />
            {fieldErrors.phone && <FormHelperText>{fieldErrors.phone}</FormHelperText>}
          </FormControl>

          <FormControl>
            <FormLabel sx={labelSx}>Firma E-postası</FormLabel>
            <OutlinedInput type="email" value={form.companyEmail} onChange={set('companyEmail')} placeholder="info@firmaniz.com"
              startAdornment={<InputAdornment position="start"><EmailIcon sx={{ color: colors.outline, fontSize: '1.1rem' }} /></InputAdornment>} sx={inputSx} />
          </FormControl>

          <FormControl>
            <FormLabel sx={labelSx}>Web Sitesi</FormLabel>
            <OutlinedInput value={form.website} onChange={set('website')} placeholder="https://firmaniz.com"
              startAdornment={<InputAdornment position="start"><LanguageIcon sx={{ color: colors.outline, fontSize: '1.1rem' }} /></InputAdornment>} sx={inputSx} />
          </FormControl>

          {/* KONUM */}
          <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.1em', pt: 1.5 }}>
            Konum
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <FormControl>
              <FormLabel sx={labelSx}>Şehir</FormLabel>
              <Select value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} displayEmpty
                startAdornment={<InputAdornment position="start"><LocationOnIcon sx={{ color: colors.outline, fontSize: '1.1rem' }} /></InputAdornment>} sx={inputSx}>
                <MenuItem value=""><Typography sx={{ color: colors.outline, fontSize: '0.9rem' }}>Şehir seçin</Typography></MenuItem>
                {TURKISH_CITIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel sx={labelSx}>İlçe</FormLabel>
              <OutlinedInput value={form.district} onChange={set('district')} placeholder="İlçe" sx={inputSx} />
            </FormControl>
          </Box>

          <Button type="submit" variant="contained" fullWidth size="large" disabled={loading}
            sx={{ mt: 1, py: 1.75, fontSize: '1rem', fontFamily: 'var(--font-manrope)', borderRadius: 2 }}>
            {loading ? <CircularProgress size={22} color="inherit" /> : 'Başvuruyu Gönder'}
          </Button>
        </Box>

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
