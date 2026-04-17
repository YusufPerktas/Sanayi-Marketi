import React from 'react';
import { Box, Button, Container, Typography, Stack } from '@mui/material';
import Link from 'next/link';
import { ROUTES } from '@/utils/constants';

export default function HomePage() {
  return (
    <Container maxWidth="lg">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          gap: 3,
        }}
      >
        <Typography variant="h3" sx={{ fontWeight: 800, color: 'primary.main' }}>
          Sanayi Marketi
        </Typography>
        <Typography
          variant="h6"
          sx={{ color: 'text.secondary', maxWidth: 560 }}
        >
          Malzeme arayan kullanıcıları üretici ve satıcılarla buluşturan platform.
          Şirket profillerini keşfet, fiyatları karşılaştır.
        </Typography>
        <Stack direction="row" sx={{ gap: 2, mt: 2 }}>
          <Button
            variant="contained"
            size="large"
            href={ROUTES.SEARCH}
            LinkComponent={Link}
          >
            Malzeme Ara
          </Button>
          <Button
            variant="outlined"
            size="large"
            href={ROUTES.LOGIN}
            LinkComponent={Link}
          >
            Giriş Yap / Kayıt Ol
          </Button>
        </Stack>
      </Box>
    </Container>
  );
}
