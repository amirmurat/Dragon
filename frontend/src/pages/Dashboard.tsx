import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { useState } from "react"
import { useTitle } from "@/ui/useTitle"
import { toast } from "@/ui/Toast"

export default function Dashboard(){
  useTitle("Dashboard — Zapis")
  const qc = useQueryClient()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [address, setAddress] = useState("")
  const [date, setDate] = useState(()=> new Date().toISOString().slice(0,10))

  const me = useQuery({ queryKey: ["me"], queryFn: ()=> api.me() })

  const myProv = useQuery({ queryKey: ["myProvider"], queryFn: ()=> api.myProvider(), retry: false })
  const createProv = useMutation({
    mutationFn: ()=> api.createProvider({ name, description, address }),
    onSuccess: ()=> { toast("Profile created","success"); qc.invalidateQueries({ queryKey: ["myProvider"] }) },
    onError: (e:any)=> toast(e?.message||"Failed to create", "error")
  })

  const provId = (myProv.data as any)?.id
  const canCreateProvider = ["PROVIDER","ADMIN"].includes(me.data?.role)

  // Services
  const services = useQuery({ queryKey: ["myServices", provId], queryFn: ()=> api.providerServices(provId!), enabled: !!provId })
  const [svcTitle, setSvcTitle] = useState("")
  const [svcPrice, setSvcPrice] = useState(0)
  const [svcDur, setSvcDur] = useState(30)
  const createSvc = useMutation({
    mutationFn: ()=> api.createService(provId!, { title: svcTitle, price: Number(svcPrice), durationMin: Number(svcDur) }),
    onSuccess: ()=> { setSvcTitle(""); setSvcPrice(0); setSvcDur(30); toast("Service added","success"); qc.invalidateQueries({ queryKey: ["myServices", provId] }) },
    onError: (e:any)=> toast(e?.message||"Failed to add service", "error")
  })

  // Working hours
  const hours = useQuery({ queryKey: ["wh", provId], queryFn: ()=> api.getWorkingHours(provId!), enabled: !!provId })
  const setDefault = useMutation({
    mutationFn: ()=> api.setDefaultHours(provId!),
    onSuccess: ()=> { toast("Working hours set","success"); qc.invalidateQueries({ queryKey: ["wh", provId] }) },
    onError: (e:any)=> toast(e?.message||"Failed to set hours", "error")
  })

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
                  <div>{s.title} — {s.price} ({s.durationMin}m)</div>
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
            </div>
            <div className="text-sm text-[--muted]">
              {(hours.data ?? []).length === 0 ? "No working hours yet" : null}
            </div>
            <ul className="list-disc pl-6">
              {(hours.data ?? []).map((h:any)=>(
                <li key={h.id}>weekday {h.weekday}: {h.startTime}–{h.endTime}</li>
              ))}
            </ul>
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
