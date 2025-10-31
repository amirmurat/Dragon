import { Link } from "react-router-dom"
import { useTitle } from "@/ui/useTitle"

export default function Home(){
  useTitle("Zapis — Home")
  return (
    <div className="space-y-10">
      <section className="card card-pad text-center" style={{background:"linear-gradient(180deg, var(--brand-50), transparent)"}}>
        <div className="mx-auto max-w-3xl space-y-5">
          <h1 className="font-display text-3xl md:text-4xl font-bold leading-tight">
            Your beauty — <span className="text-[--brand-700]">without waiting</span>
          </h1>
          <p className="text-[--muted]">
            Nails, hair, brows, massage — book top providers in a few clicks.
            No calls or long chats.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link to="/providers" className="btn btn-primary">Find a provider</Link>
            <Link to="/login" className="btn btn-ghost">Log in</Link>
          </div>
          <div className="text-xs text-[--muted]">100+ providers already with us</div>
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
          <div className="badge">Trusted</div>
          <div className="font-medium">Verified providers</div>
          <p className="text-sm text-[--muted]">Profiles, services and prices — transparent, no surprises.</p>
        </div>
      </section>
    </div>
  )
}
