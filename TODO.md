# Lithos TODO

## Recently Completed
- [x] WorthPoint historical data import (29 collectibles, 2000+ price points)
- [x] Outlier filtering for ATH/ATL stats (5th percentile for ATL, actual max for ATH)
- [x] Sparse data chart visibility (dots for ≤20 data points)
- [x] Full historical stats query (unlimited prices for ATH/ATL)

## Next Steps

### High Priority
- [ ] Fix Recharts SSR warning (consider dynamic import with ssr: false)
- [ ] Add more WorthPoint data for remaining collectibles
- [ ] Implement automated price update cron job

### Features
- [ ] Search functionality improvements
- [ ] Material comparison tool
- [ ] Export price history to CSV
- [ ] Email notifications for price alerts

### Data Quality
- [ ] Review materials with N/A prices and backfill data
- [ ] Add more rare earth pricing sources
- [ ] Strategic metals API integration (if available)

### Performance
- [ ] Add Redis caching for dashboard queries
- [ ] Optimize trending calculation queries
- [ ] Consider ISR incremental regeneration tuning

### Polish
- [ ] Mobile responsive improvements
- [ ] Loading skeletons for charts
- [ ] Error boundaries for failed data fetches
