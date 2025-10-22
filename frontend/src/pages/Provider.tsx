import { useParams } from "react-router-dom"
import { useQuery, useMutation } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { useState } from "react"

export default function Provider(){
  const { id } = useParams()
  const { data: provider } = useQuery({ queryKey: ["provider", id], queryFn: ()=> api.provider(id!) })
  const { data: services } = useQuery({ queryKey: ["providerServices", id], queryFn: ()=> api.providerServices(id!) })
  const [date, setDate] = useState<string>("")
  const [serviceId, setServiceId] = useState<string>("")

  const { data: slots } = useQuery({
    queryKey: ["availability", id, date, serviceId],
    queryFn: ()=> (date ? api.availability(id!, date, serviceId || undefined) : Promise.resolve([])),
    enabled: Boolean(id && date)
  })

  const book = useMutation({
    mutationFn: (payload: any)=> api.createAppointment(payload),
    onSuccess: ()=> alert("Booked!")
  })

  return (
    <div className="space-y-4">
      {provider && (
        <div>
          <div className="text-xl font-semibold">{provider.name}</div>
          <div className="text-sm text-gray-600">{provider.address}</div>
        </div>
      )}

      <div className="flex gap-2 items-center">
        <select className="border px-2 py-2" value={serviceId} onChange={e=>setServiceId(e.target.value)}>
          <option value="">Select service (optional)</option>
          {services?.map((s: any)=> <option key={s.id} value={s.id}>{s.title} — {s.price}</option>)}
        </select>
        <input type="date" className="border px-2 py-2" value={date} onChange={e=>setDate(e.target.value)} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {(slots ?? []).map((t: string)=> (
          <button key={t} onClick={()=>book.mutate({ providerId: id, serviceId: serviceId || null, startAt: t })}
                  className="border rounded px-3 py-2 hover:bg-gray-50">
            {new Date(t).toLocaleString()}
          </button>
        ))}
      </div>
    </div>
  )
}
