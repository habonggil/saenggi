import { Navigate } from 'react-router-dom'

export default function AdminRoute({ children }) {
  const isAdmin = sessionStorage.getItem('admin_auth') === 'true'
  if (!isAdmin) return <Navigate to="/admin/login" replace />
  return children
}
