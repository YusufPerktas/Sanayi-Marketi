#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Company Data Scraper - Ana Çalıştırma Dosyası
=============================================

Bu script, companies.json dosyasındaki firmaların web sitelerinden
katalog ve iletişim bilgilerini toplar ve Excel formatında raporlar.

Kullanım:
    python main.py

Akış:
    1. config/companies.json dosyasını oku
    2. Her firma için web sitesini scrape et
    3. Katalog dosyalarını indir
    4. Sonuçları Excel'e yaz (sadece katalog bulunanlar)
    5. Özet raporu göster

Önemli:
    - Katalog bulunamayan firmalar Excel'e YAZILMAZ
    - Progress göstergesi console'da görünür
    - Detaylı loglar output/logs/ klasöründe tutulur
"""

import os
import sys
import json
from datetime import datetime
from typing import List, Dict, Any

# Proje root'unu path'e ekle
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from config.settings import (
    OUTPUT_DIR,
    CATALOGS_DIR,
    LOGS_DIR,
    STATUS_SUCCESS,
    STATUS_PARTIAL,
    STATUS_FAILED,
    STATUS_ERROR,
    RunSession
)
from scrapers import GenericScraper
from utils import ExcelWriter, get_logger
from utils.logger import (
    log_separator,
    log_company_start,
    log_company_result,
    log_summary,
    ProgressTracker
)
from utils.validators import validate_company_data

# Logger'ı başlat
logger = get_logger('main')


def load_companies(json_path: str = 'config/companies.json') -> List[Dict[str, str]]:
    """
    Firma listesini JSON dosyasından yükler.

    Args:
        json_path: JSON dosya yolu

    Returns:
        List[Dict]: Firma listesi

    Raises:
        FileNotFoundError: Dosya bulunamazsa
        json.JSONDecodeError: JSON parse hatası

    Example:
        >>> companies = load_companies()
        >>> print(f"{len(companies)} firma yüklendi")
    """
    # Absolute path oluştur
    if not os.path.isabs(json_path):
        base_dir = os.path.dirname(os.path.abspath(__file__))
        json_path = os.path.join(base_dir, json_path)

    logger.info(f"Firma listesi yükleniyor: {json_path}")

    if not os.path.exists(json_path):
        logger.error(f"Firma listesi bulunamadı: {json_path}")
        raise FileNotFoundError(f"Dosya bulunamadı: {json_path}")

    with open(json_path, 'r', encoding='utf-8') as f:
        companies = json.load(f)

    if not companies:
        logger.warning("Firma listesi boş!")
        return []

    logger.info(f"{len(companies)} firma yüklendi")
    return companies


def ensure_directories() -> None:
    """
    Gerekli dizinlerin varlığını kontrol eder ve oluşturur.

    Oluşturulan dizinler:
    - output/
    - output/catalogs/
    - output/logs/
    """
    directories = [OUTPUT_DIR, CATALOGS_DIR, LOGS_DIR]

    for directory in directories:
        if not os.path.exists(directory):
            os.makedirs(directory, exist_ok=True)
            logger.debug(f"Dizin oluşturuldu: {directory}")


def print_banner() -> None:
    """Başlık banner'ı yazdırır."""
    banner = """
╔══════════════════════════════════════════════════════════════╗
║                  COMPANY DATA SCRAPER                        ║
║              Firma Katalog & İletişim Toplayıcı              ║
╚══════════════════════════════════════════════════════════════╝
    """
    print(banner)


def print_progress_bar(current: int, total: int, width: int = 40) -> None:
    """
    Console'da progress bar gösterir.

    Args:
        current: Mevcut değer
        total: Toplam değer
        width: Progress bar genişliği
    """
    if total == 0:
        return

    percentage = current / total
    filled = int(width * percentage)
    bar = '█' * filled + '░' * (width - filled)
    percent_str = f"{percentage * 100:.1f}%"

    print(f"\r[{bar}] {percent_str} ({current}/{total})", end='', flush=True)


def process_company(scraper: GenericScraper, company: Dict[str, str]) -> Dict[str, Any]:
    """
    Tek bir firmayı işler.

    Args:
        scraper: GenericScraper instance
        company: Firma bilgileri dictionary'si

    Returns:
        Dict: Scrape sonucu
    """
    company_name = company.get('company_name', 'Bilinmeyen')
    website = company.get('website', '')
    sector = company.get('sector', '')

    if not website:
        logger.warning(f"Website bilgisi eksik: {company_name}")
        return {
            'company_name': company_name,
            'website': '',
            'sector': sector,
            'status': STATUS_ERROR,
            'catalog_count': 0
        }

    # Scrape işlemi
    result = scraper.scrape(website, company_name, sector)

    return result


def main() -> None:
    """
    Ana çalıştırma fonksiyonu.

    İşlem akışı:
    1. Dizinleri oluştur
    2. Firma listesini yükle
    3. Her firma için scrape et
    4. Sonuçları Excel'e yaz
    5. Özet raporu göster
    """
    start_time = datetime.now()

    # Banner göster
    print_banner()

    # ==========================================================================
    # RUN SESSION OLUŞTUR (Tarih bazlı klasör yapısı)
    # ==========================================================================
    session = RunSession.create_new()
    print(f"Oturum: {session.timestamp}")
    print(f"Kataloglar: {session.catalogs_dir}")
    print(f"Excel: {session.excel_file}")
    print()

    # Dizinleri oluştur
    ensure_directories()

    log_separator(logger)
    logger.info("Scraping işlemi başlıyor...")
    logger.info(f"Başlangıç zamanı: {start_time.strftime('%Y-%m-%d %H:%M:%S')}")
    log_separator(logger)

    # ==========================================================================
    # 1. FİRMA LİSTESİNİ YÜKLE
    # ==========================================================================
    try:
        companies = load_companies()
    except FileNotFoundError as e:
        logger.error(str(e))
        print("\n[HATA] Firma listesi bulunamadı!")
        print("Lütfen config/companies.json dosyasını oluşturun.")
        print("\nÖrnek format:")
        print('''[
  {
    "company_name": "Firma Adı",
    "website": "https://firma-website.com",
    "sector": "Sektör"
  }
]''')
        return
    except json.JSONDecodeError as e:
        logger.error(f"JSON parse hatası: {e}")
        print("\n[HATA] companies.json dosyası geçersiz JSON formatında!")
        return

    if not companies:
        print("\n[UYARI] Firma listesi boş. İşlem yapılacak firma yok.")
        return

    total_companies = len(companies)
    print(f"\n{total_companies} firma işlenecek...\n")

    # ==========================================================================
    # 2. SCRAPING İŞLEMİ
    # ==========================================================================
    tracker = ProgressTracker(total_companies)
    excel_writer = ExcelWriter(file_path=session.excel_file)
    results: List[Dict[str, Any]] = []

    with GenericScraper(catalogs_dir=session.catalogs_dir) as scraper:
        for i, company in enumerate(companies, 1):
            company_name = company.get('company_name', 'Bilinmeyen')

            # Progress göstergesi
            print_progress_bar(i, total_companies)
            log_company_start(logger, company_name, i, total_companies)

            # Firmayı işle
            result = process_company(scraper, company)
            results.append(result)

            # Sonucu logla
            log_company_result(
                logger,
                company_name,
                result['status'],
                result.get('catalog_count', 0),
                bool(result.get('phone') or result.get('email'))
            )

            # Tracker güncelle
            tracker.increment(result['status'])

            # Excel'e ekle (sadece geçerli olanlar)
            if validate_company_data(result):
                excel_writer.append_company(result)

    # Progress bar'ı tamamla
    print("\n")

    # ==========================================================================
    # 3. EXCEL'E KAYDET
    # ==========================================================================
    if excel_writer.pending_data:
        logger.info("Excel dosyası kaydediliyor...")
        if excel_writer.save():
            print(f"\n[OK] Excel kaydedildi: {excel_writer.file_path}")
        else:
            print("\n[HATA] Excel kaydedilemedi!")
    else:
        print("\n[UYARI] Katalog bulunan firma yok, Excel oluşturulmadı.")

    # ==========================================================================
    # 4. ÖZET RAPOR
    # ==========================================================================
    end_time = datetime.now()
    duration = end_time - start_time

    stats = tracker.get_stats()

    log_summary(
        logger,
        stats['total'],
        stats['success'],
        stats['partial'],
        stats['failed'],
        stats['errors']
    )

    # Console özeti
    print("\n" + "=" * 60)
    print("                       ÖZET RAPOR")
    print("=" * 60)
    print(f"  Toplam firma         : {stats['total']}")
    print(f"  Başarılı (SUCCESS)   : {stats['success']}")
    print(f"  Kısmi (PARTIAL)      : {stats['partial']}")
    print(f"  Başarısız (FAILED)   : {stats['failed']}")
    print(f"  Hata (ERROR)         : {stats['errors']}")
    print("-" * 60)
    print(f"  Excel'e yazılan      : {stats['written_to_excel']}")
    print(f"  Süre                 : {duration}")
    print("=" * 60)

    # Çıktı konumları
    print("\nÇıktılar:")
    print(f"  - Kataloglar : {os.path.abspath(session.catalogs_dir)}")
    print(f"  - Excel      : {os.path.abspath(session.excel_file)}")
    print(f"  - Loglar     : {os.path.abspath(LOGS_DIR)}")

    logger.info(f"İşlem tamamlandı. Süre: {duration}")


if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n[!] İşlem kullanıcı tarafından iptal edildi.")
        logger.warning("İşlem kullanıcı tarafından iptal edildi")
        sys.exit(1)
    except Exception as e:
        logger.exception(f"Beklenmeyen hata: {e}")
        print(f"\n[HATA] Beklenmeyen hata: {e}")
        sys.exit(1)
