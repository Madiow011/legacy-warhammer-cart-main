import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Header from '@/components/Header';
import ProductCard from '@/components/ProductCard';
import AuthModal from '@/components/AuthModal';
import { useApp } from '@/context/AppContext';
import { useProducts } from '@/hooks/useProducts';
import { Skeleton } from '@/components/ui/skeleton';

const categoryNames: Record<string, { th: string; en: string }> = {
  warhammer40k: { th: 'Warhammer 40,000', en: 'Warhammer 40,000' },
  ageofsigmar:  { th: 'Age of Sigmar',    en: 'Age of Sigmar'    },
  killteam:     { th: 'Kill Team',         en: 'Kill Team'        },
  boardgame:    { th: 'เกมกระดาน',         en: 'Board Game'       },
  cardgame:     { th: 'เกมการ์ด',          en: 'Card Game'        },
  rpg:          { th: 'เกม RPG',           en: 'RPG Game'         },
  puzzlegame:   { th: 'เกมปริศนา',         en: 'Puzzle Game'      },
  partygame:    { th: 'เกมปาร์ตี้',        en: 'Party Game'       },
};

export default function Index() {
  const { showAuthModal, t, language } = useApp();
  const [searchParams] = useSearchParams();
  const categoryParam = searchParams.get('category');
  const [search, setSearch] = useState('');
  const { products, loading } = useProducts(categoryParam, search);

  const catLabel = categoryParam && categoryNames[categoryParam]
    ? (language === 'th' ? categoryNames[categoryParam].th : categoryNames[categoryParam].en)
    : null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header searchValue={search} onSearchChange={setSearch} onSearchSubmit={() => {}} />
      {showAuthModal && <AuthModal />}

      {/* ข้อ 1: ไม่มี Sidebar แล้ว — สินค้าเต็มหน้าจอ */}
      <main className="flex-1 max-w-6xl mx-auto w-full p-4">
        {/* แสดง label หมวดหมู่ที่เลือก */}
        {catLabel && (
          <div className="mb-4 flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{t('หมวดหมู่:', 'Category:')}</span>
            <span className="text-sm font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">{catLabel}</span>
          </div>
        )}

        {search && (
          <p className="text-sm text-muted-foreground mb-3">
            {t(`ผลการค้นหา: "${search}"`, `Search results: "${search}"`)} ({products.length} {t('รายการ', 'items')})
          </p>
        )}

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-lg" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <p className="text-lg">{t('ไม่พบสินค้า', 'No products found')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
