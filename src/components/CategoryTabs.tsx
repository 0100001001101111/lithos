'use client';

interface CategoryTabsProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

const categories = [
  { id: 'all', label: 'All Materials' },
  { id: 'strategic_metal', label: 'Strategic Metals' },
  { id: 'rare_earth', label: 'Rare Earths' },
  { id: 'collectible', label: 'Collectibles' },
];

export default function CategoryTabs({ activeCategory, onCategoryChange }: CategoryTabsProps) {
  return (
    <div className="flex gap-1 border-b border-[var(--border)]">
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onCategoryChange(category.id)}
          className={`px-4 py-3 text-sm font-medium transition-colors ${
            activeCategory === category.id
              ? 'tab-active'
              : 'tab-inactive'
          }`}
        >
          {category.label}
        </button>
      ))}
    </div>
  );
}
