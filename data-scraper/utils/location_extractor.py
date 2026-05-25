"""
Location Extractor
==================
Adres metninden Türk şehir ve ilçe bilgisi çıkarmak için yardımcı modül.
81 il listesine göre eşleştirme yapar.

Kullanım:
    from utils.location_extractor import extract_city_district
    city, district = extract_city_district(address="... Gemlik, Bursa 16601")
    # city="Bursa", district="Gemlik"
"""

import re
from typing import Tuple

from utils.logger import get_logger

logger = get_logger(__name__)

# Türkçe karakter normalizasyon tablosu (karşılaştırma için ASCII'ye indirgeme)
# İ ve ı ayrıca replace ile işlenir (maketrans'a uymayan özel durumlar)
_TR_NORMALIZE_TABLE = str.maketrans(
    'ığüşöçĞÜŞÖÇ',
    'igusocGUSOC'
)

# Adres yapısal anahtar kelimeleri — bunlar ilçe adı değildir
_STREET_KEYWORDS = frozenset({
    # Adres yapısı
    'mah', 'mahallesi', 'mahalle', 'sok', 'sokak', 'sokagi', 'sk',
    'cad', 'cadde', 'caddesi', 'cd',
    'bulvar', 'blv', 'apt', 'plaza', 'sitesi', 'osb', 'organize',
    'sanayi', 'bolgesi', 'bolge', 'no', 'kat', 'daire', 'turkiye', 'turkey',
    'merkez', 'il', 'ilce', 'koy', 'belde', 'posta', 'kutusu',
    # Tesis / bina türleri — ilçe ile karışmasın
    'fabrika', 'fabrikasi', 'tesis', 'tesisi', 'isletme', 'isletmesi',
    'sube', 'subesi', 'depo', 'deposu', 'ofis', 'ofisi', 'bina', 'binasi',
    'kampus', 'kampusu', 'atolye', 'atoyesi', 'mudurluk', 'mudurugu',
    'merkezi', 'genel', 'holding', 'grubu', 'anonim', 'limited', 'sirketi',
})


def _normalize_tr(text: str) -> str:
    """Türkçe karakterleri ASCII'ye indirgeyip küçültür (eşleştirme için)."""
    # Özel durum: dotted İ ve dotless ı
    text = text.replace('İ', 'I').replace('ı', 'i')
    return text.translate(_TR_NORMALIZE_TABLE).lower()


def _match_city(text: str) -> str:
    """
    Metinde 81 Türk ilinden birini arar.

    Uzun isimler önce kontrol edilir (Kahramanmaraş > Maraş çakışmasını önler).
    Eşleşme varsa canonical şehir adını (settings.py'deki yazımla) döndürür.
    """
    try:
        from config.settings import TURKISH_CITIES
    except ImportError:
        logger.warning("TURKISH_CITIES settings'den yüklenemedi")
        return ''

    normalized = _normalize_tr(text)

    for city in sorted(TURKISH_CITIES, key=len, reverse=True):
        normalized_city = _normalize_tr(city)
        if re.search(r'\b' + re.escape(normalized_city) + r'\b', normalized):
            return city

    return ''


def _clean_component(text: str) -> str:
    """İlçe/şehir bileşenini temizler: ZIP kodu, noktalama, fazla boşluk."""
    # Baştaki ve sondaki 5 haneli ZIP kodunu kaldır
    text = re.sub(r'^\s*\d{5}\s*', '', text)
    text = re.sub(r'\s*\d{5}\s*$', '', text)
    # Tire, em-dash, en-dash ve standart noktalama temizle
    text = text.strip(',./-\\;–—–— \t\n')
    text = re.sub(r'\s+', ' ', text).strip()
    return text


def _is_district_candidate(text: str, city_normalized: str) -> bool:
    """Metnin ilçe adı olup olamayacağını kontrol eder."""
    if not text:
        return False
    normalized = _normalize_tr(text)
    # Sadece rakamlar → ZIP kodu, değil
    if re.match(r'^\d+$', text):
        return False
    # Rakamla başlıyorsa → posta kodu veya bina numarası (örn. "34522 Esenyurt")
    if re.match(r'^\d', text.strip()):
        return False
    # "No:" veya "No." kalıbı → bina/kapı numarası (örn. "No:15", "No.7")
    if re.search(r'\bno\b\s*[:.]\s*\d', normalized):
        return False
    # Şehir adıyla aynı → değil
    if normalized == city_normalized:
        return False
    # Çok uzun (40+) → muhtemelen cadde/sokak bilgisi
    if len(text) > 40:
        return False
    # Çok kısa (2-) → anlamsız
    if len(text) < 3:
        return False
    words = normalized.split()
    if len(words) == 1:
        # Tek kelime: başı rakam veya street keyword → değil
        # (örn. "Sk." → "sk" normalize → keyword)
        word_stem = re.split(r'[^a-z]', words[0])[0]  # "sk." → "sk", "no:15" → "no"
        if word_stem in _STREET_KEYWORDS:
            return False
    else:
        # Çok kelime: HERHANGİ biri street keyword veya rakamla başlıyorsa → değil
        for w in words:
            stem = re.split(r'[^a-z]', w)[0]
            if stem in _STREET_KEYWORDS:
                return False
            if re.match(r'^\d', w):
                return False
    return True


def _parse_from_address(address: str) -> Tuple[str, str]:
    """Adres string'inden şehir ve ilçe çıkarır."""
    city = _match_city(address)
    if not city:
        return '', ''

    normalized_city = _normalize_tr(city)
    normalized_address = _normalize_tr(address)

    # Şehrin POZİSYONUNU BUL — son oluşumu al
    # (şehir adı "Ankara Cad." gibi sokak adında da geçebilir — asıl yer genellikle sonda)
    all_matches = list(re.finditer(r'\b' + re.escape(normalized_city) + r'\b', normalized_address))
    if not all_matches:
        return city, ''

    city_pos = all_matches[-1].start()
    before_city = address[:city_pos].rstrip(',./-\\; \t\n')

    district = ''

    # Strateji 1: Son virgül veya slash'tan sonraki parçayı ilçe olarak dene
    for sep in [',', '/', '\\']:
        pos = before_city.rfind(sep)
        if pos >= 0:
            candidate = _clean_component(before_city[pos + 1:])
            if _is_district_candidate(candidate, normalized_city):
                district = candidate
                logger.debug(f"İlçe bulundu (sep='{sep}'): {district}")
                break

    # Strateji 2: Separator yoksa before_city'nin son 1-2 kelimesini dene
    if not district:
        words = before_city.strip().split()
        for n in [1, 2]:
            if len(words) >= n:
                candidate = _clean_component(' '.join(words[-n:]))
                if _is_district_candidate(candidate, normalized_city):
                    district = candidate
                    logger.debug(f"İlçe bulundu (son kelime): {district}")
                    break

    return city, district


def extract_city_district(
    address: str = '',
    schema_locality: str = '',
    schema_region: str = '',
) -> Tuple[str, str]:
    """
    Adres bilgisinden şehir ve ilçe çıkarır.

    Öncelik sırası:
    1. Schema.org: her ikisi 81-il listesiyle eşleştirilir, il olan şehir olur;
       eşleşmeyen diğeri ilçe adayı olarak değerlendirilir.
    2. Adres metninde 81-il eşleşmesi + separator heuristiği

    Args:
        address: Ham adres metni (ör. "Atatürk Mah. No:5, Gemlik, Bursa 16601")
        schema_locality: Schema.org addressLocality (genellikle ilçe)
        schema_region: Schema.org addressRegion (genellikle şehir)

    Returns:
        Tuple[str, str]: (city, district) — bulunamazsa boş string
    """
    city = ''
    district = ''

    # 1. Schema.org — en güvenilir
    # Her ikisini önce 81-il listesiyle eşleştir, sonra rollerini ata
    region_city = _match_city(schema_region) if schema_region else ''
    locality_city = _match_city(schema_locality) if schema_locality else ''

    if region_city:
        # region kesin olarak bir il → şehir olarak al
        city = region_city
        if schema_locality and not locality_city:
            # locality bir il değil → ilçe adayı
            candidate = _clean_component(schema_locality)
            if _is_district_candidate(candidate, _normalize_tr(city)):
                district = candidate
                logger.debug(f"Schema.org'dan ilçe: {district}, şehir: {city}")
    elif locality_city:
        # region il eşleşmedi ama locality eşleşti → locality şehir, region ilçe adayı
        city = locality_city
        if schema_region:
            candidate = _clean_component(schema_region)
            if _is_district_candidate(candidate, _normalize_tr(city)):
                district = candidate
                logger.debug(f"Schema.org'dan ilçe (region→district): {district}, şehir: {city}")
    elif schema_region:
        # Hiçbiri il listesiyle eşleşmedi → region'ı olduğu gibi kullan (son çare)
        city = _clean_component(schema_region)
        if schema_locality:
            candidate = _clean_component(schema_locality)
            if _is_district_candidate(candidate, _normalize_tr(city)):
                district = candidate

    if city and district:
        return city, district

    # 2. Adres metninden parse et
    if address:
        parsed_city, parsed_district = _parse_from_address(address)
        if not city and parsed_city:
            city = parsed_city
        if not district and parsed_district:
            district = parsed_district

    if city:
        logger.debug(f"Lokasyon: şehir={city!r}, ilçe={district!r}")

    return city, district
