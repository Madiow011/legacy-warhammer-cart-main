import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/integrations/supabase/client';

const TIMER_SECONDS = 15 * 60;
type PaymentMethod = 'promptpay' | 'visa' | 'mastercard';
type PayStep = 'confirm' | 'qr' | 'card' | 'success';

export default function Payment() {
  const location = useLocation();
  const navigate = useNavigate();
  const { clearCart, t } = useApp();
  const state = location.state as any;

  const [step, setStep] = useState<PayStep>('confirm');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('promptpay');
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const [saving, setSaving] = useState(false);
  const [cardForm, setCardForm] = useState({ cardNumber: '', cardName: '', expiry: '', cvv: '' });
  const [simStatus, setSimStatus] = useState<'idle' | 'processing' | 'done'>('idle');

  // SCB state
  const [orderId, setOrderId] = useState<string | null>(null);
  const [qrImage, setQrImage] = useState<string | null>(null);   // base64 from SCB
  const [qrRawData, setQrRawData] = useState<string | null>(null);
  const [scbError, setScbError] = useState('');
  const [qrLoading, setQrLoading] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (step === 'qr') {
      setTimeLeft(TIMER_SECONDS);
      timerRef.current = setInterval(() => setTimeLeft(t => { if (t <= 1) { clearInterval(timerRef.current!); return 0; } return t - 1; }), 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [step]);

  // หยุด poll เมื่อ unmount
  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  const formatTime = (s: number) => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;

  // บันทึก order ใน Supabase ก่อน แล้วค่อยเรียก SCB
  const createOrder = async (): Promise<string | null> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const orderItems = state.items.map((i: any) => ({ name: i.product.name, price: i.product.price, quantity: i.quantity }));
      const { data, error } = await supabase.from('orders').insert({
        user_id: session?.user?.id,
        customer_name: state.form.name || '',
        phone: state.form.phone || '',
        province: state.form.province || '',
        district: state.form.district || '',
        subdistrict: state.form.subdistrict || '',
        zipcode: state.form.zipcode || '',
        detail: state.form.detail || '',
        items: orderItems,
        subtotal: state.subtotal,
        shipping_fee: state.shipping,
        total: state.total,
        payment_method: 'promptpay',
        status: 'pending',
      } as any).select('id').single();
      if (error || !data) return null;
      return data.id;
    } catch { return null; }
  };

  // เรียก SCB Edge Function สร้าง QR
  const handleConfirmQR = async () => {
    setQrLoading(true);
    setScbError('');
    const oid = await createOrder();
    if (!oid) { setScbError(t('สร้างออเดอร์ไม่สำเร็จ', 'Failed to create order')); setQrLoading(false); return; }
    setOrderId(oid);

    const { data, error } = await supabase.functions.invoke('scb-payment', {
      body: { action: 'create_qr', orderId: oid, amount: state.total },
    });

    if (error || !data?.success) {
      setScbError(data?.error || t('สร้าง QR ไม่สำเร็จ', 'Failed to create QR'));
      setQrLoading(false);
      return;
    }

    setQrImage(data.qrImage);       // รูป QR จาก SCB (base64)
    setQrRawData(data.qrRawData);   // raw string สำรอง
    setQrLoading(false);
    setStep('qr');

    // Poll เช็คสถานะทุก 5 วินาที
    pollRef.current = setInterval(async () => {
      // SCB Sandbox ใช้ transactionId จาก ref1 — เช็คจาก order status แทน
      const { data: order } = await supabase.from('orders').select('status').eq('id', oid).single();
      if (order?.status === 'paid') {
        clearInterval(pollRef.current!);
        if (timerRef.current) clearInterval(timerRef.current);
        clearCart();
        setStep('success');
      }
    }, 5000);
  };

  // จำลองสำเร็จ (Sandbox กด simulate)
  const handleSimPay = async () => {
    setSimStatus('processing');
    if (timerRef.current) clearInterval(timerRef.current);
    if (pollRef.current) clearInterval(pollRef.current);
    await new Promise(r => setTimeout(r, 1500));
    if (orderId) await supabase.from('orders').update({ status: 'paid' }).eq('id', orderId);
    clearCart();
    setSimStatus('done');
    setTimeout(() => setStep('success'), 600);
  };

  const handleCardPay = async () => {
    if (!cardForm.cardNumber || !cardForm.cardName || !cardForm.expiry || !cardForm.cvv) return;
    setSimStatus('processing');
    await new Promise(r => setTimeout(r, 1500));
    const { data: { session } } = await supabase.auth.getSession();
    const orderItems = state.items.map((i: any) => ({ name: i.product.name, price: i.product.price, quantity: i.quantity }));
    await supabase.from('orders').insert({
      user_id: session?.user?.id,
      customer_name: state.form.name || '',
      phone: state.form.phone || '',
      items: orderItems, subtotal: state.subtotal,
      shipping_fee: state.shipping, total: state.total,
      payment_method: paymentMethod, status: 'paid',
    } as any);
    clearCart();
    setSimStatus('done');
    setTimeout(() => setStep('success'), 600);
  };

  if (!state) { navigate('/'); return null; }

  // PROCESSING
  if (simStatus === 'processing' || simStatus === 'done') return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center p-8">
          {simStatus === 'processing' ? (
            <>
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="font-semibold">{t('กำลังดำเนินการ...', 'Processing...')}</p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-green-600 font-bold text-lg">{t('ชำระเงินสำเร็จ!', 'Payment Successful!')}</p>
            </>
          )}
        </div>
      </div>
    </div>
  );

  // SUCCESS
  if (step === 'success') return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <div className="flex flex-1 items-center justify-center px-4">
        <div className="bg-card rounded-xl border border-border p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-1">{t('ชำระสินค้าเรียบร้อย', 'Payment Successful')}</h2>
          <p className="text-muted-foreground mb-6">{t('ขอบคุณสำหรับการสั่งซื้อ', 'Thank you for your order')}</p>
          {state.items.map((item: any, i: number) => (
            <div key={i} className="flex items-center gap-3 mb-3 text-left border border-border rounded-lg p-3">
              <img src={item.product.imageUrl} alt="" className="w-14 h-14 object-cover rounded" />
              <div className="flex-1"><p className="text-sm font-medium">{item.product.name}</p><p className="text-xs text-muted-foreground">×{item.quantity}</p></div>
              <span className="text-sm font-semibold">{(item.product.price * item.quantity).toLocaleString()} {t('บาท','THB')}</span>
            </div>
          ))}
          <div className="border-t border-border pt-3 flex justify-between text-sm font-bold mb-6">
            <span>{t('รวม','Total')}</span>
            <span className="text-primary">{state.total.toLocaleString()} {t('บาท','THB')}</span>
          </div>
          <button onClick={() => navigate('/')} className="btn-order w-full py-3 mb-2">{t('กลับหน้าหลัก','Back to Home')}</button>
          <button onClick={() => navigate('/orders')} className="w-full py-2 text-sm text-primary hover:underline">{t('ดูประวัติการสั่งซื้อ','View Order History')}</button>
        </div>
      </div>
    </div>
  );

  // QR STEP — แสดง QR จาก SCB จริง
  if (step === 'qr') return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <div className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="bg-card rounded-xl border border-border p-6 max-w-lg w-full">
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              {/* SCB Logo badge */}
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-[#4B2E83] text-white text-xs font-bold px-3 py-1 rounded">SCB</div>
                <span className="text-xs text-muted-foreground">PromptPay</span>
              </div>
              <div className="bg-white p-3 rounded-xl border-2 border-[#4B2E83] shadow-md">
                {qrImage ? (
                  /* รูป QR จาก SCB (base64) */
                  <img src={`data:image/png;base64,${qrImage}`} alt="SCB QR" className="w-48 h-48 object-contain" />
                ) : qrRawData ? (
                  /* Fallback: สร้าง QR จาก raw data */
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrRawData)}&margin=5`}
                    alt="QR Code" className="w-48 h-48 object-contain" />
                ) : null}
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                {t('สแกนผ่าน SCB Easy App', 'Scan via SCB Easy App')}<br />
                <span className="font-semibold text-foreground text-base">{state.total.toLocaleString()} {t('บาท','THB')}</span>
              </p>
              <div className="mt-3 bg-muted rounded px-4 py-2 text-2xl font-mono font-bold border border-border">
                {formatTime(timeLeft)}
              </div>
              {timeLeft === 0 && <p className="text-destructive text-xs mt-1">{t('หมดเวลา','Time expired')}</p>}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-2">{t('รายการสั่งซื้อ','Order Summary')}</h3>
              <div className="text-sm text-muted-foreground mb-3 space-y-1">
                {state.items.map((item: any, i: number) => (
                  <div key={i} className="flex justify-between text-xs">
                    <span className="truncate max-w-[130px]">{item.product.name}</span>
                    <span>{(item.product.price * item.quantity).toLocaleString()} {t('บาท','THB')}</span>
                  </div>
                ))}
                <div className="flex justify-between font-semibold border-t border-border pt-1 mt-1">
                  <span>{t('รวม','Total')}</span>
                  <span>{state.total.toLocaleString()} {t('บาท','THB')}</span>
                </div>
              </div>
              <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                <li>{t('เปิด SCB Easy App', 'Open SCB Easy App')}</li>
                <li>{t('กด "จ่ายเงิน" → "สแกน QR"', 'Tap "Pay" → "Scan QR"')}</li>
                <li>{t('สแกน QR Code ด้านซ้าย', 'Scan the QR Code')}</li>
                <li>{t('ยืนยันยอด แล้วกดชำระ', 'Confirm amount & pay')}</li>
              </ol>
              <div className="mt-4 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700">
                {t('ระบบจะอัปเดตอัตโนมัติเมื่อชำระสำเร็จ', 'System will auto-update when payment is confirmed')}
              </div>
            </div>
          </div>

          {/* Sandbox: ปุ่มจำลองสำเร็จ */}
          <div className="mt-6 border-t border-border pt-4">
            <p className="text-xs text-center text-muted-foreground mb-3">
              🧪 {t('โหมด Sandbox — กดปุ่มด้านล่างเพื่อจำลองการชำระเงิน', 'Sandbox mode — click below to simulate payment')}
            </p>
            <button onClick={handleSimPay} disabled={saving || timeLeft === 0}
              className="btn-order w-full py-3 disabled:opacity-50">
              {saving ? t('กำลังบันทึก...','Saving...') : t('✅ Simulate Payment (Sandbox)', '✅ Simulate Payment (Sandbox)')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // CARD STEP
  if (step === 'card') return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <div className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="bg-card rounded-xl border border-border p-6 max-w-md w-full">
          <h2 className="font-bold text-lg mb-4 text-center">{paymentMethod === 'visa' ? 'VISA' : 'MasterCard'} {t('ชำระเงิน','Payment')}</h2>
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">{t('หมายเลขบัตร','Card Number')}</label>
              <input className="input-field" placeholder="0000 0000 0000 0000" maxLength={19} value={cardForm.cardNumber}
                onChange={e => { const v = e.target.value.replace(/\D/g,'').replace(/(.{4})/g,'$1 ').trim(); setCardForm(p=>({...p,cardNumber:v})); }} />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">{t('ชื่อบนบัตร','Cardholder Name')}</label>
              <input className="input-field" placeholder="FIRST LAST" value={cardForm.cardName}
                onChange={e => setCardForm(p=>({...p,cardName:e.target.value.toUpperCase()}))} />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs text-muted-foreground mb-1">{t('วันหมดอายุ','Expiry')}</label>
                <input className="input-field" placeholder="MM/YY" maxLength={5} value={cardForm.expiry}
                  onChange={e => { let v=e.target.value.replace(/\D/g,''); if(v.length>=3)v=v.slice(0,2)+'/'+v.slice(2,4); setCardForm(p=>({...p,expiry:v})); }} />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-muted-foreground mb-1">CVV</label>
                <input className="input-field" placeholder="***" maxLength={3} type="password" value={cardForm.cvv}
                  onChange={e => setCardForm(p=>({...p,cvv:e.target.value.replace(/\D/g,'')}))} />
              </div>
            </div>
          </div>
          <div className="flex justify-between text-sm font-bold border-t border-border pt-3 mb-4">
            <span>{t('รวม','Total')}</span>
            <span className="text-primary">{state.total.toLocaleString()} {t('บาท','THB')}</span>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep('confirm')} className="flex-1 py-3 rounded-full border border-border text-sm hover:bg-muted">{t('กลับ','Back')}</button>
            <button onClick={handleCardPay} disabled={saving || !cardForm.cardNumber || !cardForm.cardName || !cardForm.expiry || !cardForm.cvv}
              className="btn-order flex-1 py-3 disabled:opacity-50">
              {saving ? t('กำลังดำเนินการ...','Processing...') : t('ชำระเงิน','Pay Now')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // CONFIRM STEP
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <div className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="bg-card rounded-xl border border-border p-6 max-w-md w-full">
          <h2 className="font-bold text-lg mb-4 text-center">{t('เลือกช่องทางชำระเงิน','Select Payment Method')}</h2>
          {state.items.map((item: any, i: number) => (
            <div key={i} className="flex items-center gap-3 mb-3 border border-border rounded p-2">
              <img src={item.product.imageUrl} alt="" className="w-12 h-12 object-cover rounded" />
              <div className="flex-1 text-sm">
                <p className="font-medium">{item.product.name}</p>
                <p className="text-muted-foreground">×{item.quantity}</p>
              </div>
              <span className="text-sm font-semibold">{(item.product.price * item.quantity).toLocaleString()} {t('บาท','THB')}</span>
            </div>
          ))}
          <div className="flex justify-between text-sm font-bold border-t border-border pt-3 mb-4">
            <span>{t('รวม','Total')}</span>
            <span className="text-primary">{state.total.toLocaleString()} {t('บาท','THB')}</span>
          </div>
          <div className="border border-border rounded p-3 mb-4">
            <p className="text-xs text-muted-foreground mb-2">{t('ช่องทางชำระเงิน','Payment methods')}</p>
            <div className="flex gap-2">
              {(['promptpay','visa','mastercard'] as PaymentMethod[]).map(m => (
                <button key={m} onClick={() => setPaymentMethod(m)}
                  className={`px-3 py-1.5 rounded text-xs font-bold border transition-all ${paymentMethod===m ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:border-primary/50'}`}>
                  {m === 'promptpay' ? 'PromptPay' : m === 'visa' ? 'VISA' : 'MasterCard'}
                </button>
              ))}
            </div>
          </div>

          {scbError && <p className="text-destructive text-sm mb-3 text-center">{scbError}</p>}

          <button
            onClick={paymentMethod === 'promptpay' ? handleConfirmQR : () => setStep('card')}
            disabled={qrLoading}
            className="btn-order w-full py-3 disabled:opacity-50"
          >
            {qrLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {t('กำลังสร้าง QR...','Creating QR...')}
              </span>
            ) : t('ยืนยัน / ชำระเงิน','Confirm / Pay')}
          </button>
        </div>
      </div>
    </div>
  );
}
