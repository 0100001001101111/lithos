/*
WorthPoint Console Scraper - Single Page Extractor
---------------------------------------------------
Run this script on each WorthPoint search results page.
It extracts listings and saves them to localStorage.

INSTRUCTIONS:
1. Log into WorthPoint
2. Search for the material you want (e.g., "Darwin Glass")
3. Open Developer Console (F12 -> Console)
4. Paste and run this script
5. Click "Next" to go to the next page
6. Repeat step 4-5 until all pages are done
7. On the last page, the script will download the CSV

COMMANDS (run in console after initial script):
- WP.download()      - Download all collected data as CSV
- WP.clear()         - Clear all stored data
- WP.count()         - Show count of collected items
- WP.data()          - Show all collected data
*/

(function() {
    // Initialize storage namespace
    window.WP = window.WP || {};

    const STORAGE_KEY = 'worthpoint_scraper_data';
    const SEEN_KEY = 'worthpoint_scraper_seen';

    // Load existing data
    function loadData() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        } catch (e) {
            return [];
        }
    }

    function loadSeen() {
        try {
            return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) || '[]'));
        } catch (e) {
            return new Set();
        }
    }

    function saveData(data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }

    function saveSeen(seen) {
        localStorage.setItem(SEEN_KEY, JSON.stringify([...seen]));
    }

    function extractWeight(title) {
        const patterns = [
            [/(\d+\.?\d*)\s*[Gg](?:rams?)?/i, 1.0],
            [/(\d+\.?\d*)-[Gg](?:rams?)?/i, 1.0],
            [/(\d+\.?\d*)\s*[Gg]r\.?/i, 1.0],
            [/(\d+\.?\d*)\s*ct/i, 0.2],
            [/(\d+\.?\d*)\s*oz/i, 28.35],
            [/(\d+\.?\d*)\s*kg/i, 1000.0],
        ];

        for (const [pattern, multiplier] of patterns) {
            const match = title.match(pattern);
            if (match) {
                const weight = parseFloat(match[1]) * multiplier;
                if (weight > 0.01 && weight < 100000) {
                    return Math.round(weight * 1000) / 1000;
                }
            }
        }
        return null;
    }

    function parseDate(dateStr) {
        if (!dateStr) return null;
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) {
            return d.toISOString().split('T')[0];
        }
        return dateStr;
    }

    function getSlugFromUrl() {
        const params = new URLSearchParams(window.location.search);
        const query = params.get('query') || 'unknown';
        return query.toLowerCase().replace(/\s+/g, '-');
    }

    function extractListingsFromPage() {
        const listings = [];
        const items = document.querySelectorAll(".search-result");

        for (const item of items) {
            // Get title from img alt or first text
            let title = "";
            const img = item.querySelector(".item-link img");
            if (img && img.alt) {
                title = img.alt;
            } else {
                const lines = item.innerText.split("\n");
                for (const line of lines) {
                    if (line.trim().length > 5) {
                        title = line.trim();
                        break;
                    }
                }
            }

            // Get price from .price .result
            let price = null;
            const priceEl = item.querySelector(".price .result");
            if (priceEl) {
                price = priceEl.innerText.trim();
            }

            // Get date from .sold-date .result
            let date = null;
            const dateEl = item.querySelector(".sold-date .result");
            if (dateEl) {
                date = dateEl.innerText.trim();
            }

            if (title && price) {
                listings.push({ title, price, date });
            }
        }

        return listings;
    }

    function downloadCSV(data, filename) {
        const headers = ["material_slug", "title", "price_usd", "sale_date", "weight_grams", "price_per_gram", "source"];
        const csvRows = [headers.join(",")];

        for (const row of data) {
            const values = headers.map(h => {
                const val = row[h];
                if (val === null || val === undefined) return "";
                const str = String(val);
                if (str.includes(",") || str.includes('"') || str.includes("\n")) {
                    return `"${str.replace(/"/g, '""')}"`;
                }
                return str;
            });
            csvRows.push(values.join(","));
        }

        const csv = csvRows.join("\n");
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Main extraction
    function extract() {
        const slug = getSlugFromUrl();
        const results = loadData();
        const seen = loadSeen();

        const pageListings = extractListingsFromPage();
        let newCount = 0;

        for (const listing of pageListings) {
            const titleKey = listing.title.toLowerCase().substring(0, 60);
            if (seen.has(titleKey)) continue;
            seen.add(titleKey);

            const priceStr = listing.price.replace(/[$,]/g, '');
            const price = parseFloat(priceStr);
            if (isNaN(price)) continue;

            const date = parseDate(listing.date);
            const weight = extractWeight(listing.title);
            const pricePerGram = weight && weight > 0 ? Math.round(price / weight * 100) / 100 : null;

            results.push({
                material_slug: slug,
                title: listing.title,
                price_usd: price,
                sale_date: date,
                weight_grams: weight,
                price_per_gram: pricePerGram,
                source: "WorthPoint"
            });
            newCount++;
        }

        saveData(results);
        saveSeen(seen);

        // Get page info
        const params = new URLSearchParams(window.location.search);
        const offset = parseInt(params.get('offset') || '0');
        const pageNum = Math.floor(offset / 20) + 1;

        console.log(`%c📊 WorthPoint Scraper`, 'font-size: 14px; font-weight: bold; color: #4CAF50;');
        console.log(`Page ${pageNum}: Found ${pageListings.length} listings, ${newCount} new`);
        console.log(`Total collected: ${results.length} listings`);
        console.log('');
        console.log('Commands: WP.download() | WP.clear() | WP.count() | WP.data()');
        console.log('Click "Next" page and run this script again (or just re-run extract)');

        return { pageListings: pageListings.length, newItems: newCount, total: results.length };
    }

    // Public API
    WP.extract = extract;

    WP.download = function() {
        const data = loadData();
        if (data.length === 0) {
            console.log('No data to download. Run extraction first.');
            return;
        }
        const slug = data[0]?.material_slug || 'worthpoint-data';
        downloadCSV(data, `${slug}.csv`);
        console.log(`%c📥 Downloaded ${data.length} listings`, 'color: #2196F3; font-weight: bold;');
    };

    WP.clear = function() {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(SEEN_KEY);
        console.log('%c🗑️ All data cleared', 'color: #FF5722; font-weight: bold;');
    };

    WP.count = function() {
        const data = loadData();
        console.log(`Total: ${data.length} listings`);
        return data.length;
    };

    WP.data = function() {
        return loadData();
    };

    WP.stats = function() {
        const data = loadData();
        const withWeight = data.filter(r => r.price_per_gram);
        if (withWeight.length === 0) {
            console.log('No items with weight data');
            return;
        }
        const prices = withWeight.map(r => r.price_per_gram).sort((a, b) => a - b);
        const median = prices[Math.floor(prices.length / 2)];
        const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
        const min = prices[0];
        const max = prices[prices.length - 1];

        console.log(`%c📈 Price Statistics`, 'font-size: 14px; font-weight: bold; color: #9C27B0;');
        console.log(`Items with weight: ${withWeight.length}`);
        console.log(`Median: $${median.toFixed(2)}/gram`);
        console.log(`Average: $${avg.toFixed(2)}/gram`);
        console.log(`Range: $${min.toFixed(2)} - $${max.toFixed(2)}/gram`);
    };

    // Auto-run extraction
    extract();

})();
