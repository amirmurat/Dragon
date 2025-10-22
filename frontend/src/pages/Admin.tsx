import { useEffect, useMemo, useState } from "react"

type User = { id: string; email: string; role: "CLIENT"|"PROVIDER"|"ADMIN"; createdAt?: string }
type Provider = { id: string; name: string; address?: string|null; description?: string|null; ownerUserId?: string|null }
type Appointment = {
  id: string; providerId: string; userId: string;
  startAt: string; endAt: string; status: string; serviceTitle?: string|null
}

const BASE = "http://localhost:8080"
function authHeaders() {
  const t = localStorage.getItem("token") || ""
  const h = new Headers()
  h.set("Content-Type","application/json")
  if (t) h.set("Authorization","Bearer "+t)
  return h
}
async function mustJson(res: Response){
  if (res.status === 401) { localStorage.removeItem("token"); location.href = "/login"; throw new Error("unauthorized") }
  if (!res.ok) throw new Error(await res.text().catch(()=>`HTTP ${res.status}`))
  return res.json()
}
const ROLE_LABELS = { CLIENT: "Пользователь", PROVIDER: "Владелец бизнеса", ADMIN: "Администратор" }

export default function Admin(){
  const [tab, setTab] = useState<"users"|"providers"|"appointments">("users")

  return (
    <div className="space-y-4">
      <div className="text-xl font-semibold">Admin</div>

      <div className="flex gap-2">
        <button className={"px-3 py-1 border rounded "+(tab==="users"?"bg-gray-200":"")} onClick={()=>setTab("users")}>Users</button>
        <button className={"px-3 py-1 border rounded "+(tab==="providers"?"bg-gray-200":"")} onClick={()=>setTab("providers")}>Providers</button>
        <button className={"px-3 py-1 border rounded "+(tab==="appointments"?"bg-gray-200":"")} onClick={()=>setTab("appointments")}>Appointments</button>
      </div>

      {tab==="users" && <UsersTab />}
      {tab==="providers" && <ProvidersTab />}
      {tab==="appointments" && <ApptsTab />}
    </div>
  )
}

function UsersTab(){
  const [q, setQ] = useState("")
  const [role, setRole] = useState<""|"CLIENT"|"PROVIDER"|"ADMIN">("")
  const [data, setData] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string|null>(null)

  async function load(){
    setLoading(true); setErr(null)
    try{
      const url = new URL(BASE+"/admin/users")
      if (q) url.searchParams.set("q", q)
      if (role) url.searchParams.set("role", role)
      const res = await fetch(url, { headers: authHeaders() })
      const json = await mustJson(res)
      setData(json)
    }catch(e:any){
      setErr(e?.message||"Failed to load")
    }finally{ setLoading(false) }
  }
  useEffect(()=>{ load() }, []) // eslint-disable-line

  async function changeRole(id: string, newRole: User["role"]){
    try{
      const res = await fetch(`${BASE}/admin/users/${id}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ role: newRole })
      })
      await mustJson(res)
      await load()
    }catch(e:any){ alert(e?.message||"Failed") }
  }

  return (
    <div className="space-y-3">
      <div className="grid md:grid-cols-3 gap-2">
        <input className="border px-3 py-2" placeholder="Search by email" value={q} onChange={e=>setQ(e.target.value)} />
        <select className="border px-3 py-2" value={role} onChange={e=>setRole(e.target.value as any)}>
          <option value="">Any role</option>
          <option value="CLIENT">Пользователь</option>
          <option value="PROVIDER">Владелец бизнеса</option>
          <option value="ADMIN">Администратор</option>
        </select>
        <button className="border rounded px-3 py-2" onClick={load} disabled={loading}>{loading?"…":"Apply"}</button>
      </div>

      {err && <div className="text-red-600 text-sm">{err}</div>}

      <div className="grid gap-2">
        {data.map(u=>(
          <div key={u.id} className="border rounded p-2 flex items-center justify-between">
            <div className="text-sm">
              <div className="font-medium">{u.email}</div>
              <div className="text-gray-600">role: {ROLE_LABELS[u.role]}</div>
            </div>
            <div className="flex items-center gap-2">
              {(["CLIENT","PROVIDER","ADMIN"] as const).map(r=>(
                <button key={r}
                  className={"px-2 py-1 border rounded text-sm "+(u.role===r?"bg-gray-200":"")}
                  onClick={()=> changeRole(u.id, r)}
                  disabled={u.role===r}
                >
                  {ROLE_LABELS[r]}
                </button>
              ))}
            </div>
          </div>
        ))}
        {(!loading && data.length===0) && <div className="text-sm text-gray-600">No users.</div>}
      </div>
    </div>
  )
}

function ProvidersTab(){
  const [q, setQ] = useState("")
  const [data, setData] = useState<Provider[]>([])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string|null>(null)

  async function load(){
    setLoading(true); setErr(null)
    try{
      const url = new URL(BASE+"/admin/providers")
      if (q) url.searchParams.set("q", q)
      const res = await fetch(url, { headers: authHeaders() })
      const json = await mustJson(res)
      setData(json)
    }catch(e:any){
      setErr(e?.message||"Failed to load")
    }finally{ setLoading(false) }
  }
  useEffect(()=>{ load() }, []) // eslint-disable-line

  return (
    <div className="space-y-3">
      <div className="grid md:grid-cols-3 gap-2">
        <input className="border px-3 py-2" placeholder="Search by name/address/desc" value={q} onChange={e=>setQ(e.target.value)} />
        <div />
        <button className="border rounded px-3 py-2" onClick={load} disabled={loading}>{loading?"…":"Apply"}</button>
      </div>

      {err && <div className="text-red-600 text-sm">{err}</div>}

      <div className="grid gap-2">
        {data.map(p=>(
          <div key={p.id} className="border rounded p-2">
            <div className="font-medium">{p.name}</div>
            {p.address && <div className="text-sm text-gray-600">{p.address}</div>}
            {p.description && <div className="text-sm text-gray-600">{p.description}</div>}
            {p.ownerUserId && <div className="text-xs text-gray-500 mt-1">owner: {p.ownerUserId}</div>}
          </div>
        ))}
        {(!loading && data.length===0) && <div className="text-sm text-gray-600">No providers.</div>}
      </div>
    </div>
  )
}

function ApptsTab(){
  const [date, setDate] = useState("")
  const [data, setData] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string|null>(null)

  const pretty = useMemo(()=> (iso:string)=> new Date(iso).toLocaleString(), [])

  async function load(){
    setLoading(true); setErr(null)
    try{
      const url = new URL(BASE+"/admin/appointments")
      if (date) url.searchParams.set("date", date)
      const res = await fetch(url, { headers: authHeaders() })
      const json = await mustJson(res)
      setData(json)
    }catch(e:any){
      setErr(e?.message||"Failed to load")
    }finally{ setLoading(false) }
  }
  useEffect(()=>{ load() }, []) // eslint-disable-line

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input type="date" className="border px-3 py-2" value={date} onChange={e=>setDate(e.target.value)} />
        <button className="border rounded px-3 py-2" onClick={load} disabled={loading}>{loading?"…":"Apply"}</button>
      </div>

      {err && <div className="text-red-600 text-sm">{err}</div>}

      <div className="grid gap-2">
        {data.map(a=>(
          <div key={a.id} className="border rounded p-2">
            <div className="font-medium">{pretty(a.startAt)} — {a.serviceTitle||"—"}</div>
            <div className="text-sm text-gray-600">
              status: {a.status} · provider: {a.providerId} · user: {a.userId}
            </div>
          </div>
        ))}
        {(!loading && data.length===0) && <div className="text-sm text-gray-600">No appointments.</div>}
      </div>
    </div>
  )
}
