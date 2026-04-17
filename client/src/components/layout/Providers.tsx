'use client';

import React from 'react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/context/AuthContext';

const theme = createTheme({
  palette: {
    primary: {
      main: '#004ac6',
      light: '#2563eb',
      dark: '#003ea8',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#3755c3',
      contrastText: '#ffffff',
    },
    error: {
      main: '#ba1a1a',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f9f9ff',
      paper: '#ffffff',
    },
    text: {
      primary: '#111c2d',
      secondary: '#434655',
      disabled: '#737686',
    },
    divider: 'rgba(195, 198, 215, 0.3)',
  },
  typography: {
    fontFamily: '"Inter", sans-serif',
    h1: { fontFamily: '"Manrope", sans-serif', fontWeight: 800 },
    h2: { fontFamily: '"Manrope", sans-serif', fontWeight: 700 },
    h3: { fontFamily: '"Manrope", sans-serif', fontWeight: 700 },
    h4: { fontFamily: '"Manrope", sans-serif', fontWeight: 700 },
    h5: { fontFamily: '"Manrope", sans-serif', fontWeight: 700 },
    h6: { fontFamily: '"Manrope", sans-serif', fontWeight: 700 },
    subtitle1: { fontFamily: '"Manrope", sans-serif', fontWeight: 600 },
    button: { fontFamily: '"Inter", sans-serif', fontWeight: 700, textTransform: 'none' },
  },
  shape: { borderRadius: 8 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 700,
          borderRadius: 8,
          '&.MuiButton-containedPrimary': {
            background: 'linear-gradient(135deg, #004ac6, #2563eb)',
            boxShadow: 'none',
            '&:hover': { background: 'linear-gradient(135deg, #003ea8, #1d4ed8)', boxShadow: '0 8px 16px rgba(0,74,198,0.2)' },
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: '#f9f9ff',
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#004ac6' },
        },
        notchedOutline: { borderColor: 'rgba(195,198,215,0.4)' },
      },
    },
    MuiPaper: {
      styleOverrides: { root: { backgroundImage: 'none' } },
    },
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: '#f9f9ff', color: '#111c2d' },
        '*': { boxSizing: 'border-box' },
      },
    },
  },
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 5, retry: 1 },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <QueryClientProvider client={queryClient}>
        <AuthProvider>{children}</AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
