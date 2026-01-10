"""
Base Scraper Module
===================
Tüm scraper'lar için abstract base class.

Bu sınıf, web scraping işlemleri için temel yapıyı sağlar
ve tüm scraper'ların uyması gereken arayüzü tanımlar.
"""

import time
import warnings
import requests

# BeautifulSoup XML uyarılarını bastır
warnings.filterwarnings('ignore', category=UserWarning, module='bs4')
from abc import ABC, abstractmethod
from typing import Optional, Dict, Any, List
from urllib.parse import urljoin, urlparse

from bs4 import BeautifulSoup

# Selenium imports
from selenium import webdriver
from selenium.webdriver.chrome.options import Options as ChromeOptions
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, WebDriverException

# Config'den ayarları al
try:
    from config.settings import (
        REQUEST_TIMEOUT,
        MAX_RETRIES,
        USER_AGENT,
        REQUEST_DELAY,
        USE_SELENIUM,
        SELENIUM_PAGE_TIMEOUT,
        SELENIUM_IMPLICIT_WAIT,
        SELENIUM_JS_WAIT,
        SELENIUM_HEADLESS
    )
except ImportError:
    REQUEST_TIMEOUT = 10
    MAX_RETRIES = 3
    USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    REQUEST_DELAY = 1.0
    USE_SELENIUM = True
    SELENIUM_PAGE_TIMEOUT = 15
    SELENIUM_IMPLICIT_WAIT = 5
    SELENIUM_JS_WAIT = 2.0
    SELENIUM_HEADLESS = True

from utils.logger import get_logger

logger = get_logger(__name__)


class BaseScraper(ABC):
    """
    Tüm scraper'lar için abstract base class.

    Bu sınıf, web scraping işlemleri için temel metodları sağlar
    ve alt sınıfların uygulaması gereken abstract metodları tanımlar.

    Attributes:
        timeout: HTTP istek zaman aşımı (saniye)
        max_retries: Maksimum yeniden deneme sayısı
        delay: İstekler arası bekleme süresi
        session: requests.Session nesnesi (connection pooling için)

    Example:
        >>> class MyScraper(BaseScraper):
        ...     def extract_catalog_links(self, soup, base_url):
        ...         # Katalog linklerini çıkar
        ...         pass
        ...     def extract_contact_info(self, soup):
        ...         # İletişim bilgilerini çıkar
        ...         pass
    """

    def __init__(self):
        """BaseScraper'ı başlatır."""
        self.timeout = REQUEST_TIMEOUT
        self.max_retries = MAX_RETRIES
        self.delay = REQUEST_DELAY

        # Session oluştur (connection pooling için)
        self.session = requests.Session()

        # Default headers
        self.session.headers.update({
            'User-Agent': USER_AGENT,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        })

        # Selenium driver (lazy initialization)
        self._selenium_driver: Optional[webdriver.Chrome] = None

    def _init_selenium_driver(self) -> Optional[webdriver.Chrome]:
        """
        Selenium WebDriver'ı başlatır.

        Returns:
            webdriver.Chrome: Chrome driver instance, hata durumunda None
        """
        if not USE_SELENIUM:
            return None

        try:
            chrome_options = ChromeOptions()

            if SELENIUM_HEADLESS:
                chrome_options.add_argument('--headless=new')

            # Performance ve stabilite ayarları
            chrome_options.add_argument('--no-sandbox')
            chrome_options.add_argument('--disable-dev-shm-usage')
            chrome_options.add_argument('--disable-gpu')
            chrome_options.add_argument('--window-size=1920,1080')
            chrome_options.add_argument(f'--user-agent={USER_AGENT}')
            chrome_options.add_argument('--disable-blink-features=AutomationControlled')

            # Logging'i bastır
            chrome_options.add_argument('--log-level=3')
            chrome_options.add_experimental_option('excludeSwitches', ['enable-logging'])

            # Selenium 4.6+ kendi driver yönetimini yapıyor
            driver = webdriver.Chrome(options=chrome_options)

            driver.set_page_load_timeout(SELENIUM_PAGE_TIMEOUT)
            driver.implicitly_wait(SELENIUM_IMPLICIT_WAIT)

            logger.debug("Selenium driver başlatıldı")
            return driver

        except Exception as e:
            logger.debug(f"Selenium driver başlatılamadı: {e}")
            return None

    def fetch_page_with_js(self, url: str, wait_for_element: Optional[str] = None) -> Optional[BeautifulSoup]:
        """
        Selenium ile sayfa çeker (JavaScript rendering dahil).

        Args:
            url: Çekilecek sayfa URL'si
            wait_for_element: Beklenecek CSS selector (opsiyonel)

        Returns:
            BeautifulSoup: Parse edilmiş sayfa, hata durumunda None
        """
        if self._selenium_driver is None:
            self._selenium_driver = self._init_selenium_driver()

        if self._selenium_driver is None:
            logger.debug("Selenium kullanılamıyor, requests ile devam ediliyor")
            return self.fetch_page(url)

        try:
            logger.debug(f"Selenium ile sayfa çekiliyor: {url}")

            self._selenium_driver.get(url)

            # Belirli bir element için bekle
            if wait_for_element:
                try:
                    WebDriverWait(self._selenium_driver, SELENIUM_PAGE_TIMEOUT).until(
                        EC.presence_of_element_located((By.CSS_SELECTOR, wait_for_element))
                    )
                except TimeoutException:
                    logger.debug(f"Element bulunamadı: {wait_for_element}")

            # JavaScript'in çalışması için bekle
            time.sleep(SELENIUM_JS_WAIT)

            # Render edilmiş HTML'i al
            page_source = self._selenium_driver.page_source
            soup = BeautifulSoup(page_source, 'lxml')

            logger.debug(f"Selenium ile sayfa başarıyla çekildi: {url}")
            return soup

        except TimeoutException:
            logger.debug(f"Selenium zaman aşımı: {url}")
            return self.fetch_page(url)  # Fallback to requests

        except WebDriverException as e:
            logger.debug(f"Selenium hatası: {url} - {e}")
            return self.fetch_page(url)  # Fallback to requests

        except Exception as e:
            logger.debug(f"Beklenmeyen Selenium hatası: {url} - {e}")
            return self.fetch_page(url)  # Fallback to requests

    def fetch_page(self, url: str, retry_count: int = 0) -> Optional[BeautifulSoup]:
        """
        Belirtilen URL'den sayfa içeriğini çeker ve BeautifulSoup nesnesi döndürür.

        Retry mekanizması ile hatalı istekleri yeniden dener.

        Args:
            url: Çekilecek sayfa URL'si
            retry_count: Mevcut deneme sayısı (internal)

        Returns:
            BeautifulSoup: Parse edilmiş sayfa, hata durumunda None

        Example:
            >>> soup = scraper.fetch_page("https://example.com")
            >>> if soup:
            ...     print(soup.title.string)
        """
        try:
            # Rate limiting
            if retry_count == 0:
                time.sleep(self.delay)

            logger.debug(f"Sayfa çekiliyor: {url}")

            response = self.session.get(
                url,
                timeout=self.timeout,
                allow_redirects=True
            )
            response.raise_for_status()

            # Encoding tespiti
            response.encoding = response.apparent_encoding or 'utf-8'

            # BeautifulSoup ile parse et
            soup = BeautifulSoup(response.text, 'lxml')

            logger.debug(f"Sayfa başarıyla çekildi: {url}")
            return soup

        except requests.exceptions.Timeout:
            logger.debug(f"Zaman aşımı: {url}")
            if retry_count < self.max_retries:
                logger.debug(f"Yeniden deneniyor ({retry_count + 1}/{self.max_retries})...")
                return self.fetch_page(url, retry_count + 1)

        except requests.exceptions.HTTPError as e:
            logger.debug(f"HTTP hatası ({e.response.status_code}): {url}")
            if retry_count < self.max_retries and e.response.status_code >= 500:
                logger.debug(f"Yeniden deneniyor ({retry_count + 1}/{self.max_retries})...")
                return self.fetch_page(url, retry_count + 1)

        except requests.exceptions.ConnectionError:
            logger.debug(f"Bağlantı hatası: {url}")
            if retry_count < self.max_retries:
                time.sleep(2)  # Bağlantı hatalarında biraz daha bekle
                logger.debug(f"Yeniden deneniyor ({retry_count + 1}/{self.max_retries})...")
                return self.fetch_page(url, retry_count + 1)

        except requests.exceptions.RequestException as e:
            logger.debug(f"İstek hatası: {url} - {str(e)}")

        except Exception as e:
            logger.error(f"Beklenmeyen hata: {url} - {str(e)}")

        return None

    def get_base_url(self, url: str) -> str:
        """
        URL'den base URL'yi çıkarır.

        Args:
            url: Tam URL

        Returns:
            str: Base URL (scheme + netloc)

        Example:
            >>> scraper.get_base_url("https://example.com/page/subpage")
            'https://example.com'
        """
        parsed = urlparse(url)
        return f"{parsed.scheme}://{parsed.netloc}"

    def resolve_url(self, base_url: str, relative_url: str) -> str:
        """
        Relative URL'yi absolute URL'ye çevirir.

        Args:
            base_url: Base URL
            relative_url: Relative URL

        Returns:
            str: Absolute URL

        Example:
            >>> scraper.resolve_url("https://example.com", "/page.html")
            'https://example.com/page.html'
        """
        if relative_url.startswith(('http://', 'https://')):
            return relative_url
        return urljoin(base_url, relative_url)

    def find_pages_by_keywords(self, soup: BeautifulSoup, base_url: str,
                                keywords: List[str]) -> List[str]:
        """
        Belirtilen anahtar kelimeleri içeren sayfa linklerini bulur.

        Args:
            soup: BeautifulSoup nesnesi
            base_url: Base URL
            keywords: Aranacak anahtar kelimeler

        Returns:
            List[str]: Bulunan sayfa URL'leri

        Example:
            >>> pages = scraper.find_pages_by_keywords(soup, base_url, ['katalog', 'catalog'])
        """
        found_urls = []

        # Tüm linkleri tara
        for link in soup.find_all('a', href=True):
            href = link['href'].lower()
            link_text = link.get_text().lower()

            # Anahtar kelime kontrolü (href veya link text'te)
            for keyword in keywords:
                keyword_lower = keyword.lower()
                if keyword_lower in href or keyword_lower in link_text:
                    full_url = self.resolve_url(base_url, link['href'])

                    # Duplicate kontrolü
                    if full_url not in found_urls:
                        found_urls.append(full_url)
                    break

        return found_urls

    def clean_text(self, text: str) -> str:
        """
        Metni temizler (fazla boşlukları kaldırır).

        Args:
            text: Ham metin

        Returns:
            str: Temizlenmiş metin

        Example:
            >>> scraper.clean_text("  Çok   boşluklu   metin  ")
            'Çok boşluklu metin'
        """
        if not text:
            return ''

        # Satır sonlarını boşluğa çevir
        text = text.replace('\n', ' ').replace('\r', ' ').replace('\t', ' ')

        # Ardışık boşlukları tek boşluğa indir
        while '  ' in text:
            text = text.replace('  ', ' ')

        return text.strip()

    @abstractmethod
    def extract_catalog_links(self, soup: BeautifulSoup, base_url: str) -> List[str]:
        """
        Sayfadan katalog dosya linklerini çıkarır.

        Bu metod alt sınıflar tarafından uygulanmalıdır.

        Args:
            soup: BeautifulSoup nesnesi
            base_url: Sayfanın base URL'si

        Returns:
            List[str]: Katalog dosya URL'leri
        """
        pass

    @abstractmethod
    def extract_contact_info(self, soup: BeautifulSoup) -> Dict[str, str]:
        """
        Sayfadan iletişim bilgilerini çıkarır.

        Bu metod alt sınıflar tarafından uygulanmalıdır.

        Args:
            soup: BeautifulSoup nesnesi

        Returns:
            Dict[str, str]: İletişim bilgileri (phone, email, address)
        """
        pass

    def close(self) -> None:
        """Session ve Selenium driver'ı kapatır."""
        self.session.close()
        logger.debug("Session kapatıldı")

        # Selenium driver'ı kapat
        if self._selenium_driver:
            try:
                self._selenium_driver.quit()
                logger.debug("Selenium driver kapatıldı")
            except Exception as e:
                logger.debug(f"Selenium driver kapatılırken hata: {e}")
            finally:
                self._selenium_driver = None

    def __enter__(self):
        """Context manager entry."""
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit."""
        self.close()
        return False
