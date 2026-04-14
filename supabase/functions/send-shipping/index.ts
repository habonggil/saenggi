import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    const { orderId, phone, trackingNumber } = await req.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // DB 업데이트
    await supabase.from('orders')
      .update({ tracking_number: trackingNumber, status: 'shipped' })
      .eq('id', orderId)

    // 솔라피 SMS 발송
    const cleanPhone = phone?.replace(/-/g, '')
    if (cleanPhone && SOLAPI_API_KEY) {
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
            to: cleanPhone,
            from: SOLAPI_SENDER,
            text: `[생기출판사] 책이 발송되었습니다!\n운송장: ${trackingNumber}\n(CJ대한통운 기준)\n감사합니다!`,
          }
        }),
      })
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
