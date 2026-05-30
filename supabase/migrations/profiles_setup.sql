-- =========================================
-- รัน SQL นี้ใน Supabase → SQL Editor
-- =========================================

-- 1. ลบ trigger เก่าก่อน (ป้องกัน error ซ้ำ)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;

-- 2. ลบ table เก่า (cascade ลบ policy ด้วย)
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 3. สร้าง profiles ใหม่ — เพิ่ม email column
CREATE TABLE public.profiles (
  id          UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID        NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username    TEXT,
  email       TEXT,                        -- เก็บ email ไว้ด้วยเพื่อแสดงในหน้า admin
  birthday    DATE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. เปิด RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. Policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- อนุญาตให้ service_role (trigger) insert ได้
CREATE POLICY "Service role can insert profile" ON public.profiles
  FOR INSERT TO service_role WITH CHECK (true);

-- 6. Trigger อัปเดต updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Function สร้าง profile อัตโนมัติเมื่อสมัคร
--    บันทึกทั้ง username, email, birthday
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username, email, birthday)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'username',
    NEW.email,
    NULLIF(NEW.raw_user_meta_data->>'birthday', '')::date
  );
  RETURN NEW;
END;
$$;

-- 8. สร้าง trigger ใหม่
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================
-- ปิด Email Confirmation (สำหรับ demo/dev)
-- รันใน SQL Editor เพื่อให้ login ได้ทันทีโดยไม่ต้องยืนยัน email
-- =========================================
-- หมายเหตุ: วิธีที่ถูกต้องกว่าคือไปที่
-- Supabase Dashboard → Authentication → Email → ปิด "Confirm email"
-- แต่ถ้าต้องการทำผ่าน SQL ให้ใช้ด้านล่าง:

-- ยืนยัน email ให้ user ที่มีอยู่แล้วทั้งหมด (กรณีสมัครไปแล้วแต่ยัง confirm ไม่ได้)
UPDATE auth.users
SET email_confirmed_at = now()
WHERE email_confirmed_at IS NULL;
