import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shield, Eye, EyeOff } from 'lucide-react';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // เช็ค session แบบ non-blocking — ถ้าไม่มี session แสดง form ทันที
  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      // ถ้าไม่มี session เลย — แสดง form ทันที ไม่ต้องรอ
      if (!session?.user) return;

      // มี session อยู่ — เช็คว่าเป็น admin ไหม
      try {
        const { data } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .eq('role', 'admin')
          .maybeSingle();

        if (data) navigate('/admin', { replace: true });
        // ถ้าไม่ใช่ admin — แสดง form ปกติ (ไม่ต้อง signOut ก่อน)
      } catch {
        // error — แสดง form ปกติ
      }
    };
    check();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // signOut เฉพาะถ้ามี session อยู่
      const { data: { session } } = await supabase.auth.getSession();
      if (session) await supabase.auth.signOut();

      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError || !data.user) {
        setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
        setLoading(false);
        return;
      }

      // เช็ค admin role โดยตรง — ไม่ใช้ rpc เพื่อหลีกเลี่ยง type error
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', data.user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (!roleData) {
        await supabase.auth.signOut();
        setError('คุณไม่มีสิทธิ์เข้าถึง Admin Dashboard');
        setLoading(false);
        return;
      }

      navigate('/admin', { replace: true });
    } catch {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8 rounded-2xl border border-border bg-card shadow-lg">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-3">
            <Shield className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Admin Login</h1>
          <p className="text-muted-foreground text-sm mt-1">เข้าสู่ระบบสำหรับผู้ดูแล</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">อีเมล</label>
            <Input type="email" value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              autoComplete="username" required />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">รหัสผ่าน</label>
            <div className="relative">
              <Input type={showPw ? 'text' : 'password'} value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password" required className="pr-10" />
              <button type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                กำลังเข้าสู่ระบบ...
              </span>
            ) : 'เข้าสู่ระบบ Admin'}
          </Button>
        </form>

        <div className="mt-6 p-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground text-center">
            ระบบนี้สำหรับผู้ดูแลร้านเท่านั้น<br />
            ต้องได้รับสิทธิ์ admin จากผู้พัฒนา
          </p>
        </div>
      </div>
    </div>
  );
}
