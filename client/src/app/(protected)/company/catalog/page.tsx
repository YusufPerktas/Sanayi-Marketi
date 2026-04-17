'use client';

import React, { useRef, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Snackbar, Typography } from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteIcon from '@mui/icons-material/Delete';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { colors } from '@/utils/colors';

const ALLOWED_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
const ALLOWED_EXT = '.pdf, .doc, .docx';
const MAX_SIZE_MB = 20;

export default function CompanyCatalogPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snack, setSnack] = useState<string | null>(null);

  // Existing catalog from backend (placeholder — replace with useQuery when endpoint is ready)
  const [existingCatalog] = useState<{ url: string; type: string; name: string } | null>(null);

  function validateFile(f: File): string | null {
    if (!ALLOWED_TYPES.includes(f.type)) return 'Sadece PDF, DOC veya DOCX dosyaları yüklenebilir.';
    if (f.size > MAX_SIZE_MB * 1024 * 1024) return `Dosya boyutu ${MAX_SIZE_MB}MB\'den büyük olamaz.`;
    return null;
  }

  function handleSelect(f: File) {
    const err = validateFile(f);
    if (err) { setError(err); return; }
    setError(null);
    setFile(f);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleSelect(f);
  }

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    try {
      // TODO: implement catalog upload API endpoint
      await new Promise((r) => setTimeout(r, 1500));
      setSnack('Katalog başarıyla yüklendi');
      setFile(null);
    } catch {
      setError('Yükleme sırasında bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <DashboardLayout variant="company">
      <Box sx={{ maxWidth: 640 }}>
        <Typography variant="h4" sx={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, color: colors.onSurface, mb: 1 }}>
          Katalog Yönetimi
        </Typography>
        <Typography sx={{ color: colors.onSurfaceVariant, mb: 5 }}>
          Firmanızın ürün kataloğunu yükleyin (PDF, DOC veya DOCX)
        </Typography>

        {/* Existing catalog */}
        {existingCatalog && (
          <Box
            sx={{
              bgcolor: colors.surfaceContainerLowest,
              borderRadius: 3,
              p: 3,
              border: `1px solid rgba(195,198,215,0.15)`,
              boxShadow: colors.shadowSm,
              display: 'flex',
              alignItems: 'center',
              gap: 3,
              mb: 4,
              flexWrap: 'wrap',
            }}
          >
            <Box sx={{ width: 48, height: 48, bgcolor: colors.primaryFixed, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <PictureAsPdfIcon sx={{ color: colors.primary }} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontWeight: 700, color: colors.onSurface }}>{existingCatalog.name}</Typography>
              <Typography sx={{ fontSize: '0.8rem', color: colors.outline }}>{existingCatalog.type}</Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <Button startIcon={<DownloadIcon />} component="a" href={existingCatalog.url} target="_blank" variant="outlined" size="small" sx={{ borderColor: 'rgba(195,198,215,0.3)', color: colors.primary }}>
                İndir
              </Button>
              <Button startIcon={<DeleteIcon />} color="error" size="small" variant="outlined">
                Sil
              </Button>
            </Box>
          </Box>
        )}

        {/* Upload area */}
        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        <Box
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          sx={{
            border: `2px dashed ${dragOver ? colors.primary : 'rgba(195,198,215,0.4)'}`,
            borderRadius: 3,
            p: 6,
            textAlign: 'center',
            cursor: 'pointer',
            bgcolor: dragOver ? colors.primaryFixed : colors.surfaceContainerLowest,
            transition: 'all 0.15s',
            '&:hover': { borderColor: colors.primary, bgcolor: colors.primaryFixed },
            mb: 3,
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept={ALLOWED_EXT}
            style={{ display: 'none' }}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleSelect(f); }}
          />
          <UploadFileIcon sx={{ fontSize: '3rem', color: dragOver ? colors.primary : colors.outline, mb: 2 }} />
          <Typography sx={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, color: colors.onSurface, mb: 0.5 }}>
            Dosyayı buraya sürükleyin veya tıklayın
          </Typography>
          <Typography sx={{ fontSize: '0.875rem', color: colors.onSurfaceVariant }}>
            PDF, DOC veya DOCX — Maksimum {MAX_SIZE_MB}MB
          </Typography>
        </Box>

        {file && (
          <Box
            sx={{
              bgcolor: colors.surfaceContainerLow,
              borderRadius: 3,
              p: 3,
              border: `1px solid rgba(195,198,215,0.15)`,
              display: 'flex',
              alignItems: 'center',
              gap: 2.5,
              mb: 3,
            }}
          >
            <PictureAsPdfIcon sx={{ color: colors.primary, flexShrink: 0 }} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontWeight: 600, color: colors.onSurface, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {file.name}
              </Typography>
              <Typography sx={{ fontSize: '0.8rem', color: colors.outline }}>
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </Typography>
            </Box>
            <Button size="small" color="error" onClick={() => setFile(null)} sx={{ flexShrink: 0 }}>
              Kaldır
            </Button>
          </Box>
        )}

        <Button
          variant="contained"
          fullWidth
          size="large"
          startIcon={uploading ? <CircularProgress size={18} color="inherit" /> : <UploadFileIcon />}
          disabled={!file || uploading}
          onClick={handleUpload}
          sx={{ py: 1.75 }}
        >
          {uploading ? 'Yükleniyor...' : 'Kataloğu Yükle'}
        </Button>

        <Box sx={{ mt: 3, p: 2.5, bgcolor: colors.surfaceContainerLow, borderRadius: 2 }}>
          <Typography sx={{ fontSize: '0.8rem', color: colors.onSurfaceVariant, lineHeight: 1.6 }}>
            Firmanızın güncel ürün kataloğunu yükleyerek müşterilerinizin tüm ürün ve fiyat bilgilerinize kolayca ulaşmasını sağlayabilirsiniz.
          </Typography>
        </Box>
      </Box>

      <Snackbar open={!!snack} autoHideDuration={3000} onClose={() => setSnack(null)} message={snack} />
    </DashboardLayout>
  );
}
