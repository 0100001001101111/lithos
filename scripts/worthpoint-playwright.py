#!/usr/bin/env python3
"""
WorthPoint Scraper using Playwright (JavaScript rendering)
Extracts sold listing data for collectible materials.

Setup:
    pip install playwright
    playwright install chromium

Usage:
    # Scrape single material (browser opens - solve CAPTCHA if prompted)
    python worthpoint-playwright.py --cookie "YOUR_GC_SESSION_COOKIE" --material darwin-glass

    # Scrape all materials
    python worthpoint-playwright.py --cookie "YOUR_GC_SESSION_COOKIE" --all

    # Run headless (may be blocked by bot detection)
    python worthpoint-playwright.py --cookie "YOUR_COOKIE" --material darwin-glass --headless

Note: WorthPoint uses PerimeterX bot detection. The script defaults to visible
mode so you can solve any CAPTCHA that appears. After solving once, the session
typically continues without further challenges.
"""

import re
import csv
import time
import argparse
import os
from datetime import datetime
from urllib.parse import quote_plus
from playwright.sync_api import sync_playwright, Page
from playwright_stealth import Stealth

# Configuration
OUTPUT_DIR = "./worthpoint-data"
DELAY_BETWEEN_PAGES = 3  # seconds
MAX_PAGES = 100  # safety limit

# Materials to scrape with search terms and category filter
MATERIALS = {
    "darwin-glass": {
        "queries": ["Darwin Glass"],
        "category": "natural-history",
    },
    "trinitite": {
        "queries": ["trinitite"],
        "category": "natural-history",
    },
    "allende-meteorite": {
        "queries": ["Allende meteorite"],
        "category": "natural-history",
    },
    "indochinite": {
        "queries": ["indochinite tektite", "indochinite"],
        "category": "natural-history",
    },
    "nwa-martian": {
        "queries": ["NWA martian meteorite", "martian meteorite shergottite"],
        "category": "natural-history",
    },
    "muonionalusta": {
        "queries": ["muonionalusta meteorite"],
        "category": "natural-history",
    },
    "nwa-lunar": {
        "queries": ["NWA lunar meteorite", "lunar meteorite NWA"],
        "category": "natural-history",
    },
    "libyan-desert-glass": {
        "queries": ["Libyan Desert Glass"],
        "category": "natural-history",
    },
    "sikhote-alin": {
        "queries": ["Sikhote-Alin meteorite"],
        "category": "natural-history",
    },
    "campo-del-cielo": {
        "queries": ["Campo del Cielo meteorite"],
        "category": "natural-history",
    },
    "kpg-boundary": {
        "queries": ["KT boundary", "KPG boundary", "cretaceous boundary"],
        "category": "natural-history",
    },
}


def extract_weight(title: str) -> float | None:
    """Extract weight in grams from title."""
    patterns = [
        (r'(\d+\.?\d*)\s*[Gg](?:rams?)?', 1.0),      # grams
        (r'(\d+\.?\d*)-[Gg](?:rams?)?', 1.0),        # 288-grams
        (r'(\d+\.?\d*)\s*[Gg]r\.?', 1.0),            # gr.
        (r'(\d+\.?\d*)\s*ct', 0.2),                   # carats
        (r'(\d+\.?\d*)\s*oz', 28.35),                 # ounces
        (r'(\d+\.?\d*)\s*kg', 1000.0),                # kilograms
    ]

    for pattern, multiplier in patterns:
        match = re.search(pattern, title, re.IGNORECASE)
        if match:
            weight = float(match.group(1)) * multiplier
            if 0.01 < weight < 100000:  # sanity check
                return round(weight, 3)
    return None


def parse_date(date_str: str) -> str | None:
    """Parse date string to YYYY-MM-DD format."""
    if not date_str:
        return None

    formats = [
        "%b %d, %Y",   # Jan 03, 2026
        "%B %d, %Y",   # January 03, 2026
        "%m/%d/%Y",    # 01/03/2026
    ]

    for fmt in formats:
        try:
            dt = datetime.strptime(date_str.strip(), fmt)
            return dt.strftime("%Y-%m-%d")
        except ValueError:
            continue
    return date_str


def build_url(query: str, offset: int = 0, category: str = None) -> str:
    """Build WorthPoint search URL."""
    encoded_query = quote_plus(query)
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
    if category:
        url += f"&categories={category}"
    return url


def extract_listings_from_page(page: Page, debug: bool = False) -> list[dict]:
    """Extract all listings from the current page using JavaScript."""

    # Use specific class selectors for more reliable extraction
    js_code = """
    () => {
        var results = [];
        var items = document.querySelectorAll(".search-result");

        for (var i = 0; i < items.length; i++) {
            var item = items[i];

            // Get title from item-link or first text
            var titleEl = item.querySelector(".item-link");
            var title = "";
            if (titleEl) {
                var img = titleEl.querySelector("img");
                if (img && img.alt) {
                    title = img.alt;
                } else {
                    title = titleEl.innerText.trim();
                }
            }
            if (!title) {
                // Fallback to first line of innerText
                var lines = item.innerText.split(String.fromCharCode(10));
                for (var k = 0; k < lines.length; k++) {
                    if (lines[k].trim().length > 5) {
                        title = lines[k].trim();
                        break;
                    }
                }
            }

            // Get price from .price .result or look for $
            var price = null;
            var priceEl = item.querySelector(".price .result");
            if (priceEl) {
                price = priceEl.innerText.trim();
            } else {
                // Fallback: search for $ in text
                var text = item.innerText;
                var lines = text.split(String.fromCharCode(10));
                for (var j = 0; j < lines.length; j++) {
                    if (lines[j].trim().charAt(0) === "$") {
                        price = lines[j].trim();
                        break;
                    }
                }
            }

            // Get date from .sold-date .result
            var date = null;
            var dateEl = item.querySelector(".sold-date .result");
            if (dateEl) {
                date = dateEl.innerText.trim();
            } else {
                // Fallback: search for date pattern
                var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                var text = item.innerText;
                var lines = text.split(String.fromCharCode(10));
                for (var m = 0; m < lines.length; m++) {
                    var line = lines[m].trim();
                    if (line.length >= 10 && line.length <= 15) {
                        for (var n = 0; n < months.length; n++) {
                            if (line.indexOf(months[n]) === 0) {
                                date = line;
                                break;
                            }
                        }
                    }
                    if (date) break;
                }
            }

            if (title && price) {
                results.push({
                    title: title,
                    price: price,
                    date: date
                });
            }
        }
        return results;
    }
    """

    try:
        listings = page.evaluate(js_code)
        if debug:
            if listings:
                print(f"\n    DEBUG: Extracted {len(listings)} listings. First: {listings[0]}\n")
            else:
                # Debug why no listings - check if price elements exist
                count = page.evaluate("document.querySelectorAll('.search-result').length")
                priceCount = page.evaluate("document.querySelectorAll('.search-result .price').length")
                sample = page.evaluate("document.querySelectorAll('.search-result')[0]?.innerText?.substring(0, 300) || 'N/A'")
                print(f"\n    DEBUG: No listings. Elements: {count}, Price elements: {priceCount}")
                print(f"    Sample text: {sample}\n")
        return listings if listings else []
    except Exception as e:
        print(f"    Error extracting listings: {e}")
        import traceback
        traceback.print_exc()
        return []


def get_total_results(page: Page) -> int:
    """Get total number of results from page."""
    try:
        # Look for "X,XXX sold items matching" text
        text = page.inner_text("body")
        match = re.search(r'([\d,]+)\s+sold items matching', text)
        if match:
            return int(match.group(1).replace(',', ''))
    except:
        pass
    return 0


def scrape_material(page: Page, slug: str, config: dict, session_cookie: str) -> list[dict]:
    """Scrape all listings for a material."""
    all_results = []
    seen_titles = set()

    for query in config["queries"]:
        print(f"  Searching: '{query}'")
        offset = 0
        consecutive_empty = 0

        while offset < MAX_PAGES * 20:
            url = build_url(query, offset, config.get("category"))
            print(f"    Offset {offset}...", end=" ", flush=True)

            try:
                page.goto(url, wait_until="domcontentloaded", timeout=60000)
                time.sleep(2)  # Extra wait for JS rendering
            except Exception as e:
                print(f"navigation error: {e}")
                break

            # Check for CAPTCHA mid-scraping
            if "please verify you are a human" in page.content().lower():
                print("CAPTCHA - solve it in browser...", end=" ", flush=True)
                if not wait_for_captcha_solved(page):
                    print("timed out")
                    return all_results
                print("OK")
                # Retry the navigation
                page.goto(url, wait_until="domcontentloaded", timeout=60000)
                time.sleep(2)

            # Check if logged in
            if "sign in" in page.content().lower() and "my worthpoint" not in page.content().lower():
                print("SESSION EXPIRED - please get fresh cookie")
                return all_results

            # Get total on first page
            if offset == 0:
                total = get_total_results(page)
                search_results = page.query_selector_all(".search-result")
                print(f"(found {len(search_results)} items on page, {total} total)")
                if total == 0 and len(search_results) == 0:
                    # Debug: save page content
                    with open("debug_page.html", "w") as f:
                        f.write(page.content())
                    print("    Saved debug_page.html for inspection")
                    break

            # Wait for search results to load
            try:
                page.wait_for_selector(".search-result", timeout=10000)
            except:
                pass  # May timeout if no results

            # Scroll down to trigger lazy loading of price/date elements
            page.evaluate("window.scrollTo(0, 500)")
            time.sleep(1)
            page.evaluate("window.scrollTo(0, 0)")
            time.sleep(1)

            # Wait for price elements specifically
            try:
                page.wait_for_selector(".search-result .price", timeout=5000)
            except:
                pass

            # Extract listings (debug on first page)
            listings = extract_listings_from_page(page, debug=(offset == 0))

            if not listings:
                print("no listings found")
                consecutive_empty += 1
                if consecutive_empty >= 2:
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

                # Extract weight and calculate price per gram
                weight = extract_weight(listing["title"])
                price_per_gram = round(price / weight, 2) if weight and weight > 0 else None

                all_results.append({
                    "material_slug": slug,
                    "title": listing["title"],
                    "price_usd": price,
                    "sale_date": date,
                    "weight_grams": weight,
                    "price_per_gram": price_per_gram,
                    "source": "WorthPoint",
                })
                new_count += 1

            print(f"{new_count} new")

            # Check if we've reached the end
            if len(listings) < 20:
                print(f"    End of results (got {len(listings)} < 20)")
                break

            offset += 20
            time.sleep(DELAY_BETWEEN_PAGES)

    return all_results


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


def print_stats(data: list[dict]):
    """Print summary statistics."""
    prices_per_gram = [r["price_per_gram"] for r in data if r["price_per_gram"]]
    if prices_per_gram:
        avg = sum(prices_per_gram) / len(prices_per_gram)
        prices_per_gram.sort()
        median = prices_per_gram[len(prices_per_gram) // 2]
        print(f"  Stats: {len(prices_per_gram)} with weight data")
        print(f"  Median: ${median:.2f}/gram, Average: ${avg:.2f}/gram")
        print(f"  Range: ${min(prices_per_gram):.2f} - ${max(prices_per_gram):.2f}/gram")


def wait_for_captcha_solved(page: Page, timeout: int = 300) -> bool:
    """Wait for user to solve CAPTCHA if present. Returns True if page is ready."""
    start_time = time.time()

    while time.time() - start_time < timeout:
        content = page.content().lower()

        # Check if CAPTCHA/block page is shown
        if "please verify you are a human" in content or "access to this page has been denied" in content:
            print("\n*** CAPTCHA DETECTED ***")
            print("Please solve the CAPTCHA in the browser window.")
            print(f"Waiting up to {timeout} seconds...")
            time.sleep(3)
            continue

        # Check if we're on a normal page
        if "worthpoint" in content and "search-result" in content:
            return True

        # Check if logged in and on a normal page
        if "my worthpoint" in content or "worthopedia" in content:
            return True

        time.sleep(2)

    return False


def main():
    parser = argparse.ArgumentParser(description="Scrape WorthPoint with Playwright")
    parser.add_argument("--cookie", required=True, help="gc_session cookie value")
    parser.add_argument("--material", help="Scrape single material (slug name)")
    parser.add_argument("--all", action="store_true", help="Scrape all materials")
    parser.add_argument("--delay", type=int, default=3, help="Delay between pages (seconds)")
    parser.add_argument("--headless", action="store_true", help="Run headless (may trigger bot detection)")
    parser.add_argument("--visible", action="store_true", default=True, help="Show browser window (default, recommended)")
    args = parser.parse_args()

    global DELAY_BETWEEN_PAGES
    DELAY_BETWEEN_PAGES = args.delay

    # Default to visible mode to handle CAPTCHA
    headless = args.headless and not args.visible

    # Determine materials to scrape
    if args.material:
        if args.material not in MATERIALS:
            print(f"Unknown material: {args.material}")
            print(f"Available: {', '.join(MATERIALS.keys())}")
            return
        materials_to_scrape = {args.material: MATERIALS[args.material]}
    elif args.all:
        materials_to_scrape = MATERIALS
    else:
        print("Specify --material <slug> or --all")
        print(f"Available materials: {', '.join(MATERIALS.keys())}")
        return

    print(f"Starting Playwright (headless={headless})...")

    with sync_playwright() as p:
        # Launch with stealth settings to avoid bot detection
        browser = p.chromium.launch(
            headless=headless,
            args=[
                "--disable-blink-features=AutomationControlled",
                "--disable-dev-shm-usage",
                "--no-sandbox",
            ]
        )

        # Create context with realistic browser fingerprint
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            viewport={"width": 1920, "height": 1080},
            locale="en-US",
            timezone_id="America/New_York",
        )

        # Set the session cookie
        context.add_cookies([{
            "name": "gc_session",
            "value": args.cookie,
            "domain": ".worthpoint.com",
            "path": "/",
        }])

        # Remove webdriver flag
        context.add_init_script("""
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined
            });
        """)

        page = context.new_page()

        # Apply stealth mode to avoid detection
        stealth = Stealth()
        stealth.apply_stealth_sync(page)

        # Test connection
        print("Testing connection...")
        print("NOTE: If a CAPTCHA appears, please solve it in the browser window.")
        print()
        page.goto("https://www.worthpoint.com/worthopedia", wait_until="domcontentloaded", timeout=60000)
        time.sleep(2)  # Wait for JS

        # Check for CAPTCHA and wait if needed
        if "please verify you are a human" in page.content().lower():
            print("CAPTCHA detected - please solve it in the browser...")
            if not wait_for_captcha_solved(page):
                print("ERROR: Timed out waiting for CAPTCHA")
                browser.close()
                return

        if "sign in" in page.content().lower() and "my worthpoint" not in page.content().lower():
            print("ERROR: Session cookie is invalid or expired")
            print("Please get a fresh gc_session cookie from your browser")
            browser.close()
            return

        print("Connection OK - session is valid\n")

        # Scrape each material
        for slug, config in materials_to_scrape.items():
            print(f"{'='*50}")
            print(f"Scraping: {slug}")
            print(f"{'='*50}")

            results = scrape_material(page, slug, config, args.cookie)
            save_csv(slug, results)
            print_stats(results)

            # Longer delay between materials
            if len(materials_to_scrape) > 1:
                time.sleep(DELAY_BETWEEN_PAGES * 2)

        browser.close()

    print(f"\n{'='*50}")
    print(f"Done! CSV files saved to {OUTPUT_DIR}/")
    print(f"{'='*50}")


if __name__ == "__main__":
    main()
