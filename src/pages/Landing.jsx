import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const TOTAL_LIMIT = 500
const CITIES = [
  '서울', '부산', '대구', '인천', '광주',
  '대전', '울산', '수원', '청주', '전주'
]

export default function Landing() {
  const navigate = useNavigate()
  const [cityStats, setCityStats] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  async function fetchStats() {
    const { data: orders } = await supabase
      .from('orders')
      .select('city')
      .eq('status', 'paid')

    const { data: cities } = await supabase
      .from('cities')
      .select('*')

    if (orders) setTotalCount(orders.length)
    if (cities) setCityStats(cities)
    setLoading(false)
  }

  const remaining = TOTAL_LIMIT - totalCount
  const isSoldOut = remaining <= 0

  return (
    <div className="min-h-screen bg-saenggi-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-saenggi-200 py-4 px-6 text-center">
        <p className="text-saenggi-600 text-sm font-medium tracking-widest">생기출판사</p>
      </header>

      {/* 히어로 */}
      <section className="max-w-2xl mx-auto px-6 py-16 text-center">
        <p className="text-saenggi-600 text-sm tracking-widest mb-4">한정판 예약</p>
        <h1 className="font-serif text-4xl md:text-5xl font-semibold text-gray-900 leading-tight mb-6">
          나는 끝내<br />나를 살아냈다
        </h1>
        <p className="text-gray-600 text-lg mb-2">하봉길 지음</p>
        <p className="text-saenggi-600 font-medium mb-10">
          천일수련 1,171일의 기록 — 2026년 출간
        </p>

        {/* 수량 현황 */}
        <div className="bg-white rounded-2xl shadow-sm border border-saenggi-100 p-6 mb-8">
          <div className="flex justify-between items-center mb-3">
            <span className="text-gray-600 text-sm">예약 현황</span>
            <span className="text-saenggi-700 font-bold text-lg">
              {loading ? '—' : `${totalCount} / ${TOTAL_LIMIT}`}
            </span>
          </div>
          <div className="w-full bg-saenggi-100 rounded-full h-3 mb-3">
            <div
              className="bg-saenggi-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${Math.min((totalCount / TOTAL_LIMIT) * 100, 100)}%` }}
            />
          </div>
          <p className="text-sm text-gray-500">
            {isSoldOut
              ? '예약이 마감되었습니다'
              : `잔여 ${remaining}부 — 선착순 한정`}
          </p>
        </div>

        {/* 패키지 안내 */}
        <div className="bg-white rounded-2xl shadow-sm border border-saenggi-100 p-6 mb-8 text-left">
          <h2 className="font-semibold text-gray-900 mb-4">한정판 패키지 구성</h2>
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start gap-3">
              <span className="text-saenggi-500 mt-0.5">✦</span>
              <span><strong>『나는 끝내 나를 살아냈다』</strong> 정식 출판본</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-saenggi-500 mt-0.5">✦</span>
              <span><strong>생기공명 사주 리딩</strong> — 개인 맞춤 이메일 발송</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-saenggi-500 mt-0.5">✦</span>
              <span><strong>북콘서트 초대</strong> — 희망 도시 선택 (30명 확정 시 개최)</span>
            </li>
          </ul>
          <div className="mt-5 pt-5 border-t border-saenggi-100 flex justify-between items-center">
            <span className="text-gray-500 text-sm">예약 가격</span>
            <span className="text-2xl font-bold text-saenggi-700">50,000원</span>
          </div>
        </div>

        {/* 예약 버튼 */}
        <button
          onClick={() => navigate('/apply')}
          disabled={isSoldOut}
          className={`w-full py-4 rounded-2xl text-lg font-semibold transition-all ${
            isSoldOut
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-saenggi-600 hover:bg-saenggi-700 text-white shadow-md hover:shadow-lg'
          }`}
        >
          {isSoldOut ? '예약 마감' : '지금 예약하기'}
        </button>
        <p className="text-xs text-gray-400 mt-3">결제 후 취소 불가 · 책 출간 후 일괄 배송</p>

        {/* 인증 링크 */}
        <div className="mt-5 text-center">
          <button
            onClick={() => navigate('/verify')}
            className="text-sm text-saenggi-600 underline underline-offset-2 hover:text-saenggi-800"
          >
            SNS 인증 · 서점 사전예약 인증하기
          </button>
        </div>
      </section>

      {/* 도시별 현황 */}
      <section className="max-w-2xl mx-auto px-6 pb-16">
        <h2 className="font-semibold text-gray-900 mb-4 text-center">북콘서트 도시별 현황</h2>
        <div className="grid grid-cols-2 gap-3">
          {loading
            ? CITIES.map(city => (
                <div key={city} className="bg-white rounded-xl p-4 border border-saenggi-100 animate-pulse">
                  <div className="h-4 bg-saenggi-100 rounded mb-2" />
                  <div className="h-3 bg-saenggi-50 rounded w-2/3" />
                </div>
              ))
            : CITIES.map(city => {
                const stat = cityStats.find(c => c.city_name === city)
                const count = stat?.current_count || 0
                const confirmed = stat?.confirmed || false
                const full = count >= 30
                return (
                  <div key={city} className="bg-white rounded-xl p-4 border border-saenggi-100">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-gray-800">{city}</span>
                      {confirmed && (
                        <span className="text-xs bg-saenggi-100 text-saenggi-700 px-2 py-0.5 rounded-full">확정</span>
                      )}
                      {full && !confirmed && (
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">마감</span>
                      )}
                    </div>
                    <div className="w-full bg-saenggi-50 rounded-full h-2 mb-1">
                      <div
                        className={`h-2 rounded-full ${confirmed ? 'bg-saenggi-500' : 'bg-saenggi-300'}`}
                        style={{ width: `${Math.min((count / 30) * 100, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400">{count} / 30명</p>
                  </div>
                )
              })}
        </div>
      </section>

      {/* 푸터 */}
      <footer className="bg-white border-t border-saenggi-100 py-8 text-center text-sm text-gray-400">
        <p>생기출판사 | 대표: 하모세</p>
        <p className="mt-1">문의: 카카오톡 채널 @생기출판사</p>
      </footer>
    </div>
  )
}
