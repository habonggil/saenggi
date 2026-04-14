import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Verify() {
  const navigate = useNavigate()

  // sessionStorage에 저장된 주문번호 우선 사용
  const storedOrderId = sessionStorage.getItem('last_order_id') || ''

  const [orderId, setOrderId] = useState(storedOrderId)
  const [orderConfirmed, setOrderConfirmed] = useState(!!storedOrderId)
  const [orderError, setOrderError] = useState('')
  const [snsFile, setSnsFile] = useState(null)
  const [bookstoreFile, setBookstoreFile] = useState(null)
  const [snsLink, setSnsLink] = useState('')
  const [uploading, setUploading] = useState(false)
  const [done, setDone] = useState(false)

  async function confirmOrder() {
    if (!orderId.trim()) {
      setOrderError('주문번호를 입력해주세요')
      return
    }
    setOrderError('')
    // orders 테이블에서 해당 order_id 존재 여부 확인
    const { data, error } = await supabase
      .from('orders')
      .select('id, name')
      .eq('order_id', orderId.trim())
      .single()

    if (error || !data) {
      setOrderError('주문번호를 찾을 수 없습니다. 결제 완료 후 받으신 주문번호를 입력해주세요.')
      return
    }
    setOrderConfirmed(true)
  }

  async function handleUpload() {
    if (!snsFile && !bookstoreFile) return
    setUploading(true)

    const id = orderId.trim()

    try {
      let snsUrl = null
      let bookstoreUrl = null

      if (snsFile) {
        const ext = snsFile.name.split('.').pop()
        const path = `sns/${id}_${Date.now()}.${ext}`
        const { data } = await supabase.storage.from('verifications').upload(path, snsFile)
        if (data) {
          const { data: { publicUrl } } = supabase.storage.from('verifications').getPublicUrl(path)
          snsUrl = publicUrl
        }
      }

      if (bookstoreFile) {
        const ext = bookstoreFile.name.split('.').pop()
        const path = `bookstore/${id}_${Date.now()}.${ext}`
        const { data } = await supabase.storage.from('verifications').upload(path, bookstoreFile)
        if (data) {
          const { data: { publicUrl } } = supabase.storage.from('verifications').getPublicUrl(path)
          bookstoreUrl = publicUrl
        }
      }

      const updates = {}
      if (snsUrl) { updates.sns_image_url = snsUrl; updates.sns_verified = false }
      if (bookstoreUrl) { updates.bookstore_image_url = bookstoreUrl; updates.bookstore_verified = false }

      await supabase.from('orders').update(updates).eq('order_id', id)
      setDone(true)
    } catch (e) {
      console.error('업로드 오류:', e)
    }
    setUploading(false)
  }

  if (done) {
    return (
      <div className="min-h-screen bg-saenggi-50 flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-6">✦</div>
          <h1 className="text-xl font-semibold text-gray-900 mb-3">인증 제출 완료</h1>
          <p className="text-sm text-gray-500 mb-8">확인 후 혜택이 적용됩니다</p>
          <button onClick={() => navigate('/')} className="bg-saenggi-600 text-white px-8 py-3 rounded-xl">홈으로</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-saenggi-50">
      <header className="bg-white border-b border-saenggi-200 py-4 px-6">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <button onClick={() => navigate('/')} className="text-gray-400 hover:text-gray-600">←</button>
          <p className="text-saenggi-600 text-sm font-medium">SNS · 서점 인증</p>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">인증으로 혜택 받기</h2>
          <p className="text-sm text-gray-500">SNS 인증 또는 서점 사전예약 인증 시<br />생기공명 리딩 우선 발송 · VIP 북콘서트석 혜택</p>
        </div>

        {/* 주문번호 입력 (sessionStorage에 없을 때) */}
        {!orderConfirmed ? (
          <div className="bg-white rounded-2xl border border-saenggi-100 p-5">
            <h3 className="font-medium text-gray-900 mb-1">주문번호 확인</h3>
            <p className="text-xs text-gray-400 mb-4">결제 완료 후 받으신 주문번호를 입력해주세요</p>
            <input
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-saenggi-400"
              placeholder="예) saenggi_1744123456789"
              value={orderId}
              onChange={e => setOrderId(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && confirmOrder()}
            />
            {orderError && <p className="text-xs text-red-500 mt-2">{orderError}</p>}
            <button
              onClick={confirmOrder}
              className="mt-3 w-full bg-saenggi-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-saenggi-700 transition"
            >
              확인
            </button>
          </div>
        ) : (
          <>
            <div className="bg-saenggi-50 border border-saenggi-200 rounded-xl px-4 py-2.5 flex items-center justify-between">
              <span className="text-xs text-saenggi-700">주문번호: <span className="font-mono font-medium">{orderId}</span></span>
              <button onClick={() => { setOrderConfirmed(false); setSnsFile(null); setBookstoreFile(null) }}
                className="text-xs text-gray-400 hover:text-gray-600">변경</button>
            </div>

            {/* SNS 셀카 인증 */}
            <div className="bg-white rounded-2xl border border-saenggi-100 p-5">
              <h3 className="font-medium text-gray-900 mb-1">SNS 셀카 인증</h3>
              <p className="text-xs text-gray-400 mb-4">책/굿즈와 함께 찍은 사진을 SNS에 올리고 이미지 업로드</p>
              <input type="file" accept="image/jpeg,image/png,image/heic"
                onChange={e => setSnsFile(e.target.files[0])}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-saenggi-100 file:text-saenggi-700 file:text-sm" />
              {snsFile && <p className="text-xs text-saenggi-600 mt-2">✓ {snsFile.name}</p>}
              <input className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm mt-3 focus:outline-none focus:ring-2 focus:ring-saenggi-400"
                placeholder="SNS 게시물 링크 (선택)" value={snsLink} onChange={e => setSnsLink(e.target.value)} />
            </div>

            {/* 서점 예약 인증 */}
            <div className="bg-white rounded-2xl border border-saenggi-100 p-5">
              <h3 className="font-medium text-gray-900 mb-1">서점 사전예약 인증</h3>
              <p className="text-xs text-gray-400 mb-4">서점 예약 확인 캡처 이미지 업로드</p>
              <input type="file" accept="image/jpeg,image/png,image/heic"
                onChange={e => setBookstoreFile(e.target.files[0])}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-saenggi-100 file:text-saenggi-700 file:text-sm" />
              {bookstoreFile && <p className="text-xs text-saenggi-600 mt-2">✓ {bookstoreFile.name}</p>}
            </div>

            <button onClick={handleUpload} disabled={uploading || (!snsFile && !bookstoreFile)}
              className={`w-full py-4 rounded-2xl font-semibold text-lg transition-all ${
                !uploading && (snsFile || bookstoreFile)
                  ? 'bg-saenggi-600 hover:bg-saenggi-700 text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}>
              {uploading ? '업로드 중...' : '인증 제출하기'}
            </button>
          </>
        )}

        <button onClick={() => navigate('/')} className="w-full text-gray-400 text-sm py-2">
          나중에 하기
        </button>
      </div>
    </div>
  )
}
