'use client';

import React from 'react';
import Link from 'next/link';
import { Box, Button, LinearProgress, Typography } from '@mui/material';
import EditDocumentIcon from '@mui/icons-material/EditNote';
import CategoryIcon from '@mui/icons-material/Category';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import HistoryIcon from '@mui/icons-material/History';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import CategoryIcon2 from '@mui/icons-material/Inventory2';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import ImageIcon from '@mui/icons-material/Image';
import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { companyService, Company } from '@/services/company.service';
import { ROUTES } from '@/utils/constants';
import { colors } from '@/utils/colors';

const QUICK_ACTIONS = [
  {
    icon: <EditDocumentIcon sx={{ fontSize: '1.5rem' }} />,
    title: 'Firma Bilgilerini Düzenle',
    desc: 'İletişim bilgilerinizi, adresinizi ve firma profil detaylarınızı güncelleyin.',
    cta: 'Düzenle',
    href: ROUTES.COMPANY_EDIT,
    accentColor: colors.primary,
    accentBg: colors.primaryFixed,
    decorColor: `${colors.primary}0D`,
  },
  {
    icon: <CategoryIcon sx={{ fontSize: '1.5rem' }} />,
    title: 'Malzeme Ekle / Düzenle',
    desc: 'Ürün envanterinizi yönetin, yeni stok ekleyin veya mevcut olanları güncelleyin.',
    cta: 'Yönet',
    href: ROUTES.COMPANY_MATERIALS,
    accentColor: colors.secondary,
    accentBg: colors.secondaryFixed,
    decorColor: `${colors.secondary}0D`,
  },
  {
    icon: <UploadFileIcon sx={{ fontSize: '1.5rem' }} />,
    title: 'Katalog Yükle',
    desc: 'Kurumsal ürün kataloglarınızı PDF formatında sisteme yükleyin.',
    cta: 'Yükle',
    href: ROUTES.COMPANY_CATALOG,
    accentColor: colors.tertiary,
    accentBg: colors.tertiaryFixed,
    decorColor: `${colors.tertiary}0D`,
  },
];

export default function CompanyManagePage() {
  const { data: company, isLoading } = useQuery<Company | null>({
    queryKey: ['my-company'],
    queryFn: () => companyService.getMe(),
  });

  const { data: materials } = useQuery({
    queryKey: ['company-materials', company?.id],
    queryFn: () => companyService.getMaterials(company!.id),
    enabled: !!company?.id,
  });

  const hasMaterials = (materials?.length ?? 0) > 0;

  const completenessItems = [
    { label: 'Temel Bilgiler', done: true },
    { label: 'İletişim Bilgileri', done: !!company?.phone || !!company?.email },
    { label: 'Adres', done: !!company?.fullAddress },
    { label: 'Firma Açıklaması', done: !!company?.description },
    { label: 'Ürün Kataloğu', done: !!company?.catalogFileUrl },
    { label: 'Malzeme Listesi', done: hasMaterials },
  ];

  const completeness = completenessItems.filter((i) => i.done).length;
  const maxSteps = completenessItems.length;
  const completePct = Math.round((completeness / maxSteps) * 100);

  return (
    <DashboardLayout variant="company">
      {/* Page header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 5, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 0.5 }}>
            <Typography variant="h4" sx={{ fontFamily: 'var(--font-manrope)', fontWeight: 800, color: colors.onSurface }}>
              {company?.companyName ?? 'Firma Paneli'}
            </Typography>
          </Box>
          <Typography sx={{ color: colors.outline, fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {company ? `Oluşturulma: ${new Date(company.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}` : 'Yükleniyor...'}
          </Typography>
        </Box>
        {company && (
          <Button
            component={Link}
            href={`/companies/${company.id}`}
            variant="outlined"
            startIcon={<VisibilityIcon />}
            sx={{ borderColor: 'rgba(195,198,215,0.3)', color: colors.primary }}
          >
            Profili Görüntüle
          </Button>
        )}
      </Box>

      {/* Quick actions */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3,1fr)' }, gap: 3, mb: 8 }}>
        {QUICK_ACTIONS.map((action) => (
          <Box
            key={action.href}
            component={Link}
            href={action.href}
            sx={{
              bgcolor: colors.surfaceContainerLowest,
              border: `1px solid rgba(195,198,215,0.15)`,
              borderRadius: 3,
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              overflow: 'hidden',
              textDecoration: 'none',
              cursor: 'pointer',
              transition: 'box-shadow 0.2s',
              '&:hover': { boxShadow: colors.shadow },
              '&:hover .arrow-icon': { transform: 'translateX(4px)' },
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: 120,
                height: 120,
                bgcolor: action.decorColor,
                borderBottomLeftRadius: '100%',
                zIndex: 0,
              }}
            />
            <Box
              sx={{
                width: 48,
                height: 48,
                bgcolor: action.accentBg,
                color: action.accentColor,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 3,
                zIndex: 1,
              }}
            >
              {action.icon}
            </Box>
            <Typography sx={{ fontWeight: 700, fontSize: '1.05rem', color: colors.onSurface, mb: 1, zIndex: 1 }}>
              {action.title}
            </Typography>
            <Typography sx={{ fontSize: '0.875rem', color: colors.outline, lineHeight: 1.6, mb: 3, flex: 1, zIndex: 1 }}>
              {action.desc}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', color: colors.primary, fontWeight: 600, fontSize: '0.875rem', zIndex: 1 }}>
              {action.cta}
              <ArrowForwardIcon className="arrow-icon" sx={{ fontSize: '1rem', ml: 0.5, transition: 'transform 0.15s' }} />
            </Box>
          </Box>
        ))}
      </Box>

      {/* Bottom grid */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: 4 }}>
        {/* Activity log */}
        <Box sx={{ bgcolor: colors.surfaceContainerLow, borderRadius: 3, p: 3 }}>
          <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: colors.onSurface, display: 'flex', alignItems: 'center', gap: 1, mb: 4 }}>
            <HistoryIcon sx={{ color: colors.outline, fontSize: '1.2rem' }} />
            Son Aktiviteler
          </Typography>
          <ActivityLog company={company} materials={materials ?? []} />
        </Box>

        {/* Completeness */}
        <Box sx={{ bgcolor: colors.surfaceContainerLowest, border: `1px solid rgba(195,198,215,0.15)`, borderRadius: 3, p: 3, display: 'flex', flexDirection: 'column' }}>
          <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: colors.onSurface, mb: 1 }}>
            Profil Doluluğu
          </Typography>
          <Typography sx={{ fontSize: '0.8rem', color: colors.outline, mb: 3 }}>
            Müşterilerin size güvenmesi için profilinizi %100 doldurun.
          </Typography>
          <Box sx={{ mb: 1.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography sx={{ fontWeight: 700, fontSize: '0.875rem', color: colors.onSurface }}>İlerleme</Typography>
              <Typography sx={{ fontWeight: 700, fontSize: '0.875rem', color: colors.primary }}>{completePct}%</Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={completePct}
              sx={{
                height: 8,
                borderRadius: 4,
                bgcolor: colors.surfaceContainerHigh,
                '& .MuiLinearProgress-bar': { background: colors.gradientPrimary, borderRadius: 4 },
              }}
            />
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 2, flex: 1 }}>
            {completenessItems.map((item) => (
              <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: '0.875rem' }}>
                {item.done
                  ? <CheckCircleIcon sx={{ fontSize: '1rem', color: colors.tertiary }} />
                  : <RadioButtonUncheckedIcon sx={{ fontSize: '1rem', color: colors.outline }} />}
                <Typography sx={{ fontSize: '0.875rem', color: item.done ? colors.onSurface : colors.outline }}>
                  {item.label}
                </Typography>
              </Box>
            ))}
          </Box>
          {completePct < 100 && (
            <Button
              component={Link}
              href={ROUTES.COMPANY_EDIT}
              sx={{ mt: 3, color: colors.primary, fontWeight: 700, fontSize: '0.875rem' }}
            >
              Eksikleri Tamamla
            </Button>
          )}
        </Box>
      </Box>
    </DashboardLayout>
  );
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function ActivityLog({ company, materials }: { company: Company | null | undefined; materials: import('@/services/company.service').CompanyMaterial[] }) {
  if (!company) return null;

  type ActivityItem = { icon: React.ReactNode; title: string; desc: string; date: Date };
  const items: ActivityItem[] = [];

  items.push({
    icon: <HowToRegIcon sx={{ fontSize: '1rem', color: colors.tertiary }} />,
    title: 'Firma kaydı oluşturuldu',
    desc: 'Sisteme ilk kayıt tamamlandı ve onaya gönderildi.',
    date: new Date(company.createdAt),
  });

  if (company.description || company.phone || company.email || company.fullAddress) {
    items.push({
      icon: <EditIcon sx={{ fontSize: '1rem', color: colors.primary }} />,
      title: 'Firma bilgileri güncellendi',
      desc: 'İletişim ve profil bilgileri düzenlendi.',
      date: new Date(company.createdAt),
    });
  }

  if (company.logoUrl) {
    items.push({
      icon: <ImageIcon sx={{ fontSize: '1rem', color: colors.secondary }} />,
      title: 'Logo yüklendi',
      desc: 'Firma logosu sisteme eklendi.',
      date: new Date(company.createdAt),
    });
  }

  if (company.catalogFileUrl) {
    items.push({
      icon: <MenuBookIcon sx={{ fontSize: '1rem', color: colors.tertiary }} />,
      title: 'Ürün kataloğu yüklendi',
      desc: `${company.catalogFileType ?? 'Dosya'} formatında katalog eklendi.`,
      date: new Date(company.createdAt),
    });
  }

  materials.slice(0, 3).forEach((m) => {
    items.push({
      icon: <CategoryIcon2 sx={{ fontSize: '1rem', color: colors.primary }} />,
      title: `Malzeme eklendi: ${m.materialName}`,
      desc: `Rol: ${m.role === 'PRODUCER' ? 'Üretici' : m.role === 'SELLER' ? 'Satıcı' : 'Her İkisi'}${m.unit ? ` · ${m.unit}` : ''}`,
      date: new Date(m.createdAt),
    });
  });

  if (materials.length > 3) {
    items.push({
      icon: <CategoryIcon2 sx={{ fontSize: '1rem', color: colors.outline }} />,
      title: `+${materials.length - 3} malzeme daha eklendi`,
      desc: `Toplam ${materials.length} malzeme listeleniyor.`,
      date: new Date(materials[3].createdAt),
    });
  }

  const sorted = items.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 6);

  if (sorted.length === 0) {
    return (
      <Typography sx={{ fontSize: '0.875rem', color: colors.outline }}>Henüz aktivite yok.</Typography>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
      {sorted.map((item, i) => (
        <Box key={i} sx={{ display: 'flex', gap: 2.5 }}>
          <Box sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: colors.surfaceContainerHighest, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {item.icon}
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', color: colors.onSurface }}>{item.title}</Typography>
            <Typography sx={{ fontSize: '0.8rem', color: colors.outline, mt: 0.3 }}>{item.desc}</Typography>
            <Typography sx={{ fontSize: '0.75rem', color: `${colors.outline}80`, mt: 0.5 }}>{formatDate(item.date.toISOString())}</Typography>
          </Box>
        </Box>
      ))}
    </Box>
  );
}
