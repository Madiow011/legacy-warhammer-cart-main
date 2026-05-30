import { Link, useNavigate } from 'react-router-dom';
import { Search, Heart, ShoppingCart, User, LogOut, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useApp } from '@/context/AppContext';

interface HeaderProps {
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  onSearchSubmit?: () => void;
}

// ข้อ 1: หมวดหมู่ทั้งหมด
const CATEGORIES = [
  { value: 'warhammer40k', th: 'Warhammer 40,000', en: 'Warhammer 40,000' },
  { value: 'ageofsigmar',  th: 'Age of Sigmar',    en: 'Age of Sigmar'    },
  { value: 'killteam',     th: 'Kill Team',         en: 'Kill Team'        },
  { value: 'boardgame',    th: 'เกมกระดาน',         en: 'Board Game'       },
  { value: 'cardgame',     th: 'เกมการ์ด',          en: 'Card Game'        },
  { value: 'rpg',          th: 'เกม RPG',           en: 'RPG Game'         },
  { value: 'puzzlegame',   th: 'เกมปริศนา',         en: 'Puzzle Game'      },
  { value: 'partygame',    th: 'เกมปาร์ตี้',        en: 'Party Game'       },
];

export default function Header({ searchValue = '', onSearchChange, onSearchSubmit }: HeaderProps) {
  const { user, logout, language, setLanguage, cartCount, t } = useApp();
  const navigate = useNavigate();
  const [localSearch, setLocalSearch] = useState(searchValue);
  const [showCatMenu, setShowCatMenu] = useState(false);
  const catRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (catRef.current && !catRef.current.contains(e.target as Node)) setShowCatMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearchSubmit) onSearchSubmit();
  };

  return (
    <header className="header-sticky sticky top-0 z-50">
      {/* ข้อ 3: ลบ free shipping banner ออกแล้ว */}

      <div className="px-4 py-2 flex items-center gap-3">
        <Link to="/" className="flex-shrink-0 mr-2">
          <span className="font-display text-primary text-lg font-bold tracking-wide whitespace-nowrap">
            TOP LEGACY
          </span>
        </Link>

        <form onSubmit={handleSearch} className="flex-1 flex items-center bg-white rounded border border-border overflow-hidden max-w-xl">
          <div className="flex items-center px-3 text-muted-foreground">
            <Search size={16} />
          </div>
          <input
            className="flex-1 py-2 text-sm text-foreground bg-transparent outline-none placeholder:text-muted-foreground"
            placeholder={t('ค้นหาสินค้า...', 'Search products...')}
            value={onSearchChange ? searchValue : localSearch}
            onChange={(e) => {
              if (onSearchChange) onSearchChange(e.target.value);
              else setLocalSearch(e.target.value);
            }}
          />
          <button type="submit" className="bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:brightness-110 transition-all">
            {t('ค้นหา', 'Search')}
          </button>
        </form>

        <div className="flex items-center gap-3 ml-auto flex-shrink-0">
          <Link to="/wishlist" className="flex items-center gap-1 text-secondary-foreground hover:text-primary transition-colors text-sm">
            <Heart size={18} />
            <span className="hidden md:inline">{t('รายการโปรด', 'Wishlist')}</span>
          </Link>

          <div className="flex items-center gap-1">
            <button onClick={() => setLanguage('th')} className={`text-sm font-bold px-2 py-0.5 rounded transition-all ${language === 'th' ? 'bg-primary text-primary-foreground' : 'text-primary/60 hover:text-primary'}`}>TH</button>
            <span className="text-muted-foreground text-xs">/</span>
            <button onClick={() => setLanguage('en')} className={`text-sm font-bold px-2 py-0.5 rounded transition-all ${language === 'en' ? 'bg-primary text-primary-foreground' : 'text-primary/60 hover:text-primary'}`}>EN</button>
          </div>

          {user ? (
            <div className="flex items-center gap-2">
              <Link to="/orders" className="text-secondary-foreground hover:text-primary transition-colors text-sm hidden md:inline">{user.username}</Link>
              <button onClick={logout} className="text-secondary-foreground hover:text-primary transition-colors" title="Logout"><LogOut size={18} /></button>
            </div>
          ) : (
            <Link to="/login" className="flex items-center gap-1 text-secondary-foreground hover:text-primary transition-colors text-sm">
              <User size={18} />
              <span className="hidden md:inline">{t('เข้าสู่ระบบ', 'Login')}</span>
            </Link>
          )}

          <Link to="/cart" className="relative flex items-center text-secondary-foreground hover:text-primary transition-colors">
            <ShoppingCart size={22} />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-accent text-accent-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Nav tabs — ข้อ 2: เปลี่ยนโปรโมชั่นเป็น dropdown หมวดหมู่ */}
      <div className="bg-background border-b border-border px-4 flex gap-1 items-center">
        <Link to="/" className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors border-b-2 border-transparent hover:border-primary">
          {t('หน้าแรก', 'Home')}
        </Link>

        {/* Dropdown หมวดหมู่ */}
        <div className="relative" ref={catRef}>
          <button
            onClick={() => setShowCatMenu(v => !v)}
            className={`flex items-center gap-1 px-3 py-2 text-sm transition-colors border-b-2 ${showCatMenu ? 'text-primary border-primary' : 'text-muted-foreground border-transparent hover:text-foreground hover:border-primary hover:bg-muted'}`}
          >
            {t('หมวดหมู่เกม', 'Game Categories')}
            <ChevronDown size={14} className={`transition-transform ${showCatMenu ? 'rotate-180' : ''}`} />
          </button>

          {showCatMenu && (
            <div className="absolute left-0 top-full mt-0.5 w-48 bg-card border border-border rounded-lg shadow-xl z-50 overflow-hidden">
              <div className="py-1">
                <div className="px-3 py-1.5 text-xs text-muted-foreground font-semibold uppercase tracking-wide bg-muted/50">Warhammer</div>
                {CATEGORIES.slice(0, 3).map((cat) => (
                  <button key={cat.value} onClick={() => { navigate(`/?category=${cat.value}`); setShowCatMenu(false); }}
                    className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors">
                    {language === 'th' ? cat.th : cat.en}
                  </button>
                ))}
                <div className="px-3 py-1.5 text-xs text-muted-foreground font-semibold uppercase tracking-wide bg-muted/50 mt-1">บอร์ดเกม</div>
                {CATEGORIES.slice(3).map((cat) => (
                  <button key={cat.value} onClick={() => { navigate(`/?category=${cat.value}`); setShowCatMenu(false); }}
                    className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors">
                    {language === 'th' ? cat.th : cat.en}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <Link to="/contact" className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors border-b-2 border-transparent hover:border-primary">
          {t('ติดต่อเรา', 'Contact')}
        </Link>
      </div>
    </header>
  );
}
