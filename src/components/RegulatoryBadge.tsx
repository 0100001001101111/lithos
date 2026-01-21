'use client';

interface RegulatoryBadgeProps {
  status: 'unrestricted' | 'export_controlled' | 'restricted';
}

const config = {
  unrestricted: {
    label: 'Unrestricted',
    className: 'bg-[var(--positive)]/20 text-[var(--positive)] border-[var(--positive)]/30',
  },
  export_controlled: {
    label: 'Export Controlled',
    className: 'bg-[var(--warning)]/20 text-[var(--warning)] border-[var(--warning)]/30',
  },
  restricted: {
    label: 'Restricted',
    className: 'bg-[var(--negative)]/20 text-[var(--negative)] border-[var(--negative)]/30',
  },
};

export function RegulatoryBadge({ status }: RegulatoryBadgeProps) {
  const { label, className } = config[status];

  return (
    <span className={`text-xs px-2 py-1 rounded border ${className}`}>
      {label}
    </span>
  );
}
