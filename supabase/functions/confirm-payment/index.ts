import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const TOSS_SECRET_KEY = Deno.env.get('TOSS_SECRET_KEY')!
const SOLAPI_API_KEY = Deno.env.get('SOLAPI_API_KEY')!
const SOLAPI_API_SECRET = Deno.env.get('SOLAPI_API_SECRET')!
const SOLAPI_SENDER = Deno.env.get('SOLAPI_SENDER_NUMBER')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { paymentKey, orderId, amount, orderData } = await req.json()

    // 1. 토스 결제 승인
    const tossRes = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${btoa(TOSS_SECRET_KEY + ':')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ paymentKey, orderId, amount }),
    })

    const tossData = await tossRes.json()
    if (!tossRes.ok || tossData.status !== 'DONE') {
      throw new Error(tossData.message || '결제 승인 실패')
    }

    // 2. Supabase DB 저장
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { error: insertError } = await supabase.from('orders').insert({
      ...orderData,
      order_id: orderId,
      payment_key: paymentKey,
      amount,
      status: 'paid',
    })

    if (insertError) throw insertError

    // 3. 도시 카운트 업데이트 (트리거가 없을 경우 대비)
    await supabase.rpc('increment_city_count', { city_name: orderData.city }).maybeSingle()

    // 4. 솔라피 SMS 발송
    const phone = orderData.phone?.replace(/-/g, '')
    if (phone && SOLAPI_API_KEY) {
      const date = new Date().toISOString().replace(/[:-]/g, '').slice(0, 15) + 'Z'
      const salt = crypto.randomUUID()
      const hmacKey = await crypto.subtle.importKey('raw', new TextEncoder().encode(SOLAPI_API_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
      const sig = await crypto.subtle.sign('HMAC', hmacKey, new TextEncoder().encode(date + salt))
      const signature = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('')

      await fetch('https://api.solapi.com/messages/v4/send', {
        method: 'POST',
        headers: {
          Authorization: `HMAC-SHA256 apiKey=${SOLAPI_API_KEY}, date=${date}, salt=${salt}, signature=${signature}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: {
            to: phone,
            from: SOLAPI_SENDER,
            text: `[생기출판사] 예약이 확정되었습니다!\n주문번호: ${orderId.slice(-8)}\n희망도시: ${orderData.city}\n생기공명 리딩은 이메일로 발송됩니다. 감사합니다!`,
          }
        }),
      })
    }

    // 5. 알림 로그 기록
    await supabase.from('notifications').insert({
      order_id: null,
      type: 'payment',
      channel: 'sms',
      success: true,
      message: `결제완료 SMS: ${phone}`,
    })

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('confirm-payment error:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
