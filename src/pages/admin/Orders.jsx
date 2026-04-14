import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import AdminLayout from '../../components/AdminLayout'

export default function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({ city: '', status: '', reading: '' })
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)

  useEffect(() => { fetchOrders() }, [filter])

  async function fetchOrders() {
    setLoading(true)
    let query = supabase.from('orders').select('*').order('created_at', { ascending: false })
    if (filter.city) query = query.eq('city', filter.city)
    if (filter.status) query = query.eq('status', filter.status)
    if (filter.reading === 'done') query = query.eq('reading_done', true)
    if (filter.reading === 'pending') query = query.eq('reading_done', false)
    const { data } = await query
    setOrders(data || [])
    setLoading(false)
  }

  const filtered = orders.filter(o =>
    !search || o.name?.includes(search) || o.phone?.includes(search) || o.order_id?.includes(search)
  )

  function downloadCSV() {
    const headers = ['주문번호', '이름', '연락처', '이메일', '도시', '주소', '생년월일', '시간', '성별', '결제일시', '상태', '리딩', '배송']
    const rows = filtered.map(o => [
      o.order_id, o.name, o.phone, o.email, o.city,
      `${o.address} ${o.address_detail}`, o.birth_date, o.birth_time, o.gender,
      o.created_at, o.status, o.reading_done ? '완료' : '미완료', o.tracking_number || ''
    ])
    const csv = [headers, ...rows].map(r => r.map(c => `"${c || ''}"`).join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `예약목록_${Date.now()}.csv`; a.click()
  }

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">주문 관리</h1>
        <button onClick={downloadCSV} className="bg-saenggi-100 text-saenggi-700 px-4 py-2 rounded-lg text-sm font-medium">
          엑셀 다운로드
        </button>
      </div>

      {/* 필터 */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saenggi-300 w-48"
          placeholder="이름/연락처/주문번호 검색" value={search} onChange={e => setSearch(e.target.value)} />
        <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm" value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}>
          <option value="">전체 상태</option>
          <option value="paid">결제완료</option>
          <option value="pending">미결제</option>
          <option value="shipped">배송중</option>
          <option value="cancelled">취소</option>
        </select>
        <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm" value={filter.reading} onChange={e => setFilter(f => ({ ...f, reading: e.target.value }))}>
          <option value="">전체 리딩</option>
          <option value="pending">미완료</option>
          <option value="done">완료</option>
        </select>
      </div>

      {/* 테이블 */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['주문번호', '이름', '연락처', '도시', '결제일시', '리딩', '배송', '인증'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-gray-500 font-medium text-xs whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={8} className="text-center py-12 text-gray-400">로딩 중...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-gray-400">주문이 없습니다</td></tr>
              ) : filtered.map(order => (
                <tr key={order.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelected(order)}>
                  <td className="px-4 py-3 text-gray-400 text-xs font-mono">{order.order_id?.slice(0, 12)}...</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{order.name}</td>
                  <td className="px-4 py-3 text-gray-600">{order.phone}</td>
                  <td className="px-4 py-3 text-gray-600">{order.city}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{order.created_at?.slice(0, 10)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${order.reading_done ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-600'}`}>
                      {order.reading_done ? '완료' : '미완료'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{order.tracking_number || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${order.sns_verified ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-400'}`}>
                      {order.sns_verified ? 'SNS✓' : '—'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 상세 모달 */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-6" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5">
              <h2 className="font-semibold text-gray-900">{selected.name} 상세</h2>
              <button onClick={() => setSelected(null)} className="text-gray-400">✕</button>
            </div>
            <div className="space-y-2 text-sm divide-y divide-gray-50">
              {[
                ['이메일', selected.email], ['카카오', selected.kakao_id],
                ['주소', `${selected.address} ${selected.address_detail}`],
                ['생년월일', selected.birth_date], ['시간', selected.birth_time], ['성별', selected.gender === 'male' ? '남성' : '여성'],
                ['금액', `${selected.amount?.toLocaleString()}원`], ['주문ID', selected.order_id],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between py-2">
                  <span className="text-gray-400">{label}</span>
                  <span className="text-gray-800 text-right max-w-[60%]">{value || '—'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
