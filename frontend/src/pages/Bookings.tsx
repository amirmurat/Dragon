import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"

export default function Bookings(){
  const qc = useQueryClient()
  const { data } = useQuery({ queryKey: ["bookings"], queryFn: ()=> api.myBookings() })
  const cancel = useMutation({
    mutationFn: (id:string)=> api.changeAppointment(id, "cancel"),
    onSuccess: ()=> qc.invalidateQueries({ queryKey: ["bookings"] })
  })
  return (
    <div className="space-y-3">
      <div className="text-xl font-semibold">My bookings</div>
      <div className="grid gap-2">
        {(data ?? []).map((a: any)=>(
          <div key={a.id} className="border rounded p-3 flex items-center gap-3">
            <div className="flex-1">
              <div className="font-medium">{a.providerName}</div>
              <div className="text-sm">{new Date(a.startAt).toLocaleString()} — {new Date(a.endAt).toLocaleString()}</div>
              {a.serviceTitle && <div className="text-sm text-gray-600">{a.serviceTitle}</div>}
              <div className="text-xs text-gray-600">status: {a.status}</div>
            </div>
            {a.status !== "CANCELLED" && (
              <button className="px-2 py-1 border rounded" onClick={()=>cancel.mutate(a.id)}>Cancel</button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
