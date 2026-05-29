"""
catalog_analyzer.py
-------------------
PDF kataloglarından malzeme adayları çıkar (Rule-based, pdfminer.six).

Kullanım:
  python catalog_analyzer.py --company "Dizayn Grup" --test-dir 10
  python catalog_analyzer.py --company "Ayvaz"
  python catalog_analyzer.py --pdf "D:/path/to/file.pdf" --company "Test"
"""

import os
import re
import sys
import json
import argparse
from datetime import datetime
from typing import List, Dict, Tuple, Optional

sys.stdout.reconfigure(encoding='utf-8')

OUTPUT_DIR   = r'D:\Sanayi Marketi Output'
CATALOGS_DIR = os.path.join(OUTPUT_DIR, 'catalogs')
TESTS_DIR    = os.path.join(OUTPUT_DIR, 'tests')
CANDIDATES_FILE = 'materials_candidates.json'

# ─── KEYWORD SETLERİ ─────────────────────────────────────────────────────────

# Substring eşleşmesi güvenli olan uzun keyword'ler (>= 4 harf)
STRONG_KEYWORDS = {
    # Boru / tüp
    'boru', 'pipe', 'tüp', 'tube', 'hortum',
    # Profil / yapısal (kısa profil kodları _WORD_KEYWORDS'de)
    'profil', 'köşebent', 'lama', 'nervürlü',
    # Levha / sac
    'levha', 'sac', 'plaka', 'sheet', 'plate',
    # Vana ve fittings
    'vana', 'valf', 'valve', 'küresel', 'kelebek', 'sürgülü', 'çekvalf',
    'fitting', 'rakor', 'nipel', 'nipple',
    'flanş', 'flange', 'dirsek', 'elbow', 'redüksiyon', 'manşon',
    'kuplaj', 'kelepçe', 'klips', 'kaplin',
    'conta', 'salmastra', 'gasket', 'oring',
    # Isı sistemleri
    'radyatör', 'kalorifer', 'kollektör', 'manifold',
    'ısıtma', 'soğutma', 'fancoil', 'petek',
    # Polimer (kısa kodlar _WORD_KEYWORDS'de)
    'pp-r', 'ppr', 'pprc', 'hdpe', 'pe-rt', 'pert',
    'polipropilen', 'polietilen', 'polyester',
    # Pompa / kompresör
    'pompa', 'pump', 'kompresör', 'hidrofor',
    # Filtre / seperatör
    'filtre', 'filter', 'seperatör', 'streyner',
    # Metal
    'çelik', 'demir', 'alüminyum', 'bakır', 'pirinç',
    'paslanmaz', 'galvanizli', 'galvanize', 'inox',
    # Kablo / elektrik
    'kablo', 'iletken', 'klemens',
    # Diğer sanayi
    'klape', 'aksesuar', 'taşıyıcı',
    'izolasyon', 'yalıtım', 'kompansatör', 'ekspansiyon',
}

# Kısa kodlar — yanlış eşleşmeyi önlemek için word-boundary ile aranır
_WORD_KEYWORDS = re.compile(
    r'\b(?:hea|heb|ipe|upn|bim|pvc|abs|tee|tel|bara|sac)\b',
    re.IGNORECASE,
)

# Boyut / spesifikasyon kalıpları — malzeme adından temizlenecek
_SPEC_RE = re.compile(
    r'\b(?:DN|PN|NPS|d|D)\s*[\d\./]+\b'        # DN20, PN16, d=20
    r'|\b\d+\s*(?:mm|cm|m\b|bar|kg|°C|°)\b'    # 20mm, 16 bar
    r'|\b\d+["\']\s*(?:NPTM?|BSP|ISO|DIN)?\b'  # 1/2", 3/4"
    r'|\b(?:R|G|Rp)\s*\d+[/\d]*\b'             # R1/2, G3/4
    r'|\b\d+[,\.]\d+\s*(?:mm|cm|m\b)\b',       # 1,5 mm
    re.IGNORECASE,
)

# Fiyat / birim suffix kalıpları — satır sonundan temizlenecek
_PRICE_RE = re.compile(
    r'\s+\d[\d\s.,]*\s*(?:TL|₺|EUR|USD|\$)?\s*(?:/\s*\w+)?\s*$'
    r'|\s+\d[\d.,]+\s*$',
    re.IGNORECASE,
)

# Gürültü satırları — bunlar aday olamaz
_NOISE_RE = re.compile(
    r'^\s*\d[\d\s,\.]*\s*(?:TL|₺|EUR|USD|\$|m\b|kg\b|adet\b)?\s*$'  # fiyat/sayı satırı
    r'|^\s*(?:Sayfa|Page)\s*\d+'             # sayfa numarası
    r'|^\s*\d{2}[./]\d{2}[./]\d{4}'         # tarih
    r'|^\s*(?:www\.|http)'                   # URL
    r'|@'                                    # e-mail
    r'|^\s*\+?90[\s\d]'                      # telefon
    r'|^\s*(?:Tel|Fax|Adres|KDV)\s*[:/]'     # etiket satırı
    r'|^\s*Contact\s+\w+'                    # Contact Person/Telephone/e-mail vb.
    r'|^\s*[-_=*•·]{2,}\s*$'                # ayraç / madde işareti
    r'|^\s*[A-ZÇĞİÖŞÜa-z]\s*$'             # tek harf
    r'|(?:San\.\s*Tic\.|A\.Ş\.|Ltd\.|Şti\.)'  # şirket unvanı
    r'|(?:edilir|edilmez|uygundur|kullanılır|yapılır|verilir)\s*\.'  # cümle sonu Türkçe
    r'|(?:sulama|tarım|peyzaj|bahçe)\s+(?:sistem|uygulama)'  # uygulama alanı cümleleri
    r'|^\s*migration\s'                      # İngilizce teknik not satırları
    r'|^\s*\*',                              # dipnot / uyarı satırı
    re.IGNORECASE,
)

# ─── YARDIMCI FONKSİYONLAR ───────────────────────────────────────────────────

def _is_noise(line: str) -> bool:
    if len(line.strip()) < 3:
        return True
    return bool(_NOISE_RE.search(line))


def _clean_name(line: str) -> str:
    """Satırın sonundaki fiyat/birim suffix'ini kaldır."""
    return _PRICE_RE.sub('', line).strip()


_COLOR_RE = re.compile(
    r'\s*[-–]\s*(?:Mavi|Kırmızı|Sarı|Beyaz|Siyah|Yeşil|Gri|Turuncu|Kahverengi|Mor)\b'
    r'|\s+(?:SETİ|TAKIMI|GRUBU)\s*$',
    re.IGNORECASE,
)

def _normalize(name: str) -> str:
    """Deduplication için: boyut spec, renk varyantı ve set suffix kaldır, büyük harfe çevir."""
    result = _COLOR_RE.sub('', name)
    result = _SPEC_RE.sub('', result).upper()
    result = re.sub(r'\s+', ' ', result).strip()
    result = re.sub(r'[,.:;]+$', '', result).strip()
    return result


def _score(line: str) -> float:
    """
    Satırın malzeme adayı olma güven skoru (0.0 = aday değil, 0.5–0.95 = aday).
    Threshold: 0.5
    """
    low = line.lower()
    score = 0.0

    for kw in STRONG_KEYWORDS:
        if kw in low:
            score = 0.85
            break

    # Kısa word-boundary keyword'ler (hea, heb, ipe, pvc, ...)
    if score == 0.0 and _WORD_KEYWORDS.search(line):
        score = 0.85

    # Boyut spesifikasyonu varsa + keyword varsa → ürün satırı olma ihtimali artar
    if score > 0 and _SPEC_RE.search(line):
        score = min(score + 0.05, 0.95)

    # Fiyat kalıbı var ama keyword yok → zayıf aday
    if score == 0.0 and re.search(r'\d+[,\.]\d+', line):
        score = 0.50

    # Uzunluk cezası
    n = len(line.strip())
    if n < 4 or n > 120:
        score *= 0.1
    elif n > 80:
        score *= 0.3  # muhtemelen açıklama cümlesi

    # Tek kelime ve çok genellik cezası ("BORU", "VANA" gibi)
    words = line.strip().split()
    if len(words) == 1 and score < 0.90:
        score *= 0.4

    # Cümle yapısı cezası: küçük harf ağırlıklı ve virgül/nokta içeriyorsa
    alpha = [c for c in line if c.isalpha()]
    if alpha:
        lower_ratio = sum(1 for c in alpha if c.islower()) / len(alpha)
        if lower_ratio > 0.6 and (',' in line or '. ' in line):
            score *= 0.2

    return round(score, 2)


def _is_section_header(line: str) -> bool:
    """
    Satır bölüm başlığı mı? (büyük harf ağırlıklı, fiyat yok, kısa-orta uzunluk)
    Başlıklar malzeme adayı olarak da kaydedilir.
    """
    s = line.strip()
    if len(s) < 4 or len(s) > 80:
        return False
    if not s[0].isupper():
        return False
    alpha = [c for c in s if c.isalpha()]
    if not alpha:
        return False
    upper_ratio = sum(1 for c in alpha if c.isupper()) / len(alpha)
    has_price   = bool(re.search(r'\d+[,\.]\d+', s))
    digit_ratio = sum(1 for c in s if c.isdigit()) / len(s)
    return upper_ratio > 0.55 and not has_price and digit_ratio < 0.25


# ─── PDF METİN ÇIKARIMI ──────────────────────────────────────────────────────

def extract_pages(pdf_path: str) -> List[Tuple[int, List[str]]]:
    """
    pdfminer.six ile PDF'den sayfa bazlı metin satırları çıkar.
    Returns: [(page_num, [line, ...]), ...]
    """
    try:
        from pdfminer.high_level import extract_pages as _ep
        from pdfminer.layout import LTTextContainer, LTTextLine
    except ImportError:
        print("[HATA] pdfminer.six kurulu değil: pip install pdfminer.six", file=sys.stderr)
        sys.exit(1)

    result = []
    try:
        for page_num, page_layout in enumerate(_ep(pdf_path), start=1):
            lines: List[str] = []
            for element in page_layout:
                if isinstance(element, LTTextContainer):
                    for line_obj in element:
                        if isinstance(line_obj, LTTextLine):
                            text = line_obj.get_text().strip()
                            if text:
                                lines.append(text)
            result.append((page_num, lines))
    except Exception as e:
        print(f"[HATA] PDF okunamadı: {e}", file=sys.stderr)

    return result


# ─── ADAY ÇIKARIMI ───────────────────────────────────────────────────────────

def extract_candidates(pages: List[Tuple[int, List[str]]]) -> List[Dict]:
    """
    Tüm sayfalardan malzeme adaylarını çıkar, normalize edip deduplicate et.
    """
    candidates: List[Dict] = []
    seen: set = set()
    current_category = ""

    for page_num, lines in pages:
        for raw_line in lines:
            line = raw_line.strip()
            if not line or _is_noise(line):
                continue

            # Bölüm başlığı tespiti
            if _is_section_header(line):
                current_category = _clean_name(line)
                # Başlık aynı zamanda keyword içeriyorsa aday olarak da ekle
                if _score(line) >= 0.5:
                    clean = _clean_name(line)
                    norm  = _normalize(clean)
                    if norm and norm not in seen and len(norm) >= 4:
                        seen.add(norm)
                        candidates.append({
                            'name':       clean,
                            'confidence': _score(clean),
                            'source_page': page_num,
                            'category':   '',
                        })
                continue

            # Fiyat temizle
            clean = _clean_name(line)
            if not clean or len(clean) < 4:
                continue

            score = _score(clean)
            if score < 0.5:
                continue

            norm = _normalize(clean)
            if not norm or norm in seen or len(norm) < 4:
                continue

            seen.add(norm)
            candidates.append({
                'name':       clean,
                'confidence': score,
                'source_page': page_num,
                'category':   current_category,
            })

    # Güven skoruna göre sırala
    candidates.sort(key=lambda x: x['confidence'], reverse=True)
    return candidates


# ─── ÇIKTI ───────────────────────────────────────────────────────────────────

def write_candidates(
    company_name: str,
    catalog_path: str,
    candidates: List[Dict],
    output_dir: str,
) -> str:
    """materials_candidates.json yaz, dosya yolunu döndür."""
    catalog_file = os.path.basename(catalog_path)
    output = {
        'company_name':      company_name,
        'catalog_file':      catalog_file,
        'analyzed_at':       datetime.now().isoformat(),
        'extraction_method': 'rule-based',
        'candidates':        candidates,
        'total_candidates':  len(candidates),
        'status':            'PENDING_REVIEW',
    }
    out_path = os.path.join(output_dir, CANDIDATES_FILE)
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    return out_path


def print_summary(candidates: List[Dict], out_path: str) -> None:
    total  = len(candidates)
    high   = sum(1 for c in candidates if c['confidence'] >= 0.85)
    medium = sum(1 for c in candidates if 0.65 <= c['confidence'] < 0.85)
    low    = sum(1 for c in candidates if c['confidence'] < 0.65)

    print(f"\n{'─'*55}")
    print(f"  Toplam aday   : {total}")
    print(f"  Yüksek güven  : {high}  (≥0.85)")
    print(f"  Orta güven    : {medium}  (0.65–0.84)")
    print(f"  Düşük güven   : {low}  (<0.65)")
    print(f"{'─'*55}")
    if candidates:
        print("  İlk 10 aday:")
        for c in candidates[:10]:
            print(f"    [{c['confidence']:.2f}] s.{c['source_page']:>3}  {c['name']}")
    print(f"{'─'*55}")
    print(f"  Kaydedildi: {out_path}\n")


# ─── ANA AKIŞ ────────────────────────────────────────────────────────────────

def analyze_catalog(pdf_path: str, company_name: str, output_dir: str) -> Optional[str]:
    """Tek bir PDF analiz et, candidates JSON yaz."""
    print(f"\n[Analiz] {os.path.basename(pdf_path)}")
    pages = extract_pages(pdf_path)
    if not pages:
        print("  [HATA] Sayfalar okunamadı.")
        return None

    total_lines = sum(len(lines) for _, lines in pages)
    print(f"  {len(pages)} sayfa, {total_lines} satır okundu.")

    candidates = extract_candidates(pages)
    out_path = write_candidates(company_name, pdf_path, candidates, output_dir)
    print_summary(candidates, out_path)
    return out_path


def find_company_dir(company_name: str, test_dir: Optional[int]) -> Optional[str]:
    """Firma klasörünü bul (test veya ana katalog dizini)."""
    safe_name = company_name.replace(' ', '_')

    if test_dir is not None:
        path = os.path.join(TESTS_DIR, f'test-{test_dir}', safe_name)
    else:
        path = os.path.join(CATALOGS_DIR, safe_name)

    if not os.path.isdir(path):
        print(f"[HATA] Firma dizini bulunamadı: {path}", file=sys.stderr)
        return None
    return path


def get_pdf_files(company_dir: str) -> List[str]:
    """Firma dizinindeki PDF dosyalarını döndür (company_info.json'dan okur)."""
    info_path = os.path.join(company_dir, 'company_info.json')
    if os.path.exists(info_path):
        try:
            with open(info_path, encoding='utf-8') as f:
                data = json.load(f)
            files = data.get('catalog_info', {}).get('files', [])
            pdfs = [p for p in files if p.lower().endswith('.pdf') and os.path.exists(p)]
            if pdfs:
                return pdfs
        except Exception:
            pass
    # Fallback: dizindeki tüm PDF'ler
    return [
        os.path.join(company_dir, f)
        for f in os.listdir(company_dir)
        if f.lower().endswith('.pdf')
    ]


# ─── CLI ─────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description='PDF kataloglarından malzeme adayları çıkar (rule-based).'
    )
    parser.add_argument('--company',  required=True, help='Firma adı (ör. "Dizayn Grup")')
    parser.add_argument('--test-dir', type=int, default=None,
                        help='Test klasörü numarası (ör. 10 → tests/test-10/)')
    parser.add_argument('--pdf',      default=None,
                        help='Doğrudan PDF yolu (company_info.json yerine)')
    args = parser.parse_args()

    if args.pdf:
        if not os.path.exists(args.pdf):
            print(f"[HATA] PDF bulunamadı: {args.pdf}", file=sys.stderr)
            sys.exit(1)
        output_dir = os.path.dirname(args.pdf)
        analyze_catalog(args.pdf, args.company, output_dir)
        return

    company_dir = find_company_dir(args.company, args.test_dir)
    if not company_dir:
        sys.exit(1)

    pdf_files = get_pdf_files(company_dir)
    if not pdf_files:
        print(f"[HATA] {company_dir} dizininde PDF bulunamadı.", file=sys.stderr)
        sys.exit(1)

    print(f"\nFirma    : {args.company}")
    print(f"Dizin    : {company_dir}")
    print(f"PDF sayısı: {len(pdf_files)}")

    for pdf_path in pdf_files:
        analyze_catalog(pdf_path, args.company, company_dir)


if __name__ == '__main__':
    main()
