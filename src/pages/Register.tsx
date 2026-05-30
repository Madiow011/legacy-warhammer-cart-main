import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useApp } from '@/context/AppContext';

export default function Register() {
  const { register, language, setLanguage, t } = useApp();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    birthday: '',
    terms: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const set = (key: string, val: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.username) e.username = t('กรุณากรอกชื่อผู้ใช้', 'Username required');
    if (!form.password) e.password = t('กรุณากรอกรหัสผ่าน', 'Password required');
    else if (form.password.length < 6)
      e.password = t('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร', 'Password must be at least 6 characters');
    if (form.password !== form.confirmPassword)
      e.confirmPassword = t('รหัสผ่านไม่ตรงกัน', 'Passwords do not match');
    if (!form.email) e.email = t('กรุณากรอกอีเมล', 'Email required');
    if (!form.terms)
      e.terms = t('กรุณายอมรับเงื่อนไข', 'Please accept terms');
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setLoading(true);
    const res = await register(form.username, form.email, form.password, form.birthday);
    setLoading(false);
    if (!res.ok) {
      setSubmitError(res.error || t('สมัครไม่สำเร็จ', 'Registration failed'));
      return;
    }
    setSuccess(true);
    setTimeout(() => navigate('/login'), 1800);
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-card">
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            {t('สมัครสมาชิกเรียบร้อย', 'Registration Successful')}
          </h2>
          <p className="text-muted-foreground mb-6">{t('ขอบคุณที่เข้าร่วมกับเรา', 'Thank you for joining us')}</p>
          <p className="text-primary text-sm">
            {t('กำลังนำคุณกลับหน้าล็อคอิน...', 'Redirecting to login...')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted">
      {/* ซ่อน icon ดวงตา native ของ browser (Edge/Chrome) ไม่ให้ซ้อนกับ icon ของเรา */}
      <style>{`
        input[type="password"]::-ms-reveal,
        input[type="password"]::-ms-clear,
        input[type="password"]::-webkit-contacts-auto-fill-button,
        input[type="password"]::-webkit-credentials-auto-fill-button {
          display: none !important;
          visibility: hidden;
          pointer-events: none;
        }
      `}</style>

      <div className="flex items-center justify-between p-3">
        <button
          onClick={() => navigate('/login')}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={16} />
          {t('กลับหน้าล็อคอิน', 'Back to Login')}
        </button>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{t('เปลี่ยนภาษา', 'Language')}</span>
          <button onClick={() => setLanguage('th')} className={`text-lg ${language === 'th' ? '' : 'opacity-40'}`}>🇹🇭</button>
          <button onClick={() => setLanguage('en')} className={`text-lg ${language === 'en' ? '' : 'opacity-40'}`}>🇬🇧</button>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-4 pb-8">
        <div className="bg-card rounded-xl border border-border p-8 w-full max-w-md shadow-lg">
          <h1 className="text-xl font-bold text-center text-foreground mb-6">
            {t('สมัครสมาชิก', 'Register')}
          </h1>

          {/*
            autoComplete="off" ป้องกัน browser เติมข้อมูลอัตโนมัติ
            hidden inputs หลอก password manager ให้รู้ว่า email คือ username จริง
          */}
          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
            <input type="text" name="fake-username" style={{ display: 'none' }} readOnly tabIndex={-1} />
            <input type="password" name="fake-password" style={{ display: 'none' }} readOnly tabIndex={-1} />

            {/* Username */}
            <div className="flex items-center gap-3">
              <label className="w-32 text-sm text-muted-foreground flex-shrink-0">
                {t('ชื่อผู้ใช้งาน', 'Username')}
              </label>
              <div className="flex-1">
                <input
                  type="text"
                  className="input-field"
                  value={form.username}
                  onChange={(e) => set('username', e.target.value)}
                  autoComplete="off"
                />
                {errors.username && <p className="text-destructive text-xs mt-0.5">{errors.username}</p>}
              </div>
            </div>

            {/* Password */}
            <div className="flex items-center gap-3">
              <label className="w-32 text-sm text-muted-foreground flex-shrink-0">
                {t('รหัสผ่าน', 'Password')}
              </label>
              <div className="flex-1">
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="input-field pr-10"
                    value={form.password}
                    onChange={(e) => set('password', e.target.value)}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <p className="text-destructive text-xs mt-0.5">{errors.password}</p>}
              </div>
            </div>

            {/* Confirm Password */}
            <div className="flex items-center gap-3">
              <label className="w-32 text-sm text-muted-foreground flex-shrink-0">
                {t('ยืนยันรหัสผ่าน', 'Confirm Password')}
              </label>
              <div className="flex-1">
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="input-field pr-10"
                    value={form.confirmPassword}
                    onChange={(e) => set('confirmPassword', e.target.value)}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-destructive text-xs mt-0.5">{errors.confirmPassword}</p>}
              </div>
            </div>

            {/* Email — autoComplete="email" บอก password manager ว่าช่องนี้คือ login identifier */}
            <div className="flex items-center gap-3">
              <label className="w-32 text-sm text-muted-foreground flex-shrink-0">
                {t('อีเมลล์', 'Email')}
              </label>
              <div className="flex-1">
                <input
                  type="email"
                  className="input-field"
                  value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                  autoComplete="email"
                  name="email"
                />
                {errors.email && <p className="text-destructive text-xs mt-0.5">{errors.email}</p>}
              </div>
            </div>

            {/* Birthday */}
            <div className="flex items-center gap-3">
              <label className="w-32 text-sm text-muted-foreground flex-shrink-0">{t('วันเกิด', 'Birthday')}</label>
              <div className="flex-1">
                <input
                  type="date"
                  className="input-field"
                  value={form.birthday}
                  onChange={(e) => set('birthday', e.target.value)}
                />
              </div>
            </div>

            {/* Terms */}
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="terms"
                className="mt-0.5 accent-primary w-4 h-4"
                checked={form.terms}
                onChange={(e) => set('terms', e.target.checked)}
              />
              <label htmlFor="terms" className="text-sm text-muted-foreground">
                {t('กรุณาตกลง ข้อตกลงและเงื่อนไขในการใช้งานเว็บไซต์', 'Please agree to Terms and Conditions')}
              </label>
            </div>
            {errors.terms && <p className="text-destructive text-xs">{errors.terms}</p>}
            {submitError && <p className="text-destructive text-sm text-center">{submitError}</p>}

            <div className="flex justify-end">
              <button type="submit" disabled={loading} className="btn-order px-8 py-2.5 disabled:opacity-50">
                {loading ? t('กำลังสมัคร...', 'Registering...') : t('ยืนยันข้อมูล', 'Submit')}
              </button>
            </div>
          </form>

          <div className="mt-4 text-center">
            <Link to="/login" className="text-sm text-primary hover:underline">
              {t('มีบัญชีแล้ว? เข้าสู่ระบบ', 'Already have an account? Login')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
