import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCircle, Save } from 'lucide-react';
import Header from '@/components/Header';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/integrations/supabase/client';

export default function Profile() {
  const { user, t } = useApp();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', birthday: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('username, birthday')
      .eq('user_id', user!.id)
      .single();
    if (data) {
      setForm({
        username: data.username ?? '',
        birthday: data.birthday ?? '',
      });
    }
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username.trim()) { setError(t('กรุณากรอกชื่อผู้ใช้', 'Username required')); return; }
    setError('');
    setSaving(true);
    const { error: dbError } = await supabase
      .from('profiles')
      .update({
        username: form.username.trim(),
        birthday: form.birthday || null,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user!.id);

    if (dbError) {
      setError(t('บันทึกไม่สำเร็จ กรุณาลองใหม่', 'Save failed, please try again'));
    } else {
      // อัปเดต user_metadata ด้วยเพื่อให้ header แสดง username ใหม่ทันที
      await supabase.auth.updateUser({ data: { username: form.username.trim() } });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    }
    setSaving(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <div className="max-w-lg mx-auto w-full px-4 py-6">
        <button onClick={() => navigate(-1)} className="mb-4 px-4 py-2 rounded border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">
          {t('กลับ', 'Back')}
        </button>

        <h1 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
          <UserCircle size={22} className="text-primary" />
          {t('โปรไฟล์', 'Profile')}
        </h1>

        <div className="bg-card rounded-xl border border-border p-6">
          {/* Avatar placeholder */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center">
              <span className="text-3xl font-bold text-primary">
                {user?.username?.[0]?.toUpperCase() ?? '?'}
              </span>
            </div>
          </div>

          {/* Email (readonly) */}
          <div className="mb-4">
            <label className="block text-sm text-muted-foreground mb-1">{t('อีเมล', 'Email')}</label>
            <input
              type="text"
              className="input-field bg-muted cursor-not-allowed opacity-70"
              value={user?.email ?? ''}
              readOnly
            />
          </div>

          {loading ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-10 bg-muted rounded-lg" />
              <div className="h-10 bg-muted rounded-lg" />
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-1">{t('ชื่อผู้ใช้', 'Username')}</label>
                <input
                  type="text"
                  className="input-field"
                  value={form.username}
                  onChange={(e) => setForm(p => ({ ...p, username: e.target.value }))}
                  autoComplete="off"
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">{t('วันเกิด', 'Birthday')}</label>
                <input
                  type="date"
                  className="input-field"
                  value={form.birthday}
                  onChange={(e) => setForm(p => ({ ...p, birthday: e.target.value }))}
                />
              </div>

              {error && <p className="text-destructive text-sm">{error}</p>}

              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-2">
                  {t('บันทึกเรียบร้อยแล้ว ✓', 'Saved successfully ✓')}
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-order px-8 py-2.5 flex items-center gap-2 disabled:opacity-50"
                >
                  <Save size={16} />
                  {saving ? t('กำลังบันทึก...', 'Saving...') : t('บันทึก', 'Save')}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
