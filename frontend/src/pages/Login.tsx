import { useState } from "react"
import { api, setToken } from "@/lib/api"
import { useNavigate, useLocation, Link } from "react-router-dom"

export default function Login(){
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [err, setErr] = useState<string| null>(null)
  const [loading, setLoading] = useState(false)
  const nav = useNavigate()
  const loc = useLocation() as any

  async function submit(e: React.FormEvent){
    e.preventDefault()
    setErr(null)
    if (!email || !password) { setErr("Fill email and password"); return }
    setLoading(true)
    try{
      const data = await api.login(email, password) as any
      if (!data?.token) throw new Error("No token in response")
      setToken(data.token)
      nav(loc.state?.from || "/providers")
      location.reload()
    }catch(e:any){
      setErr(e?.message || "Login failed")
    }finally{
      setLoading(false)
    }
  }

  return (
    <div className="max-w-sm mx-auto">
      <h1 className="text-xl font-semibold mb-4">Login</h1>
      <form onSubmit={submit} className="space-y-3">
        <input className="border px-3 py-2 w-full" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input className="border px-3 py-2 w-full" placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        {err && <div className="text-red-600 text-sm">{err}</div>}
        <button className="border rounded px-4 py-2" disabled={loading}>
          {loading? "..." : "Login"}
        </button>
      </form>
      <div className="text-sm text-gray-600 mt-3">
        No account? <Link to="/register" className="underline">Register</Link>
      </div>
    </div>
  )
}
