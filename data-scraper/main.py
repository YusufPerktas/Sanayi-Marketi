#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Company Data Scraper - Firma katalog ve iletişim bilgisi toplayıcı.

Kullanım:
    python main.py                         # Toplu arama
    python main.py --company "Firma Adı"   # Tekli arama
    python main.py --list                  # Firma listesi
"""

import os
import sys
import json
import argparse
from datetime import datetime
from typing import List, Dict, Any, Optional

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
from utils import ExcelWriter, JSONWriter, get_logger
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
    """Firma listesini JSON dosyasından yükler."""
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
    """Gerekli dizinleri oluşturur."""
    directories = [OUTPUT_DIR, CATALOGS_DIR, LOGS_DIR]

    for directory in directories:
        if not os.path.exists(directory):
            os.makedirs(directory, exist_ok=True)


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
    """Console'da progress bar gösterir."""
    if total == 0:
        return

    percentage = current / total
    filled = int(width * percentage)
    bar = '█' * filled + '░' * (width - filled)
    percent_str = f"{percentage * 100:.1f}%"

    print(f"\r[{bar}] {percent_str} ({current}/{total})", end='', flush=True)


def process_company(scraper: GenericScraper, company: Dict[str, str]) -> Dict[str, Any]:
    """Tek bir firmayı işler."""
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


def process_single_company(company_name: str, companies: List[Dict[str, str]]) -> None:
    """Tekli firma scraping modunu çalıştırır."""
    from utils.validators import sanitize_filename
    
    # Firma ara
    company = None
    for c in companies:
        if c['company_name'].lower() == company_name.lower():
            company = c
            break
    
    if not company:
        print(f"\n[HATA] Firma bulunamadı: {company_name}")
        print(f"\nMevcut firmalar:")
        for i, c in enumerate(companies, 1):
            print(f"  {i:2d}. {c['company_name']}")
        logger.error(f"Firma bulunamadı: {company_name}")
        return
    
    # Başlık
    print(f"\n[TEKLİ ARAMA MODU]")
    print(f"Firma: {company['company_name']}")
    print(f"Web: {company['website']}")
    print(f"Sektör: {company['sector']}")
    print(f"\nİşlem başlıyor...\n")
    
    logger.info(f"Tekli arama başlıyor: {company_name}")
    
    # Katalog klasörü (FileDownloader ile aynı yol yapısını kullan)
    safe_company_name = sanitize_filename(company['company_name'])
    company_dir = os.path.join(CATALOGS_DIR, safe_company_name)
    
    # Scraper ile işle
    with GenericScraper(catalogs_dir=CATALOGS_DIR) as scraper:
        result = process_company(scraper, company)
    
    # Sonuç
    status = result.get('status', STATUS_ERROR)
    catalog_count = result.get('catalog_count', 0)
    
    print(f"\n[SONUÇ]")
    print(f"  Durum: {status}")
    print(f"  Katalog: {catalog_count} dosya")
    
    if result.get('phone'):
        print(f"  Telefon: {result['phone']}")
    if result.get('email'):
        print(f"  Email: {result['email']}")
    if result.get('address'):
        print(f"  Adres: {result['address']}")
    
    # JSON'a kaydet
    if status in [STATUS_SUCCESS, STATUS_PARTIAL]:
        if not JSONWriter.save_company(result, company_dir):
            print(f"  ✗ Kayıt başarısız!")
    
    print()
    logger.info(f"Tekli arama tamamlandı: {company_name} ({status})")


def process_batch(companies: List[Dict[str, str]]) -> None:
    """Toplu firma scraping modunu çalıştırır."""
    start_time = datetime.now()
    session = RunSession.create_new()
    print(f"[TOPLU ARAMA MODU]")
    print(f"Oturum: {session.timestamp}")
    print(f"Kataloglar: {session.catalogs_dir}")
    print(f"Excel: {session.excel_file}")
    print()

    log_separator(logger)
    logger.info("Scraping işlemi başlıyor...")
    log_separator(logger)

    total_companies = len(companies)
    print(f"\n{total_companies} firma işlenecek...\n")

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

    print("\n")

    if excel_writer.pending_data:
        logger.info("Excel dosyası kaydediliyor...")
        if excel_writer.save():
            print(f"\n[OK] Excel kaydedildi: {excel_writer.file_path}")
        else:
            print("\n[HATA] Excel kaydedilemedi!")
    else:
        print("\n[UYARI] Katalog bulunan firma yok, Excel oluşturulmadı.")

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


def main() -> None:
    """Ana çalıştırma fonksiyonu."""
    parser = argparse.ArgumentParser(
        description='Firma Katalog ve İletişim Toplayıcı',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Örnekler:
  python main.py                           # Toplu arama (tüm firmalar)
  python main.py --company "Tosyalı"      # Tekli arama (belirli firma)
  python main.py --list                   # Firma listesini göster
        """
    )
    parser.add_argument('--company', type=str, help='Belirli firma adı ara (tekli mod)')
    parser.add_argument('--list', action='store_true', help='Firma listesini göster')
    
    args = parser.parse_args()
    
    # Dizinleri oluştur
    ensure_directories()
    
    # Firma listesini yükle
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
    
    # --list seçeneği
    if args.list:
        print("[FİRMA LİSTESİ]")
        print()
        for i, company in enumerate(companies, 1):
            print(f"{i:3d}. {company['company_name']:35s} | {company['sector']}")
        print()
        return
    
    # --company seçeneği (tekli mod)
    if args.company:
        process_single_company(args.company, companies)
        return
    
    # Varsayılan mod: Toplu arama
    process_batch(companies)


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
