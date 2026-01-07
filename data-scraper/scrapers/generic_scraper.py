"""
Generic Scraper Module
======================
Genel amaçlı web scraper.

Her türlü firma web sitesinden katalog ve iletişim bilgisi
çıkarmak için tasarlanmış esnek bir scraper.
"""

import re
from typing import Dict, List, Any, Optional, Set
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

    def __init__(self, max_depth: int = 2):
        """
        GenericScraper'ı başlatır.

        Args:
            max_depth: Maksimum link takip derinliği (varsayılan: 2)
        """
        super().__init__()
        self.downloader = FileDownloader()
        self.visited_urls: Set[str] = set()
        self.max_depth = max_depth

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
                logger.error(f"Ana sayfa çekilemedi: {website}")
                result['status'] = STATUS_ERROR
                return result

            # =================================================================
            # 2. KATALOG LİNKLERİNİ BUL
            # =================================================================
            catalog_links = self._find_all_catalogs(main_soup, base_url)

            logger.info(f"Bulunan katalog sayısı: {len(catalog_links)}")

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
            logger.error(f"Scraping hatası ({company_name}): {str(e)}")
            result['status'] = STATUS_ERROR

        return result

    def _find_all_catalogs(self, main_soup: BeautifulSoup,
                           base_url: str) -> List[str]:
        """
        Ana sayfa ve alt sayfalardan tüm katalog linklerini bulur.

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

        # 2. Katalog sayfalarını bul ve tara
        catalog_pages = self.find_pages_by_keywords(
            main_soup, base_url, CATALOG_PAGE_KEYWORDS
        )

        for page_url in catalog_pages:
            if page_url in self.visited_urls:
                continue

            self.visited_urls.add(page_url)
            logger.debug(f"Katalog sayfası taranıyor: {page_url}")

            page_soup = self.fetch_page(page_url)
            if page_soup:
                page_catalogs = self.extract_catalog_links(page_soup, base_url)
                all_catalogs.update(page_catalogs)
                logger.debug(f"Alt sayfada {len(page_catalogs)} katalog bulundu")

        return list(all_catalogs)

    def extract_catalog_links(self, soup: BeautifulSoup, base_url: str) -> List[str]:
        """
        Sayfadan katalog dosya linklerini çıkarır (geliştirilmiş filtering ile).

        Arama stratejisi:
        1. Doğrudan dosya uzantılı linkler (.pdf, .doc, etc.)
        2. Negatif keyword filtreleme (privacy, terms vb. hariç)
        3. Pozitif keyword skorlama (katalog, ürün vb. öncelikli)

        Args:
            soup: BeautifulSoup nesnesi
            base_url: Sayfanın base URL'si

        Returns:
            List[str]: Katalog dosya URL'leri (relevance'a göre sıralı)
        """
        from typing import Tuple

        # (url, score, link_text) tuple'ları
        catalog_candidates: List[Tuple[str, int, str]] = []

        # Tüm linkleri tara
        for link in soup.find_all('a', href=True):
            href = link['href']
            href_lower = href.lower()
            link_text = link.get_text().strip()
            link_text_lower = link_text.lower()

            # 1. Dosya uzantısı kontrolü
            has_valid_ext = any(href_lower.endswith(ext) for ext in VALID_EXTENSIONS)

            if not has_valid_ext:
                continue

            full_url = self.resolve_url(base_url, href)

            # 2. Pre-filter: Negatif keyword kontrolü
            should_download, reason = self.downloader.should_download_url(full_url, link_text)

            if not should_download:
                logger.debug(f"Link filtrelendi: {full_url} - {reason}")
                continue

            # 3. Relevance skoru hesapla
            score = self.downloader.get_url_score(full_url, link_text)

            catalog_candidates.append((full_url, score, link_text))

        # Embed edilmiş PDF'leri de kontrol et
        for embed in soup.find_all(['embed', 'object', 'iframe']):
            src = embed.get('src') or embed.get('data')
            if src:
                src_lower = src.lower()
                if any(src_lower.endswith(ext) for ext in VALID_EXTENSIONS):
                    full_url = self.resolve_url(base_url, src)
                    should_download, _ = self.downloader.should_download_url(full_url, '')
                    if should_download:
                        score = self.downloader.get_url_score(full_url, '')
                        catalog_candidates.append((full_url, score, ''))

        # Skora göre sırala (yüksekten düşüğe) ve duplicate'ları kaldır
        catalog_candidates.sort(key=lambda x: x[1], reverse=True)

        seen_urls: Set[str] = set()
        result: List[str] = []

        for url, score, _ in catalog_candidates:
            if url not in seen_urls:
                seen_urls.add(url)
                result.append(url)
                logger.debug(f"Katalog adayı: {url} (skor: {score})")

        return result

    def _find_contact_info(self, main_soup: BeautifulSoup,
                           base_url: str) -> Dict[str, str]:
        """
        İletişim bilgilerini bulur (ana sayfa + iletişim sayfaları).

        Geliştirilmiş versiyon: Daha fazla sayfa kontrol eder, Selenium kullanır.

        Args:
            main_soup: Ana sayfa BeautifulSoup nesnesi
            base_url: Base URL

        Returns:
            Dict: İletişim bilgileri
        """
        contact_info = {'phone': '', 'email': '', 'address': ''}

        # 1. Ana sayfadan dene
        contact_info = self.extract_contact_info(main_soup)

        # Eğer eksik bilgi varsa iletişim sayfalarını tara
        if not contact_info['phone'] or not contact_info['email']:
            contact_pages = self.find_pages_by_keywords(
                main_soup, base_url, CONTACT_KEYWORDS
            )

            # Daha fazla sayfa kontrol et (eskiden 2 idi)
            max_contact_pages = 5

            for page_url in contact_pages[:max_contact_pages]:
                if page_url in self.visited_urls:
                    continue

                self.visited_urls.add(page_url)
                logger.debug(f"İletişim sayfası taranıyor: {page_url}")

                # İletişim sayfaları için Selenium kullan (genellikle dinamik içerik var)
                page_soup = self.fetch_page_with_js(page_url)

                if not page_soup:
                    page_soup = self.fetch_page(page_url)

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
                        break

        return contact_info

    def extract_contact_info(self, soup: BeautifulSoup) -> Dict[str, str]:
        """
        Sayfadan iletişim bilgilerini çıkarır (geliştirilmiş versiyon).

        Strateji:
        1. Semantik HTML etiketlerinden (address, footer, contact divs)
        2. Labeled patterns (Tel:, Email:, Adres:)
        3. mailto: ve tel: linkleri
        4. Fallback: full-page regex scan

        Args:
            soup: BeautifulSoup nesnesi

        Returns:
            Dict[str, str]: İletişim bilgileri (phone, email, address)
        """
        contact = {
            'phone': '',
            'email': '',
            'address': '',
            'phones': [],   # Bulunan tüm telefonlar
            'emails': []    # Bulunan tüm email'ler
        }

        # =================================================================
        # STRATEGY 1: Semantik HTML Etiketleri
        # =================================================================
        contact = self._extract_from_semantic_elements(soup, contact)

        # =================================================================
        # STRATEGY 2: Etiketli Pattern'ler
        # =================================================================
        if not contact['phone'] or not contact['email']:
            contact = self._extract_from_labeled_patterns(soup, contact)

        # =================================================================
        # STRATEGY 3: mailto: ve tel: linkleri
        # =================================================================
        if not contact['email']:
            contact = self._extract_from_links(soup, contact)

        # =================================================================
        # STRATEGY 4: Full-page regex (fallback)
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
        """Etiketli pattern'lerden iletişim bilgisi çıkarır."""
        page_text = soup.get_text(separator='\n')

        # Telefon label'ları ile ara
        for label in PHONE_LABELS:
            pattern = rf'(?:{label})[\s:]*([+\d\s\-\(\)]{10,20})'
            matches = re.findall(pattern, page_text, re.IGNORECASE)
            for match in matches:
                formatted = self._format_phone(match)
                if formatted and formatted not in contact['phones']:
                    # Fax olmadığından emin ol
                    context_start = max(0, page_text.lower().find(match.lower()) - 20)
                    context = page_text[context_start:context_start + 50].lower()
                    if not any(fax in context for fax in FAX_LABELS):
                        contact['phones'].append(formatted)

        # Email label'ları ile ara
        for label in EMAIL_LABELS:
            pattern = rf'(?:{label})[\s:]*({EMAIL_PATTERN})'
            matches = re.findall(pattern, page_text, re.IGNORECASE)
            for match in matches:
                if self._is_valid_email(match) and match not in contact['emails']:
                    contact['emails'].append(match)

        # Adres label'ları ile ara
        if not contact['address']:
            for label in ADDRESS_LABELS:
                pattern = rf'(?:{label})[\s:]*([^\n]{{20,150}})'
                match = re.search(pattern, page_text, re.IGNORECASE)
                if match:
                    address = self.clean_text(match.group(1))
                    if 20 < len(address) < 200:
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
        """Metinden tüm telefon numaralarını bulur."""
        phones = []
        matches = re.findall(PHONE_PATTERN, text)

        for match in matches:
            formatted = self._format_phone(match)
            if formatted and formatted not in phones:
                # En az 10 rakam kontrolü
                digits = re.sub(r'\D', '', formatted)
                if len(digits) >= 10:
                    phones.append(formatted)

        return phones

    def _find_emails_in_text(self, text: str) -> List[str]:
        """Metinden tüm email adreslerini bulur."""
        emails = []
        matches = re.findall(EMAIL_PATTERN, text)

        for email in matches:
            if self._is_valid_email(email) and email not in emails:
                emails.append(email)

        return emails

    def _find_address_in_text(self, text: str) -> Optional[str]:
        """Metinden adres çıkarmaya çalışır."""
        # Türkçe adres göstergeleri
        address_indicators = [
            r'\b(?:Mah|Mahallesi|Sok|Sokak|Cad|Caddesi|Bulvar|Blv)\b',
            r'\b(?:No|No\.|Kat|Daire)\s*[:\s]*\d+',
            r'\b\d{5}\b',  # Posta kodu
            r'\b(?:İstanbul|Ankara|İzmir|Bursa|Antalya|Konya|Adana|Gaziantep|Kocaeli|Mersin)\b',
        ]

        for pattern in address_indicators:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                # Çevredeki bağlamı adres olarak al
                start = max(0, match.start() - 50)
                end = min(len(text), match.end() + 100)
                potential_address = text[start:end]

                # Temizle ve doğrula
                cleaned = self.clean_text(potential_address)
                if 20 < len(cleaned) < 200:
                    return cleaned

        return None

    def _is_valid_email(self, email: str) -> bool:
        """Email'in geçerli olup olmadığını kontrol eder."""
        if not email:
            return False

        email_lower = email.lower()

        # Hariç tutulan uzantıları kontrol et
        for ext in EMAIL_EXCLUDE_EXTENSIONS:
            if email_lower.endswith(ext):
                return False

        # Hariç tutulan domain'leri kontrol et
        for domain in EMAIL_EXCLUDE_DOMAINS:
            if domain in email_lower:
                return False

        # Temel format kontrolü
        if not re.match(EMAIL_PATTERN, email):
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
        Telefon numarasını temizler ve formatlar.

        Args:
            phone: Ham telefon string'i

        Returns:
            str: Formatlanmış telefon numarası
        """
        # Sadece rakam ve + işaretini koru
        cleaned = re.sub(r'[^\d+]', '', phone)

        # Başında 0 varsa ve 11 haneli ise +90 ekle
        if cleaned.startswith('0') and len(cleaned) == 11:
            cleaned = '+9' + cleaned

        # Formatlama: +90 XXX XXX XX XX
        if cleaned.startswith('+90') and len(cleaned) == 13:
            return f"+90 {cleaned[3:6]} {cleaned[6:9]} {cleaned[9:11]} {cleaned[11:13]}"

        return phone.strip()

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
