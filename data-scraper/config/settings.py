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

# Katalog dosyalarının indirileceği dizin
CATALOGS_DIR = os.path.join(OUTPUT_DIR, 'catalogs')

# Log dosyalarının tutulacağı dizin
LOGS_DIR = os.path.join(OUTPUT_DIR, 'logs')

# Excel rapor dosyası yolu
EXCEL_FILE = os.path.join(OUTPUT_DIR, 'company_data.xlsx')

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
PDF_POSITIVE_KEYWORDS = [
    # Türkçe
    'katalog', 'urun', 'ürün', 'fiyat', 'liste', 'brosur', 'broşür',
    'teknik', 'spesifikasyon', 'ozellik', 'özellik',
    # İngilizce
    'catalog', 'catalogue', 'product', 'price', 'pricelist', 'price-list',
    'brochure', 'datasheet', 'data-sheet', 'specification', 'spec',
    # Genel
    'model', 'seri', 'series'
]

# İndirilMEYECEK PDF'ler için negatif anahtar kelimeler
PDF_NEGATIVE_KEYWORDS = [
    # Türkçe gizlilik/yasal
    'gizlilik', 'kvkk', 'kisisel-veri', 'kişisel-veri', 'kisisel_veri',
    'sozlesme', 'sözleşme', 'kosul', 'koşul', 'sart', 'şart',
    'aydinlatma', 'aydınlatma', 'cerez', 'çerez', 'politika',
    'kullanim-sartlari', 'kullanim-kosullari',
    # İngilizce gizlilik/yasal
    'privacy', 'policy', 'terms', 'conditions', 'legal', 'disclaimer',
    'cookie', 'gdpr', 'agreement', 'contract', 'compliance',
    'terms-of-service', 'terms-of-use', 'privacy-policy',
    # URL path pattern'leri
    '/legal/', '/privacy/', '/terms/', '/policy/', '/gdpr/',
    '/kvkk/', '/gizlilik/', '/sozlesme/', '/yasal/'
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
