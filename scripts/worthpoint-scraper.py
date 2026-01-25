#!/usr/bin/env python3
"""
WorthPoint Historical Price Scraper
Extracts sold listing data for collectible materials.

Usage:
    1. Log into WorthPoint in your browser
    2. Open DevTools (F12) > Application > Cookies
    3. Copy the value of 'gc_session' cookie
    4. Paste it below or pass via command line

    python worthpoint-scraper.py --cookie "YOUR_COOKIE_HERE"
"""

import requests
from bs4 import BeautifulSoup
import re
import csv
import time
import argparse
import os
from datetime import datetime
from urllib.parse import quote_plus

# Configuration
OUTPUT_DIR = "./worthpoint-data"
DELAY_BETWEEN_REQUESTS = 3  # seconds - be respectful
MAX_PAGES_PER_MATERIAL = 50  # limit to avoid excessive requests

# Materials to scrape with search terms
MATERIALS = {
    "darwin-glass": ["darwin glass australia", "darwin glass"],
    "trinitite": ["trinitite", "trinity glass atomic"],
    "moldavite": ["moldavite gram", "moldavite genuine"],
    "libyan-desert-glass": ["libyan desert glass", "libyan glass"],
    "campo-del-cielo": ["campo del cielo meteorite", "campo del cielo"],
    "allende-meteorite": ["allende meteorite", "allende cv3"],
    "muonionalusta": ["muonionalusta meteorite", "muonionalusta"],
    "sikhote-alin": ["sikhote alin meteorite", "sikhote-alin"],
    "nwa-lunar": ["nwa lunar meteorite", "lunar meteorite nwa"],
    "nwa-martian": ["nwa martian meteorite", "martian meteorite shergottite"],
    "kpg-boundary": ["kt boundary", "kpg boundary", "cretaceous boundary"],
    "indochinite": ["indochinite tektite", "indochinite"],
}


def extract_weight_grams(title: str) -> float | None:
    """
    Extract weight in grams from listing title.
    Handles various formats: 5.2g, 5.2 grams, 5.2gram, 5.2 gr, 5.2ct (carats)
    """
    title_lower = title.lower()

    # Pattern priority: more specific first
    patterns = [
        # Grams: "5.2g", "5.2 g", "5.2 grams", "5.2gram"
        (r'(\d+\.?\d*)\s*(?:grams?|gr?)\b', 1.0),
        # Carats: "5.2ct", "5.2 carats" (1 carat = 0.2 grams)
        (r'(\d+\.?\d*)\s*(?:carats?|ct)\b', 0.2),
        # Kilograms: "1.5kg", "1.5 kg"
        (r'(\d+\.?\d*)\s*kg\b', 1000.0),
        # Ounces: "2oz", "2 oz" (1 oz = 28.35g)
        (r'(\d+\.?\d*)\s*oz\b', 28.35),
    ]

    for pattern, multiplier in patterns:
        match = re.search(pattern, title_lower)
        if match:
            weight = float(match.group(1)) * multiplier
            # Sanity check - ignore unreasonable weights
            if 0.01 < weight < 100000:
                return round(weight, 2)

    return None


def extract_price_usd(price_text: str) -> float | None:
    """Extract USD price from text like '$45.99' or '45.99 USD'"""
    # Remove commas and find price pattern
    price_text = price_text.replace(',', '')
    match = re.search(r'\$?\s*(\d+\.?\d*)', price_text)
    if match:
        price = float(match.group(1))
        if 0 < price < 1000000:  # sanity check
            return round(price, 2)
    return None


def parse_date(date_text: str) -> str | None:
    """Parse various date formats to YYYY-MM-DD"""
    date_text = date_text.strip()

    # Common formats
    formats = [
        "%B %d, %Y",      # January 15, 2023
        "%b %d, %Y",      # Jan 15, 2023
        "%m/%d/%Y",       # 01/15/2023
        "%Y-%m-%d",       # 2023-01-15
        "%d %B %Y",       # 15 January 2023
        "%B %Y",          # January 2023 (use 1st of month)
    ]

    for fmt in formats:
        try:
            dt = datetime.strptime(date_text, fmt)
            return dt.strftime("%Y-%m-%d")
        except ValueError:
            continue

    # Try to extract year at minimum
    year_match = re.search(r'20[12]\d', date_text)
    if year_match:
        return f"{year_match.group(0)}-01-01"

    return None


class WorthPointScraper:
    def __init__(self, session_cookie: str, debug: bool = False):
        self.session = requests.Session()
        self.debug = debug
        self.session.cookies.set('gc_session', session_cookie, domain='.worthpoint.com')
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Referer': 'https://www.worthpoint.com/',
        })

    def search(self, query: str, offset: int = 0) -> list[dict]:
        """
        Search WorthPoint inventory and extract listings.
        Returns list of {title, price, date, url}

        URL pattern: /inventory/search?offset=0&max=20&sort=SaleDate&query=...
        """
        encoded_query = quote_plus(query)

        # Actual WorthPoint inventory search URL
        url = (
            f"https://www.worthpoint.com/inventory/search"
            f"?offset={offset}"
            f"&max=20"
            f"&sort=SaleDate"
            f"&query={encoded_query}"
            f"&restrictTo=worldwide"
            f"&img=true"
            f"&noGreyList=true"
            f"&saleDate=ALL_TIME"
        )

        try:
            response = self.session.get(url, timeout=30)
            response.raise_for_status()
        except requests.RequestException as e:
            print(f"  Request error: {e}")
            return []

        # Check if we're logged in
        if "sign in" in response.text.lower() and "my account" not in response.text.lower():
            print("  WARNING: Session may have expired - check your cookie")
            return []

        soup = BeautifulSoup(response.text, 'html.parser')
        listings = []

        # Debug mode: save raw HTML for inspection
        if self.debug:
            debug_file = f"debug_response_offset{offset}.html"
            with open(debug_file, 'w', encoding='utf-8') as f:
                f.write(response.text)
            print(f"\n  [DEBUG] Saved HTML to {debug_file}")
            print(f"  [DEBUG] Response length: {len(response.text)} chars")

        # Find all listing cards - try various selectors
        cards = (
            soup.select('.card') or
            soup.select('[class*="card"]') or
            soup.select('.search-result') or
            soup.select('[class*="listing"]') or
            soup.select('article')
        )

        # Fallback: find divs containing "Sold for:" text
        if not cards:
            for div in soup.find_all('div'):
                text = div.get_text()
                if 'Sold for:' in text and 'Sold Date:' in text:
                    cards.append(div)

        for card in cards:
            try:
                card_text = card.get_text(separator='\n')

                # Extract title - usually in h2, h3, or first link
                title_elem = (
                    card.select_one('h2') or
                    card.select_one('h3') or
                    card.select_one('h4') or
                    card.select_one('a[href*="/worthopedia/"]') or
                    card.select_one('.title') or
                    card.select_one('a')
                )
                title = title_elem.get_text(strip=True) if title_elem else ""

                # Extract price from "Sold for: $XX.XX" pattern
                price_match = re.search(r'Sold\s+for:\s*\$?([\d,]+\.?\d*)', card_text, re.IGNORECASE)
                price_text = price_match.group(1) if price_match else ""

                # Extract date from "Sold Date: Jan 18, 2026" pattern
                date_match = re.search(r'Sold\s+Date:\s*([A-Za-z]+\s+\d+,?\s+\d{4})', card_text, re.IGNORECASE)
                if not date_match:
                    # Try alternate patterns
                    date_match = re.search(r'Sold\s+Date:\s*(\d{1,2}/\d{1,2}/\d{4})', card_text, re.IGNORECASE)
                date_text = date_match.group(1) if date_match else ""

                # Extract URL
                link = card.select_one('a[href*="/worthopedia/"]') or card.select_one('a[href]')
                item_url = ""
                if link and link.get('href'):
                    item_url = link.get('href')
                    if not item_url.startswith('http'):
                        item_url = f"https://www.worthpoint.com{item_url}"

                # Only add if we found meaningful data
                if title and (price_text or date_text):
                    listings.append({
                        'title': title,
                        'price_text': price_text,
                        'date_text': date_text,
                        'url': item_url,
                    })
            except Exception as e:
                print(f"  Error parsing card: {e}")
                continue

        return listings

    def scrape_material(self, slug: str, search_terms: list[str]) -> list[dict]:
        """Scrape all listings for a material across all search terms"""
        all_results = []
        seen_titles = set()

        for term in search_terms:
            print(f"  Searching: '{term}'")

            # Use offset-based pagination (20 items per page)
            offset = 0
            max_offset = MAX_PAGES_PER_MATERIAL * 20  # Convert pages to offset limit
            consecutive_empty = 0

            while offset < max_offset:
                print(f"    Offset {offset}...", end=" ")

                listings = self.search(term, offset)

                if not listings:
                    print("no results")
                    consecutive_empty += 1
                    if consecutive_empty >= 2:
                        break
                    offset += 20
                    time.sleep(DELAY_BETWEEN_REQUESTS)
                    continue

                consecutive_empty = 0
                new_count = 0

                for listing in listings:
                    # Deduplicate by title
                    title_key = listing['title'].lower()[:50]
                    if title_key in seen_titles:
                        continue
                    seen_titles.add(title_key)

                    # Parse fields
                    price = extract_price_usd(listing['price_text'])
                    date = parse_date(listing['date_text'])
                    weight = extract_weight_grams(listing['title'])

                    # Filter to 2021-2026
                    if date:
                        year = int(date[:4])
                        if year < 2021 or year > 2026:
                            continue

                    # Calculate price per gram
                    price_per_gram = None
                    if price and weight and weight > 0:
                        price_per_gram = round(price / weight, 2)

                    all_results.append({
                        'material_slug': slug,
                        'sale_date': date,
                        'title': listing['title'],
                        'price_usd': price,
                        'weight_grams': weight,
                        'price_per_gram': price_per_gram,
                        'source': 'WorthPoint',
                        'url': listing['url'],
                    })
                    new_count += 1

                print(f"{new_count} new listings")

                # If we got fewer than 20 results, we've likely hit the end
                if len(listings) < 20:
                    print(f"    End of results (got {len(listings)} < 20)")
                    break

                offset += 20
                time.sleep(DELAY_BETWEEN_REQUESTS)

        return all_results

    def save_csv(self, slug: str, data: list[dict]):
        """Save results to CSV file"""
        if not data:
            print(f"  No data to save for {slug}")
            return

        os.makedirs(OUTPUT_DIR, exist_ok=True)
        filepath = os.path.join(OUTPUT_DIR, f"{slug}.csv")

        fieldnames = ['material_slug', 'sale_date', 'title', 'price_usd',
                      'weight_grams', 'price_per_gram', 'source', 'url']

        with open(filepath, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(data)

        print(f"  Saved {len(data)} listings to {filepath}")


def test_connection(scraper: WorthPointScraper) -> bool:
    """Test if the session cookie is valid"""
    print("Testing connection...")
    try:
        response = scraper.session.get("https://www.worthpoint.com/my-worthpoint", timeout=30)
        if "sign in" in response.text.lower() and "dashboard" not in response.text.lower():
            print("ERROR: Session cookie appears invalid or expired")
            print("Please get a fresh cookie from your browser")
            return False
        print("Connection OK - session is valid")
        return True
    except Exception as e:
        print(f"ERROR: Could not connect - {e}")
        return False


def main():
    parser = argparse.ArgumentParser(description='Scrape WorthPoint for collectible prices')
    parser.add_argument('--cookie', required=True, help='gc_session cookie value')
    parser.add_argument('--material', help='Scrape single material (slug name)')
    parser.add_argument('--test', action='store_true', help='Test connection only')
    parser.add_argument('--delay', type=int, default=3, help='Delay between requests (seconds)')
    parser.add_argument('--debug', action='store_true', help='Save raw HTML for debugging selectors')
    args = parser.parse_args()

    global DELAY_BETWEEN_REQUESTS
    DELAY_BETWEEN_REQUESTS = args.delay

    scraper = WorthPointScraper(args.cookie, debug=args.debug)

    # Test connection first
    if not test_connection(scraper):
        return

    if args.test:
        return

    # Determine which materials to scrape
    if args.material:
        if args.material not in MATERIALS:
            print(f"Unknown material: {args.material}")
            print(f"Available: {', '.join(MATERIALS.keys())}")
            return
        materials_to_scrape = {args.material: MATERIALS[args.material]}
    else:
        materials_to_scrape = MATERIALS

    # Scrape each material
    for slug, search_terms in materials_to_scrape.items():
        print(f"\n{'='*50}")
        print(f"Scraping: {slug}")
        print(f"{'='*50}")

        results = scraper.scrape_material(slug, search_terms)
        scraper.save_csv(slug, results)

        # Summary stats
        if results:
            prices = [r['price_per_gram'] for r in results if r['price_per_gram']]
            if prices:
                avg = sum(prices) / len(prices)
                median = sorted(prices)[len(prices) // 2]
                print(f"  Stats: {len(prices)} with weight data")
                print(f"  Average: ${avg:.2f}/gram, Median: ${median:.2f}/gram")

        # Longer delay between materials
        time.sleep(DELAY_BETWEEN_REQUESTS * 2)

    print(f"\n{'='*50}")
    print(f"Done! CSV files saved to {OUTPUT_DIR}/")
    print(f"{'='*50}")


if __name__ == "__main__":
    main()
