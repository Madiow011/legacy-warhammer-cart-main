import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Shield, TrendingUp, Package, DollarSign, Calendar, ChevronLeft } from 'lucide-react';

interface Order {
  id: string;
  created_at: string;
  total: number;
  subtotal: number;
  shipping_fee: number;
  payment_method: string;
  status: string;
  customer_name: string;
  items: { name: string; price: number; quantity: number }[];
}

type Range = 'today' | '7days' | '30days' | 'all';

export default function AdminReport() {
  const navigate = useNavigate();
  const { isAdmin, isLoading } = useAdminAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<Range>('30days');

  useEffect(() => { if (!isLoading && isAdmin) fetchOrders(); }, [isLoading, isAdmin, range]);

  const fetchOrders = async () => {
    setLoading(true);
    let query = supabase.from('orders').select('*').eq('status', 'paid').order('created_at', { ascending: false });
    const now = new Date();
    if (range === 'today') {
      const start = new Date(now); start.setHours(0,0,0,0);
      query = query.gte('created_at', start.toISOString());
    } else if (range === '7days') {
      const start = new Date(now); start.setDate(start.getDate() - 7);
      query = query.gte('created_at', start.toISOString());
    } else if (range === '30days') {
      const start = new Date(now); start.setDate(start.getDate() - 30);
      query = query.gte('created_at', start.toISOString());
    }
    const { data } = await query;
    setOrders((data as Order[]) || []);
    setLoading(false);
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">กำลังโหลด...</p></div>;
  if (!isAdmin) return <div className="min-h-screen flex items-center justify-center"><Shield size={32} className="text-muted-foreground" /></div>;

  const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
  const totalOrders = orders.length;
  const avgOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // top products
  const productMap: Record<string, { name: string; qty: number; revenue: number }> = {};
  orders.forEach((o) => {
    (o.items || []).forEach((item) => {
      if (!productMap[item.name]) productMap[item.name] = { name: item.name, qty: 0, revenue: 0 };
      productMap[item.name].qty += item.quantity;
      productMap[item.name].revenue += item.price * item.quantity;
    });
  });
  const topProducts = Object.values(productMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  // by payment method
  const payMap: Record<string, number> = {};
  orders.forEach((o) => { payMap[o.payment_method] = (payMap[o.payment_method] || 0) + o.total; });

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });

  const rangeLabels: Record<Range, string> = { today: 'วันนี้', '7days': '7 วันที่ผ่านมา', '30days': '30 วันที่ผ่านมา', all: 'ทั้งหมด' };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-card shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/admin')} className="text-muted-foreground hover:text-foreground">
              <ChevronLeft size={20} />
            </button>
            <TrendingUp size={18} className="text-primary" />
            <span className="font-bold text-foreground">รายงานยอดขาย</span>
          </div>
          <button onClick={() => navigate('/')} className="text-sm text-muted-foreground hover:text-foreground">ดูหน้าร้าน</button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Range selector */}
        <div className="flex gap-2 flex-wrap">
          {(Object.keys(rangeLabels) as Range[]).map((r) => (
            <button key={r} onClick={() => setRange(r)}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${range === r ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-primary/50'}`}>
              {rangeLabels[r]}
            </button>
          ))}
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-card rounded-xl border border-border p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center"><DollarSign size={18} className="text-primary" /></div>
              <span className="text-sm text-muted-foreground">รายได้รวม</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{totalRevenue.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">บาท</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center"><Package size={18} className="text-blue-600" /></div>
              <span className="text-sm text-muted-foreground">คำสั่งซื้อ</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{totalOrders}</p>
            <p className="text-xs text-muted-foreground">รายการ</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center"><TrendingUp size={18} className="text-green-600" /></div>
              <span className="text-sm text-muted-foreground">ยอดเฉลี่ย/ออเดอร์</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{Math.round(avgOrder).toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">บาท</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Top Products */}
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2"><Package size={16} className="text-primary" />สินค้าขายดี</h3>
            {loading ? <p className="text-muted-foreground text-sm">กำลังโหลด...</p> :
              topProducts.length === 0 ? <p className="text-muted-foreground text-sm">ยังไม่มีข้อมูล</p> :
              <div className="space-y-3">
                {topProducts.map((p, i) => (
                  <div key={p.name} className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">{i+1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground">จำหน่าย {p.qty} ชิ้น</p>
                    </div>
                    <span className="text-sm font-semibold text-foreground">{p.revenue.toLocaleString()} ฿</span>
                  </div>
                ))}
              </div>
            }
          </div>

          {/* Payment Methods */}
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2"><DollarSign size={16} className="text-primary" />ช่องทางชำระเงิน</h3>
            {loading ? <p className="text-muted-foreground text-sm">กำลังโหลด...</p> :
              Object.keys(payMap).length === 0 ? <p className="text-muted-foreground text-sm">ยังไม่มีข้อมูล</p> :
              <div className="space-y-3">
                {Object.entries(payMap).map(([method, amount]) => {
                  const pct = totalRevenue > 0 ? Math.round((amount / totalRevenue) * 100) : 0;
                  const label: Record<string, string> = { promptpay: 'PromptPay', visa: 'VISA', mastercard: 'MasterCard' };
                  return (
                    <div key={method}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-foreground">{label[method] ?? method}</span>
                        <span className="font-medium">{amount.toLocaleString()} ฿ ({pct}%)</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            }
          </div>
        </div>

        {/* Recent Orders Table */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <Calendar size={16} className="text-primary" />
            <h3 className="font-semibold text-foreground">รายการคำสั่งซื้อล่าสุด</h3>
            <span className="text-xs text-muted-foreground ml-auto">{rangeLabels[range]}</span>
          </div>
          {loading ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground">กำลังโหลด...</div>
          ) : orders.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground">ยังไม่มีคำสั่งซื้อ</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="text-left px-4 py-3 text-muted-foreground font-medium">วันที่</th>
                    <th className="text-left px-4 py-3 text-muted-foreground font-medium">ลูกค้า</th>
                    <th className="text-left px-4 py-3 text-muted-foreground font-medium">ช่องทาง</th>
                    <th className="text-right px-4 py-3 text-muted-foreground font-medium">ยอด</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {orders.slice(0, 20).map((o) => (
                    <tr key={o.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(o.created_at)}</td>
                      <td className="px-4 py-3 text-foreground">{o.customer_name || '-'}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs bg-muted px-2 py-0.5 rounded-full">{o.payment_method}</span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-foreground">฿{o.total.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
