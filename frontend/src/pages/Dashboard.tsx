import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { useEffect, useMemo, useState } from "react"
import { useTitle } from "@/ui/useTitle"
import { toast } from "@/ui/Toast"

export default function Dashboard(){
  useTitle("Dashboard — MoonSalon")
  const qc = useQueryClient()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [address, setAddress] = useState("")
  const [date, setDate] = useState(()=> new Date().toISOString().slice(0,10))

  const me = useQuery({ queryKey: ["me"], queryFn: ()=> api.me() })

  const myProv = useQuery({ queryKey: ["myProvider"], queryFn: ()=> api.myProvider(), retry: false })
  const createProv = useMutation({
    mutationFn: ()=> api.createProvider({ name, description, address }),
    onSuccess: ()=> { toast("Profile created","success"); const k = { queryKey: ["myProvider"] } as any; (qc as any).invalidateQueries(k) },
    onError: (e:any)=> toast(e?.message||"Failed to create", "error")
  })

  const provId = (myProv.data as any)?.id
  const canCreateProvider = ["PROVIDER","ADMIN"].includes(me.data?.role)

  // Services
  const services = useQuery({ queryKey: ["myServices", provId], queryFn: ()=> api.providerServices(provId!), enabled: !!provId })
  const categories = useQuery({ queryKey: ["categories"], queryFn: ()=> api.categories() })
  const [svcTitle, setSvcTitle] = useState("")
  const [svcPrice, setSvcPrice] = useState(0)
  const [svcDur, setSvcDur] = useState(30)
  const [svcCategoryId, setSvcCategoryId] = useState<string>("")
  const createSvc = useMutation({
    mutationFn: ()=> api.createService(provId!, { title: svcTitle, price: Number(svcPrice), durationMin: Number(svcDur), categoryId: svcCategoryId || undefined }),
    onSuccess: ()=> { setSvcTitle(""); setSvcPrice(0); setSvcDur(30); setSvcCategoryId(""); toast("Service added","success"); qc.invalidateQueries({ queryKey: ["myServices", provId] }) },
    onError: (e:any)=> toast(e?.message||"Failed to add service", "error")
  })

  // Working hours
  const hours = useQuery({ queryKey: ["wh", provId], queryFn: ()=> api.getWorkingHours(provId!), enabled: !!provId })
  const setDefault = useMutation({
    mutationFn: ()=> api.setDefaultHours(provId!),
    onSuccess: ()=> { toast("Working hours set","success"); qc.invalidateQueries({ queryKey: ["wh", provId] }) },
    onError: (e:any)=> toast(e?.message||"Failed to set hours", "error")
  })
  const saveHours = useMutation({
    mutationFn: (items: Array<{weekday:number,startTime:string,endTime:string}>)=> api.setWorkingHours(provId!, items),
    onSuccess: ()=> { toast("Working hours saved","success"); qc.invalidateQueries({ queryKey: ["wh", provId] }) },
    onError: (e:any)=> toast(e?.message||"Failed to save hours", "error")
  })

  const weekdayLabels = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]
  type DraftRow = { key: string; weekday: number; startTime: string; endTime: string }
  const [hoursDraft, setHoursDraft] = useState<DraftRow[]>([])
  useEffect(()=>{
    const list = (hours.data ?? []).map((h:any, idx:number)=> ({ key: String(h.id||idx), weekday: Number(h.weekday), startTime: String(h.startTime), endTime: String(h.endTime) }))
    setHoursDraft(list)
  }, [hours.data])

  function addRow(){
    setHoursDraft(d=> [...d, { key: Math.random().toString(36).slice(2), weekday: 1, startTime: "10:00", endTime: "19:00" }])
  }
  function removeRow(key: string){ setHoursDraft(d=> d.filter(r=> r.key!==key)) }
  function updateRow(key: string, patch: Partial<DraftRow>){ setHoursDraft(d=> d.map(r=> r.key===key? { ...r, ...patch } : r)) }
  function clearAll(){ setHoursDraft([]) }
  function saveAll(){
    const items = hoursDraft.map(r=> ({ weekday: Number(r.weekday), startTime: r.startTime, endTime: r.endTime }))
    if (items.some(it=> !/^\d{2}:\d{2}$/.test(it.startTime) || !/^\d{2}:\d{2}$/.test(it.endTime))) { toast("Use HH:MM format","error"); return }
    saveHours.mutate(items)
  }

  // Provider day appointments
  const appts = useQuery({ queryKey: ["provAppts", provId, date], queryFn: ()=> api.providerAppointments(provId!, date), enabled: !!provId && !!date })

  return (
    <div className="space-y-6">
      <div className="text-xl font-semibold">Provider Dashboard</div>

      {!provId ? (
        <div className="space-y-2 card card-pad">
          <div className="font-medium">Create provider profile</div>
          {!canCreateProvider ? (
            <div className="text-sm text-[--muted]">
              Your role is CLIENT. Ask admin to upgrade your role to PROVIDER.
            </div>
          ) : (
            <>
              <label className="text-sm text-[--muted]" htmlFor="prov-name">Name</label>
              <input id="prov-name" className="input" placeholder="Studio name" value={name} onChange={e=>setName(e.target.value)} />
              <label className="text-sm text-[--muted]" htmlFor="prov-desc">Description</label>
              <input id="prov-desc" className="input" placeholder="Short description" value={description} onChange={e=>setDescription(e.target.value)} />
              <label className="text-sm text-[--muted]" htmlFor="prov-addr">Address</label>
              <input id="prov-addr" className="input" placeholder="Street, building" value={address} onChange={e=>setAddress(e.target.value)} />
              <button className="btn btn-primary" onClick={()=>createProv.mutate()} disabled={createProv.isPending}>Create</button>
            </>
          )}
        </div>
      ) : (
        <>
          <div className="space-y-2 card card-pad">
            <div className="font-medium">My services</div>
            <div className="flex flex-wrap gap-2">
              <div className="grow min-w-[180px]">
                <label className="text-sm text-[--muted]" htmlFor="svc-title">Title</label>
                <input id="svc-title" className="input" placeholder="Classic manicure" value={svcTitle} onChange={e=>setSvcTitle(e.target.value)} />
              </div>
              <div>
                <label className="text-sm text-[--muted]" htmlFor="svc-category">Category</label>
                <select id="svc-category" className="input" value={svcCategoryId} onChange={e=>setSvcCategoryId(e.target.value)}>
                  <option value="">None</option>
                  {categories.data?.map((c:any)=> <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm text-[--muted]" htmlFor="svc-price">Price</label>
                <input id="svc-price" className="input w-28" placeholder="5000" type="number" value={svcPrice} onChange={e=>setSvcPrice(Number(e.target.value))} />
              </div>
              <div>
                <label className="text-sm text-[--muted]" htmlFor="svc-dur">Duration (min)</label>
                <input id="svc-dur" className="input w-28" placeholder="60" type="number" value={svcDur} onChange={e=>setSvcDur(Number(e.target.value))} />
              </div>
              <div className="self-end">
                <button className="btn btn-outline" onClick={()=>createSvc.mutate()} disabled={createSvc.isPending}>Add</button>
              </div>
            </div>
            <div className="grid gap-2">
              {services.data?.map((s:any)=> (
                <div key={s.id} className="card card-pad flex items-center justify-between">
                  <div>{s.title} {s.category && <span className="badge">{s.category.name}</span>} — {s.price} ({s.durationMin}m)</div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2 card card-pad">
            <div className="font-medium">Working hours</div>
            <div className="flex items-center gap-2">
              <button className="btn btn-outline" onClick={()=>setDefault.mutate()} disabled={setDefault.isPending}>
                Set default Mon–Fri 10:00–19:00
              </button>
              <button className="btn btn-primary" onClick={addRow}>Add interval</button>
              <button className="btn btn-outline" onClick={clearAll}>Clear</button>
              <button className="btn btn-outline" onClick={saveAll} disabled={saveHours.isPending}>Save</button>
            </div>
            <div className="grid gap-2">
              {hoursDraft.map(r=> (
                <div key={r.key} className="flex items-center gap-2">
                  <select className="input w-28" value={r.weekday} onChange={e=>updateRow(r.key, { weekday: Number(e.target.value) })}>
                    {weekdayLabels.map((lab, idx)=> <option key={idx+1} value={idx+1}>{lab}</option>)}
                  </select>
                  <input className="input w-28" placeholder="HH:MM" value={r.startTime} onChange={e=>updateRow(r.key, { startTime: e.target.value })} />
                  <span className="text-[--muted] text-sm">–</span>
                  <input className="input w-28" placeholder="HH:MM" value={r.endTime} onChange={e=>updateRow(r.key, { endTime: e.target.value })} />
                  <button className="btn btn-outline" onClick={()=>removeRow(r.key)}>Remove</button>
                </div>
              ))}
            </div>
            <div className="text-sm text-[--muted]">
              {(hoursDraft ?? []).length === 0 ? "No working hours yet" : null}
            </div>
          </div>

          <div className="space-y-2 card card-pad">
            <div className="font-medium">Appointments (by day)</div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-[--muted]" htmlFor="appt-date">Date</label>
              <input id="appt-date" type="date" className="input" value={date} onChange={e=>setDate(e.target.value)} />
            </div>
            <div className="grid gap-2">
              {appts.data?.map((a:any)=> <ApptRow key={a.id} a={a} />)}
              {appts.isLoading && <div className="text-sm text-[--muted]">Loading…</div>}
              {!appts.isLoading && (!appts.data || appts.data.length===0) && <div className="text-sm text-[--muted]">No appointments for this day.</div>}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function ApptRow({ a }:{ a:any }){
  const confirm = useMutation({ mutationFn: ()=> api.changeAppointment(a.id, "confirm"), onSuccess: ()=> { toast("Confirmed","success"); location.reload() }, onError: (e:any)=> toast(e?.message||"Error", "error") })
  const cancel  = useMutation({ mutationFn: ()=> api.changeAppointment(a.id, "cancel"),  onSuccess: ()=> { toast("Cancelled","success"); location.reload() }, onError: (e:any)=> toast(e?.message||"Error", "error") })
  return (
    <div className="card card-pad flex items-center gap-3">
      <div className="flex-1">
        <div className="font-medium">{new Date(a.startAt).toLocaleString()} — {a.serviceTitle||"—"}</div>
        <div className="text-sm text-[--muted]">{a.userEmail ? `client: ${a.userEmail}` : null} · status: {a.status}</div>
      </div>
      <button className="btn btn-outline" onClick={()=>confirm.mutate()} disabled={a.status==="CONFIRMED"}>Confirm</button>
      <button className="btn btn-outline" onClick={()=>cancel.mutate()}  disabled={a.status==="CANCELLED"}>Cancel</button>
    </div>
  )
}
