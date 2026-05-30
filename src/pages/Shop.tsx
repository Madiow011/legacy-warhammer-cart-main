import { useState } from 'react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import ProductCard from '@/components/ProductCard';
import AuthModal from '@/components/AuthModal';
import { Category } from '@/data/products';
import { useApp } from '@/context/AppContext';
import { useProducts } from '@/hooks/useProducts';
import { Skeleton } from '@/components/ui/skeleton';

export default function Shop() {
  const { showAuthModal, t } = useApp();
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [search, setSearch] = useState('');
  const { products, loading } = useProducts(activeCategory, search);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header searchValue={search} onSearchChange={setSearch} />
      {showAuthModal && <AuthModal />}

      <div className="flex flex-1 max-w-6xl mx-auto w-full">
        <Sidebar activeCategory={activeCategory} onSelect={setActiveCategory} />
        <main className="flex-1 p-4">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-lg" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <p className="text-lg">{t('ไม่พบสินค้า', 'No products found')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
