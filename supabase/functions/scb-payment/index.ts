import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SCB_BASE   = 'https://api-sandbox.partners.scb/partners/sandbox';
const APP_KEY    = 'l75998fa61fa4d46ffadac3aad12337a9a';
const APP_SECRET = 'f3e14d51eb714151b3175d2327385e3b';
const BILLER_ID  = '673842149947166';

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

// helper: หักสต็อกจาก orderItems
async function deductStock(supabase: any, orderItems: any[]) {
  for (const item of orderItems) {
    const targetId = item.id;
    if (targetId) {
      const { data: pData } = await supabase.from('products').select('stock').eq('id', targetId).single();
      if (pData) {
        const newStock = Math.max(0, pData.stock - (item.quantity || 1));
        await supabase.from('products').update({ stock: newStock }).eq('id', targetId);
        console.log(`[LOG] 📦 Stock product #${targetId} updated to: ${newStock}`);
      }
    }
  }
}

// helper: parse items field
function parseItems(raw: any): any[] {
  if (typeof raw === 'string') {
    try { return JSON.parse(raw); } catch (_) { return []; }
  }
  if (Array.isArray(raw)) return raw;
  return [];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const rawText = await req.text();
    console.log(`[LOG] 📥 Received:`, rawText);

    let body: any = {};
    if (rawText) {
      try { body = JSON.parse(rawText); }
      catch (e) { console.error('[LOG] ❌ Invalid JSON'); }
    }

    // ==========================================
    // 🚨 1. รับ WEBHOOK จาก SCB (จริง)
    // ==========================================
    if (body.billPaymentRef1 || body.transactionId) {
      const ref1 = body.billPaymentRef1;
      console.log(`[LOG] 🔍 Searching order for Ref1: ${ref1}`);

      const { data: pendingOrders } = await supabase
        .from('orders').select('id, status, items').eq('status', 'pending');

      if (pendingOrders) {
        const matchedOrder = pendingOrders.find((o: any) => {
          const expectedRef = String(o.id).replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 20);
          return expectedRef === ref1;
        });

        if (matchedOrder) {
          const { error: updateError } = await supabase
            .from('orders').update({ status: 'paid' }).eq('id', matchedOrder.id);

          if (!updateError) {
            console.log(`[LOG] ✅ Order ${matchedOrder.id} marked as paid`);
            await deductStock(supabase, parseItems(matchedOrder.items));
            return new Response(
              JSON.stringify({ resCode: '00', resDesc: 'success', transactionId: body.transactionId }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            );
          } else {
            console.error(`[LOG] ❌ DB Update Error:`, updateError);
          }
        } else {
          console.log(`[LOG] ⚠️ No matching order found for Ref1: ${ref1}`);
        }
      }

      return new Response(
        JSON.stringify({ resCode: '01', resDesc: 'Order not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // ==========================================
    // 🧪 2. Simulate Payment (SCB Sandbox ไม่ยิง webhook จริง)
    // ==========================================
    if (body.action === 'simulate_payment') {
      const { orderId } = body;
      if (!orderId) {
        return new Response(
          JSON.stringify({ success: false, error: 'orderId required' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      const { data: order, error: orderErr } = await supabase
        .from('orders').select('id, status, items').eq('id', orderId).single();

      if (orderErr || !order) {
        return new Response(
          JSON.stringify({ success: false, error: 'Order not found' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
        );
      }

      if (order.status === 'paid') {
        return new Response(
          JSON.stringify({ success: true, message: 'Already paid' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { error: updateError } = await supabase
        .from('orders').update({ status: 'paid' }).eq('id', orderId);

      if (updateError) {
        console.error(`[LOG] ❌ Simulate payment DB error:`, updateError);
        return new Response(
          JSON.stringify({ success: false, error: 'DB update failed' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      console.log(`[LOG] ✅ [SIMULATED] Order ${orderId} marked as paid`);
      await deductStock(supabase, parseItems(order.items));

      return new Response(
        JSON.stringify({ success: true, message: 'Payment simulated successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ==========================================
    // 🛒 3. สร้าง QR Code
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

    return new Response(
      JSON.stringify({ message: 'No action performed' }),
      { headers: corsHeaders }
    );

  } catch (e: any) {
    console.error('[LOG] 🚨 Fatal Error:', e.message);
    return new Response(
      JSON.stringify({ success: false, error: e.message }),
      { status: 500, headers: corsHeaders }
    );
  }
});
