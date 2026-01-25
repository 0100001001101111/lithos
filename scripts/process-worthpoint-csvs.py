#!/usr/bin/env python3
"""
Process WorthPoint CSVs: filter, normalize, merge, and import to Supabase.
"""

import os
import re
import csv
from collections import defaultdict
from datetime import datetime

DATA_DIR = os.path.expanduser("~/lithos/scripts/worthpoint-data")
OUTPUT_FILE = os.path.join(DATA_DIR, "worthpoint-all-materials.csv")

# Mapping: filename pattern -> (material_slug, filter_function)
# Filter function takes title (lowercase) and returns True if valid
MATERIAL_CONFIG = {
    "darwin-glass": ("darwin-glass", lambda t: "darwin glass" in t),
    "_darwin-glass_": ("darwin-glass", lambda t: "darwin glass" in t),  # duplicate
    "trinitite": ("trinitite", lambda t: "trinitite" in t and "red" not in t),
    "australite": ("australite", lambda t: "australite" in t),
    "philippinite": ("philippinite", lambda t: "philippinite" in t),
    "georgiaite": ("georgiaite", lambda t: "georgiaite" in t),
    "bediasite": ("bediasite", lambda t: "bediasite" in t),
    "gibeon": ("gibeon-meteorite", lambda t: "gibeon" in t),
    "seymchan": ("seymchan-meteorite", lambda t: "seymchan" in t),
    "chelyabinsk": ("chelyabinsk-meteorite", lambda t: "chelyabinsk" in t),
    "canyon-diablo": ("canyon-diablo-meteorite", lambda t: "canyon diablo" in t),
    "fulgurite": ("fulgurite", lambda t: "fulgurite" in t),
    "osmium": ("osmium", lambda t: "osmium" in t),
    "iridium": ("iridium", lambda t: "iridium" in t),
    "gallium": ("gallium", lambda t: "gallium" in t),
    "bismuth": ("bismuth", lambda t: "bismuth" in t),
    "uranium-glass": ("uranium-glass", lambda t: "uranium" in t and "glass" in t),
    "allende": ("allende-meteorite", lambda t: "allende" in t),
    "indochinite": ("indochinite", lambda t: "indochinite" in t),
    "nwa-martian": ("nwa-martian-meteorite", lambda t: "martian" in t or ("nwa" in t and "mars" in t) or "shergottite" in t),
    "muonionalusta": ("muonionalusta-meteorite", lambda t: "muonionalusta" in t),
    "nwa-lunar": ("nwa-lunar-meteorite", lambda t: "lunar" in t or ("nwa" in t and "moon" in t)),
    "libyan-desert-glass": ("libyan-desert-glass", lambda t: "libyan" in t or "ldg" in t),
    "sikhote": ("sikhote-alin-meteorite", lambda t: "sikhote" in t),
    "campo": ("campo-del-cielo-meteorite", lambda t: "campo" in t),
    # K-Pg boundary group - all map to same material
    "kt-boundary": ("kpg-boundary", lambda t: "kt" in t or "k-t" in t or "k-pg" in t or "kpg" in t or "cretaceous" in t or "boundary" in t),
    "cretaceous-boundary": ("kpg-boundary", lambda t: "cretaceous" in t or "kt" in t or "k-t" in t or "k-pg" in t or "boundary" in t),
    "impact-spherules": ("kpg-boundary", lambda t: "spherule" in t or "impact" in t or "kt" in t or "cretaceous" in t),
}


def extract_weight(title: str) -> float | None:
    """Extract weight in grams from title."""
    patterns = [
        (r'(\d+\.?\d*)\s*[Gg](?:rams?)?(?:\s|$|,)', 1.0),
        (r'(\d+\.?\d*)-[Gg](?:rams?)?', 1.0),
        (r'(\d+\.?\d*)\s*[Gg]r\.?(?:\s|$)', 1.0),
        (r'(\d+\.?\d*)\s*ct(?:s)?(?:\s|$)', 0.2),
        (r'(\d+\.?\d*)\s*carat', 0.2),
        (r'(\d+\.?\d*)\s*oz(?:\s|$)', 28.35),
        (r'(\d+\.?\d*)\s*kg(?:\s|$)', 1000.0),
        (r'(\d+\.?\d*)\s*lb(?:s)?(?:\s|$)', 453.6),
    ]
    for pattern, multiplier in patterns:
        match = re.search(pattern, title, re.IGNORECASE)
        if match:
            weight = float(match.group(1)) * multiplier
            if 0.01 < weight < 100000:
                return round(weight, 3)
    return None


def parse_price(price_str: str) -> float | None:
    """Parse price string to float."""
    if not price_str:
        return None
    # Remove $, commas, whitespace
    cleaned = re.sub(r'[$,\s]', '', str(price_str))
    try:
        price = float(cleaned)
        if 0 < price < 1000000:
            return round(price, 2)
    except:
        pass
    return None


def parse_date(date_str: str) -> str | None:
    """Parse date to YYYY-MM-DD format."""
    if not date_str:
        return None
    formats = ["%b %d, %Y", "%B %d, %Y", "%m/%d/%Y", "%Y-%m-%d"]
    for fmt in formats:
        try:
            dt = datetime.strptime(str(date_str).strip(), fmt)
            return dt.strftime("%Y-%m-%d")
        except:
            continue
    return str(date_str) if date_str else None


def get_material_key(filename: str) -> str | None:
    """Get the material config key from filename."""
    base = os.path.basename(filename).replace('.csv', '').lower()
    # Try exact match first
    if base in MATERIAL_CONFIG:
        return base
    # Try partial match
    for key in MATERIAL_CONFIG:
        if key in base or base in key:
            return key
    return None


def read_csv(filepath: str) -> list[dict]:
    """Read CSV file and return list of dicts."""
    rows = []
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                rows.append(row)
    except Exception as e:
        print(f"  Error reading {filepath}: {e}")
    return rows


def main():
    print("=" * 70)
    print("WORTHPOINT CSV PROCESSOR")
    print("=" * 70)
    print()

    # Step 1: Read all CSVs and show raw counts
    print("STEP 1: RAW ROW COUNTS")
    print("-" * 50)

    all_files = sorted([f for f in os.listdir(DATA_DIR) if f.endswith('.csv') and f != 'worthpoint-all-materials.csv'])
    raw_data = {}
    total_raw = 0

    for filename in all_files:
        filepath = os.path.join(DATA_DIR, filename)
        rows = read_csv(filepath)
        raw_data[filename] = rows
        total_raw += len(rows)
        print(f"  {filename}: {len(rows)} rows")

    print(f"\n  TOTAL RAW: {total_raw} rows")
    print()

    # Step 2: Filter each CSV
    print("STEP 2: FILTERING BY TITLE")
    print("-" * 50)

    filtered_data = defaultdict(list)
    seen_titles = set()  # Global deduplication
    filter_stats = {}

    for filename, rows in raw_data.items():
        material_key = get_material_key(filename)
        if not material_key:
            print(f"  WARNING: No config for {filename}, skipping")
            continue

        material_slug, filter_fn = MATERIAL_CONFIG[material_key]

        before = len(rows)
        kept = 0
        dropped = 0

        for row in rows:
            title = row.get('title', '').lower()

            # Apply filter
            if not filter_fn(title):
                dropped += 1
                continue

            # Deduplicate by title (first 60 chars)
            title_key = title[:60]
            if title_key in seen_titles:
                dropped += 1
                continue
            seen_titles.add(title_key)

            # Add to filtered data with normalized material slug
            row['material_slug'] = material_slug
            filtered_data[material_slug].append(row)
            kept += 1

        filter_stats[filename] = (before, kept, dropped)
        print(f"  {filename}: {before} -> {kept} ({dropped} dropped)")

    total_filtered = sum(len(rows) for rows in filtered_data.values())
    print(f"\n  TOTAL AFTER FILTER: {total_filtered} rows (dropped {total_raw - total_filtered})")
    print()

    # Step 3: Normalize data
    print("STEP 3: NORMALIZING DATA")
    print("-" * 50)

    all_rows = []
    weight_stats = defaultdict(lambda: {'total': 0, 'with_weight': 0})

    for material_slug, rows in filtered_data.items():
        for row in rows:
            # Parse price
            price = parse_price(row.get('price_usd') or row.get('price'))
            if not price:
                continue

            # Parse date
            date = parse_date(row.get('sale_date') or row.get('date'))

            # Parse weight (from title or existing field)
            title = row.get('title', '')
            weight = None
            if row.get('weight_grams'):
                try:
                    weight = float(row['weight_grams'])
                except:
                    pass
            if not weight:
                weight = extract_weight(title)

            # Calculate price per gram
            price_per_gram = None
            if weight and weight > 0:
                price_per_gram = round(price / weight, 2)

            weight_stats[material_slug]['total'] += 1
            if weight:
                weight_stats[material_slug]['with_weight'] += 1

            all_rows.append({
                'material_slug': material_slug,
                'title': title,
                'price_usd': price,
                'sale_date': date,
                'weight_grams': weight,
                'price_per_gram': price_per_gram,
                'source': 'WorthPoint',
            })

    print(f"  Normalized {len(all_rows)} rows")
    for mat, stats in sorted(weight_stats.items()):
        pct = (stats['with_weight'] / stats['total'] * 100) if stats['total'] > 0 else 0
        print(f"    {mat}: {stats['total']} rows, {stats['with_weight']} with weight ({pct:.0f}%)")
    print()

    # Step 4: Save merged CSV
    print("STEP 4: SAVING MERGED CSV")
    print("-" * 50)

    fieldnames = ['material_slug', 'title', 'price_usd', 'sale_date', 'weight_grams', 'price_per_gram', 'source']

    with open(OUTPUT_FILE, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(all_rows)

    print(f"  Saved {len(all_rows)} rows to {OUTPUT_FILE}")
    print()

    # Step 5: Summary stats
    print("STEP 5: SUMMARY STATISTICS")
    print("-" * 50)

    print(f"\n  TOTAL ROWS: {len(all_rows)}")
    print()
    print("  ROWS PER MATERIAL:")

    material_counts = defaultdict(int)
    material_prices = defaultdict(list)
    material_ppg = defaultdict(list)

    for row in all_rows:
        mat = row['material_slug']
        material_counts[mat] += 1
        if row['price_usd']:
            material_prices[mat].append(row['price_usd'])
        if row['price_per_gram']:
            material_ppg[mat].append(row['price_per_gram'])

    print(f"  {'Material':<30} {'Count':>8} {'Price Range':>20} {'Avg $/g':>12}")
    print(f"  {'-'*30} {'-'*8} {'-'*20} {'-'*12}")

    for mat in sorted(material_counts.keys()):
        count = material_counts[mat]
        prices = material_prices[mat]
        ppg = material_ppg[mat]

        price_range = f"${min(prices):.0f} - ${max(prices):.0f}" if prices else "N/A"
        avg_ppg = f"${sum(ppg)/len(ppg):.2f}" if ppg else "N/A"

        print(f"  {mat:<30} {count:>8} {price_range:>20} {avg_ppg:>12}")

    print()
    print(f"  GRAND TOTAL: {len(all_rows)} rows across {len(material_counts)} materials")

    # Overall stats
    all_prices = [r['price_usd'] for r in all_rows if r['price_usd']]
    all_ppg = [r['price_per_gram'] for r in all_rows if r['price_per_gram']]

    print(f"\n  OVERALL PRICE RANGE: ${min(all_prices):.2f} - ${max(all_prices):.2f}")
    print(f"  ROWS WITH WEIGHT DATA: {len(all_ppg)} ({len(all_ppg)/len(all_rows)*100:.1f}%)")
    if all_ppg:
        all_ppg_sorted = sorted(all_ppg)
        median_ppg = all_ppg_sorted[len(all_ppg_sorted)//2]
        print(f"  MEDIAN PRICE/GRAM: ${median_ppg:.2f}")
        print(f"  AVERAGE PRICE/GRAM: ${sum(all_ppg)/len(all_ppg):.2f}")

    print()
    print("=" * 70)
    print("DONE! Ready for Supabase import.")
    print("=" * 70)

    return all_rows


if __name__ == "__main__":
    main()
