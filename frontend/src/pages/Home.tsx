import { Link } from "react-router-dom"
import { useTitle } from "@/ui/useTitle"
import { getToken, api } from "@/lib/api"
import { useQuery } from "@tanstack/react-query"

export default function Home(){
  useTitle("MoonSalon — Home")
  const token = getToken()
  const me = useQuery({ queryKey: ["me"], queryFn: ()=> api.me(), enabled: !!token, retry: false })
  const role = me.data?.role as ("CLIENT"|"PROVIDER"|"ADMIN"|undefined)
  const isOwner = role === "PROVIDER" || role === "ADMIN"

  return (
    <div className="space-y-6 md:space-y-10">
      <section className="card card-pad text-center" style={{background:"linear-gradient(180deg, var(--accent-50), transparent)"}}>
        <div className="mx-auto max-w-3xl space-y-4 md:space-y-5">
          <h1 className="font-display text-2xl md:text-3xl lg:text-4xl font-bold leading-tight">
            Your beauty — <span style={{color:"var(--brand-500)"}}>without waiting</span>
          </h1>
          <p className="text-[--muted]">
            Nails, hair, brows, massage — book top providers in a few clicks.
            No calls or long chats.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link to="/providers" className="btn btn-primary">Find a provider</Link>
            {!token ? (
              <>
                <Link to="/login" className="btn btn-ghost">Log in</Link>
                <Link to="/register" className="btn btn-outline">Sign up</Link>
              </>
            ) : (
              <>
                <Link to="/bookings" className="btn btn-outline">My bookings</Link>
                {isOwner && <Link to="/dashboard" className="btn btn-outline">Dashboard</Link>}
              </>
            )}
          </div>
          <div className="text-xs text-[--muted]">100+ providers already with MoonSalon</div>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-4">
        <div className="card card-pad space-y-2">
          <div className="badge">Fast</div>
          <div className="font-medium">Live slots</div>
          <p className="text-sm text-[--muted]">Pick a time — free slots appear instantly.</p>
        </div>
        <div className="card card-pad space-y-2">
          <div className="badge">Convenient</div>
          <div className="font-medium">No phone calls</div>
          <p className="text-sm text-[--muted]">Booking, confirmation and reminders — in one place.</p>
        </div>
        <div className="card card-pad space-y-2">
          <div className="badge">Elegant</div>
          <div className="font-medium">For women</div>
          <p className="text-sm text-[--muted]">Clean design with soft blush accents.</p>
        </div>
      </section>
    </div>
  )
}
