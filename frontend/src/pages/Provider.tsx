import { useQuery, useMutation } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { useParams } from "react-router-dom"
import { useState } from "react"

function fmt(iso: string){
  const d = new Date(iso)
  return d.toLocaleString()
}

export default function Provider(){
  const { id = "" } = useParams()
  const info = useQuery({ queryKey: ["provider", id], queryFn: ()=> api.provider(id) })
  const services = useQuery({ queryKey: ["services", id], queryFn: ()=> api.providerServices(id) })

  const [date, setDate] = useState("")
  const [serviceId, setServiceId] = useState<string>("")
  const [err, setErr] = useState<string| null>(null)

  const avail = useQuery({
    queryKey: ["avail", id, date, serviceId],
    queryFn: ()=> api.availability(id, date, serviceId || undefined),
    enabled: !!date
  })

  const create = useMutation({
    mutationFn: (payload: any)=> api.createAppointment(payload),
    onError: (e: any)=> {
      const m = String(e?.message||"").toLowerCase()
      if (m.includes("slot_taken")) setErr("This time is already booked.")
      else if (m.includes("outside_working_hours")) setErr("Selected time is outside working hours.")
      else if (m.includes("provider_time_off")) setErr("Provider is off on this day.")
      else if (m.includes("cannot_book_own_provider")) setErr("You cannot book your own provider.")
      else setErr("Booking failed.")
    },
    onSuccess: ()=> { setErr(null); alert("Booked! Check your bookings page.") }
  })

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">{info.data?.name || "Provider"}</h1>
      {info.data?.address && <div className="text-sm text-gray-600">{info.data.address}</div>}
      {info.data?.description && <div className="text-sm text-gray-600">{info.data.description}</div>}

      <div className="space-y-2">
        <div className="font-medium">Service</div>
        <select className="border px-2 py-2" value={serviceId} onChange={e=>setServiceId(e.target.value)}>
          <option value="">— any —</option>
          {(services.data ?? []).map((s:any)=> (
            <option key={s.id} value={s.id}>{s.title} — {s.price} ({s.durationMin}m)</option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <div className="font-medium">Date</div>
        <input type="date" className="border px-2 py-2" value={date} onChange={e=>setDate(e.target.value)} />
      </div>

      {err && <div className="text-red-600 text-sm">{err}</div>}

      <div className="grid gap-2">
        {(avail.data ?? []).map((iso:string)=> (
          <button key={iso} className="border rounded px-3 py-2 text-left hover:bg-gray-50"
                  onClick={()=> create.mutate({ providerId: id, serviceId: serviceId || null, startAt: iso })}>
            {fmt(iso)}
          </button>
        ))}
        {date && (avail.data?.length===0) && <div className="text-sm text-gray-600">No slots for this date.</div>}
      </div>
    </div>
  )
}
