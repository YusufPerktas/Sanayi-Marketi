"""
File Downloader Module
======================
Katalog dosyalarını indiren modül.

Özellikler:
- Türkçe karakter desteği
- Hash kontrolü ile tekrar indirmeyi önleme
- Progress göstergesi
- Retry mekanizması
"""

import os
import re
import hashlib
import requests
from typing import Optional, Tuple, List, Dict
from urllib.parse import urlparse, unquote
from datetime import datetime

# Config'den ayarları al
try:
    from config.settings import (
        CATALOGS_DIR,
        DOWNLOAD_TIMEOUT,
        MAX_RETRIES,
        USER_AGENT,
        VALID_EXTENSIONS,
        PDF_POSITIVE_KEYWORDS,
        PDF_NEGATIVE_KEYWORDS,
        PDF_MIN_SIZE,
        PDF_MAX_SIZE
    )
except ImportError:
    CATALOGS_DIR = 'output/catalogs'
    DOWNLOAD_TIMEOUT = 30
    MAX_RETRIES = 3
    USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    VALID_EXTENSIONS = ['.pdf', '.doc', '.docx', '.xls', '.xlsx']
    PDF_POSITIVE_KEYWORDS = ['katalog', 'catalog', 'product', 'urun', 'fiyat', 'price']
    PDF_NEGATIVE_KEYWORDS = ['privacy', 'policy', 'terms', 'legal', 'kvkk', 'gizlilik']
    PDF_MIN_SIZE = 10000
    PDF_MAX_SIZE = 100000000

from utils.logger import get_logger
from utils.validators import sanitize_filename

logger = get_logger(__name__)


class FileDownloader:
    """
    Katalog dosyalarını indiren sınıf.

    Özellikler:
    - Firma bazlı klasör yapısı
    - Hash kontrolü ile duplicate önleme
    - Retry mekanizması
    - Türkçe dosya adı desteği

    Attributes:
        base_dir: Katalogların indirileceği ana dizin
        timeout: İndirme zaman aşımı (saniye)
        max_retries: Maksimum yeniden deneme sayısı
        downloaded_hashes: İndirilen dosyaların hash'leri (duplicate kontrolü)

    Example:
        >>> downloader = FileDownloader()
        >>> result = downloader.download(
        ...     url="https://example.com/katalog.pdf",
        ...     company_name="ABC Firma"
        ... )
        >>> print(result)
        {'success': True, 'file_path': 'output/catalogs/ABC_Firma/katalog.pdf'}
    """

    def __init__(self, base_dir: Optional[str] = None):
        """
        FileDownloader'ı başlatır.

        Args:
            base_dir: Katalogların indirileceği ana dizin (varsayılan: CATALOGS_DIR)
        """
        self.base_dir = base_dir or CATALOGS_DIR
        self.timeout = DOWNLOAD_TIMEOUT
        self.max_retries = MAX_RETRIES
        self.downloaded_hashes: Dict[str, str] = {}  # hash -> file_path

        # Headers
        self.headers = {
            'User-Agent': USER_AGENT,
            'Accept': '*/*',
            'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
            'Accept-Encoding': 'gzip, deflate, br'
        }

        # Ana dizini oluştur
        os.makedirs(self.base_dir, exist_ok=True)

    def should_download_url(self, url: str, link_text: str = '') -> Tuple[bool, str]:
        """
        URL'nin indirilip indirilmeyeceğini kontrol eder (indirmeden önce).

        Negatif keyword varsa indirmez, pozitif keyword varsa öncelik verir.

        Args:
            url: Kontrol edilecek URL
            link_text: Link metni (opsiyonel)

        Returns:
            Tuple[bool, str]: (İndirilsin mi, Sebep)

        Example:
            >>> should_download, reason = downloader.should_download_url(
            ...     "https://example.com/privacy-policy.pdf", "Gizlilik Politikası"
            ... )
            >>> print(should_download)  # False
            >>> print(reason)  # "Negative keyword: privacy"
        """
        url_lower = url.lower()
        text_lower = link_text.lower() if link_text else ''
        combined = f"{url_lower} {text_lower}"

        # Negatif keyword kontrolü (bunlar engelleyici)
        for neg_kw in PDF_NEGATIVE_KEYWORDS:
            if neg_kw in combined:
                return False, f"Negative keyword: {neg_kw}"

        # Pozitif keyword kontrolü
        has_positive = any(pos_kw in combined for pos_kw in PDF_POSITIVE_KEYWORDS)

        if has_positive:
            return True, "Has positive keyword"

        # Negatif yok ama pozitif de yok - yine de indir (düşük öncelik)
        return True, "No blocking keywords"

    def get_url_score(self, url: str, link_text: str = '') -> int:
        """
        URL'ye relevance skoru verir (0-100).

        Yüksek skor = daha relevant (katalog/ürün dosyası olma ihtimali yüksek)

        Args:
            url: Skorlanacak URL
            link_text: Link metni

        Returns:
            int: Relevance skoru (0-100)
        """
        score = 50  # Başlangıç skoru
        url_lower = url.lower()
        text_lower = link_text.lower() if link_text else ''
        combined = f"{url_lower} {text_lower}"

        # Negatif keyword'ler skoru ciddi düşürür
        for neg_kw in PDF_NEGATIVE_KEYWORDS:
            if neg_kw in combined:
                score -= 60  # Ağır ceza
                break

        # Pozitif keyword'ler skoru artırır
        positive_matches = sum(1 for pos_kw in PDF_POSITIVE_KEYWORDS if pos_kw in combined)
        score += positive_matches * 15  # Her eşleşme için +15

        # URL path analizi
        if '/catalog' in url_lower or '/katalog' in url_lower:
            score += 20
        if '/product' in url_lower or '/urun' in url_lower:
            score += 15
        if '/download' in url_lower or '/indir' in url_lower:
            score += 10

        return max(0, min(100, score))  # 0-100 arasında tut

    def validate_pdf_content(self, content: bytes, url: str) -> Tuple[bool, str]:
        """
        PDF içeriğini doğrular (boyut ve header kontrolü).

        Args:
            content: PDF içeriği (bytes)
            url: Dosya URL'si (loglama için)

        Returns:
            Tuple[bool, str]: (Geçerli mi, Sebep)
        """
        content_size = len(content)

        # Boyut kontrolü
        if content_size < PDF_MIN_SIZE:
            return False, f"Dosya çok küçük: {content_size} bytes (min: {PDF_MIN_SIZE})"

        if content_size > PDF_MAX_SIZE:
            return False, f"Dosya çok büyük: {content_size} bytes (max: {PDF_MAX_SIZE})"

        # PDF header kontrolü
        if content[:4] != b'%PDF':
            return False, "Geçersiz PDF header"

        return True, "Valid PDF"

    def download(self, url: str, company_name: str,
                 custom_filename: Optional[str] = None,
                 link_text: str = '') -> Dict[str, any]:
        """
        Dosyayı indirir ve kaydeder (URL pre-filtering ile).

        Args:
            url: İndirilecek dosyanın URL'si
            company_name: Firma adı (klasör oluşturmak için)
            custom_filename: Özel dosya adı (opsiyonel)
            link_text: Link metni (filtreleme için)

        Returns:
            Dict: İndirme sonucu
                - success (bool): Başarılı mı
                - file_path (str): Kaydedilen dosya yolu
                - error (str): Hata mesajı (başarısız ise)
                - skipped (bool): Atlandı mı
                - skip_reason (str): Atlama sebebi

        Example:
            >>> result = downloader.download(
            ...     "https://example.com/doc.pdf",
            ...     "Test Firma"
            ... )
        """
        result = {
            'success': False,
            'file_path': None,
            'error': None,
            'skipped': False,
            'skip_reason': None,
            'url': url
        }

        try:
            # =================================================================
            # PRE-DOWNLOAD FILTERING (Yeni!)
            # =================================================================
            should_download, filter_reason = self.should_download_url(url, link_text)

            if not should_download:
                logger.info(f"URL filtrelendi: {url} - Sebep: {filter_reason}")
                result['skipped'] = True
                result['skip_reason'] = filter_reason
                return result

            # URL hash ile duplicate kontrolü (indirmeden önce)
            url_hash = hashlib.md5(url.encode()).hexdigest()
            if url_hash in self.downloaded_hashes:
                result['success'] = True
                result['file_path'] = self.downloaded_hashes[url_hash]
                result['skipped'] = True
                result['skip_reason'] = "URL already downloaded"
                return result

            # =================================================================
            # DOWNLOAD
            # =================================================================
            # Firma klasörünü oluştur
            company_dir = self._get_company_dir(company_name)

            # Dosya adını belirle
            filename = custom_filename or self._extract_filename(url)
            filename = sanitize_filename(filename)

            # Uzantı kontrolü
            if not self._has_valid_extension(filename):
                result['error'] = f"Geçersiz dosya uzantısı: {filename}"
                logger.warning(f"Geçersiz uzantı: {filename}")
                return result

            # Dosyayı indir
            file_path = os.path.join(company_dir, filename)

            for attempt in range(1, self.max_retries + 1):
                try:
                    logger.debug(f"İndiriliyor (deneme {attempt}): {url}")

                    response = requests.get(
                        url,
                        headers=self.headers,
                        timeout=self.timeout,
                        stream=True,
                        allow_redirects=True
                    )
                    response.raise_for_status()

                    # İçeriği oku
                    content = response.content

                    # =================================================================
                    # CONTENT VALIDATION (Yeni!)
                    # =================================================================
                    if filename.lower().endswith('.pdf'):
                        is_valid, validation_msg = self.validate_pdf_content(content, url)
                        if not is_valid:
                            logger.info(f"PDF doğrulama başarısız: {url} - {validation_msg}")
                            result['skipped'] = True
                            result['skip_reason'] = validation_msg
                            return result

                    # Hash kontrolü (içerik bazlı duplicate)
                    content_hash = self._calculate_hash(content)

                    if content_hash in self.downloaded_hashes:
                        existing_file = self.downloaded_hashes[content_hash]
                        logger.info(f"Aynı içerik zaten mevcut: {existing_file}")
                        result['success'] = True
                        result['file_path'] = existing_file
                        result['skipped'] = True
                        result['skip_reason'] = "Duplicate content"
                        return result

                    # Dosyayı kaydet
                    file_path = self._save_file(content, company_dir, filename)

                    # Hash'leri kaydet
                    self.downloaded_hashes[content_hash] = file_path
                    self.downloaded_hashes[url_hash] = file_path

                    logger.info(f"İndirildi: {filename}")
                    result['success'] = True
                    result['file_path'] = file_path
                    return result

                except requests.RequestException as e:
                    logger.warning(f"İndirme hatası (deneme {attempt}): {str(e)}")
                    if attempt == self.max_retries:
                        raise

        except requests.RequestException as e:
            result['error'] = f"İndirme hatası: {str(e)}"
            logger.error(f"İndirme başarısız: {url} - {str(e)}")

        except Exception as e:
            result['error'] = f"Beklenmeyen hata: {str(e)}"
            logger.error(f"Beklenmeyen hata: {url} - {str(e)}")

        return result

    def download_multiple(self, urls: List[str], company_name: str) -> List[Dict]:
        """
        Birden fazla dosyayı indirir.

        Args:
            urls: İndirilecek URL listesi
            company_name: Firma adı

        Returns:
            List[Dict]: Her dosya için indirme sonuçları

        Example:
            >>> urls = ["https://ex.com/1.pdf", "https://ex.com/2.pdf"]
            >>> results = downloader.download_multiple(urls, "Firma")
        """
        results = []

        for i, url in enumerate(urls, 1):
            logger.info(f"[{i}/{len(urls)}] İndiriliyor...")
            result = self.download(url, company_name)
            results.append(result)

        # Özet
        success_count = sum(1 for r in results if r['success'])
        logger.info(f"Toplam: {len(urls)}, Başarılı: {success_count}")

        return results

    def _get_company_dir(self, company_name: str) -> str:
        """
        Firma için klasör oluşturur ve yolunu döndürür.

        Args:
            company_name: Firma adı

        Returns:
            str: Firma klasör yolu
        """
        # Firma adını güvenli hale getir
        safe_name = sanitize_filename(company_name)

        # Klasör yolu
        company_dir = os.path.join(self.base_dir, safe_name)

        # Klasörü oluştur
        os.makedirs(company_dir, exist_ok=True)

        return company_dir

    def _extract_filename(self, url: str) -> str:
        """
        URL'den dosya adını çıkarır.

        Args:
            url: Dosya URL'si

        Returns:
            str: Dosya adı
        """
        try:
            # URL'yi parse et
            parsed = urlparse(url)
            path = unquote(parsed.path)

            # Son kısmı al
            filename = os.path.basename(path)

            # Eğer dosya adı yoksa veya uzantısı yoksa
            if not filename or '.' not in filename:
                # Timestamp ile benzersiz isim oluştur
                timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                filename = f"catalog_{timestamp}.pdf"

            return filename

        except Exception:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            return f"catalog_{timestamp}.pdf"

    def _has_valid_extension(self, filename: str) -> bool:
        """
        Dosya uzantısının geçerli olup olmadığını kontrol eder.

        Args:
            filename: Dosya adı

        Returns:
            bool: Uzantı geçerliyse True
        """
        lower_name = filename.lower()
        return any(lower_name.endswith(ext) for ext in VALID_EXTENSIONS)

    def _calculate_hash(self, content: bytes) -> str:
        """
        İçeriğin MD5 hash'ini hesaplar.

        Args:
            content: Dosya içeriği (bytes)

        Returns:
            str: MD5 hash
        """
        return hashlib.md5(content).hexdigest()

    def _save_file(self, content: bytes, directory: str, filename: str) -> str:
        """
        Dosyayı diske kaydeder.

        Aynı isimde dosya varsa numaralandırır.

        Args:
            content: Dosya içeriği
            directory: Hedef dizin
            filename: Dosya adı

        Returns:
            str: Kaydedilen dosya yolu
        """
        file_path = os.path.join(directory, filename)

        # Aynı isimde dosya varsa numaralandır
        if os.path.exists(file_path):
            name, ext = os.path.splitext(filename)
            counter = 1

            while os.path.exists(file_path):
                new_filename = f"{name}_{counter}{ext}"
                file_path = os.path.join(directory, new_filename)
                counter += 1

        # Dosyayı kaydet
        with open(file_path, 'wb') as f:
            f.write(content)

        return file_path

    def get_downloaded_files(self, company_name: str) -> List[str]:
        """
        Firma için indirilen dosyaları listeler.

        Args:
            company_name: Firma adı

        Returns:
            List[str]: İndirilen dosya yolları
        """
        company_dir = os.path.join(self.base_dir, sanitize_filename(company_name))

        if not os.path.exists(company_dir):
            return []

        files = []
        for filename in os.listdir(company_dir):
            file_path = os.path.join(company_dir, filename)
            if os.path.isfile(file_path) and self._has_valid_extension(filename):
                files.append(file_path)

        return files

    def clear_hash_cache(self) -> None:
        """Hash önbelleğini temizler."""
        self.downloaded_hashes.clear()
        logger.debug("Hash önbelleği temizlendi")
