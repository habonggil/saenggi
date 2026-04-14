import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Success() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [status, setStatus] = useState('processing') // processing | done | error
  const [orderId, setOrderId] = useState('')

  useEffect(() => {
    confirmPayment()
  }, [])

  async function confirmPayment() {
    const paymentKey = params.get('paymentKey')
    const orderId = params.get('orderId')
    const amount = params.get('amount')

    if (!paymentKey || !orderId || !amount) {
      setStatus('error')
      return
    }

    setOrderId(orderId)
    const form = JSON.parse(sessionStorage.getItem('apply_form') || '{}')

    try {
      // Supabase Edge Function 호출
      const { data, error } = await supabase.functions.invoke('confirm-payment', {
        body: { paymentKey, orderId, amount: Number(amount), orderData: form }
      })

      if (error) throw error
      setStatus('done')
      sessionStorage.setItem('last_order_id', orderId)  // Verify 페이지에서 사용
      sessionStorage.removeItem('apply_form')
      sessionStorage.removeItem('order_id')
    } catch (e) {
      console.error('결제 확인 오류:', e)
      setStatus('error')
    }
  }

  if (status === 'processing') {
    return (
      <div className="min-h-screen bg-saenggi-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-saenggi-200 border-t-saenggi-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">예약을 확인하는 중...</p>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-saenggi-50 flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-6">⚠️</div>
          <h1 className="text-xl font-semibold text-gray-900 mb-3">결제 확인 중 오류가 발생했습니다</h1>
          <p className="text-gray-500 text-sm mb-8">결제는 완료되었을 수 있습니다. 카카오톡으로 문의해주세요.</p>
          <button onClick={() => navigate('/')} className="bg-saenggi-600 text-white px-8 py-3 rounded-xl">홈으로</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-saenggi-50 flex items-center justify-center px-6">
      <div className="text-center max-w-sm w-full">
        <div className="text-6xl mb-6">✦</div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-3">예약이 완료됐습니다</h1>
        <p className="text-gray-500 text-sm mb-2">입력하신 이메일로 확인 안내가 발송됩니다</p>
        <p className="text-xs text-gray-400 mb-8">주문번호: {orderId}</p>

        <div className="bg-white rounded-2xl border border-saenggi-100 p-5 mb-6 text-left space-y-3">
          <div className="flex gap-3">
            <span className="text-saenggi-500">✦</span>
            <p className="text-sm text-gray-700"><strong>생기공명 리딩</strong>은 이메일로 순차 발송됩니다</p>
          </div>
          <div className="flex gap-3">
            <span className="text-saenggi-500">✦</span>
            <p className="text-sm text-gray-700"><strong>북콘서트</strong>는 30명 달성 시 일정 안내 예정</p>
          </div>
          <div className="flex gap-3">
            <span className="text-saenggi-500">✦</span>
            <p className="text-sm text-gray-700"><strong>책 배송</strong>은 출간 후 일괄 진행</p>
          </div>
        </div>

        <button onClick={() => navigate('/verify')}
          className="w-full bg-saenggi-100 hover:bg-saenggi-200 text-saenggi-700 py-3 rounded-xl text-sm font-medium mb-3 transition-all">
          SNS 인증하고 혜택 받기 (선택)
        </button>
        <button onClick={() => navigate('/')}
          className="w-full text-gray-400 text-sm py-2">
          홈으로 돌아가기
        </button>
      </div>
    </div>
  )
}
