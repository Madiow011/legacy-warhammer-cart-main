import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { products as staticProducts } from '@/data/products';

export interface DbProduct {
  id: number;
  name: string;
  name_en: string;
  price: number;
  // รองรับทุก category รวมถึงใหม่
  category: string;
  image_url: string | null;
  description: string[];
  description_en: string[];
  material: string;
  type: string;
  stock: number;
}

const staticImageByName = Object.fromEntries(staticProducts.map((p) => [p.name.toLowerCase(), p.imageUrl]));
const staticImageById   = Object.fromEntries(staticProducts.map((p) => [p.id, p.imageUrl]));

const mergeImage = (p: any): DbProduct => ({
  ...p,
  description:    Array.isArray(p.description)    ? p.description    : [],
  description_en: Array.isArray(p.description_en) ? p.description_en : [],
  image_url: (p.image_url && p.image_url !== 'null' && !p.image_url.includes('undefined'))
    ? p.image_url
    : staticImageByName[p.name?.toLowerCase()] || staticImageById[p.id] || null,
});

const toDbFormat = (p: typeof staticProducts[0]): DbProduct => ({
  id: p.id, name: p.name, name_en: p.nameEn, price: p.price,
  category: p.category,
  image_url: p.imageUrl as string,
  description: p.description, description_en: p.descriptionEn,
  material: p.material, type: p.type, stock: p.stock,
});

export function useProducts(category?: string | null, search?: string) {
  const getFiltered = () =>
    staticProducts
      .filter((p) => !category || p.category === category)
      .filter((p) => !search || p.name.toLowerCase().includes(search.toLowerCase()))
      .map(toDbFormat);

  const [products, setProducts] = useState<DbProduct[]>(getFiltered);
  const [loading, setLoading] = useState(false);

  const fetchFromSupabase = async () => {
    try {
      let query = supabase.from('products').select('*').order('id');
      if (category) query = query.eq('category', category);
      if (search)   query = query.ilike('name', `%${search}%`);
      const { data, error } = await query;
      // อัปเดตเฉพาะเมื่อ DB มีข้อมูลจริง
      if (!error && data && data.length > 0) setProducts(data.map(mergeImage));
      else if (!error && data && data.length === 0 && category) {
        // หมวดหมู่ใหม่ที่ยังไม่มีใน static — แสดง empty
        setProducts([]);
      }
    } catch (_) {}
  };

  useEffect(() => {
    // แสดง static ทันที
    setProducts(getFiltered());
    // แล้วค่อย sync จาก DB
    fetchFromSupabase();
  }, [category, search]);

  // Realtime — อัปเดต stock / สินค้าใหม่ทันที
  useEffect(() => {
    const channel = supabase
      .channel('products-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (payload) => {
        if (payload.eventType === 'UPDATE') {
          setProducts((prev) => prev.map((p) =>
            p.id === (payload.new as any).id ? mergeImage(payload.new) : p
          ));
        } else if (payload.eventType === 'INSERT') {
          const newProduct = mergeImage(payload.new);
          // เพิ่มเฉพาะถ้า category ตรงกับที่กรองอยู่
          if (!category || newProduct.category === category) {
            setProducts((prev) => {
              if (prev.find(p => p.id === newProduct.id)) return prev;
              return [...prev, newProduct];
            });
          }
        } else if (payload.eventType === 'DELETE') {
          setProducts((prev) => prev.filter((p) => p.id !== (payload.old as any).id));
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [category]);

  return { products, loading, refetch: fetchFromSupabase };
}

export function useAdminProducts() {
  const [products, setProducts] = useState<DbProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    setLoading(true);
    const { data } = await supabase.from('products').select('*').order('id');
    if (data && data.length > 0) setProducts(data.map(mergeImage));
    else setProducts(staticProducts.map(toDbFormat));
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
    const channel = supabase
      .channel('admin-products-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => { fetchAll(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  return { products, loading, refetch: fetchAll };
}

export function useProduct(id: number) {
  const staticProduct = staticProducts.find((p) => p.id === id);
  const [product, setProduct] = useState<DbProduct | null>(
    staticProduct ? toDbFormat(staticProduct) : null
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const { data } = await supabase.from('products').select('*').eq('id', id).single();
        if (data) setProduct(mergeImage(data));
      } catch (_) {}
    })();

    const channel = supabase
      .channel(`product-${id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'products', filter: `id=eq.${id}` },
        (payload) => { setProduct(mergeImage(payload.new)); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id]);

  return { product, loading };
}
