import { useNavigate, useLocation } from 'react-router-dom'

const NAV = [
  { path: '/admin', label: '대시보드' },
  { path: '/admin/orders', label: '주문관리' },
  { path: '/admin/reading', label: '리딩관리' },
  { path: '/admin/shipping', label: '배송관리' },
  { path: '/admin/cities', label: '도시관리' },
]

export default function AdminLayout({ children }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  function logout() {
    sessionStorage.removeItem('admin_auth')
    navigate('/admin/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-6">
            <span className="font-semibold text-saenggi-700">생기출판사 관리자</span>
            <nav className="flex gap-1">
              {NAV.map(({ path, label }) => (
                <button key={path} onClick={() => navigate(path)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                    pathname === path ? 'bg-saenggi-100 text-saenggi-700 font-medium' : 'text-gray-500 hover:text-gray-700'
                  }`}>
                  {label}
                </button>
              ))}
            </nav>
          </div>
          <button onClick={logout} className="text-sm text-gray-400 hover:text-gray-600">로그아웃</button>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
    </div>
  )
}
