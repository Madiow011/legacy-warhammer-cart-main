import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useAdminAuth() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAdmin();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkAdmin();
    });
    return () => subscription.unsubscribe();
  }, []);

  const checkAdmin = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { setIsAdmin(false); setIsLoading(false); return; }

      // ใช้ has_role function ที่มีใน DB แทน query ตรง (ปลอดภัยกว่า + รองรับ enum)
      const { data } = await supabase
        .rpc('has_role', {
          _user_id: session.user.id,
          _role: 'admin',
        });

      setIsAdmin(!!data);
    } catch (_) {
      // fallback: query ตรงถ้า rpc ไม่ทำงาน
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) { setIsAdmin(false); return; }
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .maybeSingle();
        setIsAdmin(roleData?.role === 'admin');
      } catch { setIsAdmin(false); }
    } finally {
      setIsLoading(false);
    }
  };

  return { isAdmin, isLoading };
}
