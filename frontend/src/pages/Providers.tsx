import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { Link } from "react-router-dom"
import { toast } from "@/ui/Toast"
import { useTitle } from "@/ui/useTitle"

export default function Providers(){
  useTitle("Providers — MoonSalon")
  const [q, setQ] = useState("")
  const query = useQuery({
    queryKey: ["providers", q],
    queryFn: () => api.providers(q||undefined)
  })

  const loading = query.isLoading
  const error = query.error as any
  const items = Array.isArray(query.data) ? query.data : (query.data?.items || [])

  useEffect(()=>{
    if (error) toast(error?.message || "Failed to load", "error")
  }, [error])

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input className="input" placeholder="Search by name/address/description" value={q} onChange={e=>setQ(e.target.value)} />
        <button className="btn btn-primary" onClick={()=>query.refetch()} disabled={loading}>{loading? "Searching…" : "Search"}</button>
      </div>

      {error && (
        <div className="text-sm text-red-600">{error?.message || "Failed to load"}</div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {loading && Array.from({length:4}).map((_,i)=> (
          <div key={i} className="card card-pad">
            <div className="h-5 w-40 skeleton" />
            <div className="h-4 w-64 skeleton mt-2" />
            <div className="h-4 w-56 skeleton mt-2" />
          </div>
        ))}

        {!loading && items.length===0 && (
          <div className="md:col-span-2 text-center text-[--muted]">
            Nothing found. Try different search parameters.
          </div>
        )}

        {!loading && items.map((p:any)=>(
          <Link to={`/providers/${p.id}`} key={p.id} className="card card-pad hover:shadow-md transition">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-medium text-lg">{p.name}</div>
                {p.address && <div className="text-sm text-[--muted]">{p.address}</div>}
              </div>
              {p.rating && <div className="badge">★ {p.rating.toFixed?.(1) || p.rating}</div>}
            </div>
            {p.description && <div className="text-sm mt-2 line-clamp-2">{p.description}</div>}
          </Link>
        ))}
      </div>
    </div>
  )
}
