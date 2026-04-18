'use client';

import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  FormHelperText,
  FormLabel,
  OutlinedInput,
  Snackbar,
  Typography,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import { AxiosError } from 'axios';
import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { companyService } from '@/services/company.service';
import { colors } from '@/utils/colors';

interface ApiError { error: string; message: string; fieldErrors?: Record<string, string> }

const FIELDS: { key: string; label: string; type?: string; placeholder: string; multiline?: boolean }[] = [
  { key: 'companyName', label: 'Firma Adı', placeholder: 'Firma adınız' },
  { key: 'description', label: 'Firma Açıklaması', placeholder: 'Firmanız hakkında kısa bilgi...', multiline: true },
  { key: 'phone', label: 'Telefon', type: 'tel', placeholder: '+90 5xx xxx xx xx' },
  { key: 'email', label: 'E-posta', type: 'email', placeholder: 'info@firma.com' },
  { key: 'website', label: 'Website', type: 'url', placeholder: 'https://www.firma.com' },
  { key: 'city', label: 'Şehir', placeholder: 'İstanbul' },
  { key: 'district', label: 'İlçe', placeholder: 'Kadıköy' },
  { key: 'fullAddress', label: 'Tam Adres', placeholder: 'Sokak adı, bina no...', multiline: true },
  { key: 'googleMapsEmbedUrl', label: 'Google Maps Embed URL', placeholder: 'https://www.google.com/maps/embed?...' },
];

export default function CompanyEditPage() {
  const [form, setForm] = useState<Record<string, string>>({
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

  const { data: company } = useQuery({
    queryKey: ['my-company'],
    queryFn: () => companyService.getMe(),
  });

  useEffect(() => {
    if (company) {
      setForm({
        companyName: company.companyName ?? '',
        description: company.description ?? '',
        phone: company.phone ?? '',
        email: company.email ?? '',
        website: company.website ?? '',
        city: company.city ?? '',
        district: company.district ?? '',
        fullAddress: company.fullAddress ?? '',
        googleMapsEmbedUrl: company.googleMapsEmbedUrl ?? '',
      });
    }
  }, [company]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!company) return;
    setSaving(true);
    setError(null);
    setFieldErrors({});
    try {
      const payload = Object.fromEntries(
        Object.entries(form).filter(([, v]) => v.trim() !== ''),
      );
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

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        <Box component="form" onSubmit={handleSave} noValidate sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Box
            sx={{
              bgcolor: colors.surfaceContainerLowest,
              borderRadius: 3,
              p: 4,
              border: `1px solid rgba(195,198,215,0.15)`,
              boxShadow: colors.shadowSm,
              display: 'flex',
              flexDirection: 'column',
              gap: 3,
            }}
          >
            <Typography sx={{ fontWeight: 700, color: colors.onSurface, fontSize: '1rem', pb: 1, borderBottom: `1px solid rgba(195,198,215,0.15)` }}>
              Temel Bilgiler
            </Typography>
            {FIELDS.slice(0, 2).map((f) => (
              <FieldInput
                key={f.key}
                field={f}
                value={form[f.key] ?? ''}
                error={fieldErrors[f.key]}
                onChange={(v) => setForm((prev) => ({ ...prev, [f.key]: v }))}
              />
            ))}
          </Box>

          <Box
            sx={{
              bgcolor: colors.surfaceContainerLowest,
              borderRadius: 3,
              p: 4,
              border: `1px solid rgba(195,198,215,0.15)`,
              boxShadow: colors.shadowSm,
              display: 'flex',
              flexDirection: 'column',
              gap: 3,
            }}
          >
            <Typography sx={{ fontWeight: 700, color: colors.onSurface, fontSize: '1rem', pb: 1, borderBottom: `1px solid rgba(195,198,215,0.15)` }}>
              İletişim Bilgileri
            </Typography>
            {FIELDS.slice(2, 5).map((f) => (
              <FieldInput
                key={f.key}
                field={f}
                value={form[f.key] ?? ''}
                error={fieldErrors[f.key]}
                onChange={(v) => setForm((prev) => ({ ...prev, [f.key]: v }))}
              />
            ))}
          </Box>

          <Box
            sx={{
              bgcolor: colors.surfaceContainerLowest,
              borderRadius: 3,
              p: 4,
              border: `1px solid rgba(195,198,215,0.15)`,
              boxShadow: colors.shadowSm,
              display: 'flex',
              flexDirection: 'column',
              gap: 3,
            }}
          >
            <Typography sx={{ fontWeight: 700, color: colors.onSurface, fontSize: '1rem', pb: 1, borderBottom: `1px solid rgba(195,198,215,0.15)` }}>
              Konum Bilgileri
            </Typography>
            {FIELDS.slice(5).map((f) => (
              <FieldInput
                key={f.key}
                field={f}
                value={form[f.key] ?? ''}
                error={fieldErrors[f.key]}
                onChange={(v) => setForm((prev) => ({ ...prev, [f.key]: v }))}
              />
            ))}
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 1 }}>
            <Button
              type="submit"
              variant="contained"
              startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
              disabled={saving}
              sx={{ px: 4, py: 1.5 }}
            >
              Değişiklikleri Kaydet
            </Button>
          </Box>
        </Box>
      </Box>

      <Snackbar
        open={success}
        autoHideDuration={3000}
        onClose={() => setSuccess(false)}
        message="Firma bilgileri kaydedildi"
      />
    </DashboardLayout>
  );
}

function FieldInput({
  field,
  value,
  error,
  onChange,
}: {
  field: { key: string; label: string; type?: string; placeholder: string; multiline?: boolean };
  value: string;
  error?: string;
  onChange: (v: string) => void;
}) {
  return (
    <FormControl error={!!error}>
      <FormLabel
        sx={{
          fontSize: '0.75rem',
          fontWeight: 600,
          color: colors.onSurfaceVariant,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          mb: 1,
        }}
      >
        {field.label}
      </FormLabel>
      <OutlinedInput
        type={field.type ?? 'text'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        multiline={field.multiline}
        rows={field.multiline ? 3 : undefined}
        sx={{ bgcolor: colors.surfaceBright, '& fieldset': { borderColor: 'rgba(195,198,215,0.3)' } }}
      />
      {error && <FormHelperText>{error}</FormHelperText>}
    </FormControl>
  );
}
