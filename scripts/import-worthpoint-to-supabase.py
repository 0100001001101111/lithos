#!/usr/bin/env python3
"""
Import WorthPoint CSV data into Supabase lithos_prices table.

Usage:
    python3 import-worthpoint-to-supabase.py

Reads the merged CSV and inserts monthly median prices into Supabase.
Uses direct REST API calls to avoid Python package architecture issues.
"""

import csv
import os
import json
from collections import defaultdict
import statistics
import urllib.request
import urllib.error

# Configuration
SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

CSV_FILE = os.path.expanduser("~/lithos/scripts/worthpoint-data/worthpoint-all-materials.csv")


def load_merged_csv() -> list[dict]:
    """Load the merged WorthPoint CSV file."""
    records = []
    with open(CSV_FILE, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Only include rows with price_per_gram and sale_date
            if not row.get('price_per_gram') or not row.get('sale_date'):
                continue

            try:
                ppg = float(row['price_per_gram'])
                # Sanity check - skip extreme outliers
                if ppg <= 0 or ppg > 50000:
                    continue

                records.append({
                    'material_slug': row['material_slug'],
                    'price_per_gram': ppg,
                    'sale_date': row['sale_date'],
                })
            except (ValueError, KeyError):
                continue

    return records


def calculate_monthly_medians(records: list[dict]) -> list[dict]:
    """
    Aggregate to monthly median prices.
    Returns one record per material per month.
    """
    # Group by (material, year-month)
    grouped = defaultdict(list)
    for r in records:
        date = r['sale_date']
        if date and len(date) >= 7:
            month_key = date[:7]  # YYYY-MM
            key = (r['material_slug'], month_key)
            grouped[key].append(r['price_per_gram'])

    # Calculate medians
    aggregated = []
    for (slug, month), prices in sorted(grouped.items()):
        if prices:
            median_price = statistics.median(prices)
            aggregated.append({
                'material_slug': slug,
                'price_usd': round(median_price, 2),
                'price_per': 'gram',
                'source': f'WorthPoint (n={len(prices)})',
                'recorded_at': f"{month}-15",  # Mid-month
            })

    return aggregated


def insert_to_supabase(records: list[dict]) -> tuple[int, int]:
    """Insert records using Supabase REST API directly."""
    url = f"{SUPABASE_URL}/rest/v1/lithos_prices"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
    }

    inserted = 0
    errors = 0
    batch_size = 100

    for i in range(0, len(records), batch_size):
        batch = records[i:i+batch_size]
        try:
            data = json.dumps(batch).encode('utf-8')
            req = urllib.request.Request(url, data=data, headers=headers, method='POST')
            with urllib.request.urlopen(req) as response:
                inserted += len(batch)
                print(f"  Inserted batch {i//batch_size + 1}: {len(batch)} records")
        except urllib.error.HTTPError as e:
            # Try individual inserts on batch failure
            error_body = e.read().decode('utf-8') if e.fp else str(e)
            print(f"  Batch error: {error_body[:200]}")
            for record in batch:
                try:
                    data = json.dumps([record]).encode('utf-8')
                    req = urllib.request.Request(url, data=data, headers=headers, method='POST')
                    with urllib.request.urlopen(req):
                        inserted += 1
                except Exception as e2:
                    errors += 1
                    if errors <= 5:
                        print(f"  Error: {e2}")
        except Exception as e:
            print(f"  Unexpected error: {e}")
            errors += len(batch)

    return inserted, errors


def main():
    print("=" * 60)
    print("WORTHPOINT -> SUPABASE IMPORT")
    print("=" * 60)
    print()

    if not SUPABASE_URL or not SUPABASE_KEY:
        print("ERROR: Set environment variables:")
        print("  export NEXT_PUBLIC_SUPABASE_URL='your-url'")
        print("  export SUPABASE_SERVICE_ROLE_KEY='your-key'")
        return

    if not os.path.exists(CSV_FILE):
        print(f"ERROR: CSV file not found: {CSV_FILE}")
        print("Run process-worthpoint-csvs.py first")
        return

    # Load data
    print(f"Loading {CSV_FILE}...")
    records = load_merged_csv()
    print(f"  Loaded {len(records)} records with price_per_gram")

    # Aggregate to monthly medians
    print("\nCalculating monthly medians...")
    aggregated = calculate_monthly_medians(records)
    print(f"  Aggregated to {len(aggregated)} monthly data points")

    # Show breakdown by material
    material_counts = defaultdict(int)
    for r in aggregated:
        material_counts[r['material_slug']] += 1

    print("\n  Data points per material:")
    for mat, count in sorted(material_counts.items()):
        print(f"    {mat}: {count}")

    # Insert records via REST API
    print(f"\nInserting {len(aggregated)} records via REST API...")
    inserted, errors = insert_to_supabase(aggregated)

    print()
    print("=" * 60)
    print(f"COMPLETE: {inserted} records inserted, {errors} errors")
    print("=" * 60)


if __name__ == "__main__":
    main()
