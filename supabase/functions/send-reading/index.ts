import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'saenggi@saenggi.kr'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { orderId, email, name } = await req.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // 1. Resend API로 이메일 실제 발송
    let emailSuccess = false
    if (RESEND_API_KEY) {
      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `생기출판사 <${FROM_EMAIL}>`,
          to: [email],
          subject: `[생기출판사] ${name}님의 생기공명 리딩이 도착했습니다`,
          html: `
            <div style="font-family: 'Apple SD Gothic Neo', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #1a1a1a;">
              <h1 style="font-size: 24px; font-weight: 600; margin-bottom: 8px;">생기공명 리딩</h1>
              <p style="color: #888; font-size: 14px; margin-bottom: 32px;">나는 끝내 나를 살아냈다 — 생기출판사</p>

              <p style="font-size: 16px; line-height: 1.8; margin-bottom: 24px;">
                안녕하세요, <strong>${name}</strong>님.<br>
                예약해주신 생기공명 리딩을 발송해드립니다.
              </p>

              <div style="background: #fdf8f0; border-radius: 12px; padding: 24px; margin-bottom: 32px;">
                <p style="font-size: 14px; color: #666; margin: 0 0 12px;">
                  ✦ 리딩 내용은 별도 첨부 파일 또는 아래 내용을 확인해주세요.
                </p>
                <p style="font-size: 14px; color: #666; margin: 0;">
                  ✦ 북콘서트 일정은 30명 달성 후 별도 안내드립니다.
                </p>
              </div>

              <p style="font-size: 13px; color: #aaa; border-top: 1px solid #eee; padding-top: 24px; margin: 0;">
                생기출판사 | 문의: 카카오톡 채널 @생기출판사
              </p>
            </div>
          `,
        }),
      })
      emailSuccess = emailRes.ok
    }

    // 2. DB 상태 업데이트
    const { error } = await supabase.from('orders')
      .update({ reading_done: true, reading_sent_at: new Date().toISOString() })
      .eq('id', orderId)

    if (error) throw error

    // 3. 알림 로그
    await supabase.from('notifications').insert({
      type: 'reading',
      channel: 'email',
      success: emailSuccess,
      message: `리딩 발송: ${email} (${name}) — Resend ${emailSuccess ? '성공' : '실패/미설정'}`,
    })

    return new Response(JSON.stringify({ ok: true, emailSent: emailSuccess }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
