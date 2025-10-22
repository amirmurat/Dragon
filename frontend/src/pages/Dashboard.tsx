import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { useState } from "react"

export default function Dashboard(){
  const qc = useQueryClient()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [address, setAddress] = useState("")
  const [date, setDate] = useState("")

  const me = useQuery({ queryKey: ["me"], queryFn: ()=> api.me() })

  const myProv = useQuery({ queryKey: ["myProvider"], queryFn: ()=> api.myProvider(), retry: false })
  const createProv = useMutation({
    mutationFn: ()=> api.createProvider({ name, description, address }),
    onSuccess: ()=> { qc.invalidateQueries({ queryKey: ["myProvider"] }) }
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
    onSuccess: ()=> { setSvcTitle(""); setSvcPrice(0); setSvcDur(30); qc.invalidateQueries({ queryKey: ["myServices", provId] }) }
  })

  // Working hours
  const hours = useQuery({ queryKey: ["wh", provId], queryFn: ()=> api.getWorkingHours(provId!), enabled: !!provId })
  const setDefault = useMutation({
    mutationFn: ()=> api.setDefaultHours(provId!),
    onSuccess: ()=> qc.invalidateQueries({ queryKey: ["wh", provId] })
  })

  // Provider day appointments
  const appts = useQuery({ queryKey: ["provAppts", provId, date], queryFn: ()=> api.providerAppointments(provId!, date), enabled: !!provId && !!date })

  return (
    <div className="space-y-6">
      <div className="text-xl font-semibold">Provider Dashboard</div>

      {!provId ? (
        <div className="space-y-2 border rounded p-3">
          <div className="font-medium">Create my provider</div>
          {!canCreateProvider ? (
            <div className="text-sm text-gray-700">
              Your role is CLIENT. Ask admin to upgrade your role to PROVIDER.
            </div>
          ) : (
            <>
              <input className="border px-3 py-2 w-full" placeholder="Name" value={name} onChange={e=>setName(e.target.value)} />
              <input className="border px-3 py-2 w-full" placeholder="Description" value={description} onChange={e=>setDescription(e.target.value)} />
              <input className="border px-3 py-2 w-full" placeholder="Address" value={address} onChange={e=>setAddress(e.target.value)} />
              <button className="px-3 py-2 border rounded" onClick={()=>createProv.mutate()}>Create</button>
            </>
          )}
        </div>
      ) : (
        <>
          <div className="space-y-2 border rounded p-3">
            <div className="font-medium">My services</div>
            <div className="flex gap-2">
              <input className="border px-2 py-2" placeholder="Title" value={svcTitle} onChange={e=>setSvcTitle(e.target.value)} />
              <input className="border px-2 py-2 w-28" placeholder="Price" type="number" value={svcPrice} onChange={e=>setSvcPrice(Number(e.target.value))} />
              <input className="border px-2 py-2 w-28" placeholder="Duration" type="number" value={svcDur} onChange={e=>setSvcDur(Number(e.target.value))} />
              <button className="px-3 py-2 border rounded" onClick={()=>createSvc.mutate()}>Add</button>
            </div>
            <div className="grid gap-2">
              {services.data?.map((s:any)=> (
                <div key={s.id} className="border rounded p-2 flex items-center justify-between">
                  <div>{s.title} — {s.price} ({s.durationMin}m)</div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2 border rounded p-3">
            <div className="font-medium">Working hours</div>
            <div className="flex items-center gap-2">
              <button className="px-3 py-2 border rounded" onClick={()=>setDefault.mutate()}>
                Set default Mon–Fri 10:00–19:00
              </button>
            </div>
            <div className="text-sm text-gray-700">
              {(hours.data ?? []).length === 0 ? "No working hours yet" : null}
            </div>
            <ul className="list-disc pl-6">
              {(hours.data ?? []).map((h:any)=>(
                <li key={h.id}>weekday {h.weekday}: {h.startTime}–{h.endTime}</li>
              ))}
            </ul>
          </div>

          <div className="space-y-2 border rounded p-3">
            <div className="font-medium">Appointments (by day)</div>
            <div className="flex items-center gap-2">
              <input type="date" className="border px-2 py-2" value={date} onChange={e=>setDate(e.target.value)} />
            </div>
            <div className="grid gap-2">
              {appts.data?.map((a:any)=> <ApptRow key={a.id} a={a} />)}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function ApptRow({ a }:{ a:any }){
  const confirm = useMutation({ mutationFn: ()=> api.changeAppointment(a.id, "confirm"), onSuccess: ()=> location.reload() })
  const cancel  = useMutation({ mutationFn: ()=> api.changeAppointment(a.id, "cancel"),  onSuccess: ()=> location.reload() })
  return (
    <div className="border rounded p-2 flex items-center gap-3">
      <div className="flex-1">
        <div className="font-medium">{new Date(a.startAt).toLocaleString()} — {a.serviceTitle||"—"}</div>
        <div className="text-sm text-gray-600">status: {a.status}</div>
      </div>
      <button className="px-2 py-1 border rounded" onClick={()=>confirm.mutate()} disabled={a.status==="CONFIRMED"}>Confirm</button>
      <button className="px-2 py-1 border rounded" onClick={()=>cancel.mutate()}  disabled={a.status==="CANCELLED"}>Cancel</button>
    </div>
  )
}
