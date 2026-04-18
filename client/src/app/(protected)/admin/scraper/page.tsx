'use client';

import React, { useState } from 'react';
import {
  Box,
  Button,
  Chip,
  LinearProgress,
  Typography,
} from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import ScheduleIcon from '@mui/icons-material/Schedule';
import InfoIcon from '@mui/icons-material/Info';
import AdminLayout from '@/components/layout/AdminLayout';
import { colors } from '@/utils/colors';

const SOURCES = [
  { id: 1, name: 'İSO Üye Veritabanı', url: 'iso.org.tr', status: 'idle' as const, lastRun: '2024-10-20', records: 1248 },
  { id: 2, name: 'TOBB Şirket Rehberi', url: 'tobb.org.tr', status: 'success' as const, lastRun: '2024-10-21', records: 3845 },
  { id: 3, name: 'OSD Üyeler', url: 'osd.org.tr', status: 'error' as const, lastRun: '2024-10-19', records: 0 },
];

const LOGS = [
  { time: '14:32', level: 'info', msg: 'TOBB scraper tamamlandı: 3845 kayıt' },
  { time: '14:28', level: 'info', msg: 'TOBB scraper başlatıldı' },
  { time: '11:15', level: 'error', msg: 'OSD scraper: Bağlantı zaman aşımı' },
  { time: '10:00', level: 'info', msg: 'İSO scraper tamamlandı: 1248 kayıt' },
  { time: '09:55', level: 'info', msg: 'Günlük scraper görevi başlatıldı' },
];

const STATUS_CHIP: Record<string, { label: string; color: string; bg: string }> = {
  idle: { label: 'Bekliyor', color: colors.onSurfaceVariant, bg: colors.surfaceContainerHigh },
  running: { label: 'Çalışıyor', color: colors.primary, bg: colors.primaryFixed },
  success: { label: 'Başarılı', color: '#166534', bg: '#dcfce7' },
  error: { label: 'Hatalı', color: colors.error, bg: colors.errorContainer },
};

export default function AdminScraperPage() {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);

  function handleStart() {
    setRunning(true);
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) { clearInterval(interval); setRunning(false); return 100; }
        return p + 10;
      });
    }, 400);
  }

  return (
    <AdminLayout title="Scraper Kontrol Paneli">
      {/* Note banner */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          p: 3,
          bgcolor: colors.primaryFixed,
          borderRadius: 3,
          border: `1px solid rgba(0,74,198,0.15)`,
          mb: 5,
        }}
      >
        <InfoIcon sx={{ color: colors.primary, flexShrink: 0 }} />
        <Typography sx={{ fontSize: '0.875rem', color: colors.primary }}>
          Bu panel şu an UI gösterim modundadır. Backend entegrasyonu bir sonraki fazda tamamlanacak.
        </Typography>
      </Box>

      {/* Global controls */}
      <Box
        sx={{
          bgcolor: colors.surfaceContainerLowest,
          borderRadius: 3,
          p: 4,
          border: `1px solid rgba(195,198,215,0.15)`,
          boxShadow: colors.shadowSm,
          mb: 4,
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography sx={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: '1.1rem', color: colors.onSurface, mb: 0.5 }}>
              Tüm Kaynaklarda Çalıştır
            </Typography>
            <Typography sx={{ fontSize: '0.875rem', color: colors.onSurfaceVariant }}>
              Tüm aktif scraper kaynaklarını sıralı çalıştırır
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={running ? <StopIcon /> : <PlayArrowIcon />}
              onClick={running ? () => setRunning(false) : handleStart}
              color={running ? 'error' : 'primary'}
              sx={{ px: 3 }}
            >
              {running ? 'Durdur' : 'Başlat'}
            </Button>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              sx={{ borderColor: 'rgba(195,198,215,0.3)', color: colors.onSurface }}
            >
              Sıfırla
            </Button>
          </Box>
        </Box>

        {running && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography sx={{ fontSize: '0.875rem', color: colors.onSurfaceVariant }}>İlerleme</Typography>
              <Typography sx={{ fontSize: '0.875rem', fontWeight: 700, color: colors.primary }}>{progress}%</Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                height: 8,
                borderRadius: 4,
                bgcolor: colors.surfaceContainerHigh,
                '& .MuiLinearProgress-bar': { background: colors.gradientPrimary, borderRadius: 4 },
              }}
            />
          </Box>
        )}
      </Box>

      {/* Sources */}
      <Typography sx={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, color: colors.onSurface, mb: 3 }}>
        Scraper Kaynakları
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 5 }}>
        {SOURCES.map((s) => {
          const st = STATUS_CHIP[s.status] ?? STATUS_CHIP.idle;
          return (
            <Box
              key={s.id}
              sx={{
                bgcolor: colors.surfaceContainerLowest,
                borderRadius: 3,
                p: 3,
                border: `1px solid rgba(195,198,215,0.15)`,
                display: 'flex',
                alignItems: 'center',
                gap: 3,
                flexWrap: 'wrap',
              }}
            >
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  bgcolor: colors.surfaceContainerHigh,
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <SmartToyIcon sx={{ color: colors.outline }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontWeight: 700, color: colors.onSurface, mb: 0.25 }}>{s.name}</Typography>
                <Typography sx={{ fontSize: '0.8rem', color: colors.outline }}>{s.url}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography sx={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: '1.25rem', color: colors.onSurface, lineHeight: 1 }}>
                    {s.records}
                  </Typography>
                  <Typography sx={{ fontSize: '0.7rem', color: colors.outline }}>kayıt</Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography sx={{ fontSize: '0.8rem', color: colors.onSurfaceVariant, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <ScheduleIcon sx={{ fontSize: '0.9rem' }} />
                    {new Date(s.lastRun).toLocaleDateString('tr-TR')}
                  </Typography>
                </Box>
                <Chip label={st.label} size="small" sx={{ bgcolor: st.bg, color: st.color, fontWeight: 700, fontSize: '0.7rem', height: 24 }} />
                <Button size="small" startIcon={<PlayArrowIcon />} variant="outlined" sx={{ borderColor: 'rgba(195,198,215,0.3)', color: colors.primary, fontSize: '0.75rem' }}>
                  Çalıştır
                </Button>
              </Box>
            </Box>
          );
        })}
      </Box>

      {/* Logs */}
      <Typography sx={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, color: colors.onSurface, mb: 3 }}>
        Son Aktiviteler
      </Typography>
      <Box
        sx={{
          bgcolor: colors.inverseSurface,
          borderRadius: 3,
          p: 3,
          fontFamily: 'monospace',
          fontSize: '0.8rem',
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
        }}
      >
        {LOGS.map((log, i) => (
          <Box key={i} sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
            {log.level === 'info'
              ? <CheckCircleIcon sx={{ fontSize: '0.9rem', color: '#4ade80', flexShrink: 0, mt: 0.1 }} />
              : <ErrorIcon sx={{ fontSize: '0.9rem', color: '#f87171', flexShrink: 0, mt: 0.1 }} />}
            <Typography sx={{ fontSize: '0.75rem', color: 'rgba(148,163,184,1)', fontFamily: 'monospace', flexShrink: 0 }}>
              {log.time}
            </Typography>
            <Typography sx={{ fontSize: '0.75rem', color: log.level === 'error' ? '#fca5a5' : 'rgba(203,213,225,1)', fontFamily: 'monospace' }}>
              {log.msg}
            </Typography>
          </Box>
        ))}
      </Box>
    </AdminLayout>
  );
}
