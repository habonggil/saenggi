import { useNavigate, useSearchParams } from 'react-router-dom'

export default function Fail() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const message = params.get('message') || '결제에 실패했습니다'
  const code = params.get('code') || ''

  return (
    <div className="min-h-screen bg-saenggi-50 flex items-center justify-center px-6">
      <div className="text-center max-w-sm w-full">
        <div className="text-5xl mb-6">✕</div>
        <h1 className="text-xl font-semibold text-gray-900 mb-3">결제가 실패했습니다</h1>
        <p className="text-gray-500 text-sm mb-2">{message}</p>
        {code && <p className="text-xs text-gray-400 mb-8">오류 코드: {code}</p>}
        <div className="space-y-3">
          <button onClick={() => navigate('/payment')}
            className="w-full bg-saenggi-600 hover:bg-saenggi-700 text-white py-3 rounded-xl font-medium transition-all">
            다시 시도하기
          </button>
          <button onClick={() => navigate('/')}
            className="w-full text-gray-400 text-sm py-2">
            홈으로 돌아가기
          </button>
        </div>
      </div>
    </div>
  )
}
