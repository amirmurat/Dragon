import { useState } from "react"
import { api, setToken } from "@/lib/api"
import { useNavigate, Link } from "react-router-dom"
import { useTitle } from "@/ui/useTitle"

export default function Register(){
  useTitle("Sign up — Zapis")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [err, setErr] = useState<string| null>(null)
  const [ok, setOk] = useState<string| null>(null)
  const [loading, setLoading] = useState(false)
  const nav = useNavigate()

  async function submit(e: React.FormEvent){
    e.preventDefault()
    setErr(null); setOk(null)
    if (!email || !password) { setErr("Enter email and password"); return }
    if (password.length < 6) { setErr("Password must be at least 6 characters"); return }
    setLoading(true)
    try{
      await api.register(email, password)
      const data = await api.login(email, password) as any
      if (!data?.token) throw new Error("No token")
      setToken(data.token)
      nav("/providers")
      location.reload()
    }catch(e:any){
      setErr(e?.message || "Registration failed")
    }finally{
      setLoading(false)
    }
  }

  return (
    <div className="max-w-sm mx-auto">
      <h1 className="text-xl font-semibold mb-4">Sign up</h1>
      <form onSubmit={submit} className="space-y-3" noValidate>
        <input className="input" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} type="email" autoComplete="email" required disabled={loading} />
        <input className="input" placeholder="••••••••" type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="new-password" required disabled={loading} />
        {err && <div className="text-red-600 text-sm" role="alert" aria-live="polite">{err}</div>}
        {ok && <div className="text-green-700 text-sm">{ok}</div>}
        <button className="btn btn-primary w-full" disabled={loading} aria-busy={loading}>
          {loading? "Creating…" : "Create account"}
        </button>
      </form>
      <div className="text-sm text-[--muted] mt-3">
        Have an account? <Link to="/login" className="underline">Log in</Link>
      </div>
    </div>
  )
}
