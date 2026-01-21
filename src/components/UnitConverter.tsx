'use client';

import { useState } from 'react';

interface UnitConverterProps {
  currentPricePerGram: number;
  materialName: string;
}

type Unit = 'g' | 'oz' | 'kg';

export function UnitConverter({ currentPricePerGram, materialName }: UnitConverterProps) {
  const [quantity, setQuantity] = useState<string>('');
  const [unit, setUnit] = useState<Unit>('g');

  const getGrams = (): number => {
    const num = parseFloat(quantity) || 0;
    switch (unit) {
      case 'oz':
        return num * 31.1035; // troy oz
      case 'kg':
        return num * 1000;
      default:
        return num;
    }
  };

  const value = getGrams() * currentPricePerGram;

  return (
    <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-lg p-4">
      <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-3">
        Value Calculator
      </h3>
      <div className="flex gap-2 mb-3">
        <input
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="Enter quantity"
          className="flex-1"
          min="0"
          step="any"
        />
        <select
          value={unit}
          onChange={(e) => setUnit(e.target.value as Unit)}
          className="w-24"
        >
          <option value="g">grams</option>
          <option value="oz">troy oz</option>
          <option value="kg">kg</option>
        </select>
      </div>
      <div className="text-2xl font-bold text-[var(--text-primary)]">
        {value > 0
          ? `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          : '$0.00'}
      </div>
      <div className="text-xs text-[var(--text-secondary)] mt-1">
        at ${currentPricePerGram.toFixed(4)}/g spot price for {materialName}
      </div>
    </div>
  );
}
