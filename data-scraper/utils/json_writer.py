"""
JSON Writer Module
==================
Firma verilerini JSON formatında kaydeden modül.

Tekli arama modu için kullanılır. Her firma için ayrı bir 
company_info.json dosyası oluşturur.

Özellikler:
- Katalog bilgilerini JSON formatında tutar
- Okunabilir formatlama
- Tarih damgası
"""

import os
import json
from datetime import datetime
from typing import Dict, List, Any, Optional

from utils.logger import get_logger

logger = get_logger(__name__)


class JSONWriter:
    """
    Firma bilgilerini JSON formatında kaydeder.
    
    Tekli arama modunda her firmaya ait veriler JSON dosyasında tutulur.
    Dosya katalog dosyalarıyla aynı klasörde oluşturulur.
    
    Attributes:
        json_file: JSON dosya adı (company_info.json)
    
    Example:
        >>> writer = JSONWriter()
        >>> writer.save_company(result, "/path/to/company_folder")
    """
    
    JSON_FILE = 'company_info.json'
    
    @staticmethod
    def save_company(company_data: Dict[str, Any], company_dir: str) -> bool:
        """
        Firma bilgilerini JSON dosyasına kaydeder.
        
        Args:
            company_data: Firma bilgileri dictionary'si
            company_dir: Firma klasörünün yolu
        
        Returns:
            bool: Başarılı ise True, hata ise False
        
        Example:
            >>> data = {
            ...     'company_name': 'Tosyalı Holding',
            ...     'phone': '+90 212 xxx xx xx',
            ...     'email': 'info@tosyali.com',
            ...     'catalog_files': ['katalog1.pdf']
            ... }
            >>> JSONWriter.save_company(data, './output/catalogs/Tosyalı_Holding')
        """
        try:
            # Dizin oluştur (yoksa)
            os.makedirs(company_dir, exist_ok=True)
            
            # JSON dosya yolu
            json_path = os.path.join(company_dir, JSONWriter.JSON_FILE)
            
            # Kaydedilecek veriler
            output_data = {
                'company_name': company_data.get('company_name'),
                'website': company_data.get('website'),
                'sector': company_data.get('sector'),
                'status': company_data.get('status'),
                'contact_info': {
                    'phone': company_data.get('phone'),
                    'email': company_data.get('email'),
                    'address': company_data.get('address')
                },
                'catalog_info': {
                    'count': company_data.get('catalog_count', 0),
                    'files': company_data.get('catalog_files', [])
                },
                'scrape_date': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                'scrape_timestamp': datetime.now().isoformat()
            }
            
            # JSON'u dosyaya yaz
            with open(json_path, 'w', encoding='utf-8') as f:
                json.dump(output_data, f, ensure_ascii=False, indent=2)
            
            logger.info(f"JSON kaydedildi: {json_path}")
            return True
            
        except IOError as e:
            logger.error(f"JSON yazma hatası: {e}")
            return False
        except Exception as e:
            logger.error(f"Beklenmeyen hata (JSON yazma): {e}")
            return False
    
    @staticmethod
    def read_company(company_dir: str) -> Optional[Dict[str, Any]]:
        """
        Firma bilgilerini JSON dosyasından okur.
        
        Args:
            company_dir: Firma klasörünün yolu
        
        Returns:
            Dict: Firma bilgileri veya None
        """
        try:
            json_path = os.path.join(company_dir, JSONWriter.JSON_FILE)
            
            if not os.path.exists(json_path):
                logger.warning(f"JSON dosyası bulunamadı: {json_path}")
                return None
            
            with open(json_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            return data
            
        except json.JSONDecodeError as e:
            logger.error(f"JSON parse hatası: {e}")
            return None
        except Exception as e:
            logger.error(f"Beklenmeyen hata (JSON okuma): {e}")
            return None
