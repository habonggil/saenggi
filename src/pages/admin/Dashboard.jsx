import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import AdminLayout from '../../components/AdminLayout'

export default function AdminDashboard() {
  const [stats, setStats] = useState({ total: 0, paid: 0, remaining: 0, readingPending: 0 })
  const [cityStats, setCityStats] = useState([])
  const [recent, setRecent] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    const [ordersRes, citiesRes] = await Promise.all([
      supabase.from('orders').select('id, status, city, reading_done, created_at, name, phone').order('created_at', { ascending: false }),
      supabase.from('cities').select('*'),
    ])

    const orders = ordersRes.data || []
    const paid = orders.filter(o => o.status === 'paid')

    setStats({
      total: orders.length,
      paid: paid.length,
      remaining: 500 - paid.length,
      readingPending: paid.filter(o => !o.reading_done).length,
    })
    setCityStats(citiesRes.data || [])
    setRecent(orders.slice(0, 5))
    setLoading(false)
  }

  const statCards = [
    { label: '총 예약', value: stats.total, color: 'text-gray-900' },
    { label: '결제 완료', value: stats.paid, color: 'text-saenggi-700' },
    { label: '잔여 수량', value: stats.remaining, color: 'text-blue-600' },
    { label: '리딩 미완료', value: stats.readingPending, color: 'text-orange-600' },
  ]

  return (
    <AdminLayout>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">대시보드</h1>

      {/* 요약 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {statCards.map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-sm text-gray-400 mb-1">{label}</p>
            <p className={`text-3xl font-bold ${color}`}>{loading ? '—' : value}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* 도시별 현황 */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">도시별 예약 현황</h2>
          <div className="space-y-3">
            {cityStats.map(city => (
              <div key={city.city_name}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">{city.city_name}</span>
                  <span className="text-gray-500">{city.current_count || 0} / 30</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className={`h-2 rounded-full ${city.confirmed ? 'bg-saenggi-500' : 'bg-saenggi-300'}`}
                    style={{ width: `${Math.min(((city.current_count || 0) / 30) * 100, 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 최근 예약 */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">최근 예약</h2>
          <div className="space-y-3">
            {recent.map(order => (
              <div key={order.id} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-800">{order.name}</p>
                  <p className="text-xs text-gray-400">{order.city} · {order.phone?.slice(-4)}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  order.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {order.status === 'paid' ? '완료' : order.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
