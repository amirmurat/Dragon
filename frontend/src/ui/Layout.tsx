import { Link, Outlet, useNavigate, NavLink } from "react-router-dom"
import { getToken, setToken, api } from "@/lib/api"
import { useQuery } from "@tanstack/react-query"
import { Toaster } from "./Toast"
import { useState } from "react"

function Logo(){
  return (
    <Link to="/" className="flex items-center gap-2">
      <span className="inline-flex h-8 w-8 items-center justify-center"
            style={{background:"#103559", color:"#fff"}}>
        ♥
      </span>
      <span className="font-display text-lg font-semibold tracking-wide" style={{color:"#103559"}}>MoonSalon</span>
    </Link>
  )
}

export function Layout() {
  const token = getToken()
  const nav = useNavigate()
  const me = useQuery({ queryKey: ["me"], queryFn: ()=> api.me(), enabled: !!token, retry: false })
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  function logout(){
    setToken(null)
    nav("/login")
    try { location.reload() } catch {}
  }

  const NavLinks = (
    <>
      {!token ? (
        <>
          <NavLink className={({isActive})=>`navlink${isActive?" navlink-active":""}`} to="/providers">Providers</NavLink>
          <Link className="btn btn-ghost" to="/login">Log in</Link>
          <Link className="btn btn-primary" to="/register">Sign up</Link>
        </>
      ) : (
        <>
          <NavLink className={({isActive})=>`navlink${isActive?" navlink-active":""}`} to="/providers">Providers</NavLink>
          <NavLink className={({isActive})=>`navlink${isActive?" navlink-active":""}`} to="/bookings">My bookings</NavLink>
          {(me.data?.role==="PROVIDER" || me.data?.role==="ADMIN") && (
            <NavLink className={({isActive})=>`navlink${isActive?" navlink-active":""}`} to="/dashboard">Dashboard</NavLink>
          )}
          {me.data?.role==="ADMIN" && (
            <NavLink className={({isActive})=>`navlink${isActive?" navlink-active":""}`} to="/admin">Admin</NavLink>
          )}
          <span className="hidden sm:inline text-xs text-[--muted]">({me.isLoading ? "…" : (me.data?.email || "…")})</span>
          <button className="btn btn-outline" onClick={logout}>Log out</button>
        </>
      )}
    </>
  )

  const MobileNavLinks = (
    <>
      {!token ? (
        <>
          <NavLink className={({isActive})=>`block navlink${isActive?" navlink-active":""}`} to="/providers" onClick={()=>setMobileMenuOpen(false)}>Providers</NavLink>
          <Link className="btn btn-ghost w-full text-left" to="/login" onClick={()=>setMobileMenuOpen(false)}>Log in</Link>
          <Link className="btn btn-primary w-full text-left" to="/register" onClick={()=>setMobileMenuOpen(false)}>Sign up</Link>
        </>
      ) : (
        <>
          <NavLink className={({isActive})=>`block navlink${isActive?" navlink-active":""}`} to="/providers" onClick={()=>setMobileMenuOpen(false)}>Providers</NavLink>
          <NavLink className={({isActive})=>`block navlink${isActive?" navlink-active":""}`} to="/bookings" onClick={()=>setMobileMenuOpen(false)}>My bookings</NavLink>
          {(me.data?.role==="PROVIDER" || me.data?.role==="ADMIN") && (
            <NavLink className={({isActive})=>`block navlink${isActive?" navlink-active":""}`} to="/dashboard" onClick={()=>setMobileMenuOpen(false)}>Dashboard</NavLink>
          )}
          {me.data?.role==="ADMIN" && (
            <NavLink className={({isActive})=>`block navlink${isActive?" navlink-active":""}`} to="/admin" onClick={()=>setMobileMenuOpen(false)}>Admin</NavLink>
          )}
          <div className="text-xs text-[--muted] px-2 py-1">{me.isLoading ? "…" : (me.data?.email || "…")}</div>
          <button className="btn btn-outline w-full text-left" onClick={()=>{logout(); setMobileMenuOpen(false)}}>Log out</button>
        </>
      )}
    </>
  )

  return (
    <div className="min-h-screen flex flex-col">
      <Toaster />
      <header className="sticky top-0 z-30 backdrop-blur bg-[--bg]/70 border-b" style={{borderColor:"var(--accent-100)"}}>
        <div className="mx-auto max-w-5xl px-4 h-16 flex items-center justify-between">
          <Logo />
          <nav className="hidden md:flex items-center gap-3 flex-wrap">
            {NavLinks}
          </nav>
          <button 
            className="md:hidden p-2 hover:bg-[--accent-50] transition" 
            onClick={()=>setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <span className="text-xl">{mobileMenuOpen ? "✕" : "☰"}</span>
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden border-t" style={{borderColor:"var(--accent-100)"}}>
            <nav className="px-4 py-3 space-y-1">
              {MobileNavLinks}
            </nav>
          </div>
        )}
      </header>

      <main className="mx-auto max-w-5xl w-full px-3 md:px-4 py-4 md:py-8 flex-1">
        <Outlet />
      </main>

      <footer className="border-t py-4 md:py-6 text-center text-xs text-[--muted] px-3" style={{borderColor:"var(--accent-100)"}}>
        © {new Date().getFullYear()} MoonSalon • beauty and self-care
      </footer>
    </div>
  )
}

export default Layout
