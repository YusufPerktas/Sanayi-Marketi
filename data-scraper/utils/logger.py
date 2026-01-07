"""
Logger Module
=============
Renkli console çıktısı ve dosya loglama yapılandırması.
Hem terminal hem de dosyaya detaylı log kaydı yapar.

Kullanım:
    from utils.logger import get_logger
    logger = get_logger(__name__)
    logger.info("Bilgi mesajı")
    logger.error("Hata mesajı")
"""

import os
import logging
from datetime import datetime
from typing import Optional

import colorlog

# Config'den ayarları al
try:
    from config.settings import LOGS_DIR
except ImportError:
    LOGS_DIR = 'output/logs'


def get_logger(name: str, log_file: Optional[str] = None) -> logging.Logger:
    """
    Yapılandırılmış logger instance'ı döndürür.

    Özellikler:
    - Console'da renkli çıktı (colorlog)
    - Dosyaya detaylı log kaydı
    - Türkçe karakter desteği (UTF-8)

    Args:
        name: Logger adı (genellikle __name__)
        log_file: Özel log dosyası adı (opsiyonel)

    Returns:
        logging.Logger: Yapılandırılmış logger instance'ı

    Example:
        >>> logger = get_logger(__name__)
        >>> logger.info("Scraping başladı")
        >>> logger.warning("Sayfa yavaş yanıt veriyor")
        >>> logger.error("Bağlantı hatası")
    """
    # Logger'ı al veya oluştur
    logger = logging.getLogger(name)

    # Eğer handler'lar zaten eklenmişse, tekrar ekleme
    if logger.handlers:
        return logger

    logger.setLevel(logging.DEBUG)

    # ==========================================================================
    # CONSOLE HANDLER (Renkli Çıktı)
    # ==========================================================================
    console_handler = colorlog.StreamHandler()
    console_handler.setLevel(logging.INFO)

    # Renk formatı
    console_format = colorlog.ColoredFormatter(
        fmt='%(log_color)s%(asctime)s [%(levelname)s]%(reset)s %(message)s',
        datefmt='%H:%M:%S',
        log_colors={
            'DEBUG': 'cyan',
            'INFO': 'green',
            'WARNING': 'yellow',
            'ERROR': 'red',
            'CRITICAL': 'red,bg_white',
        },
        secondary_log_colors={},
        style='%'
    )
    console_handler.setFormatter(console_format)
    logger.addHandler(console_handler)

    # ==========================================================================
    # FILE HANDLER (Dosyaya Loglama)
    # ==========================================================================
    # Log dizinini oluştur
    os.makedirs(LOGS_DIR, exist_ok=True)

    # Log dosyası adı
    if log_file is None:
        today = datetime.now().strftime('%Y-%m-%d')
        log_file = f'scraper_{today}.log'

    log_path = os.path.join(LOGS_DIR, log_file)

    # File handler - UTF-8 encoding ile
    file_handler = logging.FileHandler(log_path, encoding='utf-8')
    file_handler.setLevel(logging.DEBUG)

    # Dosya formatı (daha detaylı)
    file_format = logging.Formatter(
        fmt='%(asctime)s [%(levelname)s] %(name)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    file_handler.setFormatter(file_format)
    logger.addHandler(file_handler)

    return logger


def log_separator(logger: logging.Logger, char: str = '=', length: int = 60) -> None:
    """
    Log'a görsel ayırıcı ekler.

    Args:
        logger: Logger instance'ı
        char: Ayırıcı karakteri
        length: Ayırıcı uzunluğu

    Example:
        >>> log_separator(logger)
        >>> logger.info("Yeni Bölüm")
    """
    logger.info(char * length)


def log_company_start(logger: logging.Logger, company_name: str, index: int, total: int) -> None:
    """
    Firma işleme başlangıcını loglar.

    Args:
        logger: Logger instance'ı
        company_name: Firma adı
        index: Mevcut firma indeksi
        total: Toplam firma sayısı

    Example:
        >>> log_company_start(logger, "ABC Firma", 1, 10)
        # Output: [1/10] ABC Firma işleniyor...
    """
    log_separator(logger, '-', 50)
    logger.info(f"[{index}/{total}] {company_name} işleniyor...")


def log_company_result(logger: logging.Logger, company_name: str, status: str,
                       catalog_count: int = 0, has_contact: bool = False) -> None:
    """
    Firma işleme sonucunu loglar.

    Args:
        logger: Logger instance'ı
        company_name: Firma adı
        status: İşlem durumu (SUCCESS, PARTIAL, FAILED, ERROR)
        catalog_count: Bulunan katalog sayısı
        has_contact: İletişim bilgisi bulundu mu

    Example:
        >>> log_company_result(logger, "ABC Firma", "SUCCESS", 3, True)
    """
    status_emoji = {
        'SUCCESS': '[OK]',
        'PARTIAL': '[~]',
        'FAILED': '[X]',
        'ERROR': '[!]'
    }

    emoji = status_emoji.get(status, '[?]')

    if status == 'SUCCESS':
        logger.info(f"{emoji} {company_name}: {catalog_count} katalog, iletişim bilgisi mevcut")
    elif status == 'PARTIAL':
        logger.warning(f"{emoji} {company_name}: {catalog_count} katalog, iletişim bilgisi eksik")
    elif status == 'FAILED':
        logger.warning(f"{emoji} {company_name}: Katalog bulunamadı")
    else:
        logger.error(f"{emoji} {company_name}: Hata oluştu")


def log_summary(logger: logging.Logger, total: int, success: int, partial: int,
                failed: int, errors: int) -> None:
    """
    İşlem özetini loglar.

    Args:
        logger: Logger instance'ı
        total: Toplam firma sayısı
        success: Başarılı sayısı
        partial: Kısmi başarılı sayısı
        failed: Başarısız sayısı
        errors: Hata sayısı

    Example:
        >>> log_summary(logger, 10, 5, 2, 2, 1)
    """
    log_separator(logger, '=', 60)
    logger.info("ÖZET")
    log_separator(logger, '=', 60)
    logger.info(f"Toplam firma     : {total}")
    logger.info(f"Başarılı         : {success}")
    logger.info(f"Kısmi başarılı   : {partial}")
    logger.info(f"Başarısız        : {failed}")
    logger.info(f"Hata             : {errors}")
    logger.info(f"Excel'e yazılan  : {success + partial}")
    log_separator(logger, '=', 60)


class ProgressTracker:
    """
    İlerleme takibi için yardımcı sınıf.

    Attributes:
        total: Toplam işlem sayısı
        current: Mevcut işlem numarası
        success: Başarılı sayısı
        partial: Kısmi başarılı sayısı
        failed: Başarısız sayısı
        errors: Hata sayısı

    Example:
        >>> tracker = ProgressTracker(total=10)
        >>> tracker.increment('SUCCESS')
        >>> print(tracker.get_progress_string())
        '[1/10] (10%)'
    """

    def __init__(self, total: int):
        """
        ProgressTracker'ı başlatır.

        Args:
            total: Toplam işlem sayısı
        """
        self.total = total
        self.current = 0
        self.success = 0
        self.partial = 0
        self.failed = 0
        self.errors = 0

    def increment(self, status: str) -> None:
        """
        İlgili sayacı artırır.

        Args:
            status: İşlem durumu (SUCCESS, PARTIAL, FAILED, ERROR)
        """
        self.current += 1

        if status == 'SUCCESS':
            self.success += 1
        elif status == 'PARTIAL':
            self.partial += 1
        elif status == 'FAILED':
            self.failed += 1
        else:
            self.errors += 1

    def get_progress_string(self) -> str:
        """
        İlerleme string'ini döndürür.

        Returns:
            str: "[current/total] (percentage%)" formatında string
        """
        percentage = (self.current / self.total * 100) if self.total > 0 else 0
        return f"[{self.current}/{self.total}] ({percentage:.0f}%)"

    def get_stats(self) -> dict:
        """
        İstatistikleri dictionary olarak döndürür.

        Returns:
            dict: İstatistik değerleri
        """
        return {
            'total': self.total,
            'current': self.current,
            'success': self.success,
            'partial': self.partial,
            'failed': self.failed,
            'errors': self.errors,
            'written_to_excel': self.success + self.partial
        }
