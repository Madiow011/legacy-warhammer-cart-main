import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useAdminProducts, DbProduct } from '@/hooks/useProducts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import {
Shield, LogOut, Plus, Pencil, Trash2, Upload, X, Package,
ChevronUp, Save, ImagePlus, AlertCircle, TrendingUp, BarChart2,
DollarSign, Calendar, AlertTriangle, CheckCircle
} from 'lucide-react';
import { products as staticProducts } from '@/data/products';

type Category = 'warhammer40k' | 'ageofsigmar' | 'killteam' | 'cardgame' | 'boardgame' | 'rpg' | 'puzzlegame' | 'partygame';

const categoryLabels: Record<Category, string> = {
  warhammer40k: 'มินิเจอร์สงคราม', ageofsigmar: 'มินิเจอร์แฟนตาซี', killteam: 'มินิเจอร์ทีม',
  cardgame: 'เกมการ์ด', boardgame: 'เกมกระดาน', rpg: 'เกม RPG',
  puzzlegame: 'เกมปริศนา', partygame: 'เกมปาร์ตี้',
};

const emptyForm = {
  name: '', name_en: '', price: 0, category: 'warhammer40k' as Category,
  material: 'พลาสติกคุณภาพสูง (Citadel Plastic)', type: 'มินิเจอร์สำหรับวาดสี',
  stock: 0, description: [''], description_en: [''], image_url: '',
};

interface Order {
  id: string; created_at: string; customer_name: string; email?: string;
  total: number; subtotal: number; shipping_fee: number;
  payment_method: string; status: string;
  items: { name: string; price: number; quantity: number }[];
}

type ViewMode = 'stock' | 'report';
type ReportRange = 'today' | '7days' | '30days' | 'all';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { isAdmin, isLoading } = useAdminAuth();
  const { products, loading, refetch } = useAdminProducts();
  const [viewMode, setViewMode] = useState<ViewMode>('stock');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [reportRange, setReportRange] = useState<ReportRange>('30days');

  useEffect(() => {
    if (viewMode === 'report') fetchOrders();
  }, [viewMode, reportRange]);

  const fetchOrders = async () => {
    setOrdersLoading(true);
    let q = supabase.from('orders').select('*').order('created_at', { ascending: false });
    const now = new Date();
    if (reportRange === 'today') { const s = new Date(now); s.setHours(0,0,0,0); q = q.gte('created_at', s.toISOString()); }
    else if (reportRange === '7days') { const s = new Date(now); s.setDate(s.getDate()-7); q = q.gte('created_at', s.toISOString()); }
    else if (reportRange === '30days') { const s = new Date(now); s.setDate(s.getDate()-30); q = q.gte('created_at', s.toISOString()); }
    const { data } = await q;
    setOrders((data as Order[]) || []);
    setOrdersLoading(false);
  };

  const handleLogout = async () => { await supabase.auth.signOut(); navigate('/admin/login'); };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setImageFile(file); setImagePreview(URL.createObjectURL(file));
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return form.image_url || null;
    setUploading(true);
    const ext = imageFile.name.split('.').pop();
    const path = `products/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('product-images').upload(path, imageFile, { upsert: true });
    setUploading(false);
    if (error) { setError('อัปโหลดรูปภาพไม่สำเร็จ'); return null; }
    const { data } = supabase.storage.from('product-images').getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSave = async () => {
    if (!form.name || form.price <= 0) { setError('กรุณากรอกชื่อสินค้าและราคา'); return; }
    setSaving(true); setError('');
    const imageUrl = await uploadImage();
    const payload = {
      name: form.name, name_en: form.name_en || form.name,
      price: form.price, category: form.category,
      material: form.material, type: form.type, stock: form.stock,
      description: form.description.filter(Boolean),
      description_en: form.description_en.filter(Boolean),
      image_url: imageUrl,
    };
    let err;
    if (editId !== null) {
      ({ error: err } = await supabase.from('products').update(payload).eq('id', editId));
    } else {
      ({ error: err } = await supabase.from('products').insert([payload]));
    }
    setSaving(false);
    if (err) { setError('บันทึกไม่สำเร็จ: ' + err.message); return; }
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
    setShowForm(false); setEditId(null); setForm({ ...emptyForm });
    setImageFile(null); setImagePreview('');
    refetch();
  };

  const handleEdit = (p: DbProduct) => {
    setEditId(p.id);
    setForm({
      name: p.name, name_en: p.name_en, price: p.price,
      category: p.category as Category, material: p.material, type: p.type,
      stock: p.stock,
      description: p.description.length ? p.description : [''],
      description_en: p.description_en.length ? p.description_en : [''],
      image_url: p.image_url || '',
    });
    setImagePreview(p.image_url || ''); setImageFile(null);
    setShowForm(true); window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: number) => {
    await supabase.from('products').delete().eq('id', id);
    setDeleteConfirm(null); refetch();
  };

  const handleCancel = () => {
    setShowForm(false); setEditId(null);
    setForm({ ...emptyForm }); setImageFile(null); setImagePreview(''); setError('');
  };

  const handleSeedData = async () => {
    setSeeding(true);
    const rows = staticProducts.map((p) => ({
      id: p.id, name: p.name, name_en: p.nameEn, price: p.price,
      category: p.category, material: p.material, type: p.type, stock: p.stock,
      description: p.description, description_en: p.descriptionEn, image_url: null,
    }));
    await supabase.from('products').upsert(rows, { onConflict: 'id' });
    setSeeding(false); refetch();
  };

  const updateDesc = (arr: string[], idx: number, val: string, key: 'description' | 'description_en') => {
    const next = [...arr]; next[idx] = val; setForm((f) => ({ ...f, [key]: next }));
  };
  const addDesc = (key: 'description' | 'description_en') => setForm((f) => ({ ...f, [key]: [...f[key], ''] }));
  const removeDesc = (arr: string[], idx: number, key: 'description' | 'description_en') =>
    setForm((f) => ({ ...f, [key]: arr.filter((_, i) => i !== idx) }));

  const paidOrders = orders.filter(o => o.status === 'paid');
  const totalRevenue = paidOrders.reduce((s, o) => s + o.total, 0);
  const avgOrder = paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0;
  const rangeLabels: Record<ReportRange, string> = { today:'วันนี้', '7days':'7 วัน', '30days':'30 วัน', all:'ทั้งหมด' };
  const outOfStock = products.filter(p => (p as any)._fromDb && p.stock === 0);
  const lowStock = products.filter(p => (p as any)._fromDb && p.stock > 0 && p.stock <= 3);

  const groupedCustomerOrders = useMemo(() => {
    const groups: Record<string, { email: string, name: string, total: number, items: Record<string, any> }> = {};
    paidOrders.forEach(o => {
      const key = o.email || o.customer_name || 'ไม่ระบุตัวตน';
      if (!groups[key]) {
        groups[key] = { email: o.email || '-', name: o.customer_name || '-', total: 0, items: {} };
      }
      groups[key].total += o.total;
      if (o.items) {
        o.items.forEach(item => {
          if (!groups[key].items[item.name]) {
            groups[key].items[item.name] = { ...item };
          } else {
            groups[key].items[item.name].quantity += item.quantity;
          }
        });
      }
    });
    return Object.values(groups).map(g => ({
      ...g,
      itemsList: Object.values(g.items)
    }));
  }, [paidOrders]);

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-muted-foreground">กำลังตรวจสอบสิทธิ์...</div>
    </div>
  );

  if (!isAdmin) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-bold text-foreground mb-2">ไม่มีสิทธิ์เข้าถึง</h2>
        <p className="text-muted-foreground mb-4">คุณต้องล็อกอินด้วยบัญชี Admin</p>
        <Button onClick={() => navigate('/admin/login')}>ไปหน้า Admin Login</Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {saveSuccess && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-green-600 text-white px-4 py-3 rounded-xl shadow-xl animate-in fade-in slide-in-from-top-2">
          <CheckCircle size={18} />
          <span className="text-sm font-medium">บันทึกสำเร็จแล้ว</span>
        </div>
      )}

      <header className="sticky top-0 z-40 border-b border-border bg-card shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <span className="font-bold text-foreground">Admin Dashboard</span>
            <Badge variant="secondary" className="text-xs">Top Legacy Board Game</Badge>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>ดูหน้าร้าน</Button>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut size={14} className="mr-1" /> ออกจากระบบ
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(['warhammer40k','ageofsigmar','killteam','boardgame'] as Category[]).map((cat) => (
            <div key={cat} className="bg-card rounded-xl border border-border p-4">
              <p className="text-xs text-muted-foreground truncate">{categoryLabels[cat]}</p>
              <p className="text-2xl font-bold text-foreground">{products.filter(p=>p.category===cat).length}</p>
              <p className="text-xs text-muted-foreground">รายการสินค้า</p>
            </div>
          ))}
        </div>

        {(outOfStock.length > 0 || lowStock.length > 0) && (
          <div className="space-y-2">
            {outOfStock.length > 0 && (
              <div className="flex items-center gap-3 bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-3">
                <AlertCircle size={18} className="text-destructive flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-destructive">สินค้าหมดสต็อก {outOfStock.length} รายการ</p>
                  <p className="text-xs text-destructive/80 truncate">{outOfStock.map(p=>p.name).join(', ')}</p>
                </div>
              </div>
            )}
            {lowStock.length > 0 && (
              <div className="flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3">
                <AlertTriangle size={18} className="text-yellow-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-yellow-700">สินค้าใกล้หมด {lowStock.length} รายการ (เหลือ ≤ 3)</p>
                  <p className="text-xs text-yellow-600 truncate">{lowStock.map(p=>`${p.name} (${p.stock})`).join(', ')}</p>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-2">
          <button onClick={() => setViewMode('stock')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold border transition-all ${viewMode==='stock' ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-primary/50'}`}>
            <Package size={15} /> สต็อกสินค้า
          </button>
          <button onClick={() => setViewMode('report')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold border transition-all ${viewMode==='report' ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-primary/50'}`}>
            <TrendingUp size={15} /> Report
          </button>
        </div>

        {/* ===== STOCK VIEW ===== */}
        {viewMode === 'stock' && (
          <div>
            <div className="flex flex-wrap gap-3 items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Package size={20} /> สินค้าทั้งหมด ({products.length})
              </h2>
              <div className="flex gap-2">
                {products.length === 0 && (
                  <Button variant="outline" size="sm" onClick={handleSeedData} disabled={seeding}>
                    {seeding ? 'กำลัง Import...' : '📦 Import สินค้าตัวอย่าง'}
                  </Button>
                )}
                <Button size="sm" onClick={() => { setShowForm(!showForm); if(showForm) handleCancel(); }}>
                  {showForm ? <ChevronUp size={14} /> : <Plus size={14} />}
                  {showForm ? 'ซ่อนฟอร์ม' : '+ เพิ่มสินค้า'}
                </Button>
              </div>
            </div>

            {showForm && (
              <div className="bg-card rounded-xl border border-border p-6 space-y-5 mb-6">
                <h3 className="font-bold text-foreground text-base">
                  {editId !== null ? `✏️ แก้ไขสินค้า #${editId}` : '➕ เพิ่มสินค้าใหม่'}
                </h3>
                {error && <div className="flex items-center gap-2 text-destructive bg-destructive/10 rounded-lg px-3 py-2 text-sm"><AlertCircle size={14}/>{error}</div>}
                <div className="flex flex-col items-center gap-3">
                  <div onClick={() => fileRef.current?.click()}
                    className="w-40 h-40 rounded-xl border-2 border-dashed border-border hover:border-primary cursor-pointer flex items-center justify-center overflow-hidden bg-muted/30">
                    {imagePreview ? <img src={imagePreview} alt="preview" className="w-full h-full object-cover" /> :
                      <div className="flex flex-col items-center text-muted-foreground"><ImagePlus size={32}/><span className="text-xs mt-1">คลิกเพื่ออัปโหลด</span></div>}
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange}/>
                  {imagePreview && <button onClick={() => { setImagePreview(''); setImageFile(null); setForm(f=>({...f,image_url:''})); }} className="text-xs text-destructive hover:underline flex items-center gap-1"><X size={12}/>ลบรูป</button>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="text-sm font-medium mb-1 block">ชื่อสินค้า (TH) *</label><Input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/></div>
                  <div><label className="text-sm font-medium mb-1 block">ชื่อสินค้า (EN)</label><Input value={form.name_en} onChange={e=>setForm(f=>({...f,name_en:e.target.value}))}/></div>
                  <div><label className="text-sm font-medium mb-1 block">ราคา (บาท) *</label><Input type="number" value={form.price} onChange={e=>setForm(f=>({...f,price:+e.target.value}))}/></div>
                  <div><label className="text-sm font-medium mb-1 block">สต็อก *</label><Input type="number" value={form.stock} onChange={e=>setForm(f=>({...f,stock:+e.target.value}))}/></div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">หมวดหมู่ *</label>
                    <select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value as Category}))}
                      className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                      <optgroup label="มินิเจอร์">
                        <option value="warhammer40k">มินิเจอร์สงคราม</option>
                        <option value="ageofsigmar">มินิเจอร์แฟนตาซี</option>
                        <option value="killteam">มินิเจอร์ทีม</option>
                      </optgroup>
                      <optgroup label="บอร์ดเกม">
                        <option value="boardgame">เกมกระดาน</option>
                        <option value="cardgame">เกมการ์ด</option>
                        <option value="rpg">เกม RPG</option>
                        <option value="puzzlegame">เกมปริศนา</option>
                        <option value="partygame">เกมปาร์ตี้</option>
                      </optgroup>
                    </select>
                  </div>
                  <div><label className="text-sm font-medium mb-1 block">วัสดุ</label><Input value={form.material} onChange={e=>setForm(f=>({...f,material:e.target.value}))}/></div>
                  <div className="md:col-span-2"><label className="text-sm font-medium mb-1 block">ประเภท</label><Input value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}/></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">รายละเอียด (TH)</label>
                    <div className="space-y-2">
                      {form.description.map((d,i)=>(
                        <div key={i} className="flex gap-2">
                          <Input value={d} onChange={e=>updateDesc(form.description,i,e.target.value,'description')} placeholder={`รายละเอียด ${i+1}`}/>
                          {form.description.length > 1 && <button onClick={()=>removeDesc(form.description,i,'description')} className="text-destructive"><X size={14}/></button>}
                        </div>
                      ))}
                      <Button variant="outline" size="sm" onClick={()=>addDesc('description')}><Plus size={12}/>เพิ่มบรรทัด</Button>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">รายละเอียด (EN)</label>
                    <div className="space-y-2">
                      {form.description_en.map((d,i)=>(
                        <div key={i} className="flex gap-2">
                          <Input value={d} onChange={e=>updateDesc(form.description_en,i,e.target.value,'description_en')} placeholder={`Detail ${i+1}`}/>
                          {form.description_en.length > 1 && <button onClick={()=>removeDesc(form.description_en,i,'description_en')} className="text-destructive"><X size={14}/></button>}
                        </div>
                      ))}
                      <Button variant="outline" size="sm" onClick={()=>addDesc('description_en')}><Plus size={12}/>Add line</Button>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button onClick={handleSave} disabled={saving||uploading}>
                    {uploading ? <><Upload size={14} className="mr-1"/>กำลังอัปโหลด...</> :
                    saving ? <><Save size={14} className="mr-1"/>กำลังบันทึก...</> :
                    <><Save size={14} className="mr-1"/>บันทึก</>}
                  </Button>
                  <Button variant="outline" onClick={handleCancel}>ยกเลิก</Button>
                </div>
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center h-48 text-muted-foreground">กำลังโหลด...</div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-3">
                <Package size={40}/><p>ยังไม่มีสินค้า</p>
              </div>
            ) : (
              <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 border-b border-border">
                      <tr>
                        <th className="text-left px-4 py-3 text-muted-foreground font-medium">รูป</th>
                        <th className="text-left px-4 py-3 text-muted-foreground font-medium">ชื่อสินค้า</th>
                        <th className="text-left px-4 py-3 text-muted-foreground font-medium">หมวดหมู่</th>
                        <th className="text-right px-4 py-3 text-muted-foreground font-medium">ราคา</th>
                        <th className="text-right px-4 py-3 text-muted-foreground font-medium">สต็อก</th>
                        <th className="text-center px-4 py-3 text-muted-foreground font-medium">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {products.map((p) => (
                        <tr key={p.id} className={`hover:bg-muted/30 ${p.stock===0?'bg-destructive/5':p.stock<=3?'bg-yellow-50/50':''}`}>
                          <td className="px-4 py-3">
                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                              {p.image_url ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover"/> : <Package size={20} className="text-muted-foreground"/>}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-medium text-foreground line-clamp-1">{p.name}</p>
                            <p className="text-xs text-muted-foreground"># {p.id}</p>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className="text-xs">{categoryLabels[p.category as Category] ?? p.category}</Badge>
                          </td>
                          <td className="px-4 py-3 text-right font-medium">฿{p.price.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right">
                            {p.stock === 0 ? (
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-destructive bg-destructive/10 px-2 py-0.5 rounded-full"><AlertCircle size={11}/>หมด</span>
                            ) : p.stock <= 3 ? (
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded-full"><AlertTriangle size={11}/>{p.stock} ใกล้หมด</span>
                            ) : (
                              <span className="font-medium text-foreground">{p.stock}</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-2">
                              <Button variant="ghost" size="sm" onClick={()=>handleEdit(p)} className="h-8 w-8 p-0"><Pencil size={14}/></Button>
                              {deleteConfirm === p.id ? (
                                <div className="flex gap-1">
                                  <Button variant="destructive" size="sm" className="h-8 text-xs px-2" onClick={()=>handleDelete(p.id)}>ยืนยัน</Button>
                                  <Button variant="ghost" size="sm" className="h-8 text-xs px-2" onClick={()=>setDeleteConfirm(null)}>ยกเลิก</Button>
                                </div>
                              ) : (
                                <Button variant="ghost" size="sm" onClick={()=>setDeleteConfirm(p.id)} className="h-8 w-8 p-0 text-destructive hover:text-destructive"><Trash2 size={14}/></Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===== REPORT VIEW ===== */}
        {viewMode === 'report' && (
          <div>
            <div className="flex gap-2 mb-6">
              {(Object.keys(rangeLabels) as ReportRange[]).map((r)=>(
                <button key={r} onClick={()=>setReportRange(r)}
                  className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${reportRange===r?'bg-primary text-primary-foreground border-primary':'border-border text-muted-foreground hover:border-primary/50'}`}>
                  {rangeLabels[r]}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-card rounded-xl border border-border p-5">
                <div className="flex items-center gap-3 mb-2"><div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center"><DollarSign size={18} className="text-primary"/></div><span className="text-sm text-muted-foreground">รายได้รวม</span></div>
                <p className="text-2xl font-bold">{totalRevenue.toLocaleString()}</p><p className="text-xs text-muted-foreground">บาท</p>
              </div>
              <div className="bg-card rounded-xl border border-border p-5">
                <div className="flex items-center gap-3 mb-2"><div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center"><Package size={18} className="text-blue-600"/></div><span className="text-sm text-muted-foreground">คำสั่งซื้อ</span></div>
                <p className="text-2xl font-bold">{paidOrders.length}</p><p className="text-xs text-muted-foreground">รายการ</p>
              </div>
              <div className="bg-card rounded-xl border border-border p-5">
                <div className="flex items-center gap-3 mb-2"><div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center"><BarChart2 size={18} className="text-green-600"/></div><span className="text-sm text-muted-foreground">ยอดเฉลี่ย/ออเดอร์</span></div>
                <p className="text-2xl font-bold">{Math.round(avgOrder).toLocaleString()}</p><p className="text-xs text-muted-foreground">บาท</p>
              </div>
            </div>
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center gap-2">
                <Calendar size={16} className="text-primary"/>
                <h3 className="font-semibold text-foreground">รายการที่ลูกค้าซื้อ (แยกตามรายบุคคล)</h3>
                <span className="text-xs text-muted-foreground ml-auto">{rangeLabels[reportRange]}</span>
              </div>
              {ordersLoading ? (
                <div className="flex items-center justify-center h-32 text-muted-foreground">กำลังโหลด...</div>
              ) : paidOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground gap-2"><TrendingUp size={32} className="opacity-30"/><p>ยังไม่มีคำสั่งซื้อที่ชำระเงินแล้ว</p></div>
              ) : (
                <div className="p-4">
                  <Accordion type="multiple" className="w-full space-y-2">
                    {groupedCustomerOrders.map((customer, idx) => (
                      <AccordionItem key={idx} value={`item-${idx}`} className="bg-muted/10 border border-border rounded-lg px-4 data-[state=open]:bg-muted/30">
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex justify-between items-center w-full pr-4">
                            <div className="flex flex-col items-start gap-1">
                              <span className="font-semibold text-foreground text-base">
                                {customer.email !== '-' ? customer.email : customer.name}
                              </span>
                              <span className="text-xs text-muted-foreground font-normal">
                                ชื่อลูกค้า: {customer.name}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-xs text-muted-foreground block mb-1 font-normal">ยอดรวมทั้งหมด</span>
                              <span className="font-bold text-primary text-base">฿{customer.total.toLocaleString()}</span>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-2 pb-4 border-t border-border mt-2">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-muted/50 hover:bg-muted/50">
                                <TableHead className="w-[50px] font-semibold text-foreground">ลำดับ</TableHead>
                                <TableHead className="font-semibold text-foreground">รายละเอียดสินค้า</TableHead>
                                <TableHead className="text-right font-semibold text-foreground">จำนวนรวม</TableHead>
                                <TableHead className="text-right font-semibold text-foreground">ราคา/หน่วย</TableHead>
                                <TableHead className="text-right font-semibold text-foreground">รวมเป็นเงิน</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {customer.itemsList.map((item: any, i: number) => (
                                <TableRow key={i}>
                                  <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                                  <TableCell className="font-medium text-foreground">{item.name}</TableCell>
                                  <TableCell className="text-right font-semibold text-foreground">{item.quantity} หน่วย</TableCell>
                                  <TableCell className="text-right text-muted-foreground">฿{item.price.toLocaleString()}</TableCell>
                                  <TableCell className="text-right font-semibold text-foreground">
                                    ฿{(item.price * item.quantity).toLocaleString()}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
