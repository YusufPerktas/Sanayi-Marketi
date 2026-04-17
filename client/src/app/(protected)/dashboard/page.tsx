'use client';

import React from 'react';
import { Box, Container, Typography, Button } from '@mui/material';
import { useAuth } from '@/context/useAuth';
import { authService } from '@/services/auth.service';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/utils/constants';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    try {
      await authService.logout();
    } finally {
      logout();
      router.push(ROUTES.HOME);
    }
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 6 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
          Dashboard
        </Typography>
        <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary' }}>
          Hoş geldin! Rol: <strong>{user?.role}</strong>
        </Typography>
        <Button variant="outlined" color="error" onClick={handleLogout}>
          Çıkış Yap
        </Button>
      </Box>
    </Container>
  );
}
