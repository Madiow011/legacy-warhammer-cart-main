// Supabase Edge Function: scb-payment
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SCB_BASE    = 'https://api-sandbox.partners.scb/partners/sandbox';
const APP_KEY     = Deno.env.get('SCB_APP_KEY') ?? '	l75998fa61fa4d46ffadac3aad12337a9a';
const APP_SECRET  = Deno.env.get('SCB_APP_SECRET') ?? '';
const BILLER_ID   = Deno.env.get('SCB_BILLER_ID') ?? '010004531609931';

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
  const res = await fetch(`${SCB_BASE}/v1/payment/qrcode/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'requestUId': uid,
      'resourceOwnerId': APP_KEY,
    },
    body: JSON.stringify({
      qrType: 'PP',
      ppType: 'BILLERID',
      ppId: BILLER_ID,
      amount: String(amount.toFixed(2)),
      ref1,
      ref2,
      ref3: 'TOPLEGACY',
    }),
  });
  const text = await res.text();
  let data: any;
  try { data = JSON.parse(text); } catch { throw new Error('SCB QR parse error: ' + text); }
  if (!data?.data?.qrRawData) throw new Error('SCB QR failed: ' + JSON.stringify(data));
  return data.data;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  // ใช้ SUPABASE_SECRET_KEYS แทน SERVICE_ROLE_KEY (Supabase ใหม่)
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    ?? Deno.env.get('SUPABASE_SECRET_KEYS')
    ?? '';

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const body = await req.json();
    const { action, orderId, amount } = body;

    console.log('action:', action, 'orderId:', orderId, 'amount:', amount);
    console.log('APP_KEY set:', !!APP_KEY, 'APP_SECRET set:', !!APP_SECRET);

    if (action === 'create_qr') {
      if (!orderId || !amount) throw new Error('Missing orderId or amount');

      const token = await getToken();
      const ref1 = String(orderId).replace(/-/g, '').slice(0, 20);
      const ref2 = `TL${Date.now().toString().slice(-8)}`;
      const qr = await createQR(token, Number(amount), ref1, ref2);

      // อัปเดต order status เป็น pending
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
