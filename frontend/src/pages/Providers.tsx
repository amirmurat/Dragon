import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { Link } from "react-router-dom"
import { toast } from "@/ui/Toast"
import { useTitle } from "@/ui/useTitle"

export default function Providers(){
  useTitle("Providers — MoonSalon")
  const [q, setQ] = useState("")
  const [categoryId, setCategoryId] = useState<string>("")
  const [service, setService] = useState("")
  const [minPrice, setMinPrice] = useState("")
  const [maxPrice, setMaxPrice] = useState("")
  const [sortBy, setSortBy] = useState<"name"|"ratingAvg">("name")
  const [sortOrder, setSortOrder] = useState<"asc"|"desc">("asc")
  const [page, setPage] = useState(1)
  const pageSize = 6  
  
  const categories = useQuery({ queryKey: ["categories"], queryFn: () => api.categories() })
  
  const query = useQuery({
    queryKey: ["providers", q, categoryId, service, minPrice, maxPrice, sortBy, sortOrder, page],
    queryFn: () => api.providers({
      q: q || undefined,
      categoryId: categoryId || undefined,
      service: service || undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      sortBy,
      sortOrder,
      page,
      pageSize
    })
  })

  const loading = query.isLoading
  const error = query.error as any
  const data = query.data || { items: [], total: 0, page, pageSize }
  const items = Array.isArray(data) ? data : (data?.items || [])
  const total = data?.total || items.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const showingFrom = total ? (page - 1) * pageSize + 1 : 0
  const showingTo = total ? Math.min(page * pageSize, total) : 0

  useEffect(()=>{
    if (error) toast(error?.message || "Failed to load", "error")
  }, [error])

  return (
    <div className="space-y-4">
      <div className="grid gap-2 md:grid-cols-2">
        <input className="input" placeholder="Search by name/address/description" value={q} onChange={e=>{ setQ(e.target.value); setPage(1) }} />
        {categories.data && (
          <select className="input" value={categoryId} onChange={e=>{ setCategoryId(e.target.value); setPage(1) }}>
            <option value="">All categories</option>
            {categories.data.map((c:any) => (
              <option key={c.id} value={c.id}>{c.icon || ""} {c.name}</option>
            ))}
          </select>
        )}
        <input className="input" placeholder="Service keyword" value={service} onChange={e=>{ setService(e.target.value); setPage(1) }} />
        <div className="flex gap-2">
          <input className="input" type="number" min="0" placeholder="Min price" value={minPrice} onChange={e=>{ setMinPrice(e.target.value); setPage(1) }} />
          <input className="input" type="number" min="0" placeholder="Max price" value={maxPrice} onChange={e=>{ setMaxPrice(e.target.value); setPage(1) }} />
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-2 items-center justify-between">
        <div className="flex gap-2 w-full sm:w-auto">
          <select className="input" value={sortBy} onChange={e=>{ setSortBy(e.target.value as "name"|"ratingAvg"); setPage(1) }}>
            <option value="name">Sort by name</option>
            <option value="ratingAvg">Sort by rating</option>
          </select>
          <select className="input" value={sortOrder} onChange={e=>{ setSortOrder(e.target.value as "asc"|"desc"); setPage(1) }}>
            <option value="asc">Asc</option>
            <option value="desc">Desc</option>
          </select>
        </div>
        <button className="btn btn-primary whitespace-nowrap" onClick={()=>query.refetch()} disabled={loading}>{loading? "Searching…" : "Search"}</button>
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

        {!loading && items.map((p:any)=>{
          const ratingValue = typeof p.ratingAvg === "number" ? p.ratingAvg : null
          return (
          <Link to={`/providers/${p.id}`} key={p.id} className="card card-pad hover:shadow-md transition">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-medium text-lg">{p.name}</div>
                {p.address && <div className="text-sm text-[--muted]">{p.address}</div>}
              </div>
              {ratingValue !== null && <div className="badge">★ {ratingValue.toFixed(1)}</div>}
            </div>
            {p.description && <div className="text-sm mt-2 line-clamp-2">{p.description}</div>}
          </Link>
        )})}
      </div>
      {total > pageSize && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-sm text-[--muted]">
            Showing {showingFrom}-{showingTo} of {total}
          </div>
          <div className="flex gap-2">
            <button className="btn btn-outline" onClick={()=>setPage(p=>Math.max(1, p-1))} disabled={page===1 || loading}>Prev</button>
            <div className="text-sm text-[--muted]">Page {page} / {totalPages}</div>
            <button className="btn btn-outline" onClick={()=>setPage(p=>Math.min(totalPages, p+1))} disabled={page===totalPages || loading}>Next</button>
          </div>
        </div>
      )}
    </div>
  )
}
