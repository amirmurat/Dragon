import { getToken } from "@/lib/api"
import { Navigate, useLocation } from "react-router-dom"

export default function RequireAuth({ children }:{ children: React.ReactNode }) {
  const loc = useLocation()
  const token = getToken()
  if (!token) return <Navigate to="/login" replace state={{ from: loc.pathname }} />
  return <>{children}</>
}
