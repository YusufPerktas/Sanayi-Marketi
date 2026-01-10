"""
Catalog Scraping Strategies
============================
Farklı katalog çekme stratejileri.

Her strateji farklı bir yaklaşım kullanır:
1. Default: Standart requests + Selenium
2. Alternative Headers: Farklı User-Agent ve headers
3. Google Cache: Google'ın cache'inden çekme
4. Stealth Mode: Anti-detection Selenium
5. Deep Scan: Agresif link tarama
"""

import re
import time
import random
import requests
from abc import ABC, abstractmethod
from typing import List, Optional, Dict, Set, Tuple
from urllib.parse import urljoin, urlparse, quote

from bs4 import BeautifulSoup

try:
    from selenium import webdriver
    from selenium.webdriver.chrome.options import Options as ChromeOptions
    from selenium.webdriver.common.by import By
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC
    from selenium.common.exceptions import TimeoutException, WebDriverException
    SELENIUM_AVAILABLE = True
except ImportError:
    SELENIUM_AVAILABLE = False

from utils.logger import get_logger

logger = get_logger(__name__)

# =============================================================================
# USER AGENT HAVUZU
# =============================================================================

USER_AGENTS = [
    # Chrome Windows
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    # Chrome Mac
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    # Firefox Windows
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    # Firefox Mac
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0',
    # Edge
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
    # Safari
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
]

# =============================================================================
# BASE STRATEGY
# =============================================================================

class CatalogStrategy(ABC):
    """Katalog çekme stratejisi base class."""

    name: str = "base"
    description: str = "Base strategy"

    def __init__(self, timeout: int = 15, delay: float = 1.0):
        self.timeout = timeout
        self.delay = delay
        self.session = requests.Session()

    @abstractmethod
    def fetch_page(self, url: str) -> Optional[BeautifulSoup]:
        """Sayfayı çeker."""
        pass

    @abstractmethod
    def find_catalog_links(self, soup: BeautifulSoup, base_url: str) -> List[str]:
        """Katalog linklerini bulur."""
        pass

    def execute(self, website: str) -> Tuple[List[str], Optional[BeautifulSoup]]:
        """
        Stratejiyi çalıştırır.

        Returns:
            Tuple[List[str], BeautifulSoup]: (katalog_linkleri, ana_sayfa_soup)
        """
        logger.debug(f"[{self.name}] Strateji başlatılıyor: {website}")

        # Ana sayfayı çek
        soup = self.fetch_page(website)
        if not soup:
            logger.debug(f"[{self.name}] Ana sayfa çekilemedi")
            return [], None

        # Base URL'yi al
        parsed = urlparse(website)
        base_url = f"{parsed.scheme}://{parsed.netloc}"

        # Katalog linklerini bul
        catalogs = self.find_catalog_links(soup, base_url)

        logger.debug(f"[{self.name}] {len(catalogs)} katalog bulundu")
        return catalogs, soup

    def close(self):
        """Kaynakları temizle."""
        if hasattr(self, 'session'):
            self.session.close()


# =============================================================================
# STRATEGY 1: DEFAULT (Mevcut sistem)
# =============================================================================

class DefaultStrategy(CatalogStrategy):
    """Varsayılan strateji - mevcut requests yaklaşımı."""

    name = "default"
    description = "Standart HTTP requests ile çekme"

    def __init__(self, timeout: int = 15, delay: float = 1.0):
        super().__init__(timeout, delay)
        self.session.headers.update({
            'User-Agent': USER_AGENTS[0],
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
        })

    def fetch_page(self, url: str) -> Optional[BeautifulSoup]:
        try:
            time.sleep(self.delay)
            response = self.session.get(url, timeout=self.timeout, allow_redirects=True)
            response.raise_for_status()
            response.encoding = response.apparent_encoding or 'utf-8'
            return BeautifulSoup(response.text, 'lxml')
        except Exception as e:
            logger.debug(f"[{self.name}] Fetch hatası: {e}")
            return None

    def find_catalog_links(self, soup: BeautifulSoup, base_url: str) -> List[str]:
        """Basit katalog link araması."""
        from config.settings import VALID_EXTENSIONS

        catalogs = []
        for link in soup.find_all('a', href=True):
            href = link['href'].lower()
            if any(href.endswith(ext) for ext in VALID_EXTENSIONS):
                full_url = urljoin(base_url, link['href'])
                if full_url not in catalogs:
                    catalogs.append(full_url)

        return catalogs


# =============================================================================
# STRATEGY 2: ALTERNATIVE HEADERS
# =============================================================================

class AlternativeHeadersStrategy(CatalogStrategy):
    """Farklı User-Agent ve headers ile deneme."""

    name = "alt_headers"
    description = "Alternatif HTTP headers ile çekme"

    def __init__(self, timeout: int = 15, delay: float = 1.5):
        super().__init__(timeout, delay)

        # Rastgele User-Agent seç
        self.user_agent = random.choice(USER_AGENTS[1:])  # İlkini atla (default'ta kullanılıyor)

        self.session.headers.update({
            'User-Agent': self.user_agent,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9,tr;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Cache-Control': 'max-age=0',
            'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
            'Sec-Ch-Ua-Mobile': '?0',
            'Sec-Ch-Ua-Platform': '"Windows"',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Upgrade-Insecure-Requests': '1',
        })

    def fetch_page(self, url: str) -> Optional[BeautifulSoup]:
        try:
            time.sleep(self.delay)

            # Referer ekle (ana domain)
            parsed = urlparse(url)
            referer = f"{parsed.scheme}://{parsed.netloc}/"

            response = self.session.get(
                url,
                timeout=self.timeout,
                allow_redirects=True,
                headers={'Referer': referer}
            )
            response.raise_for_status()
            response.encoding = response.apparent_encoding or 'utf-8'
            return BeautifulSoup(response.text, 'lxml')
        except Exception as e:
            logger.debug(f"[{self.name}] Fetch hatası: {e}")
            return None

    def find_catalog_links(self, soup: BeautifulSoup, base_url: str) -> List[str]:
        """Genişletilmiş katalog araması."""
        from config.settings import VALID_EXTENSIONS, CATALOG_KEYWORDS

        catalogs = []

        # 1. Doğrudan dosya linkleri
        for link in soup.find_all('a', href=True):
            href = link['href']
            href_lower = href.lower()
            link_text = link.get_text().lower()

            # Dosya uzantısı kontrolü
            if any(href_lower.endswith(ext) for ext in VALID_EXTENSIONS):
                full_url = urljoin(base_url, href)
                if full_url not in catalogs:
                    catalogs.append(full_url)

            # Keyword kontrolü (dosya uzantısı olmasa bile)
            elif any(kw in href_lower or kw in link_text for kw in CATALOG_KEYWORDS):
                if any(ext in href_lower for ext in ['.pdf', '.doc', '.xls']):
                    full_url = urljoin(base_url, href)
                    if full_url not in catalogs:
                        catalogs.append(full_url)

        # 2. data-* attribute'ları
        for elem in soup.find_all(attrs={'data-href': True}):
            href = elem.get('data-href', '')
            if any(href.lower().endswith(ext) for ext in VALID_EXTENSIONS):
                full_url = urljoin(base_url, href)
                if full_url not in catalogs:
                    catalogs.append(full_url)

        return catalogs


# =============================================================================
# STRATEGY 3: GOOGLE CACHE
# =============================================================================

class GoogleCacheStrategy(CatalogStrategy):
    """Google Cache üzerinden sayfa çekme."""

    name = "google_cache"
    description = "Google Cache üzerinden çekme"

    def __init__(self, timeout: int = 20, delay: float = 2.0):
        super().__init__(timeout, delay)
        self.session.headers.update({
            'User-Agent': random.choice(USER_AGENTS),
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
        })
        self._original_url = None

    def fetch_page(self, url: str) -> Optional[BeautifulSoup]:
        """Google Cache'den sayfayı çek."""
        self._original_url = url

        # Google Cache URL'si oluştur
        cache_url = f"https://webcache.googleusercontent.com/search?q=cache:{quote(url)}"

        try:
            time.sleep(self.delay)

            response = self.session.get(
                cache_url,
                timeout=self.timeout,
                allow_redirects=True
            )

            if response.status_code == 200:
                response.encoding = response.apparent_encoding or 'utf-8'
                soup = BeautifulSoup(response.text, 'lxml')

                # Google cache wrapper'ını atla, gerçek içeriği al
                # Google bazen içeriği bir div içine koyar
                content = soup.find('div', {'id': 'content'}) or soup

                logger.debug(f"[{self.name}] Google Cache'den çekildi: {url}")
                return content
            else:
                logger.debug(f"[{self.name}] Google Cache bulunamadı: {url}")
                return None

        except Exception as e:
            logger.debug(f"[{self.name}] Google Cache hatası: {e}")
            return None

    def find_catalog_links(self, soup: BeautifulSoup, base_url: str) -> List[str]:
        """Cache'den katalog linklerini çıkar."""
        from config.settings import VALID_EXTENSIONS

        # Orijinal URL'den base_url'i al
        if self._original_url:
            parsed = urlparse(self._original_url)
            base_url = f"{parsed.scheme}://{parsed.netloc}"

        catalogs = []
        for link in soup.find_all('a', href=True):
            href = link['href']
            href_lower = href.lower()

            # Google yönlendirme linklerini temizle
            if 'webcache.googleusercontent.com' in href:
                continue
            if href.startswith('/search?'):
                continue

            if any(href_lower.endswith(ext) for ext in VALID_EXTENSIONS):
                # Relative URL'leri düzelt
                if href.startswith('/'):
                    full_url = urljoin(base_url, href)
                elif href.startswith('http'):
                    full_url = href
                else:
                    full_url = urljoin(base_url, href)

                if full_url not in catalogs:
                    catalogs.append(full_url)

        return catalogs


# =============================================================================
# STRATEGY 4: STEALTH SELENIUM
# =============================================================================

class StealthSeleniumStrategy(CatalogStrategy):
    """Anti-detection önlemleriyle Selenium."""

    name = "stealth_selenium"
    description = "Stealth mode Selenium ile çekme"

    def __init__(self, timeout: int = 20, delay: float = 2.0):
        super().__init__(timeout, delay)
        self._driver = None

    def _init_stealth_driver(self):
        """Stealth mode Chrome driver başlat."""
        if not SELENIUM_AVAILABLE:
            return None

        try:
            options = ChromeOptions()

            # Headless mode
            options.add_argument('--headless=new')

            # Anti-detection ayarları
            options.add_argument('--no-sandbox')
            options.add_argument('--disable-dev-shm-usage')
            options.add_argument('--disable-blink-features=AutomationControlled')
            options.add_argument('--disable-infobars')
            options.add_argument('--disable-extensions')
            options.add_argument('--disable-gpu')
            options.add_argument('--window-size=1920,1080')
            options.add_argument(f'--user-agent={random.choice(USER_AGENTS)}')

            # Ek stealth ayarları
            options.add_experimental_option('excludeSwitches', ['enable-automation'])
            options.add_experimental_option('useAutomationExtension', False)

            # Log seviyesi
            options.add_argument('--log-level=3')

            driver = webdriver.Chrome(options=options)

            # Navigator.webdriver'ı gizle
            driver.execute_cdp_cmd('Page.addScriptToEvaluateOnNewDocument', {
                'source': '''
                    Object.defineProperty(navigator, 'webdriver', {
                        get: () => undefined
                    });
                    Object.defineProperty(navigator, 'plugins', {
                        get: () => [1, 2, 3, 4, 5]
                    });
                    Object.defineProperty(navigator, 'languages', {
                        get: () => ['tr-TR', 'tr', 'en-US', 'en']
                    });
                '''
            })

            driver.set_page_load_timeout(self.timeout)

            return driver

        except Exception as e:
            logger.debug(f"[{self.name}] Stealth driver başlatılamadı: {e}")
            return None

    def fetch_page(self, url: str) -> Optional[BeautifulSoup]:
        if self._driver is None:
            self._driver = self._init_stealth_driver()

        if self._driver is None:
            return None

        try:
            time.sleep(self.delay)

            self._driver.get(url)

            # Sayfanın yüklenmesini bekle
            time.sleep(3)

            # Scroll yap (lazy loading için)
            self._driver.execute_script("window.scrollTo(0, document.body.scrollHeight/2);")
            time.sleep(1)
            self._driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
            time.sleep(1)

            page_source = self._driver.page_source
            return BeautifulSoup(page_source, 'lxml')

        except Exception as e:
            logger.debug(f"[{self.name}] Selenium hatası: {e}")
            return None

    def find_catalog_links(self, soup: BeautifulSoup, base_url: str) -> List[str]:
        """JavaScript ile yüklenen katalogları da bul."""
        from config.settings import VALID_EXTENSIONS

        catalogs = []

        # 1. Standart linkler
        for link in soup.find_all('a', href=True):
            href = link['href']
            if any(href.lower().endswith(ext) for ext in VALID_EXTENSIONS):
                full_url = urljoin(base_url, href)
                if full_url not in catalogs:
                    catalogs.append(full_url)

        # 2. data-* attributes
        for attr in ['data-href', 'data-url', 'data-file', 'data-pdf', 'data-src']:
            for elem in soup.find_all(attrs={attr: True}):
                href = elem.get(attr, '')
                if any(href.lower().endswith(ext) for ext in VALID_EXTENSIONS):
                    full_url = urljoin(base_url, href)
                    if full_url not in catalogs:
                        catalogs.append(full_url)

        # 3. onclick handlers
        for elem in soup.find_all(attrs={'onclick': True}):
            onclick = elem.get('onclick', '')
            urls = re.findall(r'["\']([^"\']*\.pdf)["\']', onclick, re.IGNORECASE)
            for url in urls:
                full_url = urljoin(base_url, url)
                if full_url not in catalogs:
                    catalogs.append(full_url)

        # 4. Embedded objects
        for tag in ['embed', 'object', 'iframe']:
            for elem in soup.find_all(tag):
                src = elem.get('src') or elem.get('data')
                if src and any(src.lower().endswith(ext) for ext in VALID_EXTENSIONS):
                    full_url = urljoin(base_url, src)
                    if full_url not in catalogs:
                        catalogs.append(full_url)

        return catalogs

    def close(self):
        super().close()
        if self._driver:
            try:
                self._driver.quit()
            except:
                pass
            self._driver = None


# =============================================================================
# STRATEGY 5: DEEP SCAN
# =============================================================================

class DeepScanStrategy(CatalogStrategy):
    """Daha agresif ve derin tarama stratejisi - Selenium destekli."""

    name = "deep_scan"
    description = "Agresif derin tarama (Selenium + requests)"

    def __init__(self, timeout: int = 15, delay: float = 0.5, max_pages: int = 30):
        super().__init__(timeout, delay)
        self.max_pages = max_pages
        self.visited_urls: Set[str] = set()
        self._driver = None

        self.session.headers.update({
            'User-Agent': random.choice(USER_AGENTS),
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'tr-TR,tr;q=0.9,en;q=0.8',
        })

    def _init_selenium_driver(self):
        """Selenium driver başlat."""
        if not SELENIUM_AVAILABLE:
            return None

        try:
            options = ChromeOptions()
            options.add_argument('--headless=new')
            options.add_argument('--no-sandbox')
            options.add_argument('--disable-dev-shm-usage')
            options.add_argument('--disable-gpu')
            options.add_argument('--window-size=1920,1080')
            options.add_argument(f'--user-agent={random.choice(USER_AGENTS)}')
            options.add_argument('--log-level=3')

            driver = webdriver.Chrome(options=options)
            driver.set_page_load_timeout(self.timeout)
            return driver
        except Exception as e:
            logger.debug(f"[{self.name}] Selenium başlatılamadı: {e}")
            return None

    def fetch_page(self, url: str) -> Optional[BeautifulSoup]:
        """Önce requests, yetersizse Selenium ile sayfa çek."""
        if url in self.visited_urls:
            return None

        self.visited_urls.add(url)

        # 1. Önce requests ile dene (hızlı)
        try:
            time.sleep(self.delay)
            response = self.session.get(url, timeout=self.timeout, allow_redirects=True)
            response.raise_for_status()
            response.encoding = response.apparent_encoding or 'utf-8'
            soup = BeautifulSoup(response.text, 'lxml')

            # İçerik yeterliyse döndür
            if len(soup.get_text()) > 500:
                return soup

        except Exception as e:
            logger.debug(f"[{self.name}] Requests hatası ({url}): {e}")

        # 2. İçerik yetersiz veya hata - Selenium ile dene
        if self._driver is None:
            self._driver = self._init_selenium_driver()

        if self._driver is None:
            return None

        try:
            self._driver.get(url)
            time.sleep(1.5)  # JS yüklenmesi için bekle
            return BeautifulSoup(self._driver.page_source, 'lxml')
        except Exception as e:
            logger.debug(f"[{self.name}] Selenium hatası ({url}): {e}")
            return None

    def close(self):
        """Kaynakları temizle."""
        super().close()
        if self._driver:
            try:
                self._driver.quit()
            except:
                pass
            self._driver = None

    def find_catalog_links(self, soup: BeautifulSoup, base_url: str) -> List[str]:
        """Derinlemesine katalog taraması."""
        from config.settings import VALID_EXTENSIONS, CATALOG_PAGE_KEYWORDS

        all_catalogs: Set[str] = set()
        pages_to_scan: List[str] = []

        # Ana sayfadan katalogları topla
        main_catalogs = self._extract_catalogs_from_soup(soup, base_url)
        all_catalogs.update(main_catalogs)

        # Potansiyel katalog sayfalarını bul
        catalog_page_patterns = [
            r'/katalog', r'/catalog', r'/catalogue',
            r'/download', r'/indir', r'/yukle',
            r'/dokuman', r'/document', r'/docs',
            r'/pdf', r'/media', r'/files',
            r'/brosur', r'/brochure',
            r'/urun', r'/product',
            r'/fiyat', r'/price',
        ]

        # Yaygın URL path'leri - /tr/ prefix'li olanlar önce (Türk siteleri için)
        common_paths = [
            # Öncelikli: /tr/ prefix'li (Türk siteleri)
            '/tr/download-listesi', '/tr/katalog', '/tr/download', '/tr/downloads',
            '/tr/dokuman', '/tr/dokumanlar', '/tr/urunler',
            # Kök dizin path'leri
            '/download-listesi', '/katalog', '/kataloglar', '/download', '/downloads',
            '/catalog', '/catalogs', '/catalogue',
            '/indir', '/indirmeler', '/indirme-merkezi',
            '/dokuman', '/dokumanlar', '/documents', '/docs',
            '/media', '/medya', '/files', '/dosyalar', '/dosya-merkezi',
            '/pdf', '/pdfs', '/brosur', '/brochure', '/brosurler',
            '/urunler', '/urun', '/products', '/product',
            # Alt dizinler
            '/kurumsal/katalog', '/kurumsal/dokuman',
            '/en/catalog', '/en/download',
        ]

        # Yaygın path'leri ekle
        for path in common_paths:
            url = base_url.rstrip('/') + path
            if url not in self.visited_urls:
                pages_to_scan.append(url)

        # Sayfadaki linkleri tara
        for link in soup.find_all('a', href=True):
            href = link['href'].lower()
            link_text = link.get_text().lower()

            # Katalog sayfası olabilecek linkleri bul
            if any(pattern in href or pattern.replace('/', '') in link_text
                   for pattern in catalog_page_patterns):
                full_url = urljoin(base_url, link['href'])
                if full_url not in self.visited_urls and full_url not in pages_to_scan:
                    pages_to_scan.append(full_url)

        # Alt sayfaları tara
        pages_scanned = 0
        for page_url in pages_to_scan:
            if pages_scanned >= self.max_pages:
                break

            logger.debug(f"[{self.name}] Alt sayfa taranıyor: {page_url}")
            page_soup = self.fetch_page(page_url)

            if page_soup:
                pages_scanned += 1
                page_catalogs = self._extract_catalogs_from_soup(page_soup, base_url)
                all_catalogs.update(page_catalogs)

                # 2. seviye linkler (daha az sayfa)
                if pages_scanned < self.max_pages // 2:
                    for link in page_soup.find_all('a', href=True):
                        href = link['href'].lower()
                        if any(p in href for p in ['/katalog', '/pdf', '/download']):
                            sub_url = urljoin(base_url, link['href'])
                            if sub_url not in self.visited_urls and sub_url not in pages_to_scan:
                                pages_to_scan.append(sub_url)

        logger.info(f"[{self.name}] {pages_scanned} sayfa tarandı, {len(all_catalogs)} katalog bulundu")
        return list(all_catalogs)

    def _extract_catalogs_from_soup(self, soup: BeautifulSoup, base_url: str) -> Set[str]:
        """Soup'tan katalog linklerini çıkar - negatif keyword filtrelemesi ile."""
        from config.settings import VALID_EXTENSIONS, PDF_NEGATIVE_KEYWORDS
        from urllib.parse import unquote

        catalogs: Set[str] = set()

        def normalize_turkish(text: str) -> str:
            """Türkçe karakterleri normalize et."""
            tr_map = str.maketrans({
                'İ': 'i', 'I': 'i', 'ı': 'i',
                'Ğ': 'g', 'ğ': 'g',
                'Ü': 'u', 'ü': 'u',
                'Ş': 's', 'ş': 's',
                'Ö': 'o', 'ö': 'o',
                'Ç': 'c', 'ç': 'c',
            })
            return text.translate(tr_map).lower()

        def is_valid_catalog(url: str) -> bool:
            """URL'nin geçerli katalog olup olmadığını kontrol et."""
            import os
            # URL decode + Türkçe normalize (should_download_url ile aynı mantık)
            decoded_url = normalize_turkish(unquote(url))

            # Dosya adını da ayrıca çıkar ve kontrol et
            filename = os.path.basename(urlparse(url).path)
            filename_normalized = normalize_turkish(unquote(filename))

            # Hash'li dosya adı kontrolü (MD5/SHA1 gibi sadece hex karakterlerden oluşan)
            # Örnek: 44e6837acccc042ae3d6cd8eac957784.pdf
            name_without_ext = os.path.splitext(filename)[0]
            if re.match(r'^[a-f0-9]{20,}$', name_without_ext.lower()):
                return False  # Hash'li dosyaları atla

            # Her ikisini de kontrol et
            combined = f"{decoded_url} {filename_normalized}"

            # Negatif keyword kontrolü
            for neg_kw in PDF_NEGATIVE_KEYWORDS:
                if neg_kw in combined:
                    return False
            return True

        # 1. <a> linkleri
        for link in soup.find_all('a', href=True):
            href = link['href']
            if any(href.lower().endswith(ext) for ext in VALID_EXTENSIONS):
                full_url = urljoin(base_url, href)
                if is_valid_catalog(full_url):
                    catalogs.add(full_url)

        # 2. data-* attributes
        for attr in ['data-href', 'data-url', 'data-file', 'data-pdf']:
            for elem in soup.find_all(attrs={attr: True}):
                href = elem.get(attr, '')
                if any(href.lower().endswith(ext) for ext in VALID_EXTENSIONS):
                    full_url = urljoin(base_url, href)
                    if is_valid_catalog(full_url):
                        catalogs.add(full_url)

        # 3. onclick eventleri (window.open, location.href vb.)
        for elem in soup.find_all(attrs={'onclick': True}):
            onclick = elem.get('onclick', '')
            # JavaScript URL pattern'leri
            patterns = [
                r"window\.open\(['\"]([^'\"]+)['\"]",
                r"location\.href\s*=\s*['\"]([^'\"]+)['\"]",
                r"window\.location\s*=\s*['\"]([^'\"]+)['\"]",
            ]
            for pattern in patterns:
                matches = re.findall(pattern, onclick)
                for url in matches:
                    if any(url.lower().endswith(ext) for ext in VALID_EXTENSIONS):
                        full_url = urljoin(base_url, url)
                        if is_valid_catalog(full_url):
                            catalogs.add(full_url)

        # 4. Script içindeki URL'ler
        for script in soup.find_all('script'):
            script_text = script.string or ''
            urls = re.findall(r'["\']([^"\']*\.pdf)["\']', script_text, re.IGNORECASE)
            for url in urls:
                if len(url) > 5:
                    full_url = urljoin(base_url, url)
                    if is_valid_catalog(full_url):
                        catalogs.add(full_url)

        return catalogs


# =============================================================================
# STRATEGY MANAGER
# =============================================================================

class StrategyManager:
    """
    Birden fazla stratejiyi yöneten sınıf.

    İlk 3 deneme default stratejilerle, sonraki 2 deneme alternatif stratejilerle yapılır.
    """

    def __init__(self):
        self.strategies: List[CatalogStrategy] = []
        self._init_strategies()

    def _init_strategies(self):
        """Stratejileri başlat - sadeleştirilmiş versiyon."""
        # Sadece DeepScan stratejisi yeterli - hızlı ve etkili
        self.primary_strategies = [
            DeepScanStrategy(max_pages=10),
        ]

        # Yedek stratejiler kaldırıldı - gereksiz zaman kaybı
        self.fallback_strategies = []

        self.strategies = self.primary_strategies

    def execute_all(self, website: str, stop_on_success: bool = True,
                    min_catalogs: int = 1) -> Tuple[List[str], Optional[BeautifulSoup]]:
        """
        Tüm stratejileri sırayla dener.

        Args:
            website: Hedef web sitesi
            stop_on_success: İlk başarıda dur (varsayılan: True)
            min_catalogs: Başarı için minimum katalog sayısı

        Returns:
            Tuple[List[str], BeautifulSoup]: (tüm_kataloglar, son_soup)
        """
        all_catalogs: Set[str] = set()
        last_soup = None

        for strategy in self.primary_strategies:
            try:
                catalogs, soup = strategy.execute(website)

                if soup:
                    last_soup = soup

                if catalogs:
                    all_catalogs.update(catalogs)

                    if stop_on_success and len(all_catalogs) >= min_catalogs:
                        break

            except Exception as e:
                logger.debug(f"[{strategy.name}] Strateji hatası: {e}")
                continue

        return list(all_catalogs), last_soup

    def close(self):
        """Tüm stratejileri kapat."""
        for strategy in self.strategies:
            try:
                strategy.close()
            except:
                pass
