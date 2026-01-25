# Lithos Scraping Scripts

## WorthPoint Scraper

### Console Script (recommended)
`worthpoint-auto-scraper.js`

Run in browser console on WorthPoint search results page. Uses fetch() to paginate without navigation.

**Usage:**
1. Log into WorthPoint
2. Search for material (e.g., "Darwin Glass")
3. Open Console (Cmd+Option+J)
4. Paste script and run
5. CSV auto-downloads when complete

**Copy to clipboard:**
```bash
cat ~/lithos/scripts/worthpoint-auto-scraper.js | pbcopy
```

**Controls:**
- `WP.stop()` - Stop early
- `WP.download()` - Download partial results
- `WP.count()` - Check count

### Materials Scraped
- Darwin Glass
- Trinitite
- Allende meteorite
- Indochinite tektite
- NWA martian meteorite
- Muonionalusta meteorite
- NWA lunar meteorite
- Libyan Desert Glass
- Sikhote-Alin meteorite
- Campo del Cielo meteorite
- KT/K-Pg boundary
- Cretaceous boundary
- Impact spherules
- Australite
- Philippinite
- Georgiaite
- Bediasite
- Gibeon meteorite
- Seymchan meteorite
- Chelyabinsk meteorite
- Canyon Diablo meteorite
- Fulgurite
- Osmium
- Iridium
- Gallium
- Bismuth crystal
- Red trinitite
- Uranium glass

## Import to Supabase

`import-worthpoint-to-supabase.py`

Imports CSV files from `./worthpoint-data/` into Supabase `lithos_prices` table.

```bash
python3 import-worthpoint-to-supabase.py
```

## Other Scripts (deprecated)

- `worthpoint-scraper.py` - requests-based (doesn't work, JS rendering)
- `worthpoint-playwright.py` - Playwright (blocked by bot detection)
- `worthpoint-chrome-scraper.py` - Chrome profile (blocked)
- `worthpoint-remote-scraper.py` - Remote debugging (blocked)

WorthPoint's PerimeterX bot detection blocks all automation. Console script is the only working method.
