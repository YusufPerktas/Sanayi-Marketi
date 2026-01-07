"""
Global Configuration Settings
=============================
Proje genelinde kullanılan yapılandırma ayarları.
Environment değişkenleri .env dosyasından yüklenir.
"""

import os
from dotenv import load_dotenv

# .env dosyasını yükle
load_dotenv()

# =============================================================================
# SCRAPING AYARLARI
# =============================================================================

# HTTP istek zaman aşımı (saniye)
REQUEST_TIMEOUT = int(os.getenv('REQUEST_TIMEOUT', 10))

# Dosya indirme zaman aşımı (saniye)
DOWNLOAD_TIMEOUT = int(os.getenv('DOWNLOAD_TIMEOUT', 30))

# Başarısız isteklerde maksimum yeniden deneme sayısı
MAX_RETRIES = int(os.getenv('MAX_RETRIES', 3))

# Tarayıcı User-Agent bilgisi (bot tespitini önlemek için)
USER_AGENT = os.getenv(
    'USER_AGENT',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
    '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
)

# İstekler arası bekleme süresi (saniye) - rate limiting için
REQUEST_DELAY = float(os.getenv('REQUEST_DELAY', 1.0))

# =============================================================================
# SELENIUM AYARLARI
# =============================================================================

# Selenium kullanımını etkinleştir/devre dışı bırak
USE_SELENIUM = os.getenv('USE_SELENIUM', 'true').lower() == 'true'

# Sayfa yükleme zaman aşımı (saniye)
SELENIUM_PAGE_TIMEOUT = int(os.getenv('SELENIUM_PAGE_TIMEOUT', 15))

# Implicit wait süresi (saniye)
SELENIUM_IMPLICIT_WAIT = int(os.getenv('SELENIUM_IMPLICIT_WAIT', 5))

# JavaScript çalışması için bekleme süresi (saniye)
SELENIUM_JS_WAIT = float(os.getenv('SELENIUM_JS_WAIT', 2.0))

# Headless mod (tarayıcı penceresi gösterme)
SELENIUM_HEADLESS = os.getenv('SELENIUM_HEADLESS', 'true').lower() == 'true'

# =============================================================================
# DOSYA VE DİZİN AYARLARI
# =============================================================================

# Ana çıktı dizini
OUTPUT_DIR = 'output'

# Katalog dosyalarının indirileceği ana dizin
CATALOGS_DIR = os.path.join(OUTPUT_DIR, 'catalogs')

# Log dosyalarının tutulacağı dizin
LOGS_DIR = os.path.join(OUTPUT_DIR, 'logs')

# Excel rapor dosyası yolu (varsayılan - RunSession kullanılmadığında)
EXCEL_FILE = os.path.join(OUTPUT_DIR, 'company_data.xlsx')


# =============================================================================
# RUN SESSION - Her çalıştırma için tarih bazlı klasör yönetimi
# =============================================================================

class RunSession:
    """
    Her çalıştırma için benzersiz tarih-saat bazlı oturum yönetimi.

    Her çalıştırmada:
    - Kataloglar: output/catalogs/2026-01-07_18-30-00/FirmaAdı/
    - Excel: output/company_data_2026-01-07_18-30-00.xlsx

    Example:
        >>> session = RunSession()
        >>> print(session.catalogs_dir)
        'output/catalogs/2026-01-07_18-30-00'
        >>> print(session.excel_file)
        'output/company_data_2026-01-07_18-30-00.xlsx'
    """

    _instance = None

    def __init__(self, timestamp: str = None):
        """
        RunSession'ı başlatır.

        Args:
            timestamp: Özel timestamp (varsayılan: şu anki zaman)
        """
        from datetime import datetime

        if timestamp:
            self.timestamp = timestamp
        else:
            self.timestamp = datetime.now().strftime('%Y-%m-%d_%H-%M-%S')

        # Tarih bazlı katalog dizini
        self.catalogs_dir = os.path.join(CATALOGS_DIR, self.timestamp)

        # Tarih bazlı Excel dosyası
        self.excel_file = os.path.join(OUTPUT_DIR, f'company_data_{self.timestamp}.xlsx')

        # Dizinleri oluştur
        os.makedirs(self.catalogs_dir, exist_ok=True)
        os.makedirs(LOGS_DIR, exist_ok=True)

    @classmethod
    def get_instance(cls) -> 'RunSession':
        """Singleton instance döndürür."""
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    @classmethod
    def create_new(cls) -> 'RunSession':
        """Yeni bir session oluşturur (singleton'ı günceller)."""
        cls._instance = cls()
        return cls._instance

    def __str__(self) -> str:
        return f"RunSession({self.timestamp})"

# =============================================================================
# KATALOG AYARLARI
# =============================================================================

# Geçerli katalog dosya uzantıları
VALID_EXTENSIONS = ['.pdf', '.doc', '.docx', '.xls', '.xlsx']

# Katalog linklerini bulmak için kullanılan anahtar kelimeler
CATALOG_KEYWORDS = [
    'katalog', 'catalog', 'catalogue',
    'urun', 'ürün', 'product', 'products',
    'dokuman', 'doküman', 'document', 'documents',
    'brosur', 'broşür', 'brochure',
    'fiyat', 'price', 'liste', 'list',
    'download', 'indir', 'yukle', 'yükle'
]

# Katalog sayfalarını bulmak için URL anahtar kelimeleri
CATALOG_PAGE_KEYWORDS = [
    'katalog', 'catalog', 'catalogue',
    'download', 'indir', 'yukle',
    'dokuman', 'document', 'documents',
    'media', 'files', 'dosya'
]

# =============================================================================
# PDF FİLTRELEME AYARLARI
# =============================================================================

# İndirilecek PDF'ler için pozitif anahtar kelimeler
# SADECE kesin katalog/ürün göstergeleri
PDF_POSITIVE_KEYWORDS = [
    # Türkçe - Kesin katalog göstergeleri
    'katalog', 'katalogu', 'brosur', 'broşür', 'fiyat-listesi', 'fiyat_listesi',
    'urun-katalogu', 'ürün-katalogu', 'fiyat listesi',
    # İngilizce - Kesin katalog göstergeleri
    'catalog', 'catalogue', 'brochure', 'pricelist', 'price-list', 'price_list',
    'product-catalog', 'product_catalog'
]

# İndirilMEYECEK PDF'ler için negatif anahtar kelimeler
PDF_NEGATIVE_KEYWORDS = [
    # Türkçe gizlilik/yasal
    'gizlilik', 'kvkk', 'kisisel-veri', 'kişisel-veri', 'kisisel_veri',
    'sozlesme', 'sözleşme', 'kosul', 'koşul', 'sart', 'şart',
    'aydinlatma', 'aydınlatma', 'cerez', 'çerez', 'politika', 'politikasi',
    'kullanim-sartlari', 'kullanim-kosullari',
    # İngilizce gizlilik/yasal
    'privacy', 'policy', 'terms', 'conditions', 'legal', 'disclaimer',
    'cookie', 'gdpr', 'agreement', 'contract', 'compliance',
    'terms-of-service', 'terms-of-use', 'privacy-policy',
    # Kurumsal/Finansal dokümanlar
    'etik', 'davranis', 'davranış', 'finansal', 'faaliyet-rapor',
    'surdurulebilirlik', 'sürdürülebilirlik', 'sustainability',
    'annual-report', 'investor', 'yatirimci',
    'vizyon', 'misyon', 'degerler', 'değerler', 'kurumsal',
    # Sertifikalar ve Standartlar - Genişletilmiş
    'sertifika', 'certificate', 'certification', 'accreditation',
    'tse_en', 'tse-en', 'ts_en', 'ts-en',  # TSE/TS standartları
    'iso9001', 'iso14001', 'iso45001', 'iso50001', 'iso27001',
    'iso_9001', 'iso_14001', 'iso_45001', 'iso_50001', 'iso_27001',
    'iso-9001', 'iso-14001', 'iso-45001', 'iso-50001', 'iso-27001',
    'ohsas', 'ohsas_18001', 'ohsas-18001',
    'ts_13', 'ts-13', 'ts13', 'ts_14', 'ts-14', 'ts14',  # TS sertifikaları
    'onay', 'onayı', 'approval',
    'belgesi',  # Sertifika eki (belge tek başına çok geniş)
    # EPD ve Çevresel Beyanlar
    'epd', 'epd_', 'epd-', '_epd', '-epd',
    'fdes', 'fdes_', 'fdes-',
    'upec', 'wallpec', 'pec_',
    'environmental-product', 'environmental_product',
    # Performans beyanları
    'declaration', 'beyan', 'performans_beyan', 'performans-beyan',
    'dop', 'declaration-of-performance', 'declaration_of_performance',
    # Raporlar
    'rapor', 'report', 'annual', 'yillik', 'yıllık',
    # Sunumlar ve kurumsal
    'sunum', 'presentation', 'corporate', 'hakkimizda',
    'kariyer', 'career', 'insan-kaynaklari',
    # Teknik standartlar (katalog değil)
    'test-raporu', 'test_raporu', 'muayene', 'deneyi', 'deney',
    # Prosedürler ve Politikalar
    'prosedur', 'prosedür', 'procedure', 'prosedurel',
    'sikayet', 'şikayet', 'complaint',
    'mekanizma', 'mechanism',
    'matris', 'matrisi', 'matrix',
    'paydas', 'paydaş', 'stakeholder',
    'katilim', 'katılım', 'participation',
    'iletisim_matrisi', 'iletişim_matrisi',
    # Yerli Malı ve Yeterlilik Belgeleri
    'yerli_mali', 'yerli-mali', 'yerli_mal', 'yerli-mal',
    'yeterlilik', 'hizmet_yeterlilik',
    'interseroh',
    # Kılavuzlar (kullanım kılavuzu katalog değil)
    'kullanim-kilavuzu', 'kullanim_kilavuzu', 'kullanım-kılavuzu',
    'kilavuz', 'kılavuz', 'manual', 'instruction', 'talimat', 'talimati',
    'montaj', 'installation',  # Montaj kılavuzları katalog değil
    # Diğer alakasız
    'basin', 'basın', 'press', 'haber', 'duyuru', 'reach',
    'entegre_yonetim', 'entegre-yonetim', 'yonetim_sistemi', 'yönetim_sistemi'
]

# Minimum PDF dosya boyutu (bytes) - boş/placeholder PDF'leri filtreler
PDF_MIN_SIZE = int(os.getenv('PDF_MIN_SIZE', 10000))  # 10KB

# Maksimum PDF dosya boyutu (bytes) - çok büyük dosyaları engeller
PDF_MAX_SIZE = int(os.getenv('PDF_MAX_SIZE', 100000000))  # 100MB

# =============================================================================
# İLETİŞİM BİLGİSİ AYARLARI
# =============================================================================

# İletişim sayfalarını bulmak için kullanılan anahtar kelimeler
CONTACT_KEYWORDS = [
    'iletisim', 'iletişim', 'contact', 'contactus', 'contact-us',
    'hakkimizda', 'hakkımızda', 'about', 'aboutus', 'about-us',
    'kurumsal', 'corporate',
    'bize-ulasin', 'bizeulasin', 'ulasim', 'ulaşım'
]

# Telefon label'ları (Türkçe, İngilizce, Almanca, Fransızca)
PHONE_LABELS = [
    # Türkçe
    'tel', 'telefon', 'gsm', 'cep', 'mobil', 'sabit', 'santral',
    # İngilizce
    'phone', 'mobile', 'cell', 'call',
    # Almanca
    'handy',
    # Kısaltmalar
    't:', 'p:'
]

# Fax label'ları (hariç tutmak için)
FAX_LABELS = ['fax', 'faks', 'belgegecer', 'belgegeçer', 'f:']

# Email label'ları
EMAIL_LABELS = [
    'email', 'e-mail', 'e-posta', 'eposta', 'mail', 'iletisim',
    'contact', 'info', 'bilgi', 'm:'
]

# Adres label'ları
ADDRESS_LABELS = [
    # Türkçe
    'adres', 'merkez', 'fabrika', 'sube', 'şube', 'depo', 'ofis',
    'genel mudürlük', 'genel mudurluk',
    # İngilizce
    'address', 'location', 'headquarters', 'hq', 'office', 'branch',
    # Genel
    'konum', 'yer'
]

# Hariç tutulacak email domain'leri
EMAIL_EXCLUDE_DOMAINS = ['example.com', 'test.com', 'domain.com', 'email.com', 'yoursite.com']

# Hariç tutulacak email uzantıları (görsel dosyaları)
EMAIL_EXCLUDE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp']

# =============================================================================
# REGEX PATTERNLERİ
# =============================================================================

# Telefon numarası regex pattern'i (Türkiye formatı)
PHONE_PATTERN = r'(?:\+90|0)?[\s.-]?(?:\(?\d{3}\)?[\s.-]?)?\d{3}[\s.-]?\d{2}[\s.-]?\d{2}'

# E-posta regex pattern'i
EMAIL_PATTERN = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'

# =============================================================================
# EXCEL KOLON AYARLARI
# =============================================================================

# Excel dosyasındaki kolon sırası ve başlıkları
EXCEL_COLUMNS = [
    'company_name',
    'website',
    'sector',
    'phone',
    'email',
    'address',
    'catalog_count',
    'catalog_files',
    'status',
    'scrape_date'
]

# Kolon başlıklarının Türkçe karşılıkları
EXCEL_HEADERS = {
    'company_name': 'Firma Adı',
    'website': 'Web Sitesi',
    'sector': 'Sektör',
    'phone': 'Telefon',
    'email': 'E-posta',
    'address': 'Adres',
    'catalog_count': 'Katalog Sayısı',
    'catalog_files': 'Katalog Dosyaları',
    'status': 'Durum',
    'scrape_date': 'Tarih'
}

# =============================================================================
# STATUS TANIMLARI
# =============================================================================

STATUS_SUCCESS = 'SUCCESS'    # Katalog + iletişim bilgileri bulundu
STATUS_PARTIAL = 'PARTIAL'    # Sadece katalog bulundu, iletişim eksik
STATUS_FAILED = 'FAILED'      # Katalog bulunamadı (Excel'e yazılmaz)
STATUS_ERROR = 'ERROR'        # Hata oluştu (Excel'e yazılmaz)
