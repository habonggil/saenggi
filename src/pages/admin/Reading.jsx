import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import AdminLayout from '../../components/AdminLayout'

export default function AdminReading() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(null)

  useEffect(() => { fetchOrders() }, [])

  async function fetchOrders() {
    const { data } = await supabase.from('orders')
      .select('id, name, email, birth_date, birth_time, gender, city, reading_done, reading_sent_at')
      .eq('status', 'paid')
      .order('reading_done', { ascending: true })
      .order('created_at', { ascending: true })
    setOrders(data || [])
    setLoading(false)
  }

  async function markReadingDone(order) {
    setProcessing(order.id)
    const { error } = await supabase.functions.invoke('send-reading', {
      body: { orderId: order.id, email: order.email, name: order.name }
    })
    if (!error) {
      await supabase.from('orders').update({ reading_done: true, reading_sent_at: new Date().toISOString() }).eq('id', order.id)
      fetchOrders()
    }
    setProcessing(null)
  }

  const pending = orders.filter(o => !o.reading_done)
  const done = orders.filter(o => o.reading_done)

  return (
    <AdminLayout>
      <h1 className="text-2xl font-semibold text-gray-900 mb-2">리딩 관리</h1>
      <p className="text-sm text-gray-400 mb-6">미완료 {pending.length}건 / 완료 {done.length}건</p>

      {/* 미완료 */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-gray-50">
          <h2 className="font-medium text-gray-900">리딩 미완료</h2>
        </div>
        {loading ? (
          <div className="py-12 text-center text-gray-400 text-sm">로딩 중...</div>
        ) : pending.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">모두 완료됐습니다 ✦</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {pending.map(order => (
              <div key={order.id} className="px-5 py-4 flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-900 text-sm">{order.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {order.birth_date} · {order.birth_time} · {order.gender === 'male' ? '남' : '여'} · {order.city}
                  </p>
                  <p className="text-xs text-gray-400">{order.email}</p>
                </div>
                <button onClick={() => markReadingDone(order)} disabled={processing === order.id}
                  className={`text-sm px-4 py-2 rounded-lg transition-all ${
                    processing === order.id ? 'bg-gray-100 text-gray-400' : 'bg-saenggi-100 hover:bg-saenggi-200 text-saenggi-700'
                  }`}>
                  {processing === order.id ? '처리 중...' : '리딩 완료 처리'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 완료 */}
      {done.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50">
            <h2 className="font-medium text-gray-500">완료 목록</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {done.map(order => (
              <div key={order.id} className="px-5 py-3 flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600">{order.name}</p>
                  <p className="text-xs text-gray-400">{order.reading_sent_at?.slice(0, 10)} 발송</p>
                </div>
                <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">완료</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
