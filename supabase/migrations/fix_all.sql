-- =========================================
-- FIX 1: Reset SERIAL sequence ให้ตรงกับ id จริง
-- (แก้ "duplicate key value violates unique constraint products_pkey")
-- =========================================
SELECT setval(
  pg_get_serial_sequence('public.products', 'id'),
  (SELECT MAX(id) FROM public.products)
);

-- =========================================
-- FIX 2: category constraint รองรับทุกหมวด
-- =========================================
ALTER TABLE public.products 
  DROP CONSTRAINT IF EXISTS products_category_check;

ALTER TABLE public.products 
  ADD CONSTRAINT products_category_check 
  CHECK (category IN (
    'warhammer40k', 'ageofsigmar', 'killteam',
    'cardgame', 'boardgame', 'rpg', 'puzzlegame', 'partygame'
  ));

-- =========================================
-- FIX 3: เพิ่ม email column ใน orders
-- =========================================
ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS email TEXT;

-- =========================================
-- FIX 4: service_role policy (Edge Function หักสต็อก + อ่าน orders ได้)
-- =========================================
DROP POLICY IF EXISTS "Service role can manage orders"   ON public.orders;
DROP POLICY IF EXISTS "Service role can manage products" ON public.products;
DROP POLICY IF EXISTS "Anon can create orders"           ON public.orders;

CREATE POLICY "Service role can manage orders"
  ON public.orders FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Service role can manage products"
  ON public.products FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Anon can create orders"
  ON public.orders FOR INSERT TO anon
  WITH CHECK (true);

-- =========================================
-- ยืนยัน
-- =========================================
SELECT last_value FROM products_id_seq;
SELECT COUNT(*) as total_products, MAX(id) as max_id FROM public.products;
