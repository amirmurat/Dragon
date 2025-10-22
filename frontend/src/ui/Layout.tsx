import { Link, Outlet, useNavigate } from "react-router-dom"
import { getToken, setToken, api } from "@/lib/api"
import { useQuery } from "@tanstack/react-query"

export function Layout() {
  const token = getToken()
  const nav = useNavigate()
  const me = useQuery({ queryKey: ["me"], queryFn: ()=> api.me(), enabled: !!token, retry: false })

  function logout(){
    setToken(null)
    nav("/login")
    try { location.reload() } catch {}
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="font-semibold">Zapis Variant A</Link>
          <nav className="flex items-center gap-3 text-sm">
            {!token ? (
              <>
                <Link to="/login">Login</Link>
                <Link to="/register">Register</Link>
              </>
            ) : (
              <>
                <Link to="/providers">Providers</Link>
                <Link to="/bookings">Bookings</Link>
                {(me.data?.role==="PROVIDER" || me.data?.role==="ADMIN") && (
                  <Link to="/dashboard">Dashboard</Link>
                )}
                {(me.data?.role==="ADMIN") && (
                  <Link to="/admin">Admin</Link>
                )}
                <span className="text-gray-500 hidden sm:inline">({me.data?.email || "..."})</span>
                <button className="border rounded px-2 py-1" onClick={logout}>Log out</button>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-6 flex-1">
        <Outlet />
      </main>
      <footer className="border-t py-3 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} Zapis
      </footer>
    </div>
  )
}
