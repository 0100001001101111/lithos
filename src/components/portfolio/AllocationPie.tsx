'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { HoldingWithValue } from '@/types';

interface AllocationPieProps {
  holdings: HoldingWithValue[];
}

const COLORS = ['#58a6ff', '#a371f7', '#d29922', '#3fb950', '#f85149', '#8b949e'];

export function AllocationPie({ holdings }: AllocationPieProps) {
  // Group by category
  const categoryTotals = holdings.reduce((acc, h) => {
    const category = h.material.category;
    acc[category] = (acc[category] || 0) + h.current_value;
    return acc;
  }, {} as Record<string, number>);

  const data = Object.entries(categoryTotals).map(([name, value]) => ({
    name: name.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
    value,
  }));

  const totalValue = data.reduce((sum, d) => sum + d.value, 0);

  if (data.length === 0) {
    return (
      <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-lg p-6">
        <h3 className="font-semibold text-[var(--text-primary)] mb-4">Allocation Breakdown</h3>
        <p className="text-[var(--text-secondary)] text-center py-8">
          Add holdings to see your allocation
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-lg p-6">
      <h3 className="font-semibold text-[var(--text-primary)] mb-4">Allocation Breakdown</h3>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#161b22',
                border: '1px solid #30363d',
                borderRadius: '6px',
                color: '#e6edf3',
              }}
              formatter={(value) => {
                const numValue = typeof value === 'number' ? value : 0;
                return [
                  `$${numValue.toLocaleString('en-US', { minimumFractionDigits: 2 })} (${((numValue / totalValue) * 100).toFixed(1)}%)`,
                  'Value',
                ];
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        {data.map((entry, index) => (
          <div key={entry.name} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            />
            <span className="text-sm text-[var(--text-secondary)]">{entry.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
