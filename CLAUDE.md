# Lithos - Strategic Materials Price Tracker

## Project Overview
A real-time price tracking dashboard for strategic metals, rare earths, and scientific collectibles (meteorites, tektites, impact glass). Aggregates pricing data from auction results (WorthPoint) and displays historical trends.

## Tech Stack
- **Framework**: Next.js 14.2 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth with SSR helpers
- **Charts**: Recharts 3.6
- **Styling**: Tailwind CSS with custom dark theme
- **Deployment**: Vercel

## Key Features
- Dashboard with 60+ materials across 3 categories
- Trending section (top gainers/losers 24h)
- Individual material detail pages with:
  - Price charts (1D, 1W, 1M, 6M, 1Y, ALL ranges)
  - ATH/ATL/Average stats with outlier filtering
  - Related news feed
  - Where to buy links
- Portfolio tracking (Pro feature)
- Price alerts (Pro feature)

## Database Schema
```sql
-- Materials catalog
lithos_materials (slug, name, symbol, category, unit, description, ...)

-- Price history (WorthPoint auction data)
lithos_prices (material_slug, price_usd, price_per, source, recorded_at)

-- News articles
lithos_news (title, url, source, published_at, material_tags)
```

## Data Pipeline
1. **WorthPoint scraping** - `scripts/worthpoint-auto-scraper.js` extracts auction results
2. **CSV processing** - `scripts/process-worthpoint-csvs.py` calculates monthly medians per gram
3. **Supabase import** - `scripts/import-worthpoint-to-supabase.py` loads data

## Important Implementation Details

### Outlier Filtering for Stats (src/app/materials/[slug]/page.tsx)
- **ATL**: Uses 5th percentile to filter bad low data (e.g., $0.07 misclassified auctions)
- **ATH**: Uses actual maximum (historical peaks are genuine, not outliers)
- Stats query ALL historical prices (unlimited), chart limited to 365 records

### Sparse Data Handling (src/components/PriceChart.tsx)
- Charts with ≤20 data points show visible dots (r=4)
- Prevents empty-looking charts for materials with limited price history

### Trending Calculation (src/lib/trending.ts)
- Compares most recent price to 24h ago price
- Falls back to oldest available price if <24h of data

## File Structure
```
src/
├── app/
│   ├── page.tsx              # Dashboard (server component)
│   ├── HomeClient.tsx        # Dashboard client interactivity
│   └── materials/[slug]/     # Material detail pages
├── components/
│   ├── PriceChart.tsx        # Recharts area chart
│   ├── PriceTable.tsx        # Materials list with sparklines
│   └── NewsFeed.tsx          # Related news display
├── lib/
│   ├── supabase.ts           # Supabase client
│   └── trending.ts           # Trending calculations
└── types/
    └── index.ts              # TypeScript interfaces
```

## Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=     # For server-side operations
```

## Known Issues
1. **Recharts SSR warning** - "width(-1) and height(-1)" console warning during server render; doesn't affect functionality
2. **Some materials show N/A** - Materials without recent price data show N/A for % changes

## Running Locally
```bash
npm install
npm run dev
# Runs on http://localhost:3000 (or next available port)
```
