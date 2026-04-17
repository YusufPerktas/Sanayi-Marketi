import React from 'react';
import { Box, Button, Container, Typography } from '@mui/material';
import Link from 'next/link';
import { ROUTES } from '@/utils/constants';

export default function NotFound() {
  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          gap: 2,
        }}
      >
        <Typography variant="h1" sx={{ fontWeight: 800, color: 'primary.main' }}>
          404
        </Typography>
        <Typography variant="h5">Sayfa bulunamadı</Typography>
        <Button
          variant="contained"
          href={ROUTES.HOME}
          LinkComponent={Link}
          sx={{ mt: 2 }}
        >
          Ana Sayfaya Dön
        </Button>
      </Box>
    </Container>
  );
}
