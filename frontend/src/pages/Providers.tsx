import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { Link } from "react-router-dom"
import { useEffect, useState } from "react"

export default function Providers(){
  const [q, setQ] = useState("")
  const [service, setService] = useState("")
  const [minPrice, setMinPrice] = useState<string>("")
  const [maxPrice, setMaxPrice] = useState<string>("")

  // простая задержка ввода
  const [debounced, setDebounced] = useState({ q, service, minPrice, maxPrice })
  useEffect(()=>{
    const id = setTimeout(()=> setDebounced({ q, service, minPrice, maxPrice }), 300)
    return ()=> clearTimeout(id)
  }, [q, service, minPrice, maxPrice])

  const { data, isLoading, error } = useQuery({
    queryKey: ["providers", debounced],
    queryFn: ()=> api.providers({
      q: debounced.q || undefined,
      service: debounced.service || undefined,
      minPrice: debounced.minPrice ? Number(debounced.minPrice) : undefined,
      maxPrice: debounced.maxPrice ? Number(debounced.maxPrice) : undefined
    })
  })

  return (
    <div className="space-y-4">
      <div className="text-xl font-semibold">Providers</div>

      <div className="grid md:grid-cols-4 gap-2">
        <input className="border px-3 py-2" placeholder="Search by name/address" value={q} onChange={e=>setQ(e.target.value)} />
        <input className="border px-3 py-2" placeholder="Service contains..." value={service} onChange={e=>setService(e.target.value)} />
        <input className="border px-3 py-2" placeholder="Min price" value={minPrice} onChange={e=>setMinPrice(e.target.value)} />
        <input className="border px-3 py-2" placeholder="Max price" value={maxPrice} onChange={e=>setMaxPrice(e.target.value)} />
      </div>

      {isLoading && <div>Loading…</div>}
      {error && <div className="text-red-600 text-sm">Failed to load providers</div>}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {(data ?? []).map((p:any)=>(
          <Link key={p.id} to={`/providers/${p.id}`} className="border rounded p-3 block hover:bg-gray-50">
            <div className="font-medium">{p.name}</div>
            {p.address && <div className="text-sm text-gray-600">{p.address}</div>}
            {p.description && <div className="text-sm text-gray-600 line-clamp-2">{p.description}</div>}
          </Link>
        ))}
        {(data?.length===0) && <div className="text-sm text-gray-600">No providers match the filters.</div>}
      </div>
    </div>
  )
}
