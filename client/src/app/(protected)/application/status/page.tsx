'use client';

import React, { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  FormHelperText,
  FormLabel,
  InputAdornment,
  MenuItem,
  OutlinedInput,
  Select,
  Typography,
} from '@mui/material';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import LogoutIcon from '@mui/icons-material/Logout';
import BusinessIcon from '@mui/icons-material/Business';
import EmailIcon from '@mui/icons-material/Email';
import LanguageIcon from '@mui/icons-material/Language';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { AxiosError } from 'axios';
import { companyApplicationService } from '@/services/companyApplication.service';
import { authService } from '@/services/auth.service';
import { useAuth } from '@/context/useAuth';
import { ROUTES, TURKISH_CITIES } from '@/utils/constants';
import { colors } from '@/utils/colors';

interface ApiError { error: string; message: string; fieldErrors?: Record<string, string> }

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
    description: 'Başvurunuz reddedildi. Aşağıdaki bilgileri düzenleyerek yeniden başvurabilirsiniz.',
    color: colors.error,
    bg: colors.errorContainer,
  },
};

function ReapplyForm({ previous }: { previous: Partial<import('@/services/companyApplication.service').CompanyApplication> }) {
  const qc = useQueryClient();

  const [form, setForm] = useState({
    proposedCompanyName: previous.proposedCompanyName ?? '',
    description: previous.description ?? '',
    phone: previous.phone ?? '',
    companyEmail: previous.companyEmail ?? '',
    website: previous.website ?? '',
    city: previous.city ?? '',
    district: previous.district ?? '',
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);

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

  const mutation = useMutation({
    mutationFn: () => {
      const rawPhone = form.phone.replace(/\D/g, '');
      return companyApplicationService.reapply({
        proposedCompanyName: form.proposedCompanyName,
        description: form.description || undefined,
        phone: rawPhone || undefined,
        companyEmail: form.companyEmail || undefined,
        website: form.website || undefined,
        city: form.city || undefined,
        district: form.district || undefined,
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-application'] }),
    onError: (err) => {
      const axiosError = err as AxiosError<ApiError>;
      if (axiosError.response?.data?.fieldErrors) setFieldErrors(axiosError.response.data.fieldErrors);
      else if (axiosError.response?.data?.message) setGlobalError(axiosError.response.data.message);
      else setGlobalError('Başvuru gönderilirken bir hata oluştu.');
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldErrors({});
    setGlobalError(null);
    const rawPhone = form.phone.replace(/\D/g, '');
    if (form.phone && (rawPhone.length !== 11 || !rawPhone.startsWith('05'))) {
      setFieldErrors({ phone: 'Geçerli bir numara girin (05XX XXX XX XX)' });
      return;
    }
    if (!form.proposedCompanyName.trim()) {
      setFieldErrors({ proposedCompanyName: 'Firma adı zorunludur' });
      return;
    }
    mutation.mutate();
  }

  const inputSx = { bgcolor: colors.surfaceBright, '& fieldset': { borderColor: 'rgba(195,198,215,0.3)' } };
  const labelSx = { fontSize: '0.72rem', fontWeight: 700, color: colors.onSurfaceVariant, textTransform: 'uppercase' as const, letterSpacing: '0.08em', mb: 1 };
  const sectionSx = { fontSize: '0.68rem', fontWeight: 800, color: colors.onSurfaceVariant, textTransform: 'uppercase' as const, letterSpacing: '0.1em', pt: 1 };

  return (
    <Box sx={{ mt: 4, pt: 4, borderTop: `1px solid rgba(195,198,215,0.2)`, textAlign: 'left' }}>
      <Typography sx={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: '1.1rem', color: colors.onSurface, mb: 0.5 }}>
        Yeniden Başvur
      </Typography>
      <Typography sx={{ fontSize: '0.85rem', color: colors.onSurfaceVariant, mb: 3 }}>
        Tüm bilgilerinizi güncelleyip tekrar gönderebilirsiniz.
      </Typography>

      {globalError && <Alert severity="error" sx={{ mb: 2 }}>{globalError}</Alert>}

      <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>

        <Typography sx={sectionSx}>Firma Bilgileri</Typography>

        <FormControl error={!!fieldErrors.proposedCompanyName}>
          <FormLabel sx={labelSx}>Firma Adı *</FormLabel>
          <OutlinedInput value={form.proposedCompanyName} onChange={set('proposedCompanyName')} placeholder="Firma adınız" required
            startAdornment={<InputAdornment position="start"><BusinessIcon sx={{ color: colors.outline, fontSize: '1.1rem' }} /></InputAdornment>} sx={inputSx} />
          {fieldErrors.proposedCompanyName && <FormHelperText>{fieldErrors.proposedCompanyName}</FormHelperText>}
        </FormControl>

        <FormControl>
          <FormLabel sx={labelSx}>Açıklama</FormLabel>
          <OutlinedInput multiline rows={3} value={form.description} onChange={set('description')}
            placeholder="Firmanız ve ürünleriniz hakkında kısa bilgi..." sx={inputSx} />
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

        <Typography sx={sectionSx}>Konum</Typography>

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

        <Button type="submit" variant="contained" fullWidth size="large" disabled={mutation.isPending}
          startIcon={mutation.isPending ? undefined : <RefreshIcon />}
          sx={{ py: 1.75, fontSize: '1rem', fontFamily: 'var(--font-manrope)', borderRadius: 2 }}>
          {mutation.isPending ? <CircularProgress size={22} color="inherit" /> : 'Yeniden Başvur'}
        </Button>
      </Box>
    </Box>
  );
}

export default function ApplicationStatusPage() {
  const { logout } = useAuth();
  const router = useRouter();

  const { data: application, isLoading } = useQuery({
    queryKey: ['my-application'],
    queryFn: async () => {
      try { return await companyApplicationService.getMyApplication(); }
      catch { return null; }
    },
  });

  async function handleLogout() {
    await authService.logout();
    logout();
    router.push(ROUTES.HOME);
  }

  const status = application?.status ?? 'PENDING';
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
          sx={{ fontFamily: 'var(--font-manrope)', fontWeight: 900, fontSize: '1.35rem', color: colors.onSurface, mb: 6 }}
        >
          Sanayi Marketi
        </Typography>

        {isLoading ? (
          <Box sx={{ py: 6 }}><CircularProgress /></Box>
        ) : (
          <>
            <Box
              sx={{
                width: 80, height: 80, borderRadius: '50%',
                bgcolor: config.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                mx: 'auto', mb: 3,
              }}
            >
              {config.icon}
            </Box>

            <Typography sx={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: '1.5rem', color: config.color, mb: 2 }}>
              {config.title}
            </Typography>

            <Typography sx={{ color: colors.onSurfaceVariant, lineHeight: 1.7, mb: 2 }}>
              {config.description}
            </Typography>

            {status === 'REJECTED' && application?.rejectionReason && (
              <Box sx={{ p: 3, bgcolor: colors.errorContainer, borderRadius: 2, mb: 3, textAlign: 'left' }}>
                <Typography sx={{ fontWeight: 700, color: colors.error, fontSize: '0.875rem', mb: 0.5 }}>
                  Red Sebebi:
                </Typography>
                <Typography sx={{ color: colors.onErrorContainer, fontSize: '0.875rem' }}>
                  {application.rejectionReason}
                </Typography>
              </Box>
            )}

            {application && (
              <Box sx={{ p: 2.5, bgcolor: colors.surfaceContainerLow, borderRadius: 2, mb: 4, textAlign: 'left' }}>
                <Typography sx={{ fontSize: '0.8rem', color: colors.onSurfaceVariant, mb: 0.5 }}>
                  Başvuru No: <strong>#{application.id}</strong>
                </Typography>
                <Typography sx={{ fontSize: '0.8rem', color: colors.onSurfaceVariant }}>
                  Gönderim:{' '}
                  {new Date(application.createdAt).toLocaleDateString('tr-TR', {
                    day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </Typography>
              </Box>
            )}

            {status === 'APPROVED' && (
              <Button
                href={ROUTES.COMPANY_MANAGE}
                component="a"
                variant="contained"
                fullWidth
                size="large"
                sx={{ mb: 2 }}
              >
                Firma Paneline Git
              </Button>
            )}

            {status === 'REJECTED' && (
              <ReapplyForm previous={application ?? {}} />
            )}
          </>
        )}

        <Box sx={{ mt: 4 }}>
          <Button
            onClick={handleLogout}
            startIcon={<LogoutIcon />}
            sx={{ color: colors.onSurfaceVariant, '&:hover': { color: colors.error } }}
          >
            Çıkış Yap
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
