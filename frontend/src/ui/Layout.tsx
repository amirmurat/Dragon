import { Link, Outlet } from "react-router-dom"
import { getToken, setToken } from "@/lib/api"

export function Layout() {
  const token = getToken()
  return (
    <div className="min-h-dvh flex flex-col">
      <header className="border-b">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link to="/" className="font-semibold">Zapis</Link>
          <nav className="flex items-center gap-3 text-sm">
            <Link to="/providers">Providers</Link>
            <Link to="/bookings">My bookings</Link>
            {token && <Link to="/dashboard">Dashboard</Link>}
          </nav>
          <div className="ml-auto text-sm">
            {!token ? (
              <>
                <Link to="/login" className="mr-3">Login</Link>
                <Link to="/register">Register</Link>
              </>
            ) : (
              <button onClick={()=>{ setToken(null); location.href="/"; }} className="px-2 py-1 border rounded">Logout</button>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
