"""
Generic Scraper Module
======================
Genel amaçlı web scraper.

Her türlü firma web sitesinden katalog ve iletişim bilgisi
çıkarmak için tasarlanmış esnek bir scraper.
"""

import re
from typing import Dict, List, Any, Optional, Set, Tuple
from urllib.parse import urlparse

from bs4 import BeautifulSoup

# Config'den ayarları al
try:
    from config.settings import (
        VALID_EXTENSIONS,
        CATALOG_KEYWORDS,
        CATALOG_PAGE_KEYWORDS,
        CONTACT_KEYWORDS,
        PHONE_PATTERN,
        PHONE_PATTERNS,
        INVALID_PHONE_STARTS,
        VALID_AREA_CODES,
        EMAIL_PATTERN,
        STATUS_SUCCESS,
        STATUS_PARTIAL,
        STATUS_FAILED,
        STATUS_ERROR,
        PHONE_LABELS,
        FAX_LABELS,
        EMAIL_LABELS,
        ADDRESS_LABELS,
        EMAIL_EXCLUDE_DOMAINS,
        EMAIL_EXCLUDE_EXTENSIONS,
        PDF_POSITIVE_KEYWORDS,
        PDF_NEGATIVE_KEYWORDS
    )
except ImportError:
    VALID_EXTENSIONS = ['.pdf', '.doc', '.docx', '.xls', '.xlsx']
    CATALOG_KEYWORDS = ['katalog', 'catalog', 'urun', 'product', 'dokuman', 'document', 'brosur', 'brochure']
    CATALOG_PAGE_KEYWORDS = ['katalog', 'catalog', 'download', 'indir', 'dokuman', 'document']
    CONTACT_KEYWORDS = ['iletisim', 'contact', 'hakkimizda', 'about', 'kurumsal']
    PHONE_PATTERN = r'(?:\+90|0)?[\s.-]?(?:\(?\d{3}\)?[\s.-]?)?\d{3}[\s.-]?\d{2}[\s.-]?\d{2}'
    PHONE_PATTERNS = [PHONE_PATTERN]
    INVALID_PHONE_STARTS = ['0000', '1111', '1234', '0900', '0800']
    VALID_AREA_CODES = ['212', '216', '312', '232', '224', '530', '531', '532', '533', '534', '535']
    EMAIL_PATTERN = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
    STATUS_SUCCESS = 'SUCCESS'
    STATUS_PARTIAL = 'PARTIAL'
    STATUS_FAILED = 'FAILED'
    STATUS_ERROR = 'ERROR'
    PHONE_LABELS = ['tel', 'telefon', 'phone', 'gsm', 'cep', 'mobil']
    FAX_LABELS = ['fax', 'faks']
    EMAIL_LABELS = ['email', 'e-mail', 'e-posta', 'mail']
    ADDRESS_LABELS = ['adres', 'address', 'merkez', 'fabrika']
    EMAIL_EXCLUDE_DOMAINS = ['example.com', 'test.com']
    EMAIL_EXCLUDE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif']
    PDF_POSITIVE_KEYWORDS = ['katalog', 'catalog', 'product', 'urun']
    PDF_NEGATIVE_KEYWORDS = ['privacy', 'policy', 'terms', 'legal']

from scrapers.base_scraper import BaseScraper
from scrapers.catalog_strategies import StrategyManager
from utils.logger import get_logger
from utils.file_downloader import FileDownloader
from utils.validators import determine_status, has_contact_info

logger = get_logger(__name__)


class GenericScraper(BaseScraper):
    """
    Genel amaçlı firma web sitesi scraper'ı.

    Özellikler:
    - Ana sayfadan ve alt sayfalardan katalog arama
    - İletişim bilgisi çıkarma (telefon, email, adres)
    - Otomatik katalog indirme
    - Derinlemesine site tarama

    Attributes:
        downloader: FileDownloader instance
        visited_urls: Ziyaret edilen URL'ler (duplicate önleme)
        max_depth: Maksimum tarama derinliği

    Example:
        >>> scraper = GenericScraper()
        >>> result = scraper.scrape("https://firma.com", "Firma Adı")
        >>> print(result['status'])
    """

    def __init__(self, max_depth: int = 2, catalogs_dir: Optional[str] = None,
                 use_multi_strategy: bool = True):
        """
        GenericScraper'ı başlatır.

        Args:
            max_depth: Maksimum link takip derinliği (varsayılan: 2)
            catalogs_dir: Katalog indirme dizini (varsayılan: CATALOGS_DIR)
            use_multi_strategy: Multi-strateji sistemini kullan (varsayılan: True)
        """
        super().__init__()
        self.downloader = FileDownloader(base_dir=catalogs_dir)
        self.visited_urls: Set[str] = set()
        self.max_depth = max_depth
        self.use_multi_strategy = use_multi_strategy
        self._strategy_manager: Optional[StrategyManager] = None

    def scrape(self, website: str, company_name: str,
               sector: str = '') -> Dict[str, Any]:
        """
        Firma web sitesini scrape eder.

        Ana işlem akışı:
        1. Ana sayfayı çek
        2. Katalog linklerini bul (ana sayfa + alt sayfalar)
        3. İletişim bilgilerini çıkar
        4. Katalogları indir
        5. Sonuçları döndür

        Args:
            website: Firma web sitesi URL'si
            company_name: Firma adı
            sector: Firma sektörü (opsiyonel)

        Returns:
            Dict: Scrape sonuçları
                - company_name: Firma adı
                - website: Web sitesi
                - sector: Sektör
                - phone: Telefon numarası
                - email: E-posta adresi
                - address: Adres
                - catalog_count: Bulunan katalog sayısı
                - catalog_files: İndirilen katalog dosyaları
                - status: İşlem durumu (SUCCESS, PARTIAL, FAILED, ERROR)

        Example:
            >>> result = scraper.scrape("https://example.com", "Test Firma", "Metal")
            >>> if result['status'] != 'FAILED':
            ...     print(f"Katalog sayısı: {result['catalog_count']}")
        """
        # Sonuç dictionary'si
        result = {
            'company_name': company_name,
            'website': website,
            'sector': sector,
            'phone': '',
            'email': '',
            'address': '',
            'catalog_count': 0,
            'catalog_files': [],
            'status': STATUS_ERROR,
            'scrape_date': ''
        }

        try:
            # URL'yi normalize et
            if not website.startswith(('http://', 'https://')):
                website = 'https://' + website

            base_url = self.get_base_url(website)
            self.visited_urls.clear()

            logger.info(f"Scraping başladı: {company_name}")

            # =================================================================
            # 1. ANA SAYFAYI ÇEK (JavaScript rendering ile)
            # =================================================================
            # Önce Selenium ile dene (JS-heavy siteler için)
            main_soup = self.fetch_page_with_js(website)

            if not main_soup:
                # Fallback: requests ile dene
                main_soup = self.fetch_page(website)

            if not main_soup:
                logger.debug(f"Ana sayfa çekilemedi: {website}")
                result['status'] = STATUS_ERROR
                return result

            # =================================================================
            # 2. KATALOG LİNKLERİNİ BUL
            # =================================================================
            catalog_links = self._find_all_catalogs(main_soup, base_url)

            # Eğer katalog bulunamadıysa ve multi-strateji aktifse, alternatif stratejileri dene
            if not catalog_links and self.use_multi_strategy:
                catalog_links, strategy_soup = self._try_alternative_strategies(website)

                # Strateji soup'u varsa iletişim bilgisi için kullan
                if strategy_soup and not main_soup:
                    main_soup = strategy_soup

            logger.info(f"Bulunan katalog: {len(catalog_links)}")

            # =================================================================
            # 3. İLETİŞİM BİLGİLERİNİ ÇIKAR
            # =================================================================
            contact_info = self._find_contact_info(main_soup, base_url)

            result['phone'] = contact_info.get('phone', '')
            result['email'] = contact_info.get('email', '')
            result['address'] = contact_info.get('address', '')

            # =================================================================
            # 4. KATALOGLARI İNDİR
            # =================================================================
            if catalog_links:
                downloaded_files = self._download_catalogs(catalog_links, company_name)
                result['catalog_count'] = len(downloaded_files)
                result['catalog_files'] = downloaded_files

            # =================================================================
            # 5. STATUS BELİRLE
            # =================================================================
            result['status'] = determine_status(
                result['catalog_count'],
                has_contact_info(result)
            )

            logger.info(f"Scraping tamamlandı: {company_name} - Status: {result['status']}")

        except Exception as e:
            logger.debug(f"Scraping hatası ({company_name}): {str(e)}")
            result['status'] = STATUS_ERROR

        return result

    def _find_all_catalogs(self, main_soup: BeautifulSoup,
                           base_url: str) -> List[str]:
        """
        Ana sayfa ve alt sayfalardan tüm katalog linklerini bulur.

        Geliştirilmiş versiyon:
        1. Ana sayfadan katalog linkleri
        2. Katalog/download sayfalarını tara
        3. Sitemap kontrolü
        4. Ürün kategorisi sayfalarını tara

        Args:
            main_soup: Ana sayfa BeautifulSoup nesnesi
            base_url: Base URL

        Returns:
            List[str]: Benzersiz katalog URL'leri
        """
        all_catalogs: Set[str] = set()

        # 1. Ana sayfadan katalog linkleri
        main_catalogs = self.extract_catalog_links(main_soup, base_url)
        all_catalogs.update(main_catalogs)
        logger.debug(f"Ana sayfada {len(main_catalogs)} katalog bulundu")

        # 2. Genişletilmiş katalog sayfa anahtar kelimeleri
        extended_page_keywords = CATALOG_PAGE_KEYWORDS + [
            'urunler', 'ürünler', 'products', 'product',
            'dosyalar', 'dosya', 'files', 'file',
            'belgeler', 'belge', 'documents',
            'medya', 'media', 'basin', 'press',
            'teknik', 'technical', 'spec', 'specification',
            'bilgi', 'info', 'kaynak', 'resource'
        ]

        catalog_pages = self.find_pages_by_keywords(
            main_soup, base_url, extended_page_keywords
        )

        # 3. Sitemap kontrolü
        sitemap_catalogs = self._check_sitemap_for_catalogs(base_url)
        if sitemap_catalogs:
            logger.debug(f"Sitemap'te {len(sitemap_catalogs)} potansiyel katalog sayfası bulundu")
            catalog_pages.extend(sitemap_catalogs)

        # 4. Yaygın katalog URL'lerini dene - /tr/ prefix'li olanlar önce
        common_catalog_paths = [
            # Öncelikli: /tr/ prefix'li (Türk siteleri)
            '/tr/download-listesi', '/tr/katalog', '/tr/download', '/tr/downloads',
            '/tr/dokuman', '/tr/dokumanlar', '/tr/urunler', '/tr/urun',
            '/tr/media', '/tr/medya',
            # Kök dizin path'leri
            '/download-listesi', '/katalog', '/kataloglar', '/download', '/downloads',
            '/catalog', '/catalogs', '/catalogue',
            '/indir', '/indirmeler', '/indirme-merkezi',
            '/dokuman', '/dokumanlar', '/documents', '/docs',
            '/dosya', '/dosyalar', '/files', '/dosya-merkezi',
            '/media', '/medya',
            '/brosur', '/brosurler', '/brochure', '/brochures',
            '/pdf', '/pdfs', '/fiyat-listesi', '/pricelist',
            '/urunler', '/urun', '/products', '/product',
            # Alt dizinler
            '/kurumsal/katalog', '/kurumsal/dokuman',
        ]

        for path in common_catalog_paths:
            potential_url = base_url.rstrip('/') + path
            if potential_url not in catalog_pages and potential_url not in self.visited_urls:
                catalog_pages.append(potential_url)

        # 5. Alt sayfaları tara (maksimum 15 sayfa)
        max_pages = 15
        pages_checked = 0

        for page_url in catalog_pages:
            if pages_checked >= max_pages:
                break

            if page_url in self.visited_urls:
                continue

            self.visited_urls.add(page_url)
            pages_checked += 1
            logger.debug(f"Katalog sayfası taranıyor ({pages_checked}/{max_pages}): {page_url}")

            # Önce requests ile dene (daha hızlı), başarısız olursa Selenium
            page_soup = self.fetch_page(page_url)

            if not page_soup:
                # Selenium ile dene
                page_soup = self.fetch_page_with_js(page_url)

            if page_soup:
                page_catalogs = self.extract_catalog_links(page_soup, base_url)
                all_catalogs.update(page_catalogs)

                if page_catalogs:
                    logger.debug(f"Alt sayfada {len(page_catalogs)} katalog bulundu: {page_url}")

                # Alt sayfalarda da katalog sayfası linkleri ara (depth=2)
                if pages_checked < max_pages // 2:
                    sub_pages = self.find_pages_by_keywords(
                        page_soup, base_url, CATALOG_PAGE_KEYWORDS[:5]
                    )
                    for sub_url in sub_pages[:3]:
                        if sub_url not in catalog_pages:
                            catalog_pages.append(sub_url)

        return list(all_catalogs)

    def _try_alternative_strategies(self, website: str) -> Tuple[List[str], Optional[BeautifulSoup]]:
        """
        Alternatif katalog çekme stratejilerini dener.

        İlk 3 strateji (primary):
        1. Default - Standart requests
        2. Alternative Headers - Farklı User-Agent
        3. Deep Scan - Agresif tarama

        Sonraki 2 strateji (fallback):
        4. Google Cache - Cache üzerinden
        5. Stealth Selenium - Anti-detection

        Args:
            website: Hedef web sitesi URL'si

        Returns:
            Tuple[List[str], BeautifulSoup]: (katalog_linkleri, soup)
        """
        from typing import Tuple

        # Lazy initialization
        if self._strategy_manager is None:
            self._strategy_manager = StrategyManager()

        try:
            # Tüm stratejileri çalıştır
            catalog_links, soup = self._strategy_manager.execute_all(
                website,
                stop_on_success=True,
                min_catalogs=1
            )

            # Bulunan katalogları filtrele (negatif keyword kontrolü)
            filtered_catalogs = []
            for url in catalog_links:
                should_download, reason = self.downloader.should_download_url(url, '')
                if should_download:
                    filtered_catalogs.append(url)
                else:
                    logger.debug(f"Strateji katalogu filtrelendi: {url} - {reason}")

            return filtered_catalogs, soup

        except Exception as e:
            logger.debug(f"Multi-strateji hatası: {e}")
            return [], None

    def _check_sitemap_for_catalogs(self, base_url: str) -> List[str]:
        """
        Sitemap.xml dosyasından katalog sayfalarını bulur.

        Args:
            base_url: Site base URL'si

        Returns:
            List[str]: Potansiyel katalog sayfası URL'leri
        """
        potential_pages = []
        sitemap_urls = [
            base_url.rstrip('/') + '/sitemap.xml',
            base_url.rstrip('/') + '/sitemap_index.xml',
            base_url.rstrip('/') + '/sitemap-index.xml',
        ]

        for sitemap_url in sitemap_urls:
            try:
                soup = self.fetch_page(sitemap_url)
                if not soup:
                    continue

                # URL'leri bul
                for loc in soup.find_all('loc'):
                    url = loc.get_text().strip()
                    url_lower = url.lower()

                    # Katalog ile ilgili URL'leri filtrele
                    catalog_indicators = [
                        'katalog', 'catalog', 'download', 'indir',
                        'dokuman', 'document', 'pdf', 'brosur', 'brochure'
                    ]
                    if any(ind in url_lower for ind in catalog_indicators):
                        potential_pages.append(url)

                if potential_pages:
                    break  # Sitemap bulunduysa diğerlerini deneme

            except Exception as e:
                logger.debug(f"Sitemap kontrol hatası: {sitemap_url} - {e}")
                continue

        return potential_pages[:10]  # Maksimum 10 URL

    def extract_catalog_links(self, soup: BeautifulSoup, base_url: str) -> List[str]:
        """
        Sayfadan katalog dosya linklerini çıkarır (geliştirilmiş versiyon).

        Arama stratejisi:
        1. Doğrudan dosya uzantılı linkler (.pdf, .doc, etc.)
        2. data-href, data-url gibi özel attribute'lar
        3. onclick ile yüklenen dosyalar
        4. Embed/iframe içindeki PDF'ler
        5. Negatif keyword filtreleme
        6. Pozitif keyword skorlama

        Args:
            soup: BeautifulSoup nesnesi
            base_url: Sayfanın base URL'si

        Returns:
            List[str]: Katalog dosya URL'leri (relevance'a göre sıralı)
        """
        from typing import Tuple

        # (url, score, link_text) tuple'ları
        catalog_candidates: List[Tuple[str, int, str]] = []

        def add_candidate(url: str, link_text: str = ''):
            """URL'yi candidate listesine ekle (filtreleme ile)"""
            if not url:
                return

            full_url = self.resolve_url(base_url, url)
            should_download, reason = self.downloader.should_download_url(full_url, link_text)

            if should_download:
                score = self.downloader.get_url_score(full_url, link_text)
                catalog_candidates.append((full_url, score, link_text))
            else:
                logger.debug(f"Link filtrelendi: {full_url} - {reason}")

        def has_valid_extension(url: str) -> bool:
            """URL'nin geçerli dosya uzantısı var mı"""
            url_lower = url.lower().split('?')[0]  # Query string'i kaldır
            return any(url_lower.endswith(ext) for ext in VALID_EXTENSIONS)

        # 1. Standart <a> linkleri
        for link in soup.find_all('a', href=True):
            href = link['href']
            link_text = link.get_text().strip()

            if has_valid_extension(href):
                add_candidate(href, link_text)

            # data-* attribute'ları da kontrol et
            for attr in ['data-href', 'data-url', 'data-file', 'data-download', 'data-src']:
                data_url = link.get(attr)
                if data_url and has_valid_extension(data_url):
                    add_candidate(data_url, link_text)

        # 2. Butonlar ve diğer tıklanabilir elementler
        for elem in soup.find_all(['button', 'div', 'span'], attrs={'onclick': True}):
            onclick = elem.get('onclick', '')
            link_text = elem.get_text().strip()

            # JavaScript'teki URL'leri çıkar
            url_patterns = [
                r"window\.open\(['\"]([^'\"]+)['\"]",
                r"location\.href\s*=\s*['\"]([^'\"]+)['\"]",
                r"window\.location\s*=\s*['\"]([^'\"]+)['\"]",
                r"download\(['\"]([^'\"]+)['\"]",
            ]
            for pattern in url_patterns:
                matches = re.findall(pattern, onclick)
                for url in matches:
                    if has_valid_extension(url):
                        add_candidate(url, link_text)

        # 3. data-* attribute'lu tüm elementler
        for elem in soup.find_all(attrs={'data-pdf': True}):
            add_candidate(elem.get('data-pdf'), elem.get_text().strip())

        for elem in soup.find_all(attrs={'data-file-url': True}):
            add_candidate(elem.get('data-file-url'), elem.get_text().strip())

        # 4. Embed edilmiş PDF'ler
        for embed in soup.find_all(['embed', 'object', 'iframe']):
            src = embed.get('src') or embed.get('data')
            if src and has_valid_extension(src):
                add_candidate(src, '')

        # 5. Sayfadaki tüm script'lerde PDF URL'leri ara
        for script in soup.find_all('script'):
            script_text = script.string or ''
            if script_text:
                # PDF URL pattern'leri
                pdf_patterns = [
                    r'["\']([^"\']*\.pdf)["\']',
                    r'url:\s*["\']([^"\']*\.pdf)["\']',
                    r'href:\s*["\']([^"\']*\.pdf)["\']',
                    r'file:\s*["\']([^"\']*\.pdf)["\']',
                ]
                for pattern in pdf_patterns:
                    matches = re.findall(pattern, script_text, re.IGNORECASE)
                    for url in matches:
                        if has_valid_extension(url) and len(url) > 10:
                            add_candidate(url, '')

        # 6. Skora göre sırala (yüksekten düşüğe) ve duplicate'ları kaldır
        catalog_candidates.sort(key=lambda x: x[1], reverse=True)

        seen_urls: Set[str] = set()
        result: List[str] = []

        for url, score, _ in catalog_candidates:
            # URL normalize et (duplicate kontrolü için)
            normalized_url = url.split('?')[0].rstrip('/')
            if normalized_url not in seen_urls:
                seen_urls.add(normalized_url)
                result.append(url)
                logger.debug(f"Katalog adayı: {url} (skor: {score})")

        return result

    def _find_contact_info(self, main_soup: BeautifulSoup,
                           base_url: str) -> Dict[str, str]:
        """
        İletişim bilgilerini bulur (geliştirilmiş versiyon).

        Strateji:
        1. Ana sayfanın footer'ından
        2. Yaygın iletişim URL'lerini dene
        3. Sayfadaki linklerden iletişim sayfalarını bul
        4. Her sayfada önce requests, sonra Selenium dene

        Args:
            main_soup: Ana sayfa BeautifulSoup nesnesi
            base_url: Base URL

        Returns:
            Dict: İletişim bilgileri
        """
        contact_info = {'phone': '', 'email': '', 'address': ''}

        # 1. Ana sayfadan dene (özellikle footer)
        contact_info = self.extract_contact_info(main_soup)

        if contact_info['phone'] and contact_info['email']:
            return contact_info

        # 2. Yaygın iletişim sayfası URL'lerini dene
        common_contact_paths = [
            '/iletisim', '/iletişim', '/contact', '/contact-us', '/contactus',
            '/bize-ulasin', '/bizeulasin', '/bize-ulaşın',
            '/hakkimizda', '/hakkımızda', '/about', '/about-us', '/aboutus',
            '/kurumsal', '/kurumsal/iletisim', '/tr/iletisim', '/tr/contact',
            '/corporate/contact', '/sirket/iletisim', '/şirket/iletişim',
        ]

        contact_pages = []
        for path in common_contact_paths:
            contact_pages.append(base_url.rstrip('/') + path)

        # 3. Sayfadaki linklerden iletişim sayfalarını bul
        found_pages = self.find_pages_by_keywords(main_soup, base_url, CONTACT_KEYWORDS)
        contact_pages.extend(found_pages)

        # Duplicate'ları kaldır
        contact_pages = list(dict.fromkeys(contact_pages))

        # 4. Her sayfayı dene (maksimum 8 sayfa)
        max_contact_pages = 8
        pages_tried = 0

        for page_url in contact_pages:
            if pages_tried >= max_contact_pages:
                break

            if page_url in self.visited_urls:
                continue

            self.visited_urls.add(page_url)
            pages_tried += 1

            logger.debug(f"İletişim sayfası taranıyor ({pages_tried}/{max_contact_pages}): {page_url}")

            # Önce hızlı requests ile dene
            page_soup = self.fetch_page(page_url)

            # Başarısızsa veya içerik az ise Selenium dene
            if page_soup:
                page_text = page_soup.get_text()
                # Sayfa çok kısa ise muhtemelen JS ile yükleniyor
                if len(page_text) < 500:
                    page_soup = self.fetch_page_with_js(page_url)
            else:
                page_soup = self.fetch_page_with_js(page_url)

            if page_soup:
                page_contact = self.extract_contact_info(page_soup)

                # Eksik bilgileri doldur
                if not contact_info['phone'] and page_contact['phone']:
                    contact_info['phone'] = page_contact['phone']
                if not contact_info['email'] and page_contact['email']:
                    contact_info['email'] = page_contact['email']
                if not contact_info['address'] and page_contact['address']:
                    contact_info['address'] = page_contact['address']

                # Tüm bilgiler tamamlandıysa dur
                if contact_info['phone'] and contact_info['email']:
                    logger.debug(f"İletişim bilgileri bulundu: {page_url}")
                    break

        return contact_info

    def extract_contact_info(self, soup: BeautifulSoup) -> Dict[str, str]:
        """
        Sayfadan iletişim bilgilerini çıkarır (geliştirilmiş versiyon).

        Strateji:
        1. JSON-LD Schema.org verisi
        2. mailto: ve tel: linkleri (en güvenilir)
        3. Footer'dan çıkar
        4. Semantik HTML etiketlerinden
        5. Etiketli pattern'ler
        6. Full-page regex (fallback)

        Args:
            soup: BeautifulSoup nesnesi

        Returns:
            Dict[str, str]: İletişim bilgileri (phone, email, address)
        """
        contact = {
            'phone': '',
            'email': '',
            'address': '',
            'phones': [],
            'emails': []
        }

        # =================================================================
        # STRATEGY 0: JSON-LD Schema.org (En güvenilir)
        # =================================================================
        contact = self._extract_from_schema_org(soup, contact)

        # =================================================================
        # STRATEGY 1: mailto: ve tel: linkleri (Çok güvenilir)
        # =================================================================
        contact = self._extract_from_links(soup, contact)

        # =================================================================
        # STRATEGY 2: Footer'dan çıkar (Genellikle iletişim bilgisi burada)
        # =================================================================
        if not contact['phone'] or not contact['email']:
            contact = self._extract_from_footer(soup, contact)

        # =================================================================
        # STRATEGY 3: Semantik HTML Etiketleri
        # =================================================================
        if not contact['phone'] or not contact['email']:
            contact = self._extract_from_semantic_elements(soup, contact)

        # =================================================================
        # STRATEGY 4: Etiketli Pattern'ler
        # =================================================================
        if not contact['phone'] or not contact['email']:
            contact = self._extract_from_labeled_patterns(soup, contact)

        # =================================================================
        # STRATEGY 5: Full-page regex (fallback)
        # =================================================================
        if not contact['phone'] or not contact['email']:
            contact = self._extract_from_page_text(soup, contact)

        # =================================================================
        # EN İYİ SONUÇLARI SEÇ
        # =================================================================
        if contact['phones'] and not contact['phone']:
            contact['phone'] = self._select_best_phone(contact['phones'])

        if contact['emails'] and not contact['email']:
            contact['email'] = self._select_best_email(contact['emails'])

        # Geçici listeleri temizle
        del contact['phones']
        del contact['emails']

        return contact

    def _extract_from_schema_org(self, soup: BeautifulSoup, contact: Dict) -> Dict:
        """JSON-LD Schema.org verisinden iletişim bilgisi çıkarır."""
        import json

        for script in soup.find_all('script', type='application/ld+json'):
            try:
                data = json.loads(script.string or '{}')

                # Liste ise ilk elemanı al
                if isinstance(data, list):
                    data = data[0] if data else {}

                # Telefon
                if not contact['phone']:
                    phone = data.get('telephone') or data.get('phone')
                    if phone:
                        formatted = self._format_phone(str(phone))
                        if formatted:
                            contact['phone'] = formatted

                # Email
                if not contact['email']:
                    email = data.get('email')
                    if email and self._is_valid_email(email):
                        contact['email'] = email

                # Adres
                if not contact['address']:
                    addr = data.get('address')
                    if isinstance(addr, dict):
                        parts = [
                            addr.get('streetAddress', ''),
                            addr.get('addressLocality', ''),
                            addr.get('postalCode', ''),
                            addr.get('addressCountry', '')
                        ]
                        address = ' '.join(p for p in parts if p)
                        if address and len(address) > 20:
                            contact['address'] = address
                    elif isinstance(addr, str) and len(addr) > 20:
                        contact['address'] = addr

            except (json.JSONDecodeError, TypeError, AttributeError):
                continue

        return contact

    def _extract_from_footer(self, soup: BeautifulSoup, contact: Dict) -> Dict:
        """Footer'dan iletişim bilgisi çıkarır."""
        footer_selectors = [
            'footer',
            '[class*="footer"]',
            '[id*="footer"]',
            '[class*="bottom"]',
            '[class*="alt-bilgi"]',
        ]

        for selector in footer_selectors:
            try:
                footers = soup.select(selector)
                for footer in footers:
                    footer_text = footer.get_text(separator=' ')

                    # Telefon
                    if not contact['phone']:
                        phones = self._find_phones_in_text(footer_text)
                        contact['phones'].extend(phones)

                    # Email
                    if not contact['email']:
                        emails = self._find_emails_in_text(footer_text)
                        contact['emails'].extend(emails)

                    # mailto: linklerinden email
                    for mailto in footer.find_all('a', href=re.compile(r'^mailto:', re.I)):
                        email = mailto['href'].replace('mailto:', '').split('?')[0].strip()
                        if self._is_valid_email(email) and email not in contact['emails']:
                            contact['emails'].append(email)

                    # tel: linklerinden telefon
                    for tel in footer.find_all('a', href=re.compile(r'^tel:', re.I)):
                        phone = tel['href'].replace('tel:', '').strip()
                        formatted = self._format_phone(phone)
                        if formatted and formatted not in contact['phones']:
                            contact['phones'].append(formatted)

            except Exception:
                continue

        return contact

    def _extract_from_semantic_elements(self, soup: BeautifulSoup,
                                         contact: Dict) -> Dict:
        """Semantik HTML etiketlerinden iletişim bilgisi çıkarır."""
        contact_selectors = [
            'address',
            '[class*="contact"]',
            '[class*="iletisim"]',
            '[id*="contact"]',
            '[id*="iletisim"]',
            'footer [class*="info"]',
            '[class*="footer"] [class*="contact"]',
            '[itemtype*="Organization"]',
            '[itemtype*="LocalBusiness"]',
        ]

        for selector in contact_selectors:
            try:
                elements = soup.select(selector)
                for element in elements:
                    element_text = element.get_text(separator=' ', strip=True)

                    # Telefon çıkar
                    if not contact['phone']:
                        phones = self._find_phones_in_text(element_text)
                        contact['phones'].extend(phones)

                    # Email çıkar
                    if not contact['email']:
                        emails = self._find_emails_in_text(element_text)
                        contact['emails'].extend(emails)

                        # mailto: linklerini de kontrol et
                        for mailto in element.find_all('a', href=re.compile(r'^mailto:', re.I)):
                            email = mailto['href'].replace('mailto:', '').split('?')[0].strip()
                            if self._is_valid_email(email):
                                contact['emails'].append(email)

                    # Adres çıkar
                    if not contact['address']:
                        address = self._find_address_in_text(element_text)
                        if address:
                            contact['address'] = address
            except Exception:
                continue

        return contact

    def _extract_from_labeled_patterns(self, soup: BeautifulSoup,
                                        contact: Dict) -> Dict:
        """
        Etiketli pattern'lerden iletişim bilgisi çıkarır (geliştirilmiş versiyon).

        Telefon etiketleri etrafındaki numaraları daha geniş bir alanda arar.
        """
        page_text = soup.get_text(separator='\n')

        # Genişletilmiş telefon label'ları
        extended_phone_labels = PHONE_LABELS + [
            'tel.', 'tel:', 'telefon:', 'phone:', 'gsm:', 'cep:', 'mobil:',
            't.', 'fon', 'numarası', 'numarasi', 'no:', 'santral', 'pbx'
        ]

        # Telefon label'ları ile ara - daha geniş pattern
        for label in extended_phone_labels:
            # Label'dan sonra gelen numarayı bul (daha esnek pattern)
            patterns = [
                rf'(?:{re.escape(label)})[\s:]*([+\d\s\-\(\)\/\.]{10,25})',
                rf'(?:{re.escape(label)})\s*[:=]?\s*([+\d\s\-\(\)\/\.]{10,25})',
            ]

            for pattern in patterns:
                matches = re.findall(pattern, page_text, re.IGNORECASE)
                for match in matches:
                    formatted = self._format_phone(match)
                    if formatted and formatted not in contact['phones']:
                        # Fax olmadığından emin ol
                        match_pos = page_text.lower().find(match.lower())
                        if match_pos >= 0:
                            context_start = max(0, match_pos - 30)
                            context_end = min(len(page_text), match_pos + len(match) + 10)
                            context = page_text[context_start:context_end].lower()
                            if not any(fax in context for fax in FAX_LABELS):
                                contact['phones'].append(formatted)

        # Genişletilmiş email label'ları
        extended_email_labels = EMAIL_LABELS + [
            'e-mail:', 'email:', 'e-posta:', 'mail:', 'iletişim:',
            'contact:', '@', 'adres:', 'electronic mail'
        ]

        # Email label'ları ile ara
        for label in extended_email_labels:
            if label == '@':
                continue  # @ tek başına çok geniş, atla

            pattern = rf'(?:{re.escape(label)})[\s:]*({EMAIL_PATTERN})'
            matches = re.findall(pattern, page_text, re.IGNORECASE)
            for match in matches:
                if self._is_valid_email(match) and match.lower() not in [e.lower() for e in contact['emails']]:
                    contact['emails'].append(match)

        # Adres label'ları ile ara
        if not contact['address']:
            extended_address_labels = ADDRESS_LABELS + [
                'adres:', 'address:', 'merkez:', 'fabrika:', 'lokasyon:',
                'konum:', 'location:', 'genel müdürlük:', 'headquarters:'
            ]

            for label in extended_address_labels:
                pattern = rf'(?:{re.escape(label)})[\s:]*([^\n]{{20,250}})'
                match = re.search(pattern, page_text, re.IGNORECASE)
                if match:
                    address = self.clean_text(match.group(1))
                    # Adres doğrulama fonksiyonunu kullan
                    if self._is_valid_address(address):
                        contact['address'] = address
                        break

        return contact

    def _extract_from_links(self, soup: BeautifulSoup, contact: Dict) -> Dict:
        """mailto: ve tel: linklerinden bilgi çıkarır."""
        # mailto: linkleri
        for link in soup.find_all('a', href=re.compile(r'^mailto:', re.I)):
            email = link['href'].replace('mailto:', '').split('?')[0].strip()
            if self._is_valid_email(email) and email not in contact['emails']:
                contact['emails'].append(email)

        # tel: linkleri
        for link in soup.find_all('a', href=re.compile(r'^tel:', re.I)):
            phone = link['href'].replace('tel:', '').strip()
            formatted = self._format_phone(phone)
            if formatted and formatted not in contact['phones']:
                contact['phones'].append(formatted)

        return contact

    def _extract_from_page_text(self, soup: BeautifulSoup, contact: Dict) -> Dict:
        """Tam sayfa metin taraması ile iletişim bilgisi çıkarır (fallback)."""
        page_text = soup.get_text(separator=' ')

        # Tüm telefonları bul
        if not contact['phone']:
            phones = self._find_phones_in_text(page_text)
            contact['phones'].extend(phones)

        # Tüm email'leri bul
        if not contact['email']:
            emails = self._find_emails_in_text(page_text)
            contact['emails'].extend(emails)

        return contact

    def _find_phones_in_text(self, text: str) -> List[str]:
        """
        Metinden tüm telefon numaralarını bulur (geliştirilmiş versiyon).

        Özellikler:
        - Birden fazla regex pattern kullanır
        - Geçersiz numaraları filtreler (0000, 1234 vb.)
        - Alan kodu doğrulaması yapar
        - Fax numaralarını hariç tutar
        """
        phones = []
        seen_digits = set()  # Tekrarları önle

        # Tüm patternleri dene
        all_patterns = PHONE_PATTERNS + [PHONE_PATTERN]

        for pattern in all_patterns:
            matches = re.findall(pattern, text)

            for match in matches:
                # Temizle ve formatla
                formatted = self._format_phone(match)
                if not formatted:
                    continue

                # Sadece rakamları al
                digits = re.sub(r'\D', '', formatted)

                # En az 10 rakam olmalı
                if len(digits) < 10:
                    continue

                # Çok uzun numaraları atla (muhtemelen başka bir şey)
                if len(digits) > 14:
                    continue

                # Tekrar kontrolü (aynı numaranın farklı formatları)
                # Son 10 haneyi karşılaştır
                last_10 = digits[-10:]
                if last_10 in seen_digits:
                    continue

                # Geçersiz başlangıç kontrolü
                if any(digits.startswith(inv) or last_10.startswith(inv)
                       for inv in INVALID_PHONE_STARTS):
                    continue

                # Alan kodu doğrulaması
                area_code = None
                if digits.startswith('90') and len(digits) >= 12:
                    area_code = digits[2:5]  # +90 XXX
                elif digits.startswith('0') and len(digits) >= 11:
                    area_code = digits[1:4]  # 0XXX
                elif len(digits) == 10:
                    area_code = digits[0:3]  # XXX (alan kodu dahil 10 hane)

                # Alan kodu bilinmiyor ama uzunluk doğru ise kabul et
                if area_code and area_code not in VALID_AREA_CODES:
                    # Çok yaygın olmayan alan kodları için yine de kabul et
                    # ama sadece uzunluk doğruysa
                    if not (len(digits) == 10 or len(digits) == 11 or len(digits) == 12):
                        continue

                # Fax kontrolü - context'e bak
                match_pos = text.find(match)
                if match_pos >= 0:
                    context_start = max(0, match_pos - 30)
                    context_end = min(len(text), match_pos + len(match) + 10)
                    context = text[context_start:context_end].lower()

                    if any(fax in context for fax in FAX_LABELS):
                        continue

                seen_digits.add(last_10)
                phones.append(formatted)

        return phones

    def _find_emails_in_text(self, text: str) -> List[str]:
        """
        Metinden tüm email adreslerini bulur (geliştirilmiş versiyon).

        Özellikler:
        - Birden fazla pattern ile arama
        - JavaScript/CSS içindeki sahte email'leri filtreler
        - Geçersiz domain'leri ve uzantıları hariç tutar
        """
        emails = []
        seen_emails = set()

        # Ana pattern
        matches = re.findall(EMAIL_PATTERN, text, re.IGNORECASE)

        # Ek patternler - farklı formatlar için
        extra_patterns = [
            r'[\w.+-]+\s*@\s*[\w.-]+\.\w{2,}',  # Boşluklu format
            r'[\w.+-]+\s*\[at\]\s*[\w.-]+\.\w{2,}',  # [at] formatı
            r'[\w.+-]+\s*\(at\)\s*[\w.-]+\.\w{2,}',  # (at) formatı
        ]

        for pattern in extra_patterns:
            extra_matches = re.findall(pattern, text, re.IGNORECASE)
            # [at] ve (at) formatlarını @ ile değiştir
            for match in extra_matches:
                normalized = re.sub(r'\s*\[at\]\s*|\s*\(at\)\s*', '@', match, flags=re.IGNORECASE)
                normalized = re.sub(r'\s+', '', normalized)  # Boşlukları kaldır
                matches.append(normalized)

        for email in matches:
            email = email.strip().lower()

            # Tekrar kontrolü
            if email in seen_emails:
                continue

            # Geçerlilik kontrolü
            if not self._is_valid_email(email):
                continue

            # Context kontrolü - JavaScript/CSS içinde mi?
            email_pos = text.lower().find(email)
            if email_pos >= 0:
                context_start = max(0, email_pos - 50)
                context = text[context_start:email_pos].lower()

                # JavaScript/CSS içindeki sahte email'leri atla
                js_indicators = ['var ', 'const ', 'let ', 'function', '{', 'placeholder',
                                 'example', 'sample', 'test@', 'user@', 'your@', 'name@']
                if any(ind in context for ind in js_indicators):
                    continue

            seen_emails.add(email)
            emails.append(email)

        return emails

    def _find_address_in_text(self, text: str) -> Optional[str]:
        """Metinden adres çıkarmaya çalışır."""
        # Alakasız içerik kontrolü - bunları içeren metinleri atla
        exclude_keywords = [
            # Gizlilik/yasal
            'cookie', 'çerez', 'kişisel veri', 'gizlilik', 'privacy',
            'politika', 'policy', 'kabul', 'accept', 'depolama',
            'kvkk', 'gdpr', 'sözleşme', 'kullanım koşulları',
            # Anlamsız fragmanlar
            'gerekmektedir', 'gereklidir', 'yapılmalıdır', 'edilmelidir',
            'tıklayınız', 'tıklayın', 'click', 'button',
            # Navigasyon/menü
            'satış bölge', 'bölge müdür', 'yetkili servis', 'bayi listesi',
            'harita', 'yol tarifi', 'map', 'direction',
            # Diğer alakasız
            'haber', 'duyuru', 'blog', 'makale', 'tweet', 'facebook',
            'instagram', 'linkedin', 'youtube', 'sosyal medya',
            'sepet', 'ödeme', 'kargo', 'teslimat', 'fatura',
        ]
        text_lower = text.lower()
        if any(kw in text_lower for kw in exclude_keywords):
            return None

        # Türkçe adres göstergeleri - öncelik sırasına göre
        address_patterns = [
            # Tam adres formatı (en güvenilir)
            r'([A-ZÇĞİÖŞÜa-zçğıöşü\s]+(?:Mah\.?|Mahallesi)\s*,?\s*[A-ZÇĞİÖŞÜa-zçğıöşü\s]+(?:Cad\.?|Caddesi|Sok\.?|Sokak|Blv\.?|Bulvar)\s*(?:No\.?\s*:?\s*\d+)?[^.]*?\d{5}[^.]*?(?:İstanbul|Ankara|İzmir|Bursa|Antalya|Konya|Adana|Gaziantep|Kocaeli|Mersin|Kayseri|Eskişehir|Denizli|Manisa|Sakarya|Samsun|Trabzon)[^.]*)',
            # Mahalle + Cadde/Sokak + Şehir
            r'([A-ZÇĞİÖŞÜa-zçğıöşü\s]+(?:Mah\.?|Mahallesi)[^.]*?(?:Cad\.?|Caddesi|Sok\.?|Sokak|Blv\.?|Bulvar)[^.]*?(?:İstanbul|Ankara|İzmir|Bursa|Antalya|Konya|Adana|Gaziantep|Kocaeli|Mersin|Türkiye))',
        ]

        for pattern in address_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                potential_address = match.group(1) if match.groups() else match.group(0)
                cleaned = self.clean_text(potential_address)

                # Geçerlilik kontrolü
                if self._is_valid_address(cleaned):
                    return cleaned

        # Fallback: Basit adres göstergeleri ile
        simple_indicators = [
            r'\b(?:Mah|Mahallesi|Sok|Sokak|Cad|Caddesi|Bulvar|Blv)\b',
            r'\b(?:No|No\.)\s*[:\s]*\d+[^.]*?(?:Kat|Daire)\s*[:\s]*\d+',
        ]

        for pattern in simple_indicators:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                # Cümle sınırlarını bul (nokta, virgül dizisi ile ayrılmış)
                # Geriye doğru git, ilk büyük harfli kelimeyi bul
                start = match.start()
                while start > 0 and text[start-1] not in '.!?\n':
                    start -= 1

                # İleriye doğru git, cümle sonuna veya şehir adına kadar
                end = match.end()
                city_match = re.search(
                    r'(?:İstanbul|Ankara|İzmir|Bursa|Antalya|Konya|Adana|Gaziantep|Kocaeli|Mersin|Türkiye)',
                    text[end:end+100], re.IGNORECASE
                )
                if city_match:
                    end = end + city_match.end()
                else:
                    # Cümle sonuna kadar git
                    while end < len(text) and text[end] not in '.!?\n':
                        end += 1

                potential_address = text[start:end].strip()
                cleaned = self.clean_text(potential_address)

                # Geçerlilik kontrolü
                if self._is_valid_address(cleaned):
                    return cleaned

        return None

    def _is_valid_address(self, address: str) -> bool:
        """Adresin geçerli olup olmadığını kontrol eder."""
        if not address:
            return False

        # Uzunluk kontrolü
        if len(address) < 25 or len(address) > 250:
            return False

        address_lower = address.lower()

        # Geçersiz içerik kontrolü - bunları içermemeli
        invalid_patterns = [
            # Fiil ekleri ve cümle fragmanları
            'gerekmektedir', 'gereklidir', 'yapılmalıdır', 'yapılır',
            'edilmelidir', 'edilmektedir', 'alınmalıdır', 'atıldı',
            'kuruldu', 'açıldı', 'başladı', 'sağlanmaktadır',
            'bulunmaktadır', 'yer almaktadır', 'hizmet vermektedir',
            # Navigasyon/buton
            'tıklayın', 'tıklayınız', 'click', 'buraya', 'burada',
            'detay', 'devam', 'geri', 'ileri', 'seç', 'görüntüle',
            # Kurumsal
            'satış bölge', 'müdürlük', 'yetkili', 'bayi', 'temsilci',
            'distribütör', 'dealer', 'şube listesi',
            # Yasal/genel
            'lütfen', 'please', 'için', 'hakkında', 'about',
            'copyright', 'tüm hakları', 'all rights', 'reserved',
            # URL/email
            '@', 'http', 'www.', '.com', '.tr', '.net', '.org',
            # Sayfa içeriği
            'cookie', 'çerez', 'gizlilik', 'kvkk', 'aydınlatma',
            'sözleşme', 'koşul', 'şart', 'politika',
        ]
        if any(inv in address_lower for inv in invalid_patterns):
            return False

        # Türkçe karakter kontrolü - sadece Türkçe harfler, sayılar, noktalama
        # Adres genellikle tam cümle yapısında olmaz
        if address.count('.') > 3:  # Çok fazla cümle sonu
            return False

        # En az bir kesin adres bileşeni içermeli (ZORUNLU)
        mandatory_components = [
            r'\b(?:mah\.?|mahallesi)\b',  # Mahalle
            r'\b(?:sok\.?|sokak|sokağı)\b',  # Sokak
            r'\b(?:cad\.?|caddesi|cadde)\b',  # Cadde
            r'\b(?:bulvar|blv\.?)\b',  # Bulvar
        ]
        has_street_component = any(re.search(p, address_lower) for p in mandatory_components)

        if not has_street_component:
            return False

        # Numara veya posta kodu varsa bonus
        has_number = bool(re.search(r'\bno\.?\s*[:\s]*\d+', address_lower))
        has_postal = bool(re.search(r'\b\d{5}\b', address_lower))

        # Şehir adı kontrolü
        cities = [
            'istanbul', 'ankara', 'izmir', 'bursa', 'antalya', 'konya',
            'adana', 'gaziantep', 'kocaeli', 'mersin', 'kayseri',
            'eskişehir', 'denizli', 'manisa', 'sakarya', 'samsun',
            'trabzon', 'diyarbakır', 'şanlıurfa', 'malatya', 'erzurum',
            'van', 'batman', 'elazığ', 'kahramanmaraş', 'türkiye'
        ]
        has_city = any(city in address_lower for city in cities)

        # Geçerlilik: Sokak/cadde/mahalle + (şehir VEYA posta kodu VEYA numara)
        return has_street_component and (has_city or has_postal or has_number)

    def _is_valid_email(self, email: str) -> bool:
        """
        Email'in geçerli olup olmadığını kontrol eder (geliştirilmiş versiyon).

        Kontroller:
        - Format doğrulaması
        - Hariç tutulan domain/uzantılar
        - Placeholder email'leri reddetme
        - Minimum uzunluk kontrolü
        """
        if not email:
            return False

        email_lower = email.lower().strip()

        # Minimum uzunluk kontrolü (x@y.zz = en az 6 karakter)
        if len(email_lower) < 6:
            return False

        # @ işareti kontrolü
        if '@' not in email_lower or email_lower.count('@') != 1:
            return False

        # Hariç tutulan uzantıları kontrol et (görsel dosyaları)
        for ext in EMAIL_EXCLUDE_EXTENSIONS:
            if email_lower.endswith(ext):
                return False

        # Hariç tutulan domain'leri kontrol et
        for domain in EMAIL_EXCLUDE_DOMAINS:
            if domain in email_lower:
                return False

        # Placeholder email'leri reddet
        placeholder_patterns = [
            'example.com', 'test.com', 'sample.com', 'demo.com', 'dummy.com',
            'email@email', 'your@email', 'name@email', 'user@email',
            'xxx@', 'abc@abc', 'info@info.', 'admin@admin.',
            '@localhost', '@domain.com', '@yoursite', '@yourdomain',
            'placeholder', 'noreply@example', 'no-reply@example'
        ]
        if any(ph in email_lower for ph in placeholder_patterns):
            return False

        # Tam eşleşme gereken placeholder'lar
        exact_placeholders = [
            'info@info.com', 'test@test.com', 'admin@admin.com',
            'email@email.com', 'mail@mail.com', 'user@user.com'
        ]
        if email_lower in exact_placeholders:
            return False

        # Domain kısmını kontrol et
        parts = email_lower.split('@')
        if len(parts) != 2:
            return False

        local_part, domain = parts

        # Local part kontrolü
        if not local_part or len(local_part) < 1:
            return False

        # Domain kontrolü
        if not domain or '.' not in domain:
            return False

        # Domain TLD kontrolü
        domain_parts = domain.split('.')
        tld = domain_parts[-1]
        if len(tld) < 2 or len(tld) > 10:
            return False

        # Sadece rakamlardan oluşan domain'leri reddet
        if domain.replace('.', '').isdigit():
            return False

        # Temel format kontrolü
        if not re.match(EMAIL_PATTERN, email, re.IGNORECASE):
            return False

        return True

    def _select_best_phone(self, phones: List[str]) -> str:
        """En iyi telefon numarasını seçer (sabit hat öncelikli)."""
        if not phones:
            return ''

        # Sabit hat tercih et (0212, 0216 vb.)
        for phone in phones:
            digits = re.sub(r'\D', '', phone)
            if digits.startswith('90212') or digits.startswith('90216') or \
               digits.startswith('0212') or digits.startswith('0216'):
                return phone

        # Diğer sabit hatlar
        for phone in phones:
            digits = re.sub(r'\D', '', phone)
            if digits.startswith('902') or digits.startswith('02'):
                return phone

        # İlk telefonu döndür
        return phones[0]

    def _select_best_email(self, emails: List[str]) -> str:
        """En iyi email'i seçer (info@, contact@ öncelikli)."""
        if not emails:
            return ''

        # Öncelikli prefix'ler
        priority_prefixes = ['info@', 'contact@', 'iletisim@', 'sales@', 'satis@']

        for prefix in priority_prefixes:
            for email in emails:
                if email.lower().startswith(prefix):
                    return email

        # İlk email'i döndür
        return emails[0]

    def _format_phone(self, phone: str) -> str:
        """
        Telefon numarasını temizler ve formatlar (geliştirilmiş versiyon).

        Args:
            phone: Ham telefon string'i

        Returns:
            str: Formatlanmış telefon numarası veya boş string

        Desteklenen formatlar:
        - +90 XXX XXX XX XX
        - 0XXX XXX XX XX
        - (0XXX) XXX XX XX
        """
        if not phone:
            return ''

        # Sadece rakam ve + işaretini koru
        cleaned = re.sub(r'[^\d+]', '', phone)

        # Çok kısa numaraları reddet
        if len(cleaned) < 10:
            return ''

        # Çok uzun numaraları kırp (extension olabilir)
        if len(cleaned) > 15:
            cleaned = cleaned[:13]  # +90 + 10 hane

        # Farklı formatları normalize et
        # 0090 -> +90
        if cleaned.startswith('0090'):
            cleaned = '+9' + cleaned[2:]
        # 90 (+ olmadan) -> +90
        elif cleaned.startswith('90') and len(cleaned) == 12:
            cleaned = '+' + cleaned
        # 0 ile başlıyor ve 11 hane -> +90 ekle
        elif cleaned.startswith('0') and len(cleaned) == 11:
            cleaned = '+9' + cleaned
        # 10 hane (alan kodu dahil, başında 0 yok)
        elif len(cleaned) == 10 and not cleaned.startswith('+'):
            cleaned = '+90' + cleaned

        # Formatlama: +90 XXX XXX XX XX
        if cleaned.startswith('+90') and len(cleaned) == 13:
            return f"+90 {cleaned[3:6]} {cleaned[6:9]} {cleaned[9:11]} {cleaned[11:13]}"
        # +90 ile başlıyor ama 13 haneden uzun (extension var)
        elif cleaned.startswith('+90') and len(cleaned) > 13:
            base = f"+90 {cleaned[3:6]} {cleaned[6:9]} {cleaned[9:11]} {cleaned[11:13]}"
            ext = cleaned[13:]
            if ext:
                return f"{base} (Dahili: {ext})"
            return base
        # Diğer formatlar için orijinal temizlenmiş hali döndür
        elif len(cleaned) >= 10:
            return cleaned

        return ''

    def _download_catalogs(self, catalog_urls: List[str],
                           company_name: str) -> List[str]:
        """
        Katalog dosyalarını indirir.

        Args:
            catalog_urls: İndirilecek katalog URL'leri
            company_name: Firma adı (klasör için)

        Returns:
            List[str]: İndirilen dosya yolları
        """
        downloaded = []

        for url in catalog_urls:
            result = self.downloader.download(url, company_name)
            if result['success']:
                downloaded.append(result['file_path'])

        return downloaded

    def extract_company_info(self, website: str, company_name: str,
                             sector: str = '') -> Dict[str, Any]:
        """
        Firma bilgilerini çıkarır (scrape metodunun alias'ı).

        Args:
            website: Firma web sitesi
            company_name: Firma adı
            sector: Sektör

        Returns:
            Dict: Firma bilgileri
        """
        return self.scrape(website, company_name, sector)

    def close(self) -> None:
        """
        Kaynakları temizler.

        Session, Selenium driver ve strateji yöneticisini kapatır.
        """
        # Parent class'ın close'unu çağır
        super().close()

        # Strateji yöneticisini kapat
        if self._strategy_manager:
            try:
                self._strategy_manager.close()
                logger.debug("Strateji yöneticisi kapatıldı")
            except Exception as e:
                logger.debug(f"Strateji yöneticisi kapatılırken hata: {e}")
            finally:
                self._strategy_manager = None
