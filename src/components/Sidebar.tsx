import { Category } from '@/data/products';
import { useApp } from '@/context/AppContext';

// Category banner images (using styled divs since we have no real logos)
const categoryStyles: Record<Category, { bg: string; label: string; labelEn: string; accent: string }> = {
  warhammer40k: {
    bg: 'from-zinc-800 to-zinc-900',
    label: 'WARHAMMER 40,000',
    labelEn: 'WARHAMMER 40,000',
    accent: 'border-red-700',
  },
  ageofsigmar: {
    bg: 'from-amber-900 to-yellow-900',
    label: 'WARHAMMER Age of Sigmar',
    labelEn: 'WARHAMMER Age of Sigmar',
    accent: 'border-amber-500',
  },
  killteam: {
    bg: 'from-gray-800 to-gray-900',
    label: 'WARHAMMER KILL TEAM',
    labelEn: 'WARHAMMER KILL TEAM',
    accent: 'border-orange-600',
  },
};

interface SidebarProps {
  activeCategory: Category | null;
  onSelect: (cat: Category | null) => void;
}

export default function Sidebar({ activeCategory, onSelect }: SidebarProps) {
  const { t } = useApp();

  return (
    <aside className="w-48 flex-shrink-0 flex flex-col gap-2 pt-4 px-2">
      {(Object.keys(categoryStyles) as Category[]).map((cat) => {
        const style = categoryStyles[cat];
        const isActive = activeCategory === cat;
        return (
          <button
            key={cat}
            onClick={() => onSelect(isActive ? null : cat)}
            className={`sidebar-btn ${isActive ? 'active' : ''}`}
          >
            <div
              className={`bg-gradient-to-r ${style.bg} flex items-center justify-center px-2 py-3 border-2 rounded ${
                isActive ? 'border-primary' : style.accent
              }`}
            >
              <span
                className="text-white font-bold text-xs text-center leading-tight tracking-wider"
                style={{ fontFamily: 'Inter, sans-serif', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}
              >
                {style.label}
              </span>
            </div>
          </button>
        );
      })}
    </aside>
  );
}
