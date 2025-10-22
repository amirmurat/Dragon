import { useState } from "react"
import { api, setToken } from "@/lib/api"
import { useNavigate, Link } from "react-router-dom"

export default function Register(){
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [err, setErr] = useState<string| null>(null)
  const [ok, setOk] = useState<string| null>(null)
  const [loading, setLoading] = useState(false)
  const nav = useNavigate()

  async function submit(e: React.FormEvent){
    e.preventDefault()
    setErr(null); setOk(null)
    if (!email || !password) { setErr("Fill email and password"); return }
    if (password.length < 6) { setErr("Password must be ≥ 6 chars"); return }
    setLoading(true)
    try{
      await api.register(email, password)
      // сразу логиним
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
      <h1 className="text-xl font-semibold mb-4">Register</h1>
      <form onSubmit={submit} className="space-y-3">
        <input className="border px-3 py-2 w-full" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input className="border px-3 py-2 w-full" placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        {err && <div className="text-red-600 text-sm">{err}</div>}
        {ok && <div className="text-green-700 text-sm">{ok}</div>}
        <button className="border rounded px-4 py-2" disabled={loading}>
          {loading? "..." : "Create account"}
        </button>
      </form>
      <div className="text-sm text-gray-600 mt-3">
        Have account? <Link to="/login" className="underline">Login</Link>
      </div>
    </div>
  )
}
