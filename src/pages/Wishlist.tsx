import Header from '@/components/Header';
import ProductCard from '@/components/ProductCard';
import AuthModal from '@/components/AuthModal';
import { products } from '@/data/products';
import { useApp } from '@/context/AppContext';

export default function Wishlist() {
  const { wishlist, showAuthModal, t } = useApp();
  const wishlisted = products.filter((p) => wishlist.includes(p.id));

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      {showAuthModal && <AuthModal />}
      <div className="max-w-6xl mx-auto w-full px-4 py-6">
        <h1 className="text-xl font-bold text-foreground mb-4">{t('รายการโปรด', 'Wishlist')}</h1>
        {wishlisted.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <p className="text-lg">{t('ยังไม่มีรายการโปรด', 'No wishlist items yet')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {wishlisted.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
