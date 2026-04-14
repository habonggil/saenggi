import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadPaymentWidget } from '@tosspayments/payment-widget-sdk'
import { nanoid } from 'nanoid'

const CLIENT_KEY = import.meta.env.VITE_TOSS_CLIENT_KEY || 'test_ck_placeholder'

export default function Payment() {
  const navigate = useNavigate()
  const [form, setForm] = useState(null)
  const [ready, setReady] = useState(false)
  const [loading, setLoading] = useState(false)
  const widgetRef = useRef(null)
  const paymentMethodRef = useRef(null)
  const agreementRef = useRef(null)

  useEffect(() => {
    const saved = sessionStorage.getItem('apply_form')
    if (!saved) { navigate('/apply'); return }
    setForm(JSON.parse(saved))
  }, [])

  useEffect(() => {
    if (!form) return
    initWidget()
  }, [form])

  async function initWidget() {
    try {
      const widget = await loadPaymentWidget(CLIENT_KEY, nanoid())
      widgetRef.current = widget

      paymentMethodRef.current = await widget.renderPaymentMethods(
        '#payment-method',
        { value: 50000 },
        { variantKey: 'DEFAULT' }
      )
      agreementRef.current = await widget.renderAgreement('#agreement')
      setReady(true)
    } catch (e) {
      console.error('토스 위젯 초기화 실패:', e)
    }
  }

  async function handlePayment() {
    if (!ready || loading) return
    setLoading(true)
    const orderId = `saenggi_${nanoid()}`
    sessionStorage.setItem('order_id', orderId)

    try {
      await widgetRef.current.requestPayment({
        orderId,
        orderName: '나는 끝내 나를 살아냈다 — 한정판 예약',
        successUrl: `${window.location.origin}/success`,
        failUrl: `${window.location.origin}/fail`,
        customerName: form.name,
        customerEmail: form.email,
        customerMobilePhone: form.phone.replace(/-/g, ''),
      })
    } catch (e) {
      if (e.code !== 'USER_CANCEL') {
        console.error('결제 오류:', e)
      }
      setLoading(false)
    }
  }

  if (!form) return null

  return (
    <div className="min-h-screen bg-saenggi-50">
      <header className="bg-white border-b border-saenggi-200 py-4 px-6">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <button onClick={() => navigate('/apply')} className="text-gray-400 hover:text-gray-600">←</button>
          <p className="text-saenggi-600 text-sm font-medium">결제</p>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl border border-saenggi-100 p-5 mb-6">
          <p className="text-sm text-gray-500 mb-1">예약자</p>
          <p className="font-semibold text-gray-900">{form.name} · {form.phone}</p>
        </div>

        {/* 토스 결제 위젯 */}
        <div className="bg-white rounded-2xl border border-saenggi-100 overflow-hidden mb-4">
          <div id="payment-method" />
        </div>
        <div className="bg-white rounded-2xl border border-saenggi-100 overflow-hidden mb-6">
          <div id="agreement" />
        </div>

        <button
          onClick={handlePayment}
          disabled={!ready || loading}
          className={`w-full py-4 rounded-2xl font-semibold text-lg transition-all ${
            ready && !loading
              ? 'bg-saenggi-600 hover:bg-saenggi-700 text-white shadow-md'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {loading ? '결제 중...' : '50,000원 결제하기'}
        </button>
      </div>
    </div>
  )
}
