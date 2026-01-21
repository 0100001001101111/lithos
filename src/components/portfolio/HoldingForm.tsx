'use client';

import { useState } from 'react';
import { Material, Holding } from '@/types';
import { ImageUpload } from './ImageUpload';

interface HoldingFormProps {
  materials: Material[];
  holding?: Holding;
  isPro: boolean;
  onSubmit: (data: HoldingFormData) => Promise<void>;
  onCancel: () => void;
}

export interface HoldingFormData {
  material_slug: string;
  name: string;
  quantity_grams: number;
  grade: string;
  purchase_price_per_gram: number | null;
  purchase_date: string;
  purchase_source: string;
  verification_status: 'unverified' | 'self_verified' | 'certified';
  verification_notes: string;
  certificate_url: string;
  notes: string;
  image_url: string;
}

export function HoldingForm({ materials, holding, isPro, onSubmit, onCancel }: HoldingFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<HoldingFormData>({
    material_slug: holding?.material_slug || '',
    name: holding?.name || '',
    quantity_grams: holding?.quantity_grams || 0,
    grade: holding?.grade || '',
    purchase_price_per_gram: holding?.purchase_price_per_gram || null,
    purchase_date: holding?.purchase_date || '',
    purchase_source: holding?.purchase_source || '',
    verification_status: holding?.verification_status || 'unverified',
    verification_notes: holding?.verification_notes || '',
    certificate_url: holding?.certificate_url || '',
    notes: holding?.notes || '',
    image_url: holding?.image_url || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData);
    } finally {
      setLoading(false);
    }
  };

  const updateField = <K extends keyof HoldingFormData>(field: K, value: HoldingFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const purchaseSources = ['eBay', 'Periodic Element Guys', 'Strategic Metals Invest', 'Auction', 'Private Sale', 'Other'];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        {/* Left column - Image */}
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
            Photo
          </label>
          <ImageUpload
            currentImageUrl={formData.image_url}
            onUploadComplete={(url) => updateField('image_url', url)}
            disabled={!isPro}
          />
        </div>

        {/* Right column - Basic info */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Material *
            </label>
            <select
              required
              value={formData.material_slug}
              onChange={(e) => updateField('material_slug', e.target.value)}
              className="w-full"
            >
              <option value="">Select a material</option>
              {materials.map((m) => (
                <option key={m.slug} value={m.slug}>
                  {m.name} {m.symbol && `(${m.symbol})`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Custom Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="My Rhenium Pellets"
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Quantity (g) *
              </label>
              <input
                type="number"
                required
                step="0.01"
                min="0"
                value={formData.quantity_grams || ''}
                onChange={(e) => updateField('quantity_grams', parseFloat(e.target.value) || 0)}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Grade/Purity
              </label>
              <input
                type="text"
                value={formData.grade}
                onChange={(e) => updateField('grade', e.target.value)}
                placeholder="99.95%"
                className="w-full"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Purchase Details */}
      <div className="border-t border-[var(--border)] pt-6">
        <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-4">
          PURCHASE DETAILS (optional)
        </h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Purchase Price (total $)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.purchase_price_per_gram ? formData.purchase_price_per_gram * formData.quantity_grams : ''}
              onChange={(e) => {
                const totalPrice = parseFloat(e.target.value) || 0;
                const pricePerGram = formData.quantity_grams > 0 ? totalPrice / formData.quantity_grams : 0;
                updateField('purchase_price_per_gram', pricePerGram);
              }}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Purchase Date
            </label>
            <input
              type="date"
              value={formData.purchase_date}
              onChange={(e) => updateField('purchase_date', e.target.value)}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Source
            </label>
            <select
              value={formData.purchase_source}
              onChange={(e) => updateField('purchase_source', e.target.value)}
              className="w-full"
            >
              <option value="">Select source</option>
              {purchaseSources.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Verification */}
      <div className="border-t border-[var(--border)] pt-6">
        <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-4">
          VERIFICATION (optional)
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Status
            </label>
            <div className="flex gap-4">
              {(['unverified', 'self_verified', 'certified'] as const).map((status) => (
                <label key={status} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="verification_status"
                    checked={formData.verification_status === status}
                    onChange={() => updateField('verification_status', status)}
                    className="text-[var(--accent)]"
                  />
                  <span className="text-[var(--text-primary)] capitalize">
                    {status.replace('_', '-')}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Verification Notes
            </label>
            <input
              type="text"
              value={formData.verification_notes}
              onChange={(e) => updateField('verification_notes', e.target.value)}
              placeholder="MetBull #12345, Gamma spectroscopy confirmed..."
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Certificate URL
            </label>
            <input
              type="url"
              value={formData.certificate_url}
              onChange={(e) => updateField('certificate_url', e.target.value)}
              placeholder="https://..."
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="border-t border-[var(--border)] pt-6">
        <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
          Notes
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => updateField('notes', e.target.value)}
          placeholder="Personal notes about this item..."
          rows={3}
          className="w-full bg-[var(--card-bg)] border border-[var(--border)] rounded-lg p-3 text-[var(--text-primary)]"
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn-primary"
          disabled={loading || !formData.material_slug || formData.quantity_grams <= 0}
        >
          {loading ? 'Saving...' : holding ? 'Update Holding' : 'Save Holding'}
        </button>
      </div>
    </form>
  );
}
