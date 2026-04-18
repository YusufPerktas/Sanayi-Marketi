'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  FormHelperText,
  FormLabel,
  MenuItem,
  OutlinedInput,
  Select,
  Snackbar,
  Typography,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import DeleteIcon from '@mui/icons-material/Delete';
import FactoryIcon from '@mui/icons-material/Factory';
import { AxiosError } from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { companyService } from '@/services/company.service';
import { TURKISH_CITIES } from '@/utils/constants';
import { colors } from '@/utils/colors';

interface ApiError { error: string; message: string; fieldErrors?: Record<string, string> }

const labelSx = {
  fontSize: '0.75rem',
  fontWeight: 600,
  color: colors.onSurfaceVariant,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.08em',
  mb: 1,
};
const inputSx = { bgcolor: colors.surfaceBright, '& fieldset': { borderColor: 'rgba(195,198,215,0.3)' } };

export default function CompanyEditPage() {
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    companyName: '',
    description: '',
    phone: '',
    email: '',
    website: '',
    city: '',
    district: '',
    fullAddress: '',
    googleMapsEmbedUrl: '',
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [logoSnack, setLogoSnack] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const qc = useQueryClient();

  const { data: company } = useQuery({
    queryKey: ['my-company'],
    queryFn: () => companyService.getMe(),
  });

  const uploadLogoMutation = useMutation({
    mutationFn: (file: File) => companyService.uploadLogo(company!.id, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-company'] });
      setLogoSnack('Logo başarıyla güncellendi');
      setLogoError(null);
    },
    onError: () => setLogoError('Logo yüklenirken hata oluştu.'),
  });

  const deleteLogoMutation = useMutation({
    mutationFn: () => companyService.deleteLogo(company!.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-company'] });
      setLogoSnack('Logo silindi');
    },
    onError: () => setLogoError('Logo silinirken hata oluştu.'),
  });

  useEffect(() => {
    if (company) {
      const rawPhone = company.phone ?? '';
      setForm({
        companyName: company.companyName ?? '',
        description: company.description ?? '',
        phone: formatPhone(rawPhone.replace(/\D/g, '')),
        email: company.email ?? '',
        website: company.website ?? '',
        city: company.city ?? '',
        district: company.district ?? '',
        fullAddress: company.fullAddress ?? '',
        googleMapsEmbedUrl: company.googleMapsEmbedUrl ?? '',
      });
    }
  }, [company]);

  function formatPhone(digits: string): string {
    let n = digits.startsWith('90') && digits.length > 10 ? digits.slice(2) : digits;
    if (n.startsWith('5')) n = '0' + n;
    n = n.slice(0, 11);
    if (n.length > 9) return `${n.slice(0, 4)} ${n.slice(4, 7)} ${n.slice(7, 9)} ${n.slice(9)}`;
    if (n.length > 7) return `${n.slice(0, 4)} ${n.slice(4, 7)} ${n.slice(7)}`;
    if (n.length > 4) return `${n.slice(0, 4)} ${n.slice(4)}`;
    return n;
  }

  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, '');
    setForm((p) => ({ ...p, phone: formatPhone(digits) }));
  }

  function handleLogoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      setLogoError('Sadece JPEG, PNG, WebP veya GIF yüklenebilir.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setLogoError("Logo dosyası 5 MB'yi aşamaz.");
      return;
    }
    setLogoError(null);
    uploadLogoMutation.mutate(file);
    e.target.value = '';
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!company) return;

    // Phone validation
    const rawPhone = form.phone.replace(/\D/g, '');
    if (form.phone && (rawPhone.length !== 11 || !rawPhone.startsWith('05'))) {
      setFieldErrors({ phone: 'Geçerli bir numara girin (05XX XXX XX XX)' });
      return;
    }

    setSaving(true);
    setError(null);
    setFieldErrors({});
    try {
      const payload: Record<string, string> = {};
      Object.entries(form).forEach(([k, v]) => {
        if (k === 'phone') {
          if (rawPhone) payload.phone = rawPhone;
        } else if (v.trim()) {
          payload[k] = v.trim();
        }
      });
      await companyService.update(company.id, payload);
      setSuccess(true);
    } catch (err) {
      const axiosError = err as AxiosError<ApiError>;
      if (axiosError.response?.data?.fieldErrors) setFieldErrors(axiosError.response.data.fieldErrors);
      else if (axiosError.response?.data?.message) setError(axiosError.response.data.message);
      else setError('Kayıt sırasında bir hata oluştu.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <DashboardLayout variant="company">
      <Box sx={{ maxWidth: 720 }}>
        <Typography variant="h4" sx={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, color: colors.onSurface, mb: 1 }}>
          Firma Bilgileri
        </Typography>
        <Typography sx={{ color: colors.onSurfaceVariant, mb: 5 }}>
          İletişim ve profil bilgilerinizi güncelleyin
        </Typography>

        {/* Logo */}
        <Box sx={{ bgcolor: colors.surfaceContainerLowest, borderRadius: 3, p: 4, border: `1px solid rgba(195,198,215,0.15)`, boxShadow: colors.shadowSm, mb: 3, display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
          <Box sx={{ width: 96, height: 96, borderRadius: 2, bgcolor: colors.surfaceContainerLow, border: `1px solid rgba(195,198,215,0.2)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
            {company?.logoUrl ? (
              <img src={`http://localhost:8080${company.logoUrl}`} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '6px' }} />
            ) : (
              <FactoryIcon sx={{ fontSize: '2.5rem', color: colors.outline }} />
            )}
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 700, color: colors.onSurface, mb: 0.5 }}>Firma Logosu</Typography>
            <Typography sx={{ fontSize: '0.8rem', color: colors.onSurfaceVariant, mb: 2 }}>JPEG, PNG veya WebP — Maksimum 5 MB</Typography>
            {logoError && <Alert severity="error" sx={{ mb: 1.5, py: 0.5 }}>{logoError}</Alert>}
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <input ref={logoInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" style={{ display: 'none' }} onChange={handleLogoSelect} />
              <Button variant="outlined" size="small" startIcon={uploadLogoMutation.isPending ? <CircularProgress size={14} color="inherit" /> : <PhotoCameraIcon />} disabled={uploadLogoMutation.isPending || !company} onClick={() => logoInputRef.current?.click()} sx={{ borderColor: 'rgba(195,198,215,0.3)', color: colors.primary }}>
                {company?.logoUrl ? 'Logoyu Değiştir' : 'Logo Yükle'}
              </Button>
              {company?.logoUrl && (
                <Button variant="outlined" size="small" color="error" startIcon={deleteLogoMutation.isPending ? <CircularProgress size={14} color="inherit" /> : <DeleteIcon />} disabled={deleteLogoMutation.isPending} onClick={() => deleteLogoMutation.mutate()}>
                  Sil
                </Button>
              )}
            </Box>
          </Box>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        <Box component="form" onSubmit={handleSave} noValidate sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

          {/* Temel Bilgiler */}
          <Section title="Temel Bilgiler">
            <Field label="Firma Adı" error={fieldErrors.companyName}>
              <OutlinedInput value={form.companyName} onChange={(e) => setForm((p) => ({ ...p, companyName: e.target.value }))} placeholder="Firma adınız" sx={inputSx} />
            </Field>
            <Field label="Firma Açıklaması" error={fieldErrors.description}>
              <OutlinedInput value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Firmanız hakkında kısa bilgi..." multiline rows={3} sx={inputSx} />
            </Field>
          </Section>

          {/* İletişim Bilgileri */}
          <Section title="İletişim Bilgileri">
            {/* Phone — masked */}
            <Field label="Telefon" error={fieldErrors.phone}>
              <OutlinedInput
                value={form.phone}
                onChange={handlePhoneChange}
                placeholder="05XX XXX XX XX"
                inputProps={{ inputMode: 'numeric' }}
                sx={inputSx}
              />
            </Field>
            <Field label="E-posta" error={fieldErrors.email}>
              <OutlinedInput value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} placeholder="info@firma.com" type="email" sx={inputSx} />
            </Field>
            <Field label="Website" error={fieldErrors.website}>
              <OutlinedInput value={form.website} onChange={(e) => setForm((p) => ({ ...p, website: e.target.value }))} placeholder="https://www.firma.com" type="url" sx={inputSx} />
            </Field>
          </Section>

          {/* Konum Bilgileri */}
          <Section title="Konum Bilgileri">
            {/* City — Select dropdown */}
            <Field label="Şehir" error={fieldErrors.city}>
              <Select
                value={form.city}
                onChange={(e) => setForm((p) => ({ ...p, city: e.target.value, district: '' }))}
                displayEmpty
                sx={{ ...inputSx, '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(195,198,215,0.3)' } }}
              >
                <MenuItem value=""><em style={{ color: colors.outline }}>Şehir seçin</em></MenuItem>
                {TURKISH_CITIES.map((c) => (
                  <MenuItem key={c} value={c}>{c}</MenuItem>
                ))}
              </Select>
            </Field>
            <Field label="İlçe" error={fieldErrors.district}>
              <OutlinedInput value={form.district} onChange={(e) => setForm((p) => ({ ...p, district: e.target.value }))} placeholder="Kadıköy" sx={inputSx} />
            </Field>
            <Field label="Tam Adres" error={fieldErrors.fullAddress}>
              <OutlinedInput value={form.fullAddress} onChange={(e) => setForm((p) => ({ ...p, fullAddress: e.target.value }))} placeholder="Sokak adı, bina no..." multiline rows={3} sx={inputSx} />
            </Field>
            <Field label="Google Maps Embed URL" error={fieldErrors.googleMapsEmbedUrl}>
              <OutlinedInput value={form.googleMapsEmbedUrl} onChange={(e) => setForm((p) => ({ ...p, googleMapsEmbedUrl: e.target.value }))} placeholder="https://www.google.com/maps/embed?pb=..." sx={inputSx} />
            </Field>
          </Section>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 1 }}>
            <Button type="submit" variant="contained" startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />} disabled={saving} sx={{ px: 4, py: 1.5 }}>
              Değişiklikleri Kaydet
            </Button>
          </Box>
        </Box>
      </Box>

      <Snackbar open={success} autoHideDuration={3000} onClose={() => setSuccess(false)} message="Firma bilgileri kaydedildi" />
      <Snackbar open={!!logoSnack} autoHideDuration={3000} onClose={() => setLogoSnack(null)} message={logoSnack} />
    </DashboardLayout>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Box sx={{ bgcolor: colors.surfaceContainerLowest, borderRadius: 3, p: 4, border: `1px solid rgba(195,198,215,0.15)`, boxShadow: colors.shadowSm, display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Typography sx={{ fontWeight: 700, color: colors.onSurface, fontSize: '1rem', pb: 1, borderBottom: `1px solid rgba(195,198,215,0.15)` }}>
        {title}
      </Typography>
      {children}
    </Box>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <FormControl fullWidth error={!!error}>
      <FormLabel sx={labelSx}>{label}</FormLabel>
      {children}
      {error && <FormHelperText>{error}</FormHelperText>}
    </FormControl>
  );
}
