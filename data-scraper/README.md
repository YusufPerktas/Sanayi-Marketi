# Company Data Scraper

Web sitelerinden firma bilgileri ve katalog dosyalarını otomatik olarak toplayan Python uygulaması.

## Özellikler

- Firma web sitelerinden katalog dosyalarını (PDF, DOC, DOCX, XLS, XLSX) otomatik indirme
- İletişim bilgilerini (telefon, email, adres) çıkarma
- Sonuçları Excel formatında raporlama
- Detaylı loglama ve hata yönetimi
- Türkçe karakter desteği
- Progress göstergesi

## Kurulum

1. Virtual environment oluştur (önerilen):
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows
```

2. Bağımlılıkları yükle:
```bash
pip install -r requirements.txt
```

3. Environment dosyasını hazırla:
```bash
cp .env.example .env
```

4. Firma listesini hazırla:

`config/companies.json` dosyasına firmalarınızı ekleyin:
```json
[
  {
    "company_name": "Firma Adı",
    "website": "https://firma-website.com",
    "sector": "Çelik/Metal"
  },
  {
    "company_name": "Başka Firma",
    "website": "https://baska-firma.com",
    "sector": "Makine"
  }
]
```

5. Çalıştır:
```bash
python main.py
```

## Çıktılar

- `output/catalogs/` - İndirilen katalog dosyaları (firma adına göre klasörlenir)
- `output/company_data.xlsx` - Firma bilgileri Excel raporu
- `output/logs/` - Detaylı işlem logları

## Status Tanımları

| Status | Açıklama | Excel'e Yazılır? |
|--------|----------|------------------|
| **SUCCESS** | Katalog + iletişim bilgileri bulundu | Evet |
| **PARTIAL** | Katalog bulundu ama iletişim eksik | Evet |
| **FAILED** | Katalog bulunamadı | Hayır |
| **ERROR** | Hata oluştu | Hayır |

## Proje Yapısı

```
data-scraper/
├── config/
│   ├── companies.json    # Firma listesi
│   └── settings.py       # Yapılandırma ayarları
├── scrapers/
│   ├── __init__.py
│   ├── base_scraper.py   # Abstract base class
│   └── generic_scraper.py # Ana scraper sınıfı
├── utils/
│   ├── __init__.py
│   ├── file_downloader.py # Dosya indirme
│   ├── excel_writer.py    # Excel oluşturma
│   ├── logger.py          # Loglama
│   └── validators.py      # Doğrulama fonksiyonları
├── output/
│   ├── catalogs/         # İndirilen kataloglar
│   └── logs/             # Log dosyaları
├── main.py               # Ana çalıştırma dosyası
├── requirements.txt
├── .env.example
├── .gitignore
└── README.md
```

## Yapılandırma

`config/settings.py` dosyasından veya `.env` dosyasından ayarları değiştirebilirsiniz:

- `REQUEST_TIMEOUT`: HTTP istek zaman aşımı (varsayılan: 10 saniye)
- `DOWNLOAD_TIMEOUT`: Dosya indirme zaman aşımı (varsayılan: 30 saniye)
- `MAX_RETRIES`: Başarısız isteklerde yeniden deneme sayısı (varsayılan: 3)
- `REQUEST_DELAY`: İstekler arası bekleme süresi (varsayılan: 1 saniye)

## Kullanım Örnekleri

### Tek Firma Scrape Etme

```python
from scrapers import GenericScraper

scraper = GenericScraper()
result = scraper.scrape("https://example.com", "Firma Adı")
print(result)
```

### Excel'e Yazma

```python
from utils import ExcelWriter

writer = ExcelWriter()
writer.append_company(company_data)
writer.save()
```

## Notlar

- Katalog bulunamayan firmalar Excel'e **yazılmaz**
- Her firma için ayrı klasör oluşturulur
- Aynı dosyalar tekrar indirilmez (hash kontrolü)
- Rate limiting için istekler arası bekleme yapılır

## Lisans

MIT License
