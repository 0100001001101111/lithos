'use client';

import { useState, useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format, subDays } from 'date-fns';
import { PortfolioSnapshot } from '@/types';

interface PortfolioChartProps {
  snapshots: PortfolioSnapshot[];
  currentValue: number;
}

type ChartRange = '1W' | '1M' | '3M' | '6M' | '1Y' | 'ALL';

const ranges: { id: ChartRange; label: string; days: number | null }[] = [
  { id: '1W', label: '1W', days: 7 },
  { id: '1M', label: '1M', days: 30 },
  { id: '3M', label: '3M', days: 90 },
  { id: '6M', label: '6M', days: 180 },
  { id: '1Y', label: '1Y', days: 365 },
  { id: 'ALL', label: 'ALL', days: null },
];

export function PortfolioChart({ snapshots, currentValue }: PortfolioChartProps) {
  const [selectedRange, setSelectedRange] = useState<ChartRange>('1M');

  const chartData = useMemo(() => {
    const range = ranges.find((r) => r.id === selectedRange);
    if (!range) return [];

    let cutoffDate: Date;
    if (range.days === null) {
      cutoffDate = new Date(0);
    } else {
      cutoffDate = subDays(new Date(), range.days);
    }

    const filtered = snapshots
      .filter((s) => new Date(s.snapshot_date) >= cutoffDate)
      .map((s) => ({
        date: s.snapshot_date,
        value: Number(s.total_value_usd),
        formattedDate: format(new Date(s.snapshot_date), 'MMM d'),
      }));

    // Add current value as latest point
    if (filtered.length === 0 || filtered[filtered.length - 1].date !== format(new Date(), 'yyyy-MM-dd')) {
      filtered.push({
        date: format(new Date(), 'yyyy-MM-dd'),
        value: currentValue,
        formattedDate: 'Today',
      });
    }

    return filtered;
  }, [snapshots, selectedRange, currentValue]);

  const valueChange = useMemo(() => {
    if (chartData.length < 2) return null;
    const first = chartData[0].value;
    const last = chartData[chartData.length - 1].value;
    return ((last - first) / first) * 100;
  }, [chartData]);

  const isPositive = valueChange !== null && valueChange >= 0;
  const chartColor = isPositive ? '#3fb950' : '#f85149';

  if (snapshots.length === 0 && currentValue === 0) {
    return (
      <div className="chart-container h-[300px] flex items-center justify-center">
        <p className="text-[var(--text-secondary)]">
          Add holdings to see your portfolio value over time
        </p>
      </div>
    );
  }

  return (
    <div className="chart-container">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {valueChange !== null && (
            <span className={`text-sm font-medium ${isPositive ? 'price-up' : 'price-down'}`}>
              {isPositive ? '+' : ''}{valueChange.toFixed(2)}% this period
            </span>
          )}
        </div>
        <div className="flex gap-1">
          {ranges.map((range) => (
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

      <div className="h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorPortfolio" x1="0" y1="0" x2="0" y2="1">
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
              tickFormatter={(value) => `$${(value / 1000).toFixed(1)}k`}
              width={50}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#161b22',
                border: '1px solid #30363d',
                borderRadius: '6px',
                color: '#e6edf3',
              }}
              formatter={(value) => {
                const numValue = typeof value === 'number' ? value : 0;
                return [`$${numValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 'Value'];
              }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={chartColor}
              strokeWidth={2}
              fill="url(#colorPortfolio)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
