import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const CITIES = [
  '서울', '부산', '대구', '인천', '광주',
  '대전', '울산', '수원', '청주', '전주'
]

const BIRTH_TIMES = [
  { value: '모름', label: '모름' },
  { value: '자시(23-01)', label: '자시 (23:00 ~ 01:00)' },
  { value: '축시(01-03)', label: '축시 (01:00 ~ 03:00)' },
  { value: '인시(03-05)', label: '인시 (03:00 ~ 05:00)' },
  { value: '묘시(05-07)', label: '묘시 (05:00 ~ 07:00)' },
  { value: '진시(07-09)', label: '진시 (07:00 ~ 09:00)' },
  { value: '사시(09-11)', label: '사시 (09:00 ~ 11:00)' },
  { value: '오시(11-13)', label: '오시 (11:00 ~ 13:00)' },
  { value: '미시(13-15)', label: '미시 (13:00 ~ 15:00)' },
  { value: '신시(15-17)', label: '신시 (15:00 ~ 17:00)' },
  { value: '유시(17-19)', label: '유시 (17:00 ~ 19:00)' },
  { value: '술시(19-21)', label: '술시 (19:00 ~ 21:00)' },
  { value: '해시(21-23)', label: '해시 (21:00 ~ 23:00)' },
]

const INITIAL_FORM = {
  name: '', phone: '', email: '', kakao_id: '',
  address: '', address_detail: '', zipcode: '',
  birth_date: '', birth_time: '모름', gender: '',
  city: '',
}

export default function Apply() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState(INITIAL_FORM)
  const [cityStats, setCityStats] = useState({})
  const [errors, setErrors] = useState({})

  useEffect(() => { fetchCityStats() }, [])

  async function fetchCityStats() {
    const { data } = await supabase.from('cities').select('city_name, current_count, confirmed')
    if (data) {
      const map = {}
      data.forEach(c => { map[c.city_name] = { count: c.current_count, full: c.current_count >= 30, confirmed: c.confirmed } })
      setCityStats(map)
    }
  }

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  function validateStep(s) {
    const e = {}
    if (s === 1) {
      if (!form.name.trim()) e.name = '이름을 입력해주세요'
      if (!/^01[0-9]{8,9}$/.test(form.phone.replace(/-/g, ''))) e.phone = '올바른 연락처를 입력해주세요'
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = '올바른 이메일을 입력해주세요'
      if (!form.kakao_id.trim()) e.kakao_id = '카카오톡 ID를 입력해주세요'
    }
    if (s === 2) {
      if (!form.address.trim()) e.address = '주소를 입력해주세요'
      if (!form.address_detail.trim()) e.address_detail = '상세주소를 입력해주세요'
    }
    if (s === 3) {
      if (!form.birth_date) e.birth_date = '생년월일을 입력해주세요'
      if (!form.gender) e.gender = '성별을 선택해주세요'
    }
    if (s === 4) {
      if (!form.city) e.city = '희망 도시를 선택해주세요'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function nextStep() {
    if (validateStep(step)) setStep(s => s + 1)
  }

  function goToPayment() {
    if (!validateStep(4)) return
    // 폼 데이터를 sessionStorage에 저장 후 결제 페이지로
    sessionStorage.setItem('apply_form', JSON.stringify(form))
    navigate('/payment')
  }

  const inputClass = (field) =>
    `w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-saenggi-400 ${
      errors[field] ? 'border-red-400' : 'border-gray-200'
    }`

  return (
    <div className="min-h-screen bg-saenggi-50">
      <header className="bg-white border-b border-saenggi-200 py-4 px-6">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <button onClick={() => step > 1 ? setStep(s => s - 1) : navigate('/')} className="text-gray-400 hover:text-gray-600">
            ←
          </button>
          <p className="text-saenggi-600 text-sm font-medium">예약 신청</p>
        </div>
      </header>

      {/* 스텝 인디케이터 */}
      <div className="max-w-2xl mx-auto px-6 pt-6">
        <div className="flex gap-2 mb-8">
          {[1,2,3,4,5].map(n => (
            <div key={n} className={`flex-1 h-1.5 rounded-full transition-all ${
              n <= step ? 'bg-saenggi-500' : 'bg-saenggi-100'
            }`} />
          ))}
        </div>

        {/* Step 1: 기본 정보 */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">기본 정보</h2>
            <div>
              <label className="text-sm text-gray-600 mb-1.5 block">이름 *</label>
              <input className={inputClass('name')} placeholder="홍길동" value={form.name} onChange={e => update('name', e.target.value)} />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-1.5 block">연락처 *</label>
              <input className={inputClass('phone')} placeholder="01012345678" value={form.phone} onChange={e => update('phone', e.target.value)} />
              {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-1.5 block">이메일 *</label>
              <input className={inputClass('email')} type="email" placeholder="example@email.com" value={form.email} onChange={e => update('email', e.target.value)} />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-1.5 block">카카오톡 ID *</label>
              <input className={inputClass('kakao_id')} placeholder="kakao_id" value={form.kakao_id} onChange={e => update('kakao_id', e.target.value)} />
              {errors.kakao_id && <p className="text-red-500 text-xs mt-1">{errors.kakao_id}</p>}
            </div>
          </div>
        )}

        {/* Step 2: 배송 주소 */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">배송 주소</h2>
            <div>
              <label className="text-sm text-gray-600 mb-1.5 block">주소 *</label>
              <div className="flex gap-2">
                <input className={inputClass('address') + ' flex-1'} placeholder="주소 검색 버튼을 눌러주세요" value={form.address} readOnly />
                <button type="button"
                  onClick={() => {
                    new window.daum.Postcode({
                      oncomplete(data) {
                        update('address', data.roadAddress || data.jibunAddress)
                        update('zipcode', data.zonecode)
                      }
                    }).open()
                  }}
                  className="bg-saenggi-100 hover:bg-saenggi-200 text-saenggi-700 px-4 py-3 rounded-xl text-sm font-medium whitespace-nowrap transition-all">
                  주소 검색
                </button>
              </div>
              {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-1.5 block">상세주소 *</label>
              <input className={inputClass('address_detail')} placeholder="동/호수 등" value={form.address_detail} onChange={e => update('address_detail', e.target.value)} />
              {errors.address_detail && <p className="text-red-500 text-xs mt-1">{errors.address_detail}</p>}
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-1.5 block">우편번호</label>
              <input className={inputClass('zipcode')} placeholder="자동 입력" value={form.zipcode} readOnly />
            </div>
          </div>
        )}

        {/* Step 3: 사주 정보 */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">사주 정보</h2>
            <p className="text-sm text-gray-500 mb-6">생기공명 리딩에 사용됩니다</p>
            <div>
              <label className="text-sm text-gray-600 mb-1.5 block">생년월일 *</label>
              <input className={inputClass('birth_date')} type="date" value={form.birth_date} onChange={e => update('birth_date', e.target.value)} />
              {errors.birth_date && <p className="text-red-500 text-xs mt-1">{errors.birth_date}</p>}
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-1.5 block">태어난 시간</label>
              <select className={inputClass('birth_time')} value={form.birth_time} onChange={e => update('birth_time', e.target.value)}>
                {BIRTH_TIMES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-1.5 block">성별 *</label>
              <div className="flex gap-3">
                {['male', 'female'].map(g => (
                  <button key={g} onClick={() => update('gender', g)}
                    className={`flex-1 py-3 rounded-xl border text-sm transition-all ${
                      form.gender === g ? 'border-saenggi-500 bg-saenggi-50 text-saenggi-700 font-medium' : 'border-gray-200 text-gray-600'
                    }`}>
                    {g === 'male' ? '남성' : '여성'}
                  </button>
                ))}
              </div>
              {errors.gender && <p className="text-red-500 text-xs mt-1">{errors.gender}</p>}
            </div>
          </div>
        )}

        {/* Step 4: 도시 선택 */}
        {step === 4 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">북콘서트 희망 도시</h2>
            <p className="text-sm text-gray-500 mb-6">30명 달성 시 콘서트가 확정됩니다</p>
            <div className="grid grid-cols-2 gap-3">
              {CITIES.map(city => {
                const stat = cityStats[city] || { count: 0, full: false }
                return (
                  <button key={city} onClick={() => !stat.full && update('city', city)}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      stat.full ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed' :
                      form.city === city ? 'border-saenggi-500 bg-saenggi-50' : 'border-gray-200 bg-white hover:border-saenggi-300'
                    }`}>
                    <p className="font-medium text-gray-800">{city}</p>
                    <p className="text-xs text-gray-400 mt-1">{stat.count || 0} / 30명</p>
                    {stat.full && <p className="text-xs text-gray-400">마감</p>}
                  </button>
                )
              })}
            </div>
            {errors.city && <p className="text-red-500 text-xs mt-3">{errors.city}</p>}
          </div>
        )}

        {/* Step 5: 최종 확인 */}
        {step === 5 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">예약 확인</h2>
            <div className="bg-white rounded-2xl border border-saenggi-100 divide-y divide-gray-50">
              {[
                ['이름', form.name],
                ['연락처', form.phone],
                ['이메일', form.email],
                ['카카오톡 ID', form.kakao_id],
                ['배송주소', `${form.address} ${form.address_detail}`],
                ['생년월일', form.birth_date],
                ['태어난 시간', form.birth_time],
                ['성별', form.gender === 'male' ? '남성' : '여성'],
                ['희망 도시', form.city],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between px-5 py-3.5 text-sm">
                  <span className="text-gray-500">{label}</span>
                  <span className="text-gray-900 font-medium text-right max-w-[60%]">{value}</span>
                </div>
              ))}
            </div>
            <div className="bg-saenggi-50 rounded-2xl border border-saenggi-200 p-5 mt-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-700 font-medium">결제 금액</span>
                <span className="text-2xl font-bold text-saenggi-700">50,000원</span>
              </div>
            </div>
          </div>
        )}

        {/* 버튼 */}
        <div className="mt-8 pb-10">
          {step < 5 ? (
            <button onClick={nextStep}
              className="w-full bg-saenggi-600 hover:bg-saenggi-700 text-white py-4 rounded-2xl font-semibold text-lg transition-all">
              다음
            </button>
          ) : (
            <button onClick={goToPayment}
              className="w-full bg-saenggi-600 hover:bg-saenggi-700 text-white py-4 rounded-2xl font-semibold text-lg transition-all">
              결제하기 (50,000원)
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
