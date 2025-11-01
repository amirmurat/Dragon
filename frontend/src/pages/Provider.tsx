import { useParams } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { useEffect, useMemo, useState } from "react"
import { useTitle } from "@/ui/useTitle"
import { toast } from "@/ui/Toast"

export default function Provider(){
  const { id="" } = useParams()
  const qc = useQueryClient()
  const info = useQuery({ queryKey:["provider", id], queryFn: ()=> api.provider(id) })
  const services = useQuery({ queryKey:["services", id], queryFn: ()=> api.providerServices(id) })
  const [date, setDate] = useState(()=> new Date().toISOString().slice(0,10))
  const [serviceId, setServiceId] = useState<string>("")

  useTitle(info.data?.name ? `${info.data.name} — MoonSalon` : "Provider — MoonSalon")

  const loadingInfo = info.isLoading
  const loadingServices = services.isLoading

  const selectedService = useMemo(()=> services.data?.find((s:any)=> s.id===serviceId), [services.data, serviceId])

  const slots = useQuery({
    queryKey: ["availability", id, date, serviceId||"none"],
    queryFn: ()=> api.availability(id, date, serviceId || undefined),
    enabled: !!id && !!date,
  })

  const book = useMutation({
    mutationFn: async (startIso: string)=>{
      const durMin = Number(selectedService?.durationMin || 30)
      const start = new Date(startIso)
      const end = new Date(start.getTime() + durMin*60000)
      await api.createAppointment({ providerId: id, serviceId: serviceId || undefined, startAt: start.toISOString(), endAt: end.toISOString() })
    },
    onSuccess: ()=> { toast("Booking created","success"); qc.invalidateQueries({ queryKey: ["bookings"] }) },
    onError: (e:any)=> toast(e?.message||"Failed to create booking","error")
  })

  return (
    <div className="grid md:grid-cols-3 gap-4 md:gap-6">
      <div className="md:col-span-2 space-y-3">
        <div className="card card-pad">
          {loadingInfo ? (
            <>
              <div className="h-7 w-64 skeleton" />
              <div className="h-4 w-80 skeleton mt-2" />
              <div className="h-4 w-72 skeleton mt-2" />
            </>
          ) : (
            <>
              <div className="font-display text-2xl font-semibold">{info.data?.name || "—"}</div>
              {info.data?.address && <div className="text-[--muted]">{info.data.address}</div>}
              {info.data?.description && <div className="mt-2">{info.data.description}</div>}
            </>
          )}
        </div>

        <div className="card card-pad">
          <div className="font-medium mb-2">Services</div>
          <div className="grid sm:grid-cols-2 gap-3">
            {loadingServices && Array.from({length:4}).map((_,i)=> (
              <div key={i} className="border p-3">
                <div className="h-5 w-40 skeleton" />
                <div className="h-4 w-24 skeleton mt-2" />
              </div>
            ))}

            {!loadingServices && services.data?.length===0 && (
              <div className="text-sm text-[--muted]">No published services yet.</div>
            )}

            {!loadingServices && services.data?.map((s:any)=>(
              <button key={s.id} type="button" className={"border p-3 w-full text-left cursor-pointer transition-all duration-200 "+(serviceId===s.id?"bg-[--accent-50] border-[--brand-500] shadow-md":"hover:bg-[--accent-50] hover:shadow-md border-[--accent-100]")} onClick={()=>setServiceId(s.id)}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{s.title} {s.category && <span className="badge">{s.category.name}</span>}</div>
                    <div className="text-sm text-[--muted]">{s.durationMin} min</div>
                  </div>
                  <div className="font-medium">{s.price} ₸</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <aside className="space-y-3 md:sticky md:top-20 h-max">
        <div className="card card-pad space-y-3">
          <div className="font-medium">Booking</div>
          <input type="date" className="input" value={date} onChange={e=>setDate(e.target.value)} />
          <div className="text-sm text-[--muted]">Pick a service first, then a slot for the date.</div>
          <div className="space-y-2">
            {slots.isLoading && (
              <div className="text-sm text-[--muted]">Loading slots…</div>
            )}
            {!slots.isLoading && (!slots.data || slots.data.length===0) && (
              <div className="text-sm text-[--muted]">No available slots for the selected date.</div>
            )}
            {!slots.isLoading && (slots.data||[]).length>0 && (
              <div className="grid grid-cols-2 gap-2">
                {(slots.data as string[]).map((iso)=>{
                  const d = new Date(iso)
                  const label = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                  const disabled = !serviceId || book.isPending
                  return (
                    <button key={iso} className="btn btn-outline" onClick={()=> book.mutate(iso)} disabled={disabled}>
                      {label}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </aside>
    </div>
  )
}
