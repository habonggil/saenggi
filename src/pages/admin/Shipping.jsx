import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import AdminLayout from '../../components/AdminLayout'

export default function AdminShipping() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [trackingInputs, setTrackingInputs] = useState({})
  const [processing, setProcessing] = useState(null)

  useEffect(() => { fetchOrders() }, [])

  async function fetchOrders() {
    const { data } = await supabase.from('orders')
      .select('id, name, phone, address, address_detail, zipcode, city, tracking_number, status')
      .eq('status', 'paid')
      .order('created_at', { ascending: true })
    setOrders(data || [])
    setLoading(false)
  }

  async function sendTracking(order) {
    const trackingNumber = trackingInputs[order.id]
    if (!trackingNumber?.trim()) return
    setProcessing(order.id)

    const { error } = await supabase.functions.invoke('send-shipping', {
      body: { orderId: order.id, phone: order.phone, trackingNumber }
    })

    if (!error) {
      await supabase.from('orders').update({ tracking_number: trackingNumber, status: 'shipped' }).eq('id', order.id)
      fetchOrders()
    }
    setProcessing(null)
  }

  const unshipped = orders.filter(o => !o.tracking_number)
  const shipped = orders.filter(o => o.tracking_number)

  return (
    <AdminLayout>
      <h1 className="text-2xl font-semibold text-gray-900 mb-2">배송 관리</h1>
      <p className="text-sm text-gray-400 mb-6">배송 전 {unshipped.length}건 / 배송 중 {shipped.length}건</p>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-gray-50">
          <h2 className="font-medium text-gray-900">배송 입력</h2>
        </div>
        {loading ? (
          <div className="py-12 text-center text-gray-400 text-sm">로딩 중...</div>
        ) : unshipped.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">모두 발송 완료됐습니다 ✦</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {unshipped.map(order => (
              <div key={order.id} className="px-5 py-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{order.name}</p>
                    <p className="text-xs text-gray-400">{order.phone} · {order.city}</p>
                    <p className="text-xs text-gray-400">{order.address} {order.address_detail} ({order.zipcode})</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <input className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saenggi-300"
                    placeholder="운송장 번호 입력" value={trackingInputs[order.id] || ''}
                    onChange={e => setTrackingInputs(prev => ({ ...prev, [order.id]: e.target.value }))} />
                  <button onClick={() => sendTracking(order)} disabled={processing === order.id || !trackingInputs[order.id]?.trim()}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      processing === order.id ? 'bg-gray-100 text-gray-400' : 'bg-saenggi-600 hover:bg-saenggi-700 text-white'
                    }`}>
                    {processing === order.id ? '처리 중...' : 'SMS 발송'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {shipped.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50">
            <h2 className="font-medium text-gray-500">발송 완료</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {shipped.map(order => (
              <div key={order.id} className="px-5 py-3 flex justify-between items-center text-sm">
                <div>
                  <p className="text-gray-700">{order.name}</p>
                  <p className="text-xs text-gray-400">운송장: {order.tracking_number}</p>
                </div>
                <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">배송중</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
