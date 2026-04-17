'use client';

import React, { useState } from 'react';
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Alert,
  Paper,
  CircularProgress,
} from '@mui/material';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/useAuth';
import { authService } from '@/services/auth.service';
import { ROUTES, USER_ROLES } from '@/utils/constants';
import { AxiosError } from 'axios';

interface ApiError {
  error: string;
  message: string;
  fieldErrors?: Record<string, string>;
}

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
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

    if (form.password !== form.confirmPassword) {
      setFieldErrors({ confirmPassword: 'Şifreler eşleşmiyor' });
      return;
    }

    setLoading(true);

    try {
      const data = await authService.register({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
      });
      login(data.accessToken, data.userId, data.role);

      switch (data.role) {
        case USER_ROLES.ADMIN:
          router.push(ROUTES.ADMIN);
          break;
        case USER_ROLES.COMPANY_USER:
          router.push(ROUTES.COMPANY_MANAGE);
          break;
        default:
          router.push(ROUTES.DASHBOARD);
      }
    } catch (err) {
      const axiosError = err as AxiosError<ApiError>;
      if (axiosError.response?.data?.fieldErrors) {
        setFieldErrors(axiosError.response.data.fieldErrors);
      } else if (axiosError.response?.data?.message) {
        setError(axiosError.response.data.message);
      } else {
        setError('Kayıt olurken bir hata oluştu. Lütfen tekrar deneyin.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Container maxWidth="xs">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Typography
            variant="h5"
            sx={{ fontWeight: 700, mb: 3, textAlign: 'center' }}
          >
            Kayıt Ol
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              label="Ad"
              name="firstName"
              value={form.firstName}
              onChange={handleChange}
              error={!!fieldErrors.firstName}
              helperText={fieldErrors.firstName}
              fullWidth
              required
              margin="normal"
              autoFocus
            />
            <TextField
              label="Soyad"
              name="lastName"
              value={form.lastName}
              onChange={handleChange}
              error={!!fieldErrors.lastName}
              helperText={fieldErrors.lastName}
              fullWidth
              required
              margin="normal"
            />
            <TextField
              label="E-posta"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              error={!!fieldErrors.email}
              helperText={fieldErrors.email}
              fullWidth
              required
              margin="normal"
              autoComplete="email"
            />
            <TextField
              label="Şifre"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              error={!!fieldErrors.password}
              helperText={fieldErrors.password ?? 'En az 8 karakter'}
              fullWidth
              required
              margin="normal"
              autoComplete="new-password"
            />
            <TextField
              label="Şifre Tekrar"
              name="confirmPassword"
              type="password"
              value={form.confirmPassword}
              onChange={handleChange}
              error={!!fieldErrors.confirmPassword}
              helperText={fieldErrors.confirmPassword}
              fullWidth
              required
              margin="normal"
              autoComplete="new-password"
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={loading}
              sx={{ mt: 2, mb: 1 }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Kayıt Ol'}
            </Button>
          </Box>

          <Typography variant="body2" sx={{ textAlign: 'center', mt: 2 }}>
            Zaten hesabın var mı?{' '}
            <Link href={ROUTES.LOGIN} style={{ color: 'inherit' }}>
              Giriş Yap
            </Link>
          </Typography>

          <Typography variant="body2" sx={{ textAlign: 'center', mt: 1 }}>
            <Link href={ROUTES.HOME} style={{ color: 'inherit' }}>
              ← Ana Sayfaya Dön
            </Link>
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
}
