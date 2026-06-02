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
    headers: {
      'Content-Type': 'application/json',
      'requestUId': uid,
      'resourceOwnerId': APP_KEY,
    },
    body: JSON.stringify({ applicationKey: APP_KEY, applicationSecret: APP_SECRET }),
  });
  const text = await res.text();
  let data: any;
  try { data = JSON.parse(text); } catch { throw new Error('SCB token parse error: ' + text); }
  if (!data?.data?.accessToken) throw new Error('SCB token failed: ' + JSON.stringify(data));
  return data.data.accessToken;
}

async function createQR(token: string, amount: number, ref1: string, ref2: string) {
  const uid = crypto.randomUUID();
  const safeRef1 = ref1.slice(0, 15);
  const safeRef2 = ref2.slice(0, 15);
  
  const payload = {
    qrType: 'PP',
    ppType: 'BILLERID',
    ppId: BILLER_ID,
    amount: String(amount.toFixed(2)),
    ref1: safeRef1,
    ref2: safeRef2,
    ref3: 'SCB'
  };

  const res = await fetch(`${SCB_BASE}/v1/payment/qrcode/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'requestUId': uid,
      'resourceOwnerId': APP_KEY,
      'accept-language': 'EN'
    },
    body: JSON.stringify(payload),
  });
  
  const text = await res.text();
  let data: any;
  try { data = JSON.parse(text); } catch { throw new Error('SCB QR parse error: ' + text); }
  if (!data?.data?.qrRawData) throw new Error('SCB QR failed: ' + JSON.stringify(data));
  return data.data;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    ?? Deno.env.get('SUPABASE_SECRET_KEYS')
    ?? '';

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const body = await req.json();

    // ==========================================
    // 🚨 ส่วนที่เพิ่มใหม่: รับ Webhook จาก SCB
    // เมื่อลูกค้าสแกนจ่ายสำเร็จ SCB จะยิงข้อมูลมาที่นี่
    // ==========================================
    if (body.billPaymentRef1 || body.transactionId) {
      console.log('📢 SCB Webhook Received:', body);
      const ref1 = body.billPaymentRef1;
      
      // ค้นหาออเดอร์ที่สถานะยังเป็น pending เพื่อเทียบ ref1 (เพราะเราตัด UUID เหลือ 15 ตัวตอนสร้าง)
      const { data: pendingOrders } = await supabase.from('orders').select('id').eq('status', 'pending');
      
      if (pendingOrders) {
        const matchedOrder = pendingOrders.find(o => {
          const expectedRef = String(o.id).replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 15);
          return expectedRef === ref1;
        });
        
        if (matchedOrder) {
          // อัปเดตสถานะเป็น paid
          await supabase.from('orders').update({ status: 'paid' }).eq('id', matchedOrder.id);
          console.log('✅ Order marked as paid:', matchedOrder.id);
          
          // ตอบกลับ SCB ให้รู้ว่าเรารับข้อมูลสำเร็จแล้ว
          return new Response(JSON.stringify({ resCode: '00', resDesc: 'success' }), { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          });
        }
      }
      return new Response(JSON.stringify({ resCode: '01', resDesc: 'Order not found' }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 
      });
    }
    // ==========================================

    const { action, orderId, amount } = body;

    if (action === 'create_qr') {
      if (!orderId || !amount) throw new Error('Missing orderId or amount');
      const token = await getToken();
      const ref1 = String(orderId).replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      const ref2 = `TL${Date.now().toString().slice(-8)}`.toUpperCase();
      
      const qr = await createQR(token, Number(amount), ref1, ref2);
      await supabase.from('orders').update({ status: 'pending' }).eq('id', orderId);

      return new Response(
        JSON.stringify({ success: true, qrRawData: qr.qrRawData, qrImage: qr.qrImage ?? null, ref1, ref2 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'check_status') {
      const { transactionId } = body;
      if (!transactionId) throw new Error('Missing transactionId');
      const token = await getToken();
      const res = await fetch(
        `${SCB_BASE}/v1/payment/billpayment/inquiry?transactionId=${transactionId}&sendingBank=014`,
        { headers: { 'Authorization': `Bearer ${token}`, 'requestUId': crypto.randomUUID(), 'resourceOwnerId': APP_KEY } }
      );
      const result = await res.json();
      const isPaid = result?.data?.transactionStatus === 'SUCCESS';
      if (isPaid && orderId) await supabase.from('orders').update({ status: 'paid' }).eq('id', orderId);
      return new Response(JSON.stringify({ success: true, isPaid }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    throw new Error('Unknown action: ' + action);

  } catch (e: any) {
    console.error('Edge function error:', e.message);
    return new Response(
      JSON.stringify({ success: false, error: e.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});