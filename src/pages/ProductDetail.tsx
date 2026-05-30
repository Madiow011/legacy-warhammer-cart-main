import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Heart, ChevronLeft, ChevronRight, Minus, Plus } from 'lucide-react';
import Header from '@/components/Header';
import AuthModal from '@/components/AuthModal';
import { useApp } from '@/context/AppContext';
import { useProduct } from '@/hooks/useProducts';
import { Product } from '@/data/products';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, addToCart, setShowAuthModal, wishlist, toggleWishlist, showAuthModal, t, language } = useApp();
  const [quantity, setQuantity] = useState(1);
  const [imgIdx, setImgIdx] = useState(0);

  // ดึงจาก Supabase ก่อน ถ้าไม่มีค่อย fallback static
  const { product, loading } = useProduct(Number(id));

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex flex-1 items-center justify-center">
          <p className="text-muted-foreground">{t('กำลังโหลด...', 'Loading...')}</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex flex-1 items-center justify-center">
          <p className="text-muted-foreground">{t('ไม่พบสินค้า', 'Product not found')}</p>
        </div>
      </div>
    );
  }

  const isWishlisted = wishlist.includes(product.id);
  const images = [product.image_url || '/placeholder.svg', product.image_url || '/placeholder.svg', product.image_url || '/placeholder.svg'];
  const displayName = language === 'th' ? product.name : product.name_en;
  const displayDesc = language === 'th' ? product.description : product.description_en;

  const handleOrder = () => {
    if (!user) { setShowAuthModal(true); return; }
    // แปลงเป็น Product type สำหรับ addToCart
    const p: Product = {
      id: product.id, name: product.name, nameEn: product.name_en,
      price: product.price, category: product.category,
      imageUrl: product.image_url || '/placeholder.svg',
      description: product.description, descriptionEn: product.description_en,
      material: product.material, type: product.type, stock: product.stock,
    };
    addToCart(p, quantity);
    navigate('/cart');
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      {showAuthModal && <AuthModal />}

      <div className="max-w-4xl mx-auto w-full px-4 py-6">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 px-4 py-2 rounded border border-border text-sm text-muted-foreground hover:bg-muted transition-colors"
        >
          {t('กลับ', 'Back')}
        </button>

        <div className="bg-card rounded-xl border border-border p-6 flex flex-col md:flex-row gap-8">
          {/* Image carousel */}
          <div className="flex-shrink-0 w-full md:w-80">
            <div className="relative aspect-square bg-muted rounded-lg overflow-hidden">
              <img src={images[imgIdx]} alt={displayName} className="w-full h-full object-cover" />
              <button
                onClick={() => setImgIdx((i) => (i - 1 + images.length) % images.length)}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-card/80 rounded-full p-1 hover:bg-card transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={() => setImgIdx((i) => (i + 1) % images.length)}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-card/80 rounded-full p-1 hover:bg-card transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>
            <div className="flex gap-2 mt-2 justify-center">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setImgIdx(i)}
                  className={`w-12 h-12 rounded border-2 overflow-hidden transition-all ${imgIdx === i ? 'border-primary' : 'border-border'}`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Details */}
          <div className="flex-1 flex flex-col">
            <div className="flex items-start justify-between mb-2">
              <h1 className="text-xl font-bold text-foreground leading-tight">{displayName}</h1>
              <button
                onClick={() => toggleWishlist(product.id)}
                className={`ml-4 flex-shrink-0 ${isWishlisted ? 'text-accent' : 'text-muted-foreground'} hover:text-accent transition-colors`}
              >
                <Heart size={22} fill={isWishlisted ? 'currentColor' : 'none'} />
              </button>
            </div>

            <ul className="text-sm text-muted-foreground mb-4 space-y-1">
              {displayDesc.map((d, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>{d}</span>
                </li>
              ))}
            </ul>

            <div className="text-sm text-muted-foreground mb-4 space-y-1">
              <p><span className="text-foreground font-medium">{t('วัสดุ:', 'Material:')}</span> {product.material}</p>
              <p><span className="text-foreground font-medium">{t('ประเภท:', 'Type:')}</span> {product.type}</p>
              <p><span className="text-foreground font-medium">{t('สต็อก:', 'Stock:')}</span> {product.stock} {t('ชิ้น', 'pcs')}</p>
            </div>

            <p className="text-2xl font-bold text-foreground mb-4">
              {t('ราคา', 'Price')} {product.price.toLocaleString()} {t('บาท', 'THB')}
            </p>

            <div className="flex items-center gap-4 mb-6">
              <span className="text-sm text-muted-foreground">{t('จำนวน:', 'Qty:')}</span>
              <div className="flex items-center border border-border rounded-full overflow-hidden">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-9 h-9 flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground"
                >
                  <Minus size={16} />
                </button>
                <span className="w-10 text-center text-sm font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                  className="w-9 h-9 flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            <button
              onClick={handleOrder}
              disabled={product.stock === 0}
              className={`btn-order self-start px-10 py-3 text-base ${product.stock === 0 ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              {product.stock === 0 ? t('สินค้าหมด', 'Out of Stock') : t('สั่งซื้อ', 'Order')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
