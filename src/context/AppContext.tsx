import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Product } from '@/data/products';
import { supabase } from '@/integrations/supabase/client';

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface User {
  id: string;
  username: string;
  email: string;
  isAdmin?: boolean;
}

interface AppContextType {
  language: 'th' | 'en';
  setLanguage: (lang: 'th' | 'en') => void;
  t: (th: string, en: string) => string;
  user: User | null;
  authLoading: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  register: (username: string, email: string, password: string, birthday?: string) => Promise<{ ok: boolean; error?: string }>;
  cart: CartItem[];
  addToCart: (product: Product, qty?: number) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, qty: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartSubtotal: number;
  shippingFee: number;
  cartTotal: number;
  wishlist: number[];
  toggleWishlist: (productId: number) => void;
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
}

const AppContext = createContext<AppContextType | null>(null);
const FREE_SHIPPING_THRESHOLD = 2000;
const SHIPPING_FEE = 100;

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<'th' | 'en'>('th');
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const t = (th: string, en: string) => (language === 'th' ? th : en);

  const mapUser = async (u: any): Promise<User | null> => {
    if (!u) return null;
    try {
      const email = u.email || '';
      // ดึง username จาก metadata ก่อน (เร็วที่สุด ไม่ต้อง query)
      const metaUsername = u.user_metadata?.username;
      if (metaUsername) {
        return { id: u.id, email, username: metaUsername };
      }
      // ดึงจาก profiles table (ถ้าไม่มี metadata)
      const { data } = await supabase
        .from('profiles')
        .select('username')
        .eq('user_id', u.id)
        .maybeSingle(); // ใช้ maybeSingle แทน single — ไม่ throw error ถ้าไม่เจอ row
      return {
        id: u.id,
        email,
        username: data?.username || email.split('@')[0],
      };
    } catch (_) {
      // Admin หรือ user ที่ไม่มี profile — fallback ปลอดภัย
      return {
        id: u.id,
        email: u.email || '',
        username: u.email?.split('@')[0] || 'user',
      };
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_e, session) => {
      try {
        const mapped = await mapUser(session?.user);
        setUser(mapped);
      } catch (_) {
        setUser(null);
      }
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      try {
        const mapped = await mapUser(session?.user);
        setUser(mapped);
      } catch (_) {
        setUser(null);
      } finally {
        setAuthLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setCart([]);
  };

  const register = async (username: string, email: string, password: string, birthday?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { username, birthday: birthday || '' },
      },
    });
    if (error) {
      if (error.status === 429 || error.message.includes('rate limit') || error.message.includes('Too Many'))
        return { ok: false, error: 'ส่งคำขอบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่' };
      if (error.message.includes('already registered') || error.message.includes('already exists'))
        return { ok: false, error: 'อีเมลนี้ถูกใช้งานแล้ว' };
      if (error.message.includes('Database error'))
        return { ok: false, error: 'เกิดข้อผิดพลาดในฐานข้อมูล กรุณาติดต่อผู้ดูแลระบบ' };
      return { ok: false, error: error.message };
    }
    return { ok: true };
  };

  const addToCart = (product: Product, qty = 1) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      const maxStock = product.stock ?? 99;
      if (existing) {
        const newQty = Math.min(existing.quantity + qty, maxStock);
        return prev.map((i) => i.product.id === product.id ? { ...i, quantity: newQty } : i);
      }
      return [...prev, { product, quantity: Math.min(qty, maxStock) }];
    });
  };
  const removeFromCart = (productId: number) => setCart((prev) => prev.filter((i) => i.product.id !== productId));
  const updateQuantity = (productId: number, qty: number) => {
    if (qty <= 0) { removeFromCart(productId); return; }
    setCart((prev) => prev.map((i) => {
      if (i.product.id !== productId) return i;
      const maxStock = i.product.stock ?? 99;
      return { ...i, quantity: Math.min(qty, maxStock) };
    }));
  };
  const clearCart = () => setCart([]);
  const toggleWishlist = (productId: number) => setWishlist((prev) =>
    prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
  );

  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);
  const cartSubtotal = cart.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  const shippingFee = cartSubtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const cartTotal = cartSubtotal + shippingFee;

  return (
    <AppContext.Provider value={{
      language, setLanguage, t, user, authLoading, login, logout, register,
      cart, addToCart, removeFromCart, updateQuantity, clearCart,
      cartCount, cartSubtotal, shippingFee, cartTotal,
      wishlist, toggleWishlist, showAuthModal, setShowAuthModal,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
