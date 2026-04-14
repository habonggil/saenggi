import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import Apply from './pages/Apply'
import Payment from './pages/Payment'
import Success from './pages/Success'
import Fail from './pages/Fail'
import Verify from './pages/Verify'
import AdminLogin from './pages/admin/Login'
import AdminDashboard from './pages/admin/Dashboard'
import AdminOrders from './pages/admin/Orders'
import AdminReading from './pages/admin/Reading'
import AdminShipping from './pages/admin/Shipping'
import AdminCities from './pages/admin/Cities'
import AdminRoute from './components/AdminRoute'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 공개 페이지 */}
        <Route path="/" element={<Landing />} />
        <Route path="/apply" element={<Apply />} />
        <Route path="/payment" element={<Payment />} />
        <Route path="/success" element={<Success />} />
        <Route path="/fail" element={<Fail />} />
        <Route path="/verify" element={<Verify />} />

        {/* 관리자 페이지 */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/orders" element={<AdminRoute><AdminOrders /></AdminRoute>} />
        <Route path="/admin/reading" element={<AdminRoute><AdminReading /></AdminRoute>} />
        <Route path="/admin/shipping" element={<AdminRoute><AdminShipping /></AdminRoute>} />
        <Route path="/admin/cities" element={<AdminRoute><AdminCities /></AdminRoute>} />
      </Routes>
    </BrowserRouter>
  )
}
