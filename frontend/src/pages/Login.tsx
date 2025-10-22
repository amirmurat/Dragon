import { useState } from "react"
import { api, setToken } from "@/lib/api"

export default function Login(){
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [err, setErr] = useState<string | null>(null)

  async function submit(e: any){
    e.preventDefault()
    try {
      const res = await api.login(email, password)
      setToken(res.accessToken)
      location.href = "/"
    } catch (e: any) {
      setErr(e.message)
    }
  }

  return (
    <form onSubmit={submit} className="max-w-sm space-y-3">
      <div className="text-xl font-semibold">Login</div>
      <input className="border px-3 py-2 w-full" placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} />
      <input className="border px-3 py-2 w-full" placeholder="Password" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} />
      <button className="px-3 py-2 border rounded">Sign in</button>
      {err && <div className="text-red-600 text-sm">{err}</div>}
    </form>
  )
}
