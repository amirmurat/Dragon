import { useState } from "react"
import { api, setToken } from "@/lib/api"
import { useNavigate, useLocation, Link } from "react-router-dom"
import { useTitle } from "@/ui/useTitle"

export default function Login(){
  useTitle("Log in — MoonSalon")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [err, setErr] = useState<string| null>(null)
  const [loading, setLoading] = useState(false)
  const nav = useNavigate()
  const loc = useLocation() as any

  async function submit(e: React.FormEvent){
    e.preventDefault()
    setErr(null)
    if (!email || !password) { setErr("Enter email and password"); return }
    setLoading(true)
    try{
      const data = await api.login(email, password) as any
      if (!data?.token) throw new Error("No token in response")
      setToken(data.token)
      nav(loc.state?.from || "/providers")
      location.reload()
    }catch(e:any){
      const msg = e?.error === "email_not_verified" ? "Please verify your email before logging in" : (e?.message || "Login failed")
      setErr(msg)
    }finally{
      setLoading(false)
    }
  }

  return (
    <div className="max-w-sm mx-auto card card-pad">
      <h1 className="text-xl font-semibold mb-4">Log in</h1>
      <form onSubmit={submit} className="space-y-3" noValidate>
        <div className="space-y-1">
          <label htmlFor="email" className="text-sm text-[--muted]">Email</label>
          <input id="email" className="input" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} type="email" autoComplete="email" required disabled={loading} />
        </div>
        <div className="space-y-1">
          <label htmlFor="password" className="text-sm text-[--muted]">Password</label>
          <input id="password" className="input" placeholder="••••••••" type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password" required disabled={loading} />
        </div>
        {err && <div className="text-red-600 text-sm" role="alert" aria-live="polite">{err}</div>}
        <button className="btn btn-primary w-full" disabled={loading} aria-busy={loading}>
          {loading? "Signing in…" : "Sign in"}
        </button>
      </form>
      <div className="text-sm text-[--muted] mt-3">
        No account? <Link to="/register" className="underline">Sign up</Link>
      </div>
    </div>
  )
}
