import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';

export default function AuthModal() {
  const { setShowAuthModal, t } = useApp();
  const navigate = useNavigate();

  const handleLogin = () => {
    setShowAuthModal(false);
    navigate('/login');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-card rounded-xl shadow-xl p-8 max-w-xs w-full mx-4 relative">
        <button
          onClick={() => setShowAuthModal(false)}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
        >
          <X size={18} />
        </button>
        <p className="text-center text-foreground font-medium mb-6 text-base">
          {t('กรุณา Login ก่อนซื้อสินค้า', 'Please login before purchasing')}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={handleLogin}
            className="btn-order px-6"
          >
            {t('ตกลง', 'OK')}
          </button>
          <button
            onClick={() => setShowAuthModal(false)}
            className="px-6 py-2 rounded-full border border-border text-sm font-semibold text-muted-foreground hover:bg-muted transition-all"
          >
            {t('ไม่', 'Cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}
