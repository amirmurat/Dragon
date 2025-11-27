import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { toast } from "@/ui/Toast"
import { useTitle } from "@/ui/useTitle"

export default function Bookings(){
  useTitle("My bookings — MoonSalon")
  const qc = useQueryClient()
  const [statusPreset, setStatusPreset] = useState<"active"|"all"|"cancelled">("active")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [sortOrder, setSortOrder] = useState<"asc"|"desc">("desc")
  const [page, setPage] = useState(1)
  const pageSize = 5

  const selectedStatuses = statusPreset === "active" ? ["BOOKED","CONFIRMED"] : statusPreset === "cancelled" ? ["CANCELLED"] : undefined

  const query = useQuery({
    queryKey: ["bookings", statusPreset, dateFrom, dateTo, sortOrder, page],
    queryFn: ()=> api.myBookings({
      status: selectedStatuses,
      dateFrom: dateFrom ? `${dateFrom}T00:00:00Z` : undefined,
      dateTo: dateTo ? `${dateTo}T23:59:59Z` : undefined,
      sortOrder,
      page,
      pageSize
    })
  })
  const data = query.data || { items: [], total: 0, page, pageSize }
  const items = Array.isArray(data) ? data : (data?.items || [])
  const total = data?.total || items.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const cancel = useMutation({
    mutationFn: (id:string)=> api.changeAppointment(id, "cancel"),
    onSuccess: ()=> { toast("Booking cancelled","success"); qc.invalidateQueries({ queryKey: ["bookings"] }) },
    onError: (e:any)=> toast(e?.message||"Failed to cancel", "error")
  })
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xl font-semibold">My bookings</div>
        <div className="flex gap-2">
          <select className="input" value={statusPreset} onChange={e=>{ setStatusPreset(e.target.value as "active"|"cancelled"|"all"); setPage(1) }}>
                <option value="active">Active</option>
                <option value="cancelled">Cancelled</option>
                <option value="all">All</option>
          </select>
          <select className="input" value={sortOrder} onChange={e=>{ setSortOrder(e.target.value as "asc"|"desc"); setPage(1) }}>
            <option value="desc">Newest first</option>
            <option value="asc">Oldest first</option>
          </select>
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <input className="input" type="date" value={dateFrom} onChange={e=>{ setDateFrom(e.target.value); setPage(1) }} placeholder="From date" />
        <input className="input" type="date" value={dateTo} onChange={e=>{ setDateTo(e.target.value); setPage(1) }} placeholder="To date" />
      </div>
      <div className="grid gap-2">
        {items.length===0 && (
          <div className="text-sm text-[--muted]">No bookings match filters.</div>
        )}
        {items.map((a: any)=>(
          <div key={a.id} className="card card-pad">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <div className="flex-1">
                <div className="font-medium">{a.providerName}</div>
                <div className="text-sm">{new Date(a.startAt).toLocaleString()} — {new Date(a.endAt).toLocaleString()}</div>
                {a.serviceTitle && <div className="text-sm text-[--muted]">{a.serviceTitle}</div>}
                <div className="text-xs text-[--muted]">status: {a.status}</div>
              </div>
              {a.status !== "CANCELLED" && (
                <button className="btn btn-outline" onClick={()=>cancel.mutate(a.id)} disabled={cancel.isPending}>Cancel</button>
              )}
            </div>
          </div>
        ))}
      </div>
      {total > pageSize && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-sm text-[--muted]">Page {page} of {totalPages}</div>
          <div className="flex gap-2">
            <button className="btn btn-outline" onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1 || query.isLoading}>Prev</button>
            <button className="btn btn-outline" onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages || query.isLoading}>Next</button>
          </div>
        </div>
      )}
    </div>
  )
}
