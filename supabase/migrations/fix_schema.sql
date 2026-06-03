-- =========================================
-- TOP LEGACY — Fix Schema
-- รันใน Supabase SQL Editor
-- =========================================

-- 1. แก้ category constraint ให้รองรับทุก category
ALTER TABLE public.products 
  DROP CONSTRAINT IF EXISTS products_category_check;

ALTER TABLE public.products 
  ADD CONSTRAINT products_category_check 
  CHECK (category IN (
    'warhammer40k', 'ageofsigmar', 'killteam',
    'cardgame', 'boardgame', 'rpg', 'puzzlegame', 'partygame'
  ));

-- 2. เพิ่ม email column ใน orders (สำหรับ Report grouping)
ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS email TEXT;

-- 3. service_role จัดการ orders ได้ (Edge Function webhook หักสต็อก)
DROP POLICY IF EXISTS "Service role can manage orders" ON public.orders;
CREATE POLICY "Service role can manage orders"
  ON public.orders FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 4. anon สร้าง order ได้ (กรณี guest checkout)
DROP POLICY IF EXISTS "Anon can create orders" ON public.orders;
CREATE POLICY "Anon can create orders"
  ON public.orders FOR INSERT
  TO anon
  WITH CHECK (true);

-- 5. service_role จัดการ products ได้ (Edge Function หักสต็อก)
DROP POLICY IF EXISTS "Service role can manage products" ON public.products;
CREATE POLICY "Service role can manage products"
  ON public.products FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 6. ยืนยัน — ควรเห็น constraint ใหม่และ email column
SELECT conname, pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'public.products'::regclass AND contype = 'c';

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'orders' AND table_schema = 'public'
ORDER BY ordinal_position;
