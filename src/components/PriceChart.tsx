'use client';

import { Price, TimeRange } from '@/types';
import { useState, useMemo } from 'react';
import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { format, subDays } from 'date-fns';

interface PriceChartProps {
  prices: Price[];
  unit: string;
}

const timeRanges: { id: TimeRange; label: string; days: number | null }[] = [
  { id: '1D', label: '1D', days: 1 },
  { id: '1W', label: '1W', days: 7 },
  { id: '1M', label: '1M', days: 30 },
  { id: '6M', label: '6M', days: 180 },
  { id: '1Y', label: '1Y', days: 365 },
  { id: 'ALL', label: 'ALL', days: null },
];

function formatPriceForAxis(value: number): string {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

function formatDate(dateStr: string, range: TimeRange): string {
  const date = new Date(dateStr);
  if (range === '1D') return format(date, 'HH:mm');
  if (range === '1W' || range === '1M') return format(date, 'MMM d');
  return format(date, 'MMM yyyy');
}

export default function PriceChart({ prices, unit }: PriceChartProps) {
  const [selectedRange, setSelectedRange] = useState<TimeRange>('1M');

  const filteredData = useMemo((): { date: string; price: number; formattedDate: string }[] => {
    if (!prices.length) return [];

    const range = timeRanges.find((r) => r.id === selectedRange);
    if (!range) return [];

    let cutoffDate: Date;
    if (range.days === null) {
      cutoffDate = new Date(0); // ALL time
    } else {
      cutoffDate = subDays(new Date(), range.days);
    }

    return prices
      .filter((p) => new Date(p.recorded_at) >= cutoffDate)
      .reverse()
      .map((p) => ({
        date: p.recorded_at,
        price: Number(p.price_usd),
        formattedDate: formatDate(p.recorded_at, selectedRange),
      }));
  }, [prices, selectedRange]);

  const priceChange = useMemo(() => {
    if (filteredData.length < 2) return null;
    const first = filteredData[0].price;
    const last = filteredData[filteredData.length - 1].price;
    return ((last - first) / first) * 100;
  }, [filteredData]);

  const isPositive = priceChange !== null && priceChange >= 0;
  const chartColor = isPositive ? '#3fb950' : '#f85149';

  if (!prices.length) {
    return (
      <div className="chart-container h-[400px] flex items-center justify-center">
        <p className="text-[var(--text-secondary)]">No price data available</p>
      </div>
    );
  }

  return (
    <div className="chart-container">
      {/* Time range selector */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {priceChange !== null && (
            <span
              className={`text-sm font-medium ${
                isPositive ? 'price-up' : 'price-down'
              }`}
            >
              {isPositive ? '+' : ''}
              {priceChange.toFixed(2)}% this period
            </span>
          )}
        </div>
        <div className="flex gap-1">
          {timeRanges.map((range) => (
            <button
              key={range.id}
              onClick={() => setSelectedRange(range.id)}
              className={`px-3 py-1 text-xs font-medium rounded ${
                selectedRange === range.id
                  ? 'bg-[var(--accent)] text-[var(--background)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border)]'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={filteredData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={chartColor} stopOpacity={0.2} />
                <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="formattedDate"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#8b949e', fontSize: 11 }}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={['auto', 'auto']}
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#8b949e', fontSize: 11 }}
              tickFormatter={formatPriceForAxis}
              width={60}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#161b22',
                border: '1px solid #30363d',
                borderRadius: '6px',
                color: '#e6edf3',
              }}
              labelStyle={{ color: '#8b949e' }}
              formatter={(value) => {
                const numValue = typeof value === 'number' ? value : 0;
                return [
                  `$${numValue.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })} / ${unit}`,
                  'Price',
                ];
              }}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke={chartColor}
              strokeWidth={2}
              fill="url(#colorPrice)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
