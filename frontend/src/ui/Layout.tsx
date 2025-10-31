import { Link, Outlet, useNavigate, NavLink } from "react-router-dom"
import { getToken, setToken, api } from "@/lib/api"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { Toaster } from "./Toast"

function Logo(){
  return (
    <Link to="/" className="flex items-center gap-2">
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-2xl"
            style={{background:"linear-gradient(180deg,var(--brand-500),var(--brand-700))", color:"#fff"}}>
        ♥
      </span>
      <span className="font-display text-lg font-semibold tracking-wide">Zapis</span>
    </Link>
  )
}

export function Layout() {
  const token = getToken()
  const nav = useNavigate()
  const me = useQuery({ queryKey: ["me"], queryFn: ()=> api.me(), enabled: !!token, retry: false })
  const [menuOpen, setMenuOpen] = useState(false)

  function logout(){
    setToken(null)
    nav("/login")
    try { location.reload() } catch {}
  }

  const NavLinks = (
    <>
      {!token ? (
        <>
          <NavLink className={({isActive})=>`navlink${isActive?" navlink-active":""}`} to="/providers" onClick={()=>setMenuOpen(false)}>Providers</NavLink>
          <Link className="btn btn-ghost" to="/login" onClick={()=>setMenuOpen(false)}>Log in</Link>
          <Link className="btn btn-primary" to="/register" onClick={()=>setMenuOpen(false)}>Sign up</Link>
        </>
      ) : (
        <>
          <NavLink className={({isActive})=>`navlink${isActive?" navlink-active":""}`} to="/providers" onClick={()=>setMenuOpen(false)}>Providers</NavLink>
          <NavLink className={({isActive})=>`navlink${isActive?" navlink-active":""}`} to="/bookings" onClick={()=>setMenuOpen(false)}>My bookings</NavLink>
          {(me.data?.role==="PROVIDER" || me.data?.role==="ADMIN") && (
            <NavLink className={({isActive})=>`navlink${isActive?" navlink-active":""}`} to="/dashboard" onClick={()=>setMenuOpen(false)}>Dashboard</NavLink>
          )}
          {me.data?.role==="ADMIN" && (
            <NavLink className={({isActive})=>`navlink${isActive?" navlink-active":""}`} to="/admin" onClick={()=>setMenuOpen(false)}>Admin</NavLink>
          )}
          <span className="hidden sm:inline text-xs text-[--muted]">({me.isLoading ? "…" : (me.data?.email || "…")})</span>
          <button className="btn btn-outline" onClick={logout}>Log out</button>
        </>
      )}
    </>
  )

  return (
    <div className="min-h-screen flex flex-col">
      <Toaster />
      <header className="sticky top-0 z-30 backdrop-blur bg-[--bg]/70 border-b border-[--brand-100]">
        <div className="mx-auto max-w-5xl px-4 h-16 flex items-center justify-between">
          <Logo />
          <nav className="hidden sm:flex items-center gap-3">
            {NavLinks}
          </nav>
          <button className="sm:hidden btn btn-outline" aria-label="Menu" onClick={()=>setMenuOpen(v=>!v)}>≡</button>
        </div>
        {menuOpen && (
          <div className="sm:hidden border-t border-[--brand-100]">
            <div className="px-4 py-3 flex flex-col gap-2">
              {NavLinks}
            </div>
          </div>
        )}
      </header>

      <main className="mx-auto max-w-5xl w-full px-4 py-8 flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-[--brand-100] py-6 text-center text-xs text-[--muted]">
        © {new Date().getFullYear()} Zapis • beauty and self-care
      </footer>
    </div>
  )
}

export default Layout
