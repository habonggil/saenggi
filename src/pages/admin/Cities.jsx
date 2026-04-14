import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import AdminLayout from '../../components/AdminLayout'

const CITIES = ['서울', '부산', '대구', '인천', '광주', '대전', '울산', '수원', '청주', '전주']

export default function AdminCities() {
  const [cities, setCities] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(null)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    const [citiesRes, ordersRes] = await Promise.all([
      supabase.from('cities').select('*'),
      supabase.from('orders').select('city').eq('status', 'paid'),
    ])
    setCities(citiesRes.data || [])
    setOrders(ordersRes.data || [])
    setLoading(false)
  }

  async function toggleConfirm(city) {
    setProcessing(city.city_name)
    const isConfirm = !city.confirmed
    await supabase.from('cities').update({
      confirmed: isConfirm,
      confirmed_at: isConfirm ? new Date().toISOString() : null,
    }).eq('city_name', city.city_name)

    if (isConfirm) {
      // 해당 도시 예약자 전체 SMS 발송
      await supabase.functions.invoke('check-city', {
        body: { cityName: city.city_name }
      })
    }
    fetchAll()
    setProcessing(null)
  }

  function getCityCount(cityName) {
    return orders.filter(o => o.city === cityName).length
  }

  return (
    <AdminLayout>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">도시 관리</h1>

      <div className="grid md:grid-cols-2 gap-4">
        {CITIES.map(cityName => {
          const city = cities.find(c => c.city_name === cityName) || { city_name: cityName, confirmed: false, current_count: 0 }
          const count = getCityCount(cityName)
          const isFull = count >= 30
          return (
            <div key={cityName} className={`bg-white rounded-2xl border p-5 ${city.confirmed ? 'border-saenggi-300' : 'border-gray-100'}`}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="font-semibold text-gray-900">{cityName}</h2>
                  <p className="text-sm text-gray-400 mt-0.5">{count} / 30명</p>
                </div>
                <div className="flex gap-2 items-center">
                  {city.confirmed && (
                    <span className="text-xs bg-saenggi-100 text-saenggi-700 px-2 py-0.5 rounded-full">확정</span>
                  )}
                  {isFull && !city.confirmed && (
                    <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">30명 달성</span>
                  )}
                </div>
              </div>

              <div className="w-full bg-gray-100 rounded-full h-2.5 mb-4">
                <div className={`h-2.5 rounded-full transition-all ${city.confirmed ? 'bg-saenggi-500' : isFull ? 'bg-orange-400' : 'bg-saenggi-300'}`}
                  style={{ width: `${Math.min((count / 30) * 100, 100)}%` }} />
              </div>

              <button onClick={() => toggleConfirm(city)} disabled={processing === cityName}
                className={`w-full py-2.5 rounded-xl text-sm font-medium transition-all ${
                  processing === cityName ? 'bg-gray-100 text-gray-400' :
                  city.confirmed ? 'bg-red-50 hover:bg-red-100 text-red-600' : 'bg-saenggi-100 hover:bg-saenggi-200 text-saenggi-700'
                }`}>
                {processing === cityName ? '처리 중...' : city.confirmed ? '확정 취소' : '콘서트 확정 + SMS 발송'}
              </button>

              {city.confirmed_at && (
                <p className="text-xs text-gray-400 text-center mt-2">확정일: {city.confirmed_at?.slice(0, 10)}</p>
              )}
            </div>
          )
        })}
      </div>
    </AdminLayout>
  )
}
