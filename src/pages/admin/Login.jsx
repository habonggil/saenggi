import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'saenggi2025!'

export default function AdminLogin() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  function handleLogin(e) {
    e.preventDefault()
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem('admin_auth', 'true')
      navigate('/admin')
    } else {
      setError('비밀번호가 올바르지 않습니다')
    }
  }

  return (
    <div className="min-h-screen bg-saenggi-50 flex items-center justify-center px-6">
      <div className="bg-white rounded-2xl shadow-sm border border-saenggi-100 p-8 w-full max-w-sm">
        <h1 className="text-xl font-semibold text-gray-900 mb-2 text-center">관리자 로그인</h1>
        <p className="text-sm text-gray-400 text-center mb-8">생기출판사</p>
        <form onSubmit={handleLogin} className="space-y-4">
          <input type="password" placeholder="비밀번호" value={password} onChange={e => setPassword(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-saenggi-400" />
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <button type="submit" className="w-full bg-saenggi-600 hover:bg-saenggi-700 text-white py-3 rounded-xl font-medium transition-all">
            로그인
          </button>
        </form>
      </div>
    </div>
  )
}
