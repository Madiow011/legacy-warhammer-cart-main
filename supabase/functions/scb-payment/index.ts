import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SCB_BASE    = 'https://api-sandbox.partners.scb/partners/sandbox';
const APP_KEY     = 'l75998fa61fa4d46ffadac3aad12337a9a';
const APP_SECRET  = 'f3e14d51eb714151b3175d2327385e3b';
const BILLER_ID   = '673842149947166';

async function getToken(): Promise<string> {
  const uid = crypto.randomUUID();
  const res = await fetch(`${SCB_BASE}/v1/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'requestUId': uid, 'resourceOwnerId': APP_KEY },
    body: JSON.stringify({ applicationKey: APP_KEY, applicationSecret: APP_SECRET }),
  });
  const text = await res.text();
  let data: any;
  try { data = JSON.parse(text); } catch { throw new Error('SCB token parse error'); }
  return data.data.accessToken;
}

async function createQR(token: string, amount: number, ref1: string, ref2: string) {
  const uid = crypto.randomUUID();
  const payload = {
    qrType: 'PP', ppType: 'BILLERID', ppId: BILLER_ID,
    amount: String(amount.toFixed(2)), ref1: ref1.slice(0, 20), ref2: ref2.slice(0, 20), ref3: 'SCB'
  };

  const res = await fetch(`${SCB_BASE}/v1/payment/qrcode/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, 'requestUId': uid, 'resourceOwnerId': APP_KEY, 'accept-language': 'EN' },
    body: JSON.stringify(payload),
  });
  
  const text = await res.text();
  let data: any;
  try { data = JSON.parse(text); } catch { throw new Error('SCB QR parse error'); }
  return data.data;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // 🟢 อ่านข้อมูลที่ส่งมาเป็น Text ก่อน (กันระบบพังถ้า SCB ไม่ได้ส่งมาเป็น JSON)
    const rawText = await req.text();
    console.log(`[LOG] 📥 ได้รับ Request Method: ${req.method}`);
    console.log(`[LOG] 📦 ข้อมูลดิบที่รับมา:`, rawText);

    let body: any = {};
    if (rawText) {
      try { body = JSON.parse(rawText); } 
      catch (e) { console.error('[LOG] ❌ ข้อมูลไม่ใช่ JSON ที่ถูกต้อง'); }
    }

    // ==========================================
    // 🚨 ส่วนรับ WEBHOOK จาก SCB
    // ==========================================
    if (body.billPaymentRef1 || body.transactionId) {
      const ref1 = body.billPaymentRef1;
      console.log(`[LOG] 🔍 กำลังค้นหาออเดอร์ด้วย Ref1: ${ref1}`);
      
      const { data: pendingOrders } = await supabase.from('orders').select('id, status').eq('status', 'pending');
      
      if (pendingOrders) {
        const matchedOrder = pendingOrders.find(o => {
          const expectedRef = String(o.id).replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 20);
          return expectedRef === ref1;
        });
        
        if (matchedOrder) {
          const { error } = await supabase.from('orders').update({ status: 'paid' }).eq('id', matchedOrder.id);
          if (!error) {
            console.log(`[LOG] ✅ อัปเดตออเดอร์ ${matchedOrder.id} เป็น paid สำเร็จ!`);
            return new Response(JSON.stringify({ resCode: '00', resDesc: 'success', transactionId: body.transactionId }), { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200
            });
          } else {
            console.error(`[LOG] ❌ อัปเดต DB ไม่สำเร็จ:`, error);
          }
        } else {
          console.log(`[LOG] ⚠️ ไม่พบออเดอร์ที่ Ref1 ตรงกัน`);
        }
      }
      return new Response(JSON.stringify({ resCode: '01', resDesc: 'Order not found' }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 
      });
    }

    // ==========================================
    // 🛒 ส่วนสร้าง QR Code จากหน้าเว็บ
    // ==========================================
    if (body.action === 'create_qr') {
      const { orderId, amount } = body;
      const token = await getToken();
      const ref1 = String(orderId).replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 20);
      const ref2 = `TL${Date.now().toString().slice(-8)}`.toUpperCase();
      
      const qr = await createQR(token, Number(amount), ref1, ref2);
      await supabase.from('orders').update({ status: 'pending' }).eq('id', orderId);

      return new Response(
        JSON.stringify({ success: true, qrRawData: qr.qrRawData, qrImage: qr.qrImage ?? null, ref1, ref2 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify({ message: 'No action performed' }), { headers: corsHeaders });

  } catch (e: any) {
    console.error('[LOG] 🚨 เกิดข้อผิดพลาดร้ายแรง:', e.message);
    return new Response(JSON.stringify({ success: false, error: e.message }), { status: 500, headers: corsHeaders });
  }
});