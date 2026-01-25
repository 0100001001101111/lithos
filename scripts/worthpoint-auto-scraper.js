/*
WorthPoint Auto-Pagination Scraper (Fetch-based)
-------------------------------------------------
Scrapes all pages without navigating - uses fetch() to get each page.
Run once and let it complete.

USAGE:
1. Log into WorthPoint
2. Search for material (e.g., "Darwin Glass" in Natural History)
3. Open Console (Cmd+Option+J)
4. Paste this entire script and press Enter
5. Watch it run - hands off!

To stop early: WP.stop()
To download partial results: WP.download()
*/

(async function() {
    'use strict';

    const CONFIG = {
        delayMs: 3000,
        maxPages: 200,
    };

    const results = [];
    const seen = new Set();
    let running = true;

    window.WP = {
        stop: () => { running = false; console.log('%c⏹️ Stopping after current page...', 'color: #ff9800; font-weight: bold;'); },
        download: () => downloadCSV(),
        data: () => results,
        count: () => results.length
    };

    function extractWeight(title) {
        const patterns = [
            [/(\d+\.?\d*)\s*[Gg](?:rams?)?/i, 1],
            [/(\d+\.?\d*)-[Gg](?:rams?)?/i, 1],
            [/(\d+\.?\d*)\s*[Gg]r\.?/i, 1],
            [/(\d+\.?\d*)\s*ct/i, 0.2],
            [/(\d+\.?\d*)\s*oz/i, 28.35],
            [/(\d+\.?\d*)\s*kg/i, 1000],
        ];
        for (const [re, mult] of patterns) {
            const m = title.match(re);
            if (m) {
                const w = parseFloat(m[1]) * mult;
                if (w > 0.01 && w < 100000) return Math.round(w * 1000) / 1000;
            }
        }
        return null;
    }

    function parseDate(str) {
        if (!str) return null;
        const d = new Date(str);
        return isNaN(d) ? str : d.toISOString().split('T')[0];
    }

    function extractFromDoc(doc, slug) {
        const cards = doc.querySelectorAll('li.search-result');
        let newCount = 0;

        cards.forEach(card => {
            const titleEl = card.querySelector('.product-title');
            const title = titleEl ? titleEl.textContent.trim() : '';

            const priceEl = card.querySelector('.price .result');
            const priceText = priceEl ? (priceEl.getAttribute('title') || priceEl.textContent).trim() : '';

            const dateEl = card.querySelector('.sold-date .result');
            const dateText = dateEl ? dateEl.textContent.trim() : '';

            if (!title || !priceText) return;

            const key = title.toLowerCase().slice(0, 60);
            if (seen.has(key)) return;
            seen.add(key);

            const price = parseFloat(priceText.replace(/[$,]/g, ''));
            if (isNaN(price)) return;

            const weight = extractWeight(title);
            const ppg = weight ? Math.round(price / weight * 100) / 100 : null;

            results.push({
                material_slug: slug,
                title,
                price_usd: price,
                sale_date: parseDate(dateText),
                weight_grams: weight,
                price_per_gram: ppg,
                source: 'WorthPoint'
            });
            newCount++;
        });

        return { found: cards.length, new: newCount };
    }

    function hasNextPage(doc) {
        const nextBtn = doc.querySelector('a.nextLink');
        return nextBtn && !nextBtn.classList.contains('disabled');
    }

    function sleep(ms) {
        return new Promise(r => setTimeout(r, ms));
    }

    function downloadCSV() {
        if (!results.length) {
            console.log('No data to download');
            return;
        }
        const headers = ['material_slug', 'title', 'price_usd', 'sale_date', 'weight_grams', 'price_per_gram', 'source'];
        let csv = headers.join(',') + '\n';
        for (const row of results) {
            csv += headers.map(h => {
                let v = row[h];
                if (v == null) return '';
                v = String(v);
                if (v.includes(',') || v.includes('"') || v.includes('\n')) {
                    return '"' + v.replace(/"/g, '""') + '"';
                }
                return v;
            }).join(',') + '\n';
        }
        const blob = new Blob([csv], { type: 'text/csv' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = (results[0]?.material_slug || 'worthpoint') + '.csv';
        a.click();
        console.log(`%c📥 Downloaded ${results.length} listings`, 'color: #2196F3; font-weight: bold;');
    }

    // Get base URL info from current page
    const currentUrl = new URL(window.location.href);
    const query = currentUrl.searchParams.get('query') || '';
    const slug = query.toLowerCase().replace(/["\s]+/g, '-').replace(/^-|-$/g, '') || 'unknown';

    if (!query) {
        console.log('%c❌ Error: Not on a WorthPoint search page', 'color: red; font-weight: bold;');
        return;
    }

    console.log('%c🚀 WorthPoint Auto-Scraper Started', 'font-size: 16px; font-weight: bold; color: #4CAF50;');
    console.log(`Scraping: ${query}`);
    console.log('Commands: WP.stop() | WP.download() | WP.count()');
    console.log('');

    // First, extract from current page
    let pageNum = 0;
    let offset = parseInt(currentUrl.searchParams.get('offset') || '0');

    // Build base URL for fetching
    function buildUrl(off) {
        const url = new URL(window.location.href);
        url.searchParams.set('offset', off);
        return url.toString();
    }

    // Main loop using fetch
    while (running && pageNum < CONFIG.maxPages) {
        pageNum++;

        try {
            const url = buildUrl(offset);
            const response = await fetch(url, { credentials: 'include' });

            if (!response.ok) {
                console.log(`%c❌ Fetch failed: ${response.status}`, 'color: red;');
                break;
            }

            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            // Check if logged in
            if (html.includes('Sign In') && !html.includes('Sign Out') && !html.includes('My WorthPoint')) {
                console.log('%c❌ Session expired - please log in again', 'color: red; font-weight: bold;');
                break;
            }

            const { found, new: newItems } = extractFromDoc(doc, slug);
            console.log(`Page ${pageNum} (offset ${offset}): ${found} listings, ${newItems} new (Total: ${results.length})`);

            if (found === 0) {
                console.log('%c✅ No more results - scraping complete!', 'color: #4CAF50; font-weight: bold;');
                break;
            }

            if (!hasNextPage(doc)) {
                console.log('%c✅ Last page reached - scraping complete!', 'color: #4CAF50; font-weight: bold;');
                break;
            }

            offset += 20;
            await sleep(CONFIG.delayMs);

        } catch (err) {
            console.log(`%c❌ Error: ${err.message}`, 'color: red;');
            break;
        }
    }

    if (!running) {
        console.log('%c⏹️ Stopped by user', 'color: #ff9800; font-weight: bold;');
    }

    // Final stats
    console.log('');
    console.log(`%c📊 Scraping Complete!`, 'font-size: 14px; font-weight: bold; color: #9C27B0;');
    console.log(`Total: ${results.length} listings from ${pageNum} pages`);

    const withWeight = results.filter(r => r.price_per_gram);
    if (withWeight.length) {
        const prices = withWeight.map(r => r.price_per_gram).sort((a, b) => a - b);
        const median = prices[Math.floor(prices.length / 2)];
        const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
        console.log(`With weight data: ${withWeight.length}`);
        console.log(`Median: $${median.toFixed(2)}/gram | Average: $${avg.toFixed(2)}/gram`);
    }

    console.log('');
    downloadCSV();

})();
