"""
Validators Module
=================
Katalog varlığı ve firma verisi doğrulama fonksiyonları.

Bu modül, scraping sonuçlarının geçerliliğini kontrol eder
ve Excel'e yazılacak verileri filtreler.
"""

import re
from typing import Dict, List, Any, Optional
from urllib.parse import urlparse

# Config'den ayarları al
try:
    from config.settings import (
        VALID_EXTENSIONS,
        STATUS_SUCCESS,
        STATUS_PARTIAL,
        STATUS_FAILED,
        STATUS_ERROR,
        EMAIL_PATTERN,
        PHONE_PATTERN
    )
except ImportError:
    VALID_EXTENSIONS = ['.pdf', '.doc', '.docx', '.xls', '.xlsx']
    STATUS_SUCCESS = 'SUCCESS'
    STATUS_PARTIAL = 'PARTIAL'
    STATUS_FAILED = 'FAILED'
    STATUS_ERROR = 'ERROR'
    EMAIL_PATTERN = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
    PHONE_PATTERN = r'(?:\+90|0)?[\s.-]?(?:\(?\d{3}\)?[\s.-]?)?\d{3}[\s.-]?\d{2}[\s.-]?\d{2}'


def validate_catalog_exists(company_data: Dict[str, Any]) -> bool:
    """
    Firma verisinde katalog bulunup bulunmadığını kontrol eder.

    Katalog bulunamayan firmalar Excel'e yazılmamalıdır.

    Args:
        company_data: Firma verisi dictionary'si

    Returns:
        bool: Katalog varsa True, yoksa False

    Example:
        >>> data = {'catalog_files': ['katalog.pdf'], 'catalog_count': 1}
        >>> validate_catalog_exists(data)
        True

        >>> data = {'catalog_files': [], 'catalog_count': 0}
        >>> validate_catalog_exists(data)
        False
    """
    # catalog_count kontrolü
    catalog_count = company_data.get('catalog_count', 0)
    if catalog_count > 0:
        return True

    # catalog_files kontrolü
    catalog_files = company_data.get('catalog_files', [])
    if catalog_files and len(catalog_files) > 0:
        return True

    # downloaded_catalogs kontrolü (indirilen dosyalar)
    downloaded = company_data.get('downloaded_catalogs', [])
    if downloaded and len(downloaded) > 0:
        return True

    return False


def validate_company_data(company_data: Dict[str, Any]) -> bool:
    """
    Firma verisinin Excel'e yazılmaya uygun olup olmadığını kontrol eder.

    Kurallar:
    - FAILED veya ERROR status'lü firmalar yazılmaz
    - Katalog bulunamayan firmalar yazılmaz

    Args:
        company_data: Firma verisi dictionary'si

    Returns:
        bool: Veri geçerliyse True, değilse False

    Example:
        >>> data = {'status': 'SUCCESS', 'catalog_count': 2}
        >>> validate_company_data(data)
        True

        >>> data = {'status': 'FAILED', 'catalog_count': 0}
        >>> validate_company_data(data)
        False
    """
    # Status kontrolü
    status = company_data.get('status', '')

    if status in [STATUS_FAILED, STATUS_ERROR]:
        return False

    # Katalog varlığı kontrolü
    if not validate_catalog_exists(company_data):
        return False

    return True


def validate_url(url: str) -> bool:
    """
    URL'nin geçerli olup olmadığını kontrol eder.

    Args:
        url: Kontrol edilecek URL

    Returns:
        bool: URL geçerliyse True, değilse False

    Example:
        >>> validate_url("https://example.com")
        True

        >>> validate_url("not-a-url")
        False
    """
    try:
        result = urlparse(url)
        return all([result.scheme, result.netloc])
    except Exception:
        return False


def validate_email(email: str) -> bool:
    """
    E-posta adresinin geçerli formatda olup olmadığını kontrol eder.

    Args:
        email: Kontrol edilecek e-posta adresi

    Returns:
        bool: E-posta geçerliyse True, değilse False

    Example:
        >>> validate_email("test@example.com")
        True

        >>> validate_email("invalid-email")
        False
    """
    if not email:
        return False

    pattern = re.compile(EMAIL_PATTERN)
    return bool(pattern.match(email.strip()))


def validate_phone(phone: str) -> bool:
    """
    Telefon numarasının geçerli formatda olup olmadığını kontrol eder.

    Türkiye telefon formatlarını destekler:
    - +90 xxx xxx xx xx
    - 0xxx xxx xx xx
    - (0xxx) xxx xx xx

    Args:
        phone: Kontrol edilecek telefon numarası

    Returns:
        bool: Telefon geçerliyse True, değilse False

    Example:
        >>> validate_phone("+90 212 555 00 00")
        True

        >>> validate_phone("123")
        False
    """
    if not phone:
        return False

    # Sadece rakamları say
    digits = re.sub(r'\D', '', phone)

    # Türkiye telefon numarası 10-12 haneli olmalı
    if len(digits) < 10 or len(digits) > 12:
        return False

    return True


def validate_catalog_url(url: str) -> bool:
    """
    URL'nin geçerli bir katalog dosyasına işaret edip etmediğini kontrol eder.

    Args:
        url: Kontrol edilecek URL

    Returns:
        bool: Katalog URL'si ise True, değilse False

    Example:
        >>> validate_catalog_url("https://example.com/katalog.pdf")
        True

        >>> validate_catalog_url("https://example.com/page.html")
        False
    """
    if not url:
        return False

    # URL'yi parse et
    try:
        parsed = urlparse(url.lower())
        path = parsed.path
    except Exception:
        return False

    # Uzantı kontrolü
    for ext in VALID_EXTENSIONS:
        if path.endswith(ext.lower()):
            return True

    return False


def sanitize_filename(filename: str) -> str:
    """
    Dosya adını güvenli hale getirir.

    - Geçersiz karakterleri kaldırır
    - Türkçe karakterleri korur
    - Boşlukları alt çizgi ile değiştirir

    Args:
        filename: Orijinal dosya adı

    Returns:
        str: Güvenli dosya adı

    Example:
        >>> sanitize_filename("Katalog 2024.pdf")
        'Katalog_2024.pdf'

        >>> sanitize_filename("Ürün<Liste>.pdf")
        'Ürün_Liste_.pdf'
    """
    if not filename:
        return "unnamed_file"

    # Geçersiz karakterleri değiştir
    invalid_chars = '<>:"/\\|?*'
    for char in invalid_chars:
        filename = filename.replace(char, '_')

    # Boşlukları alt çizgi ile değiştir
    filename = filename.replace(' ', '_')

    # Ardışık alt çizgileri tek alt çizgiye indir
    while '__' in filename:
        filename = filename.replace('__', '_')

    # Baş ve sondaki alt çizgileri kaldır
    filename = filename.strip('_')

    return filename if filename else "unnamed_file"


def determine_status(catalog_count: int, has_contact: bool) -> str:
    """
    Katalog sayısı ve iletişim bilgisi durumuna göre status belirler.

    Args:
        catalog_count: Bulunan katalog sayısı
        has_contact: İletişim bilgisi bulundu mu

    Returns:
        str: Status değeri (SUCCESS, PARTIAL, FAILED)

    Example:
        >>> determine_status(3, True)
        'SUCCESS'

        >>> determine_status(2, False)
        'PARTIAL'

        >>> determine_status(0, True)
        'FAILED'
    """
    if catalog_count == 0:
        return STATUS_FAILED

    if has_contact:
        return STATUS_SUCCESS

    return STATUS_PARTIAL


def has_contact_info(company_data: Dict[str, Any]) -> bool:
    """
    Firma verisinde iletişim bilgisi olup olmadığını kontrol eder.

    En az telefon veya email bulunmalıdır.

    Args:
        company_data: Firma verisi dictionary'si

    Returns:
        bool: İletişim bilgisi varsa True, yoksa False

    Example:
        >>> data = {'phone': '+90 212 555 00 00', 'email': ''}
        >>> has_contact_info(data)
        True
    """
    phone = company_data.get('phone', '')
    email = company_data.get('email', '')

    # En az biri dolu olmalı
    if phone and phone.strip():
        return True

    if email and email.strip():
        return True

    return False


def filter_valid_companies(companies: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Geçerli firmaları filtreler (Excel'e yazılacaklar).

    Args:
        companies: Firma listesi

    Returns:
        List[Dict]: Geçerli firma listesi

    Example:
        >>> companies = [
        ...     {'status': 'SUCCESS', 'catalog_count': 2},
        ...     {'status': 'FAILED', 'catalog_count': 0}
        ... ]
        >>> valid = filter_valid_companies(companies)
        >>> len(valid)
        1
    """
    return [c for c in companies if validate_company_data(c)]
