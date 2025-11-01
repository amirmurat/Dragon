import { useEffect, useMemo, useState } from "react"
import { useTitle } from "@/ui/useTitle"
import { toast } from "@/ui/Toast"

type User = { id: string; email: string; role: "CLIENT"|"PROVIDER"|"ADMIN"; createdAt?: string }
type Provider = { id: string; name: string; address?: string|null; description?: string|null; ownerUserId?: string|null }
type Category = { id: string; name: string; slug: string; icon?: string|null; createdAt?: string }
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
const ROLE_LABELS = { CLIENT: "User", PROVIDER: "Provider owner", ADMIN: "Administrator" }

export default function Admin(){
  useTitle("Admin — MoonSalon")
  const [tab, setTab] = useState<"users"|"providers"|"categories"|"appointments">("users")

  return (
    <div className="space-y-4">
      <div className="text-xl font-semibold">Admin</div>

      <div className="flex gap-2">
        <button className={"btn btn-outline "+(tab==="users"?"navlink-active":"")} onClick={()=>setTab("users")}>Users</button>
        <button className={"btn btn-outline "+(tab==="providers"?"navlink-active":"")} onClick={()=>setTab("providers")}>Providers</button>
        <button className={"btn btn-outline "+(tab==="categories"?"navlink-active":"")} onClick={()=>setTab("categories")}>Categories</button>
        <button className={"btn btn-outline "+(tab==="appointments"?"navlink-active":"")} onClick={()=>setTab("appointments")}>Appointments</button>
      </div>

      {tab==="users" && <UsersTab />}
      {tab==="providers" && <ProvidersTab />}
      {tab==="categories" && <CategoriesTab />}
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
      const msg = e?.message||"Failed to load"; setErr(msg); toast(msg, "error")
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
      toast("Role updated","success")
      await load()
    }catch(e:any){ toast(e?.message||"Failed", "error") }
  }

  async function removeUser(id: string){
    if (!confirm("Delete user?")) return
    try{
      const res = await fetch(`${BASE}/admin/users/${id}`, { method: "DELETE", headers: authHeaders() })
      if (!res.ok) {
        const txt = await res.text().catch(()=>"")
        if (res.status === 400 && txt.includes("cannot_delete_self")) throw new Error("You cannot delete your own account")
        throw new Error(txt || `HTTP ${res.status}`)
      }
      toast("User deleted","success"); await load()
    }catch(e:any){ toast(e?.message||"Failed to delete","error") }
  }

  return (
    <div className="space-y-3">
      <div className="grid md:grid-cols-3 gap-2">
        <input className="input" placeholder="Search by email" value={q} onChange={e=>setQ(e.target.value)} />
        <select className="input" value={role} onChange={e=>setRole(e.target.value as any)}>
          <option value="">Any role</option>
          <option value="CLIENT">User</option>
          <option value="PROVIDER">Provider owner</option>
          <option value="ADMIN">Administrator</option>
        </select>
        <button className="btn btn-outline" onClick={load} disabled={loading}>{loading?"…":"Apply"}</button>
      </div>

      {err && <div className="text-red-600 text-sm">{err}</div>}

      <div className="grid gap-2">
        {data.map(u=>(
          <div key={u.id} className="card card-pad flex items-center justify-between">
            <div className="text-sm">
              <div className="font-medium">{u.email}</div>
              <div className="text-[--muted]">role: {ROLE_LABELS[u.role]}</div>
            </div>
            <div className="flex items-center gap-2">
              {( ["CLIENT","PROVIDER","ADMIN"] as const).map(r=>(
                <button key={r}
                  className={"btn btn-outline text-sm "+(u.role===r?"navlink-active":"")}
                  onClick={()=> changeRole(u.id, r)}
                  disabled={u.role===r}
                >
                  {ROLE_LABELS[r]}
                </button>
              ))}
              <button className="btn btn-outline" onClick={()=>removeUser(u.id)}>Delete</button>
            </div>
          </div>
        ))}
        {(!loading && data.length===0) && <div className="text-sm text-[--muted]">No users.</div>}
      </div>
    </div>
  )
}

function ProvidersTab(){
  const [q, setQ] = useState("")
  const [data, setData] = useState<Provider[]>([])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string|null>(null)

  const [edit, setEdit] = useState<Provider | null>(null)
  const [name, setName] = useState("")
  const [address, setAddress] = useState("")
  const [description, setDescription] = useState("")

  async function load(){
    setLoading(true); setErr(null)
    try{
      const url = new URL(BASE+"/admin/providers")
      if (q) url.searchParams.set("q", q)
      const res = await fetch(url, { headers: authHeaders() })
      const json = await mustJson(res)
      setData(json)
    }catch(e:any){
      const msg = e?.message||"Failed to load"; setErr(msg); toast(msg, "error")
    }finally{ setLoading(false) }
  }
  useEffect(()=>{ load() }, []) // eslint-disable-line

  function openEdit(p: Provider){ setEdit(p); setName(p.name); setAddress(p.address||""); setDescription(p.description||"") }

  async function save(){
    if (!edit) return
    try{
      const res = await fetch(`${BASE}/admin/providers/${edit.id}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ name, address, description })
      })
      await mustJson(res); toast("Saved","success"); setEdit(null); await load()
    }catch(e:any){ toast(e?.message||"Failed to save","error") }
  }

  async function remove(id: string){
    if (!confirm("Delete provider?")) return
    try{
      const res = await fetch(`${BASE}/admin/providers/${id}`, { method: "DELETE", headers: authHeaders() })
      if (!res.ok) throw new Error(await res.text().catch(()=>`HTTP ${res.status}`))
      toast("Provider deleted","success"); await load()
    }catch(e:any){ toast(e?.message||"Failed to delete","error") }
  }

  return (
    <div className="space-y-3">
      <div className="grid md:grid-cols-3 gap-2">
        <input className="input" placeholder="Search by name/address/desc" value={q} onChange={e=>setQ(e.target.value)} />
        <div />
        <button className="btn btn-outline" onClick={load} disabled={loading}>{loading?"…":"Apply"}</button>
      </div>

      {err && <div className="text-red-600 text-sm">{err}</div>}

      <div className="grid gap-2">
        {data.map(p=>(
          <div key={p.id} className="card card-pad">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-medium">{p.name}</div>
                {p.address && <div className="text-sm text-[--muted]">{p.address}</div>}
                {p.description && <div className="text-sm text-[--muted]">{p.description}</div>}
              </div>
              <div className="flex items-center gap-2">
                <button className="btn btn-outline" onClick={()=>openEdit(p)}>Edit</button>
                <button className="btn btn-outline" onClick={()=>remove(p.id)}>Delete</button>
              </div>
            </div>
          </div>
        ))}
        {(!loading && data.length===0) && <div className="text-sm text-[--muted]">No providers.</div>}
      </div>

      {edit && (
        <div className="card card-pad space-y-2">
          <div className="font-medium">Edit provider</div>
          <input className="input" placeholder="Name" value={name} onChange={e=>setName(e.target.value)} />
          <input className="input" placeholder="Address" value={address} onChange={e=>setAddress(e.target.value)} />
          <input className="input" placeholder="Description" value={description} onChange={e=>setDescription(e.target.value)} />
          <div className="flex gap-2">
            <button className="btn btn-primary" onClick={save}>Save</button>
            <button className="btn btn-outline" onClick={()=>setEdit(null)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}

function CategoriesTab(){
  const [data, setData] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string|null>(null)
  const [edit, setEdit] = useState<Category | "new" | null>(null)
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [icon, setIcon] = useState("")

  async function load(){
    setLoading(true); setErr(null)
    try{
      const res = await fetch(`${BASE}/admin/categories`, { headers: authHeaders() })
      const json = await mustJson(res)
      setData(json)
    }catch(e:any){
      const msg = e?.message||"Failed to load"; setErr(msg); toast(msg, "error")
    }finally{ setLoading(false) }
  }
  useEffect(()=>{ load() }, []) // eslint-disable-line

  function openEdit(c: Category|"new"|null){ setEdit(c); setName(c && c!=="new" ? c.name : ""); setSlug(c && c!=="new" ? c.slug : ""); setIcon(c && c!=="new" ? c.icon : "") }

  async function save(){
    if (!name || !slug) { toast("Name and slug required","error"); return }
    try{
      const url = edit && edit!=="new" ? `${BASE}/admin/categories/${edit.id}` : `${BASE}/admin/categories`
      const method = edit && edit!=="new" ? "PATCH" : "POST"
      const res = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify({ name, slug, icon }) })
      await mustJson(res); toast(edit!=="new" ? "Saved":"Created","success"); setEdit(null); await load()
    }catch(e:any){ toast(e?.message||"Failed to save","error") }
  }

  async function remove(id: string){
    if (!confirm("Delete category?")) return
    try{
      const res = await fetch(`${BASE}/admin/categories/${id}`, { method: "DELETE", headers: authHeaders() })
      if (!res.ok) throw new Error(await res.text().catch(()=>`HTTP ${res.status}`))
      toast("Category deleted","success"); await load()
    }catch(e:any){ toast(e?.message||"Failed to delete","error") }
  }

  return (
    <div className="space-y-3">
      {err && <div className="text-red-600 text-sm">{err}</div>}
      <div className="grid gap-2">
        {data.map(c=>(
          <div key={c.id} className="card card-pad flex items-center justify-between">
            <div>
              <div className="font-medium">{c.name} <span className="text-[--muted]">({c.slug})</span></div>
              {c.icon && <div className="text-xs text-[--muted]">icon: {c.icon}</div>}
            </div>
            <div className="flex items-center gap-2">
              <button className="btn btn-outline" onClick={()=>openEdit(c)}>Edit</button>
              <button className="btn btn-outline" onClick={()=>remove(c.id)}>Delete</button>
            </div>
          </div>
        ))}
        {(!loading && data.length===0) && <div className="text-sm text-[--muted]">No categories yet.</div>}
      </div>

      {edit !== null ? (
        <div className="card card-pad space-y-2">
          <div className="font-medium">{edit === "new" ? "Create category" : "Edit category"}</div>
          <label className="text-sm text-[--muted]">Name</label>
          <input className="input" placeholder="Makeup" value={name} onChange={e=>setName(e.target.value)} />
          <label className="text-sm text-[--muted]">Slug</label>
          <input className="input" placeholder="makeup" value={slug} onChange={e=>setSlug(e.target.value)} />
          <label className="text-sm text-[--muted]">Icon (emoji or URL)</label>
          <input className="input" placeholder="💄 or https://..." value={icon} onChange={e=>setIcon(e.target.value)} />
          <div className="flex gap-2">
            <button className="btn btn-primary" onClick={save}>Save</button>
            <button className="btn btn-outline" onClick={()=>setEdit(null)}>Cancel</button>
          </div>
        </div>
      ) : (
        <div className="card card-pad">
          <button className="btn btn-primary" onClick={()=>openEdit("new")}>Create category</button>
        </div>
      )}
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
      const msg = e?.message||"Failed to load"; setErr(msg); toast(msg, "error")
    }finally{ setLoading(false) }
  }
  useEffect(()=>{ load() }, []) // eslint-disable-line

  async function setStatus(id: string, status: string){
    try{
      const res = await fetch(`${BASE}/admin/appointments/${id}`, { method: "PATCH", headers: authHeaders(), body: JSON.stringify({ status }) })
      await mustJson(res); toast("Status updated","success"); await load()
    }catch(e:any){ toast(e?.message||"Failed to update","error") }
  }

  async function remove(id: string){
    if (!confirm("Delete appointment?")) return
    try{
      const res = await fetch(`${BASE}/admin/appointments/${id}`, { method: "DELETE", headers: authHeaders() })
      if (!res.ok) throw new Error(await res.text().catch(()=>`HTTP ${res.status}`))
      toast("Appointment deleted","success"); await load()
    }catch(e:any){ toast(e?.message||"Failed to delete","error") }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input type="date" className="input" value={date} onChange={e=>setDate(e.target.value)} />
        <button className="btn btn-outline" onClick={load} disabled={loading}>{loading?"…":"Apply"}</button>
      </div>

      {err && <div className="text-red-600 text-sm">{err}</div>}

      <div className="grid gap-2">
        {data.map(a=>(
          <div key={a.id} className="card card-pad">
            <div className="font-medium">{pretty(a.startAt)} — {a.serviceTitle||"—"}</div>
            <div className="text-sm text-[--muted]">provider: {a.providerId} · user: {a.userId} · status: {a.status}</div>
            <div className="flex items-center gap-2 mt-2">
              {(["BOOKED","CONFIRMED","CANCELLED"]).map(s=> (
                <button key={s} className="btn btn-outline" onClick={()=>setStatus(a.id, s)} disabled={a.status===s}>{s}</button>
              ))}
              <button className="btn btn-outline" onClick={()=>remove(a.id)}>Delete</button>
            </div>
          </div>
        ))}
        {(!loading && data.length===0) && <div className="text-sm text-[--muted]">No appointments.</div>}
      </div>
    </div>
  )
}
