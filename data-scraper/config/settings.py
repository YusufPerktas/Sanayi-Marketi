"""Proje yapılandırma ayarları."""

import os
from dotenv import load_dotenv

load_dotenv()

# SCRAPING
REQUEST_TIMEOUT = int(os.getenv('REQUEST_TIMEOUT', 10))
DOWNLOAD_TIMEOUT = int(os.getenv('DOWNLOAD_TIMEOUT', 30))
MAX_RETRIES = int(os.getenv('MAX_RETRIES', 1))
USER_AGENT = os.getenv(
    'USER_AGENT',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
    '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
)
REQUEST_DELAY = float(os.getenv('REQUEST_DELAY', 1.0))

# SELENIUM
USE_SELENIUM = os.getenv('USE_SELENIUM', 'true').lower() == 'true'
SELENIUM_PAGE_TIMEOUT = int(os.getenv('SELENIUM_PAGE_TIMEOUT', 15))
SELENIUM_IMPLICIT_WAIT = int(os.getenv('SELENIUM_IMPLICIT_WAIT', 5))
SELENIUM_JS_WAIT = float(os.getenv('SELENIUM_JS_WAIT', 2.0))
SELENIUM_HEADLESS = os.getenv('SELENIUM_HEADLESS', 'true').lower() == 'true'

# DİZİNLER
OUTPUT_DIR = r'D:\Sanayi Marketi Output'
CATALOGS_DIR = os.path.join(OUTPUT_DIR, 'catalogs')
LOGS_DIR = os.path.join(OUTPUT_DIR, 'logs')
TESTS_DIR = os.path.join(OUTPUT_DIR, 'tests')
EXCEL_FILE = os.path.join(OUTPUT_DIR, 'company_data.xlsx')

# JS-HEAVY DOMAINS (requests yetersiz kalıyor, direkt Selenium kullan)
# Test sırasında yeni JS-heavy site tespit edilince buraya ekle
JS_HEAVY_DOMAINS = [
    'oyakmadenmetalurji.com.tr',
    'tosyalidemircelik.com.tr',
    'kardemir.com',
    'assan.com',
    'assanaluminyum.com',
]


class RunSession:
    """Tarih bazlı oturum yönetimi."""
    _instance = None

    def __init__(self, timestamp: str = None):
        from datetime import datetime
        self.timestamp = timestamp or datetime.now().strftime('%Y-%m-%d_%H-%M-%S')
        self.catalogs_dir = os.path.join(CATALOGS_DIR, self.timestamp)
        self.excel_file = os.path.join(OUTPUT_DIR, f'company_data_{self.timestamp}.xlsx')
        os.makedirs(self.catalogs_dir, exist_ok=True)
        os.makedirs(LOGS_DIR, exist_ok=True)

    @classmethod
    def get_instance(cls) -> 'RunSession':
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    @classmethod
    def create_new(cls) -> 'RunSession':
        cls._instance = cls()
        return cls._instance

    def __str__(self) -> str:
        return f"RunSession({self.timestamp})"


# KATALOG AYARLARI
VALID_EXTENSIONS = ['.pdf', '.doc', '.docx', '.xls', '.xlsx']

CATALOG_KEYWORDS = [
    'katalog', 'catalog', 'catalogue', 'urun', 'ürün', 'product', 'products',
    'dokuman', 'doküman', 'document', 'documents', 'brosur', 'broşür', 'brochure',
    'fiyat', 'price', 'liste', 'list', 'download', 'indir', 'yukle', 'yükle'
]

CATALOG_PAGE_KEYWORDS = [
    'katalog', 'catalog', 'catalogue', 'download', 'indir', 'yukle',
    'dokuman', 'document', 'documents', 'media', 'files', 'dosya',
    'teknik', 'technical', 'tds', 'datasheet', 'data-sheet', 'veri',
    'literatur', 'literature', 'kaynaklar', 'resources'
]

# PDF FİLTRELEME
PDF_POSITIVE_KEYWORDS = [
    'katalog', 'katalogu', 'brosur', 'broşür', 'fiyat-listesi', 'fiyat_listesi',
    'urun-katalogu', 'ürün-katalogu', 'fiyat listesi', 'catalog', 'catalogue',
    'brochure', 'pricelist', 'price-list', 'price_list', 'product-catalog', 'product_catalog'
]

PDF_NEGATIVE_KEYWORDS = [
    'gizlilik', 'kvkk', 'kisisel-veri', 'kişisel-veri', 'kisisel_veri',
    'sozlesme', 'sözleşme', 'kosul', 'koşul', 'sart', 'şart',
    'aydinlatma', 'aydınlatma', 'cerez', 'çerez', 'politika', 'politikasi',
    'kullanim-sartlari', 'kullanim-kosullari',
    'privacy', 'policy', 'terms', 'conditions', 'legal', 'disclaimer',
    'cookie', 'gdpr', 'agreement', 'contract', 'compliance',
    'terms-of-service', 'terms-of-use', 'privacy-policy',
    'etik', 'davranis', 'davranış', 'finansal', 'faaliyet-rapor',
    'surdurulebilirlik', 'sürdürülebilirlik', 'sustainability',
    'annual-report', 'investor', 'yatirimci',
    'vizyon', 'misyon', 'degerler', 'değerler',
    'sertifika', 'certificate', 'certification', 'accreditation',
    'tse_en', 'tse-en', 'ts_en', 'ts-en',
    'iso9001', 'iso14001', 'iso45001', 'iso50001', 'iso27001',
    'iso_9001', 'iso_14001', 'iso_45001', 'iso_50001', 'iso_27001',
    'iso-9001', 'iso-14001', 'iso-45001', 'iso-50001', 'iso-27001',
    'ohsas', 'ohsas_18001', 'ohsas-18001',
    'ts_13', 'ts-13', 'ts13', 'ts_14', 'ts-14', 'ts14',
    'onay', 'onayı', 'approval', 'belgesi',
    'epd', 'epd_', 'epd-', '_epd', '-epd', 'fdes', 'fdes_', 'fdes-',
    'upec', 'wallpec', 'pec_', 'environmental-product', 'environmental_product',
    'declaration', 'beyan', 'performans_beyan', 'performans-beyan',
    'dop', 'declaration-of-performance', 'declaration_of_performance',
    'rapor', 'report', 'annual', 'yillik', 'yıllık',
    'sunum', 'presentation', 'corporate', 'hakkimizda',
    'kariyer', 'career', 'insan-kaynaklari',
    'test-raporu', 'test_raporu', 'muayene', 'deneyi', 'deney',
    'prosedur', 'prosedür', 'procedure', 'prosedurel',
    'sikayet', 'şikayet', 'complaint', 'mekanizma', 'mechanism',
    'matris', 'matrisi', 'matrix', 'paydas', 'paydaş', 'stakeholder',
    'katilim', 'katılım', 'participation', 'iletisim_matrisi', 'iletişim_matrisi',
    'yerli_mali', 'yerli-mali', 'yerli_mal', 'yerli-mal',
    'yeterlilik', 'hizmet_yeterlilik', 'interseroh',
    'kullanim-kilavuzu', 'kullanim_kilavuzu', 'kullanım-kılavuzu',
    'kilavuz', 'kılavuz', 'manual', 'instruction', 'talimat', 'talimati',
    'montaj', 'installation',
    'basin', 'basın', 'press', 'haber', 'duyuru', 'reach',
    'entegre_yonetim', 'entegre-yonetim', 'yonetim_sistemi', 'yönetim_sistemi',
    'genel_kurul', 'genel-kurul', 'genel_kurulun', 'toplanti_tutanak',
    'vekaleten', 'oy-kullanma', 'oy_kullanma', 'vekalet',
    'yonetim-kurulu', 'yonetim_kurulu', 'yonetici',
    'ozgecmis', 'özgeçmiş', 'ozgecmisler', 'özgeçmişler',
    'ic_yonerge', 'ic-yonerge', 'yonerge', 'yönerge',
    'bagimsizlik', 'bağımsızlık', 'bagimsiz', 'bağımsız',
    'esas_sozlesme', 'esas-sozlesme', 'esas_sözleşme',
    'cevre-ve-iklim', 'cevre_ve_iklim', 'cevre-iklim', 'iklim',
    'enerji_yonetimi', 'enerji-yonetimi', 'enerji_yonetim',
    'karbon', 'carbon', 'emisyon', 'emission',
    'msds', 'sds',
    'guvenlik-bilgi', 'guvenlik_bilgi',
    'basvuru-formu', 'basvuru_formu',
    'teklif-formu', 'teklif_formu',
    'ihale-sartnamesi', 'ihale_sartnamesi',
    # Firma-spesifik alakasız dökümanlar (test verisiyle tespit edildi)
    'kredikart', 'kredi-kart', 'kredi_kart',  # kredi kartı bilgilendirme formu
    'internet_sitesi',                          # web sitesi teknik rehber belgesi
]

PDF_MIN_SIZE = int(os.getenv('PDF_MIN_SIZE', 10000))
PDF_MAX_SIZE = int(os.getenv('PDF_MAX_SIZE', 100000000))

# SERTİFİKA KURULUŞU DOSYA ADI FİLTRELERİ
# should_download_url() içinde from_catalog_page'den önce kontrol edilir —
# katalog sayfasından gelen PDF olsa bile sertifika belgelerini bloklar.

# Dosya adının BAŞINDA bu prefix'ler varsa sertifika belgesidir
CERT_BODY_FILENAME_PREFIXES = [
    'dvgw_', 'dvgw-',                        # Alman gaz/su standardı (DVGW)
    'bureau_veritas', 'bureau-veritas',        # Bureau Veritas sertifikası
    'dnv-gl', 'dnv_gl', 'dnvgl',              # DNV-GL denizcilik sertifikası
    'aenor_', 'aenor-',                        # İspanya AENOR standardı
    'iep_atex', 'iep-atex',                    # IEP ATEX patlama koruması sertifikası
    'kiwatr',                                   # KIWA Hollanda sertifikası
    'tuv-',                                     # TÜV sertifika belgesi
    'vds_', 'vds-',                             # VDS Alman yangın koruması sertifikası
    'asme_u',                                   # ASME U/U2 Damgası (basınçlı kap sertifikası)
    'bsi_en_', 'bsi_igem', 'bsi-6',            # BSI İngiliz standardı sertifikaları
    'aga_stainless',                            # AGA Amerikan gaz sertifikası
    'csa-6',                                    # CSA Kanada standardı sertifikası
    'ul_vibration', 'ul_flexible', 'ul_hose',  # UL Amerikan sertifikaları
]

# Dosya adında HERHANGİ bir yerde bu pattern'lar varsa sertifika belgesidir
CERT_FILENAME_PATTERNS = [
    'bpv-certs', 'bpv_certs',                 # BPV sertifika dosyası
    '-certs-', '_certs_', '-certs.',           # Genel sertifika adlandırma pattern'i
]

# İLETİŞİM
CONTACT_KEYWORDS = [
    'iletisim', 'iletişim', 'contact', 'contactus', 'contact-us',
    'hakkimizda', 'hakkımızda', 'about', 'aboutus', 'about-us',
    'kurumsal', 'corporate', 'bize-ulasin', 'bizeulasin', 'ulasim', 'ulaşım'
]

PHONE_LABELS = [
    'tel', 'telefon', 'gsm', 'cep', 'mobil', 'sabit', 'santral',
    'phone', 'mobile', 'cell', 'call', 'handy', 't:', 'p:'
]

FAX_LABELS = ['fax', 'faks', 'belgegecer', 'belgegeçer', 'f:']

EMAIL_LABELS = [
    'email', 'e-mail', 'e-posta', 'eposta', 'mail', 'iletisim',
    'contact', 'info', 'bilgi', 'm:'
]

ADDRESS_LABELS = [
    'adres', 'merkez', 'fabrika', 'sube', 'şube', 'depo', 'ofis',
    'genel mudürlük', 'genel mudurluk', 'address', 'location',
    'headquarters', 'hq', 'office', 'branch', 'konum', 'yer'
]

EMAIL_EXCLUDE_DOMAINS = ['example.com', 'test.com', 'domain.com', 'email.com', 'yoursite.com']
EMAIL_EXCLUDE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp']

# REGEX
PHONE_PATTERN = r'(?:(?:\+90|0090|90|0)[\s\.\-\/]?)?(?:\(?\d{3}\)?[\s\.\-\/]?)\d{3}[\s\.\-\/]?\d{2}[\s\.\-\/]?\d{2}'

PHONE_PATTERNS = [
    r'(?:\+90|0090)[\s\.\-]?\(?\d{3}\)?[\s\.\-]?\d{3}[\s\.\-]?\d{2}[\s\.\-]?\d{2}',
    r'\b0\d{3}[\s\.\-]?\d{3}[\s\.\-]?\d{2}[\s\.\-]?\d{2}\b',
    r'\(0\d{3}\)[\s\.\-]?\d{3}[\s\.\-]?\d{2}[\s\.\-]?\d{2}',
    r'\b\d{3}[\s\.\-]\d{3}[\s\.\-]\d{2}[\s\.\-]\d{2}\b',
    r'\(0\d{3}\)[\s\.\-]?\d{3}[\s\.\-]?\d{2}[\s\.\-]?\d{2}[\s\.\-]?\d{0,4}',
    r'(?:\+90|0090)[\s\.\-]?\d{3}[\s\.\-]?\d{3}[\s\.\-]?\d{4}',
    r'\b0[1-5]\d{9}\b',
]

EMAIL_PATTERN = r'[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}'

INVALID_PHONE_STARTS = [
    '0000', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999',
    '1234', '0123', '9876', '0900', '0800',
]

VALID_AREA_CODES = [
    '212', '216', '312', '232', '224', '242', '322', '342', '262', '324',
    '352', '222', '258', '236', '264', '362', '462', '412', '414', '422',
    '442', '274', '252', '284', '266', '372', '332', '226', '288', '286',
    '256', '246', '248',
    '530', '531', '532', '533', '534', '535', '536', '537', '538', '539',
    '540', '541', '542', '543', '544', '545', '546', '547', '548', '549',
    '550', '551', '552', '553', '554', '555', '556', '557', '558', '559',
    '501', '505', '506', '507',
]

# EXCEL
EXCEL_COLUMNS = [
    'company_name', 'website', 'sectors', 'phone', 'email',
    'address', 'catalog_count', 'catalog_files', 'status', 'scrape_date'
]

EXCEL_HEADERS = {
    'company_name': 'Firma Adı', 'website': 'Web Sitesi', 'sectors': 'Sektörler',
    'phone': 'Telefon', 'email': 'E-posta', 'address': 'Adres',
    'catalog_count': 'Katalog Sayısı', 'catalog_files': 'Katalog Dosyaları',
    'status': 'Durum', 'scrape_date': 'Tarih'
}

# STATUS
STATUS_SUCCESS = 'SUCCESS'
STATUS_PARTIAL = 'PARTIAL'
STATUS_FAILED = 'FAILED'
STATUS_ERROR = 'ERROR'

# TÜRKİYE 81 İL LİSTESİ (canonical yazım — şehir/ilçe tespitinde kullanılır)
TURKISH_CITIES = [
    'Adana', 'Adıyaman', 'Afyonkarahisar', 'Ağrı', 'Amasya', 'Ankara', 'Antalya',
    'Artvin', 'Aydın', 'Balıkesir', 'Bilecik', 'Bingöl', 'Bitlis', 'Bolu',
    'Burdur', 'Bursa', 'Çanakkale', 'Çankırı', 'Çorum', 'Denizli', 'Diyarbakır',
    'Edirne', 'Elazığ', 'Erzincan', 'Erzurum', 'Eskişehir', 'Gaziantep', 'Giresun',
    'Gümüşhane', 'Hakkari', 'Hatay', 'Isparta', 'Mersin', 'İstanbul', 'İzmir',
    'Kars', 'Kastamonu', 'Kayseri', 'Kırklareli', 'Kırşehir', 'Kocaeli', 'Konya',
    'Kütahya', 'Malatya', 'Manisa', 'Kahramanmaraş', 'Mardin', 'Muğla', 'Muş',
    'Nevşehir', 'Niğde', 'Ordu', 'Rize', 'Sakarya', 'Samsun', 'Siirt', 'Sinop',
    'Sivas', 'Tekirdağ', 'Tokat', 'Trabzon', 'Tunceli', 'Şanlıurfa', 'Uşak',
    'Van', 'Yozgat', 'Zonguldak', 'Aksaray', 'Bayburt', 'Karaman', 'Kırıkkale',
    'Batman', 'Şırnak', 'Bartın', 'Ardahan', 'Iğdır', 'Yalova', 'Karabük',
    'Kilis', 'Osmaniye', 'Düzce',
]
