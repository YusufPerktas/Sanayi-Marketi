'use client';

import React, { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  FormControl,
  FormHelperText,
  FormLabel,
  IconButton,
  InputAdornment,
  OutlinedInput,
  Typography,
} from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import SaveIcon from '@mui/icons-material/Save';
import { useMutation, useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { useAuth } from '@/context/useAuth';
import { userService } from '@/services/user.service';
import { colors } from '@/utils/colors';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { USER_ROLES } from '@/utils/constants';

interface ApiError {
  error: string;
  message: string;
  fieldErrors?: Record<string, string>;
}

const labelSx = {
  fontSize: '0.75rem',
  fontWeight: 600,
  color: colors.onSurfaceVariant,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.08em',
  mb: 1,
};
const inputSx = {
  bgcolor: colors.surfaceBright,
  '& fieldset': { borderColor: 'rgba(195,198,215,0.3)' },
};

function SectionCard({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <Box
      sx={{
        bgcolor: colors.surfaceContainerLowest,
        borderRadius: 3,
        p: 4,
        border: `1px solid rgba(195,198,215,0.15)`,
        boxShadow: colors.shadowSm,
        mb: 3,
      }}
    >
      <Typography
        sx={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: '1.05rem', color: colors.onSurface, mb: 0.5 }}
      >
        {title}
      </Typography>
      <Typography sx={{ fontSize: '0.85rem', color: colors.onSurfaceVariant, mb: 3 }}>
        {description}
      </Typography>
      <Divider sx={{ borderColor: 'rgba(195,198,215,0.15)', mb: 3 }} />
      {children}
    </Box>
  );
}

export default function AccountSettingsPage() {
  const { user } = useAuth();
  const variant = user?.role === USER_ROLES.COMPANY_USER ? 'company' : 'user';

  const { data: profile } = useQuery({
    queryKey: ['user-profile'],
    queryFn: userService.getMe,
  });

  // Email change form
  const [emailForm, setEmailForm] = useState({ currentPassword: '', newEmail: '' });
  const [showEmailPw, setShowEmailPw] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);
  const [emailErrors, setEmailErrors] = useState<Record<string, string>>({});
  const [emailGlobalError, setEmailGlobalError] = useState<string | null>(null);

  // Password change form
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showCurrPw, setShowCurrPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwErrors, setPwErrors] = useState<Record<string, string>>({});
  const [pwGlobalError, setPwGlobalError] = useState<string | null>(null);

  const emailMutation = useMutation({
    mutationFn: () =>
      userService.updateCredentials({
        currentPassword: emailForm.currentPassword,
        newEmail: emailForm.newEmail,
      }),
    onSuccess: () => {
      setEmailSuccess(true);
      setEmailForm({ currentPassword: '', newEmail: '' });
      setEmailErrors({});
      setEmailGlobalError(null);
    },
    onError: (err) => {
      const ae = err as AxiosError<ApiError>;
      if (ae.response?.data?.fieldErrors) setEmailErrors(ae.response.data.fieldErrors);
      else if (ae.response?.data?.message) setEmailGlobalError(ae.response.data.message);
      else setEmailGlobalError('Bir hata oluştu. Lütfen tekrar deneyin.');
    },
  });

  const pwMutation = useMutation({
    mutationFn: () =>
      userService.updateCredentials({
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      }),
    onSuccess: () => {
      setPwSuccess(true);
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPwErrors({});
      setPwGlobalError(null);
    },
    onError: (err) => {
      const ae = err as AxiosError<ApiError>;
      if (ae.response?.data?.fieldErrors) setPwErrors(ae.response.data.fieldErrors);
      else if (ae.response?.data?.message) setPwGlobalError(ae.response.data.message);
      else setPwGlobalError('Bir hata oluştu. Lütfen tekrar deneyin.');
    },
  });

  function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEmailErrors({});
    setEmailGlobalError(null);
    setEmailSuccess(false);
    const errs: Record<string, string> = {};
    if (!emailForm.currentPassword) errs.currentPassword = 'Mevcut şifre zorunludur';
    if (!emailForm.newEmail.trim()) errs.newEmail = 'Yeni e-posta zorunludur';
    if (Object.keys(errs).length) { setEmailErrors(errs); return; }
    emailMutation.mutate();
  }

  function handlePwSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPwErrors({});
    setPwGlobalError(null);
    setPwSuccess(false);
    const errs: Record<string, string> = {};
    if (!pwForm.currentPassword) errs.currentPassword = 'Mevcut şifre zorunludur';
    if (!pwForm.newPassword) errs.newPassword = 'Yeni şifre zorunludur';
    else if (pwForm.newPassword.length < 8) errs.newPassword = 'En az 8 karakter olmalıdır';
    if (pwForm.newPassword !== pwForm.confirmPassword) errs.confirmPassword = 'Şifreler eşleşmiyor';
    if (Object.keys(errs).length) { setPwErrors(errs); return; }
    pwMutation.mutate();
  }

  return (
    <DashboardLayout variant={variant}>
      <Box sx={{ maxWidth: 600 }}>
        <Box sx={{ mb: 5 }}>
          <Typography
            variant="h5"
            sx={{ fontFamily: 'var(--font-manrope)', fontWeight: 800, color: colors.onSurface, mb: 0.5 }}
          >
            Hesap Ayarları
          </Typography>
          <Typography sx={{ color: colors.onSurfaceVariant, fontSize: '0.9rem' }}>
            Giriş bilgilerinizi buradan güncelleyebilirsiniz.
          </Typography>
        </Box>

        {/* Current email info */}
        {profile && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              p: 2.5,
              bgcolor: colors.surfaceContainerLow,
              borderRadius: 2,
              border: `1px solid rgba(195,198,215,0.2)`,
              mb: 4,
            }}
          >
            <EmailIcon sx={{ color: colors.outline, fontSize: '1.2rem' }} />
            <Box>
              <Typography sx={{ fontSize: '0.75rem', color: colors.onSurfaceVariant, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Mevcut Giriş E-postası
              </Typography>
              <Typography sx={{ fontWeight: 700, color: colors.onSurface }}>{profile.email}</Typography>
            </Box>
          </Box>
        )}

        {/* Email Change */}
        <SectionCard
          title="E-posta Değiştir"
          description="Yeni e-posta adresiniz gelecekteki girişlerde kullanılacaktır."
        >
          {emailSuccess && (
            <Alert severity="success" sx={{ mb: 3 }}>
              E-posta adresiniz güncellendi. Güvenliğiniz için çıkış yapıp yeni e-postanızla giriş yapmanız önerilir.
            </Alert>
          )}
          {emailGlobalError && <Alert severity="error" sx={{ mb: 3 }}>{emailGlobalError}</Alert>}

          <Box component="form" onSubmit={handleEmailSubmit} noValidate sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <FormControl error={!!emailErrors.currentPassword}>
              <FormLabel sx={labelSx}>Mevcut Şifre *</FormLabel>
              <OutlinedInput
                type={showEmailPw ? 'text' : 'password'}
                value={emailForm.currentPassword}
                onChange={(e) => setEmailForm((p) => ({ ...p, currentPassword: e.target.value }))}
                placeholder="Mevcut şifrenizi girin"
                startAdornment={<InputAdornment position="start"><LockIcon sx={{ color: colors.outline, fontSize: '1.1rem' }} /></InputAdornment>}
                endAdornment={
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setShowEmailPw((v) => !v)} sx={{ color: colors.outline }}>
                      {showEmailPw ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                }
                sx={inputSx}
              />
              {emailErrors.currentPassword && <FormHelperText>{emailErrors.currentPassword}</FormHelperText>}
            </FormControl>

            <FormControl error={!!emailErrors.newEmail}>
              <FormLabel sx={labelSx}>Yeni E-posta *</FormLabel>
              <OutlinedInput
                type="email"
                value={emailForm.newEmail}
                onChange={(e) => setEmailForm((p) => ({ ...p, newEmail: e.target.value }))}
                placeholder="yeni@email.com"
                startAdornment={<InputAdornment position="start"><EmailIcon sx={{ color: colors.outline, fontSize: '1.1rem' }} /></InputAdornment>}
                sx={inputSx}
              />
              {emailErrors.newEmail && <FormHelperText>{emailErrors.newEmail}</FormHelperText>}
            </FormControl>

            <Button
              type="submit"
              variant="contained"
              startIcon={emailMutation.isPending ? undefined : <SaveIcon />}
              disabled={emailMutation.isPending}
              sx={{ alignSelf: 'flex-start', px: 4, py: 1.25 }}
            >
              {emailMutation.isPending ? <CircularProgress size={20} color="inherit" /> : 'E-postayı Güncelle'}
            </Button>
          </Box>
        </SectionCard>

        {/* Password Change */}
        <SectionCard
          title="Şifre Değiştir"
          description="Güçlü bir şifre hesabınızı korur. En az 8 karakter kullanın."
        >
          {pwSuccess && (
            <Alert severity="success" sx={{ mb: 3 }}>
              Şifreniz başarıyla güncellendi.
            </Alert>
          )}
          {pwGlobalError && <Alert severity="error" sx={{ mb: 3 }}>{pwGlobalError}</Alert>}

          <Box component="form" onSubmit={handlePwSubmit} noValidate sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <FormControl error={!!pwErrors.currentPassword}>
              <FormLabel sx={labelSx}>Mevcut Şifre *</FormLabel>
              <OutlinedInput
                type={showCurrPw ? 'text' : 'password'}
                value={pwForm.currentPassword}
                onChange={(e) => setPwForm((p) => ({ ...p, currentPassword: e.target.value }))}
                placeholder="Mevcut şifrenizi girin"
                startAdornment={<InputAdornment position="start"><LockIcon sx={{ color: colors.outline, fontSize: '1.1rem' }} /></InputAdornment>}
                endAdornment={
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setShowCurrPw((v) => !v)} sx={{ color: colors.outline }}>
                      {showCurrPw ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                }
                sx={inputSx}
              />
              {pwErrors.currentPassword && <FormHelperText>{pwErrors.currentPassword}</FormHelperText>}
            </FormControl>

            <FormControl error={!!pwErrors.newPassword}>
              <FormLabel sx={labelSx}>Yeni Şifre *</FormLabel>
              <OutlinedInput
                type={showNewPw ? 'text' : 'password'}
                value={pwForm.newPassword}
                onChange={(e) => setPwForm((p) => ({ ...p, newPassword: e.target.value }))}
                placeholder="En az 8 karakter"
                startAdornment={<InputAdornment position="start"><LockIcon sx={{ color: colors.outline, fontSize: '1.1rem' }} /></InputAdornment>}
                endAdornment={
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setShowNewPw((v) => !v)} sx={{ color: colors.outline }}>
                      {showNewPw ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                }
                sx={inputSx}
              />
              {pwErrors.newPassword && <FormHelperText>{pwErrors.newPassword}</FormHelperText>}
            </FormControl>

            <FormControl error={!!pwErrors.confirmPassword}>
              <FormLabel sx={labelSx}>Yeni Şifre (Tekrar) *</FormLabel>
              <OutlinedInput
                type="password"
                value={pwForm.confirmPassword}
                onChange={(e) => setPwForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                placeholder="Yeni şifrenizi tekrar girin"
                startAdornment={<InputAdornment position="start"><LockIcon sx={{ color: colors.outline, fontSize: '1.1rem' }} /></InputAdornment>}
                sx={inputSx}
              />
              {pwErrors.confirmPassword && <FormHelperText>{pwErrors.confirmPassword}</FormHelperText>}
            </FormControl>

            <Button
              type="submit"
              variant="contained"
              startIcon={pwMutation.isPending ? undefined : <SaveIcon />}
              disabled={pwMutation.isPending}
              sx={{ alignSelf: 'flex-start', px: 4, py: 1.25 }}
            >
              {pwMutation.isPending ? <CircularProgress size={20} color="inherit" /> : 'Şifreyi Güncelle'}
            </Button>
          </Box>
        </SectionCard>
      </Box>
    </DashboardLayout>
  );
}
