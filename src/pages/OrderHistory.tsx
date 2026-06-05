import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, ChevronDown, ChevronUp } from 'lucide-react';
import Header from '@/components/Header';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/integrations/supabase/client';

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  id: string;
  created_at: string;
  customer_name: string;
  phone?: string;
  subdistrict?: string;
  district?: string;
  province?: string;
  zipcode?: string;
  detail?: string;
  items: OrderItem[];
  subtotal: number;
  shipping_fee: number;
  total: number;
  payment_method: string;
  status: string;
}

const statusLabel: Record<string, { th: string; en: string; color: string }> = {
  paid:      { th: 'ชำระแล้ว',    en: 'Paid',       color: 'text-green-600 bg-green-100' },
  pending:   { th: 'รอชำระ',      en: 'Pending',    color: 'text-yellow-600 bg-yellow-100' },
  cancelled: { th: 'ยกเลิก',      en: 'Cancelled',  color: 'text-red-600 bg-red-100' },
  shipping:  { th: 'จัดส่งแล้ว',  en: 'Shipped',    color: 'text-blue-600 bg-blue-100' },
};

const methodLabel: Record<string, string> = {
  promptpay:  'PromptPay',
  visa:       'VISA',
  mastercard: 'MasterCard',
};

export default function OrderHistory() {
  const { user, t } = useApp();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchOrders();
  }, [user]);

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });
    if (!error && data) setOrders(data as unknown as Order[]);
    setLoading(false);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <div className="max-w-3xl mx-auto w-full px-4 py-6">
        <button onClick={() => navigate(-1)} className="mb-4 px-4 py-2 rounded border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">
          {t('กลับ', 'Back')}
        </button>

        <h1 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
          <Package size={22} className="text-primary" />
          {t('ประวัติการสั่งซื้อ', 'Order History')}
        </h1>

        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="bg-card rounded-xl border border-border p-5 animate-pulse">
                <div className="h-4 bg-muted rounded w-1/3 mb-3" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground gap-4">
            <Package size={48} className="opacity-30" />
            <p className="text-lg">{t('ยังไม่มีประวัติการสั่งซื้อ', 'No orders yet')}</p>
            <button onClick={() => navigate('/')} className="btn-order px-8">
              {t('เลือกซื้อสินค้า', 'Shop Now')}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => {
              const st = statusLabel[order.status] ?? { th: order.status, en: order.status, color: 'text-muted-foreground bg-muted' };
              const isOpen = expanded === order.id;
              return (
                <div key={order.id} className="bg-card rounded-xl border border-border overflow-hidden">
                  {/* Header row */}
                  <button
                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/50 transition-colors text-left"
                    onClick={() => setExpanded(isOpen ? null : order.id)}
                  >
                    <div className="flex flex-col gap-1">
                      <p className="text-xs text-muted-foreground">{formatDate(order.created_at)}</p>
                      <p className="text-sm font-semibold text-foreground">
                        {order.items?.length ?? 0} {t('รายการ', 'items')} · {order.total.toLocaleString()} {t('บาท', 'THB')}
                      </p>
                      <p className="text-xs text-muted-foreground">{methodLabel[order.payment_method] ?? order.payment_method}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${st.color}`}>
                        {t(st.th, st.en)}
                      </span>
                      {isOpen ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
                    </div>
                  </button>

                  {/* Expanded detail */}
                  {isOpen && (
                    <div className="border-t border-border px-5 py-4 space-y-3">
                      {/* Items */}
                      <div className="space-y-2">
                        {(order.items ?? []).map((item, i) => (
                          <div key={i} className="flex justify-between text-sm">
                            <span className="text-foreground">{item.name} <span className="text-muted-foreground">×{item.quantity}</span></span>
                            <span className="font-medium">{(item.price * item.quantity).toLocaleString()} {t('บาท', 'THB')}</span>
                          </div>
                        ))}
                      </div>
                      {/* Summary */}
                      <div className="border-t border-border pt-3 space-y-1 text-sm">
                        <div className="flex justify-between text-muted-foreground">
                          <span>{t('ค่าสินค้า', 'Subtotal')}</span>
                          <span>{order.subtotal.toLocaleString()} {t('บาท', 'THB')}</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                          <span>{t('ค่าจัดส่ง', 'Shipping')}</span>
                          <span className={order.shipping_fee === 0 ? 'text-primary' : ''}>
                            {order.shipping_fee === 0 ? t('ฟรี', 'FREE') : `${order.shipping_fee} ${t('บาท', 'THB')}`}
                          </span>
                        </div>
                        <div className="flex justify-between font-bold text-foreground border-t border-border pt-1">
                          <span>{t('รวมทั้งหมด', 'Total')}</span>
                          <span className="text-primary">{order.total.toLocaleString()} {t('บาท', 'THB')}</span>
                        </div>
                      </div>
                      {/* Shipping address */}
                      {order.customer_name && (
                        <div className="bg-muted rounded-lg px-4 py-3 text-xs text-muted-foreground space-y-0.5">
                          <p className="font-medium text-foreground mb-1">{t('ที่อยู่จัดส่ง', 'Shipping Address')}</p>
                          <p className="font-medium text-foreground">{order.customer_name} {order.phone && `· ${order.phone}`}</p>
                          {order.detail && <p>{order.detail}</p>}
                          {(order.subdistrict || order.district || order.province) && (
                            <p>{[order.subdistrict, order.district, order.province, order.zipcode].filter(Boolean).join(' ')}</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
