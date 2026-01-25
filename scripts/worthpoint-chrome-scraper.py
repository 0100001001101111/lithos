#!/usr/bin/env python3
"""
WorthPoint Scraper using Chrome Profile
Uses your logged-in Chrome session to avoid bot detection.

IMPORTANT: Close Chrome before running this script!

Usage:
    python3 worthpoint-chrome-scraper.py --material "Darwin Glass"
    python3 worthpoint-chrome-scraper.py --material "trinitite"
"""

import re
import csv
import time
import argparse
import os
from datetime import datetime
from urllib.parse import quote
from playwright.sync_api import sync_playwright

# Configuration
OUTPUT_DIR = os.path.expanduser("~/lithos/scripts/worthpoint-data")
CHROME_PROFILE = os.path.expanduser("~/Library/Application Support/Google/Chrome/Default")
DELAY_BETWEEN_PAGES = 3
MAX_PAGES = 200


def extract_weight(title: str) -> float | None:
    """Extract weight in grams from title."""
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
    """Parse date string to YYYY-MM-DD format."""
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
    """Build WorthPoint search URL."""
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
    """Extract listings from current page using confirmed selectors."""

    js_code = """
    () => {
        const results = [];
        const cards = document.querySelectorAll('li.search-result');

        cards.forEach(card => {
            // Title from .product-title
            const titleEl = card.querySelector('.product-title');
            const title = titleEl ? titleEl.textContent.trim() : '';

            // Price from .price .result - use title attribute
            const priceEl = card.querySelector('.price .result');
            const price = priceEl ? (priceEl.getAttribute('title') || priceEl.textContent).trim() : '';

            // Date from .sold-date .result
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
        # Filter by material name
        filter_lower = material_filter.lower()
        return [l for l in listings if filter_lower in l['title'].lower()]
    except Exception as e:
        print(f"    Error extracting: {e}")
        return []


def has_next_page(page) -> bool:
    """Check if there's a next page."""
    try:
        next_btn = page.query_selector('a.nextLink')
        if next_btn:
            classes = next_btn.get_attribute('class') or ''
            return 'disabled' not in classes
    except:
        pass
    return False


def save_csv(slug: str, data: list[dict]):
    """Save results to CSV."""
    if not data:
        print(f"  No data to save for {slug}")
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
    parser = argparse.ArgumentParser(description="Scrape WorthPoint with Chrome profile")
    parser.add_argument("--material", required=True, help="Material name to search")
    parser.add_argument("--delay", type=int, default=3, help="Delay between pages (seconds)")
    parser.add_argument("--headless", action="store_true", help="Run headless (not recommended)")
    args = parser.parse_args()

    global DELAY_BETWEEN_PAGES
    DELAY_BETWEEN_PAGES = args.delay

    material = args.material
    slug = material.lower().replace(" ", "-")

    print(f"=" * 50)
    print(f"WorthPoint Scraper - {material}")
    print(f"=" * 50)
    print()
    print("IMPORTANT: Make sure Chrome is completely closed!")
    print()

    results = []
    seen_titles = set()

    with sync_playwright() as p:
        # Launch Chrome with user profile
        print("Launching Chrome with your profile...")

        # Use persistent context to access Chrome profile
        context = p.chromium.launch_persistent_context(
            user_data_dir=CHROME_PROFILE,
            channel="chrome",  # Use installed Chrome
            headless=args.headless,
            args=[
                "--disable-blink-features=AutomationControlled",
            ],
            viewport={"width": 1920, "height": 1080},
        )

        page = context.pages[0] if context.pages else context.new_page()

        # Navigate to first search page
        offset = 0
        page_num = 0
        consecutive_empty = 0

        while page_num < MAX_PAGES:
            page_num += 1
            url = build_url(material, offset)

            print(f"Page {page_num} (offset {offset})...", end=" ", flush=True)

            try:
                page.goto(url, wait_until="domcontentloaded", timeout=60000)
                time.sleep(2)  # Wait for JS rendering
            except Exception as e:
                print(f"navigation error: {e}")
                break

            # Check for CAPTCHA/block
            content = page.content().lower()
            if "please verify you are a human" in content:
                print("\nCAPTCHA detected! Please solve it in the browser window...")
                input("Press Enter after solving the CAPTCHA...")
                page.reload()
                time.sleep(2)

            # Check if logged in
            if "sign in" in content and "sign out" not in content:
                print("\nNot logged in! Please log into WorthPoint in this browser.")
                input("Press Enter after logging in...")
                page.goto(url, wait_until="domcontentloaded", timeout=60000)
                time.sleep(2)

            # Wait for results to load
            try:
                page.wait_for_selector("li.search-result", timeout=10000)
            except:
                print("no results found")
                consecutive_empty += 1
                if consecutive_empty >= 2:
                    break
                offset += 20
                time.sleep(DELAY_BETWEEN_PAGES)
                continue

            # Extract listings
            listings = extract_listings(page, material)

            if not listings:
                print(f"0 matching '{material}'")
                consecutive_empty += 1
                if consecutive_empty >= 2:
                    print("  No more matching results")
                    break
                offset += 20
                time.sleep(DELAY_BETWEEN_PAGES)
                continue

            consecutive_empty = 0
            new_count = 0

            for listing in listings:
                # Deduplicate
                title_key = listing["title"].lower()[:60]
                if title_key in seen_titles:
                    continue
                seen_titles.add(title_key)

                # Parse price
                price_str = listing["price"].replace("$", "").replace(",", "")
                try:
                    price = float(price_str)
                except:
                    continue

                # Parse date
                date = parse_date(listing["date"])

                # Extract weight
                weight = extract_weight(listing["title"])
                price_per_gram = round(price / weight, 2) if weight and weight > 0 else None

                results.append({
                    "material_slug": slug,
                    "title": listing["title"],
                    "price_usd": price,
                    "sale_date": date,
                    "weight_grams": weight,
                    "price_per_gram": price_per_gram,
                    "source": "WorthPoint",
                })
                new_count += 1

            print(f"{new_count} new (total: {len(results)})")

            # Check for next page
            if not has_next_page(page):
                print("  Last page reached")
                break

            offset += 20
            time.sleep(DELAY_BETWEEN_PAGES)

        context.close()

    # Save results
    print()
    save_csv(slug, results)

    # Print stats
    if results:
        prices_per_gram = [r["price_per_gram"] for r in results if r["price_per_gram"]]
        if prices_per_gram:
            prices_per_gram.sort()
            median = prices_per_gram[len(prices_per_gram) // 2]
            avg = sum(prices_per_gram) / len(prices_per_gram)
            print(f"  Stats: {len(prices_per_gram)} with weight data")
            print(f"  Median: ${median:.2f}/gram, Average: ${avg:.2f}/gram")

    print()
    print(f"{'=' * 50}")
    print("Done!")
    print(f"{'=' * 50}")


if __name__ == "__main__":
    main()
