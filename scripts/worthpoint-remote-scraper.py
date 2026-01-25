#!/usr/bin/env python3
"""
WorthPoint Scraper - Connects to running Chrome via Remote Debugging

SETUP:
1. Close Chrome completely
2. Start Chrome with remote debugging:
   /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222

3. Log into WorthPoint in that Chrome window
4. Run this script

Usage:
    python3 worthpoint-remote-scraper.py --material "Darwin Glass"
"""

import re
import csv
import time
import argparse
import os
from datetime import datetime
from urllib.parse import quote
from playwright.sync_api import sync_playwright

OUTPUT_DIR = os.path.expanduser("~/lithos/scripts/worthpoint-data")
DELAY_BETWEEN_PAGES = 3
MAX_PAGES = 200


def extract_weight(title: str) -> float | None:
    patterns = [
        (r'(\d+\.?\d*)\s*[Gg](?:rams?)?', 1.0),
        (r'(\d+\.?\d*)-[Gg](?:rams?)?', 1.0),
        (r'(\d+\.?\d*)\s*[Gg]r\.?', 1.0),
        (r'(\d+\.?\d*)\s*ct', 0.2),
        (r'(\d+\.?\d*)\s*oz', 28.35),
        (r'(\d+\.?\d*)\s*kg', 1000.0),
    ]
    for pattern, multiplier in patterns:
        match = re.search(pattern, title, re.IGNORECASE)
        if match:
            weight = float(match.group(1)) * multiplier
            if 0.01 < weight < 100000:
                return round(weight, 3)
    return None


def parse_date(date_str: str) -> str | None:
    if not date_str:
        return None
    formats = ["%b %d, %Y", "%B %d, %Y", "%m/%d/%Y"]
    for fmt in formats:
        try:
            dt = datetime.strptime(date_str.strip(), fmt)
            return dt.strftime("%Y-%m-%d")
        except ValueError:
            continue
    return date_str


def build_url(query: str, offset: int = 0) -> str:
    encoded = quote(f'"{query}"')
    return (
        f"https://www.worthpoint.com/inventory/search"
        f"?query={encoded}"
        f"&offset={offset}"
        f"&max=20"
        f"&sort=SaleDate"
        f"&img=true"
        f"&noGreyList=true"
        f"&saleDate=ALL_TIME"
    )


def extract_listings(page, material_filter: str) -> list[dict]:
    """Extract listings using confirmed selectors."""
    js_code = """
    () => {
        const results = [];
        const cards = document.querySelectorAll('li.search-result');

        cards.forEach(card => {
            const titleEl = card.querySelector('.product-title');
            const title = titleEl ? titleEl.textContent.trim() : '';

            const priceEl = card.querySelector('.price .result');
            const price = priceEl ? (priceEl.getAttribute('title') || priceEl.textContent).trim() : '';

            const dateEl = card.querySelector('.sold-date .result');
            const date = dateEl ? dateEl.textContent.trim() : '';

            if (title && price) {
                results.push({ title, price, date });
            }
        });

        return results;
    }
    """
    try:
        listings = page.evaluate(js_code)
        filter_lower = material_filter.lower()
        return [l for l in listings if filter_lower in l['title'].lower()]
    except Exception as e:
        print(f"    Error: {e}")
        return []


def has_next_page(page) -> bool:
    try:
        next_btn = page.query_selector('a.nextLink')
        if next_btn:
            classes = next_btn.get_attribute('class') or ''
            return 'disabled' not in classes
    except:
        pass
    return False


def save_csv(slug: str, data: list[dict]):
    if not data:
        print(f"  No data to save")
        return

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    filepath = os.path.join(OUTPUT_DIR, f"{slug}.csv")

    fieldnames = ["material_slug", "title", "price_usd", "sale_date",
                  "weight_grams", "price_per_gram", "source"]

    with open(filepath, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(data)

    print(f"  Saved {len(data)} listings to {filepath}")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--material", required=True, help="Material to search")
    parser.add_argument("--delay", type=int, default=3)
    args = parser.parse_args()

    global DELAY_BETWEEN_PAGES
    DELAY_BETWEEN_PAGES = args.delay

    material = args.material
    slug = material.lower().replace(" ", "-")

    print("=" * 50)
    print(f"WorthPoint Scraper - {material}")
    print("=" * 50)
    print()
    print("Connecting to Chrome on port 9222...")
    print()

    results = []
    seen = set()

    with sync_playwright() as p:
        try:
            browser = p.chromium.connect_over_cdp("http://localhost:9222")
        except Exception as e:
            print(f"ERROR: Could not connect to Chrome: {e}")
            print()
            print("Please start Chrome with remote debugging:")
            print('  /Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome --remote-debugging-port=9222')
            print()
            print("Then log into WorthPoint and run this script again.")
            return

        # Get the first context/page
        contexts = browser.contexts
        if not contexts:
            print("ERROR: No browser contexts found")
            return

        context = contexts[0]
        pages = context.pages

        # Use existing page or create new
        if pages:
            page = pages[0]
        else:
            page = context.new_page()

        print(f"Connected! Using page: {page.url}")
        print()

        offset = 0
        page_num = 0
        consecutive_empty = 0

        while page_num < MAX_PAGES:
            page_num += 1
            url = build_url(material, offset)

            print(f"Page {page_num} (offset {offset})...", end=" ", flush=True)

            try:
                page.goto(url, wait_until="domcontentloaded", timeout=60000)
                time.sleep(2)
            except Exception as e:
                print(f"error: {e}")
                break

            # Check for issues
            content = page.content().lower()
            if "please verify you are a human" in content:
                print("\nCAPTCHA! Solve it in the browser, then press Enter...")
                input()
                page.reload()
                time.sleep(2)

            # Wait for results
            try:
                page.wait_for_selector("li.search-result", timeout=10000)
            except:
                print("no results")
                consecutive_empty += 1
                if consecutive_empty >= 2:
                    break
                offset += 20
                time.sleep(DELAY_BETWEEN_PAGES)
                continue

            # Debug: check if price elements exist
            price_count = page.evaluate("document.querySelectorAll('.price .result').length")
            if price_count == 0:
                print(f"0 price elements (bot detection active)")
                consecutive_empty += 1
                if consecutive_empty >= 2:
                    print("  Bot detection blocking prices - try the console script instead")
                    break
                offset += 20
                time.sleep(DELAY_BETWEEN_PAGES)
                continue

            listings = extract_listings(page, material)

            if not listings:
                print(f"0 matching")
                consecutive_empty += 1
                if consecutive_empty >= 2:
                    break
                offset += 20
                time.sleep(DELAY_BETWEEN_PAGES)
                continue

            consecutive_empty = 0
            new_count = 0

            for listing in listings:
                title_key = listing["title"].lower()[:60]
                if title_key in seen:
                    continue
                seen.add(title_key)

                price_str = listing["price"].replace("$", "").replace(",", "")
                try:
                    price = float(price_str)
                except:
                    continue

                date = parse_date(listing["date"])
                weight = extract_weight(listing["title"])
                ppg = round(price / weight, 2) if weight and weight > 0 else None

                results.append({
                    "material_slug": slug,
                    "title": listing["title"],
                    "price_usd": price,
                    "sale_date": date,
                    "weight_grams": weight,
                    "price_per_gram": ppg,
                    "source": "WorthPoint",
                })
                new_count += 1

            print(f"{new_count} new (total: {len(results)})")

            if not has_next_page(page):
                print("  Last page")
                break

            offset += 20
            time.sleep(DELAY_BETWEEN_PAGES)

        # Don't close browser - user may want to keep using it

    print()
    save_csv(slug, results)

    if results:
        ppg_list = [r["price_per_gram"] for r in results if r["price_per_gram"]]
        if ppg_list:
            ppg_list.sort()
            median = ppg_list[len(ppg_list) // 2]
            avg = sum(ppg_list) / len(ppg_list)
            print(f"  {len(ppg_list)} with weight | Median: ${median:.2f}/g | Avg: ${avg:.2f}/g")

    print()
    print("Done!")


if __name__ == "__main__":
    main()
