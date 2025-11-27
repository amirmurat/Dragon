import { Link } from "react-router-dom"
import { useTitle } from "@/ui/useTitle"
import { getToken, api } from "@/lib/api"
import { useQuery } from "@tanstack/react-query"

const collections = [
  { title: "Hair & styling", desc: "Cuts, color, glossy blowouts", img: "https://makeup.ru/storage/articles/156361/conversions/J3rINpyJcUzSvTiOktJwoRW1YQGsPMtFZrZIltvM-content_front.jpg?resized" },
  { title: "Makeup artistry", desc: "Soft glam, bridal, editorial looks", img: "https://oblaka4you.ru/thumb/2/DHTSVXVCHPRmGFXU10KooA/800r450/d/lvechermak_22.jpg" },
  { title: "Brows & lashes", desc: "Lamination, shaping, lash volume", img: "https://stepen.ua/content/news/001000-002000/brovi-zalog-idealnogo-vneshnego-vida-li_orig_1722.jpg" },
  { title: "Nails & art", desc: "Chrome, French, signature gel", img: "https://s0.rbk.ru/v6_top_pics/media/img/8/81/347470478098818.jpeg" }
]

const features = [
  { tag: "Fast", title: "Live slots", desc: "Pick a time, free slots appear instantly in your timezone." },
  { tag: "Convenient", title: "No phone calls", desc: "All confirmations, reminders and changes stay inside MoonSalon." },
  { tag: "Elegant", title: "For women", desc: "Soft blush palette, calm typography, one-handed navigation." },
  { tag: "Trusted", title: "Curated salons", desc: "Only verified studios with 4.5★+ ratings join the platform." }
]

const stats = [
  { value: "120+", label: "providers" },
  { value: "35", label: "cities & districts" },
  { value: "4.8★", label: "average rating" }
]

export default function Home(){
  useTitle("MoonSalon — Home")
  const token = getToken()
  const me = useQuery({ queryKey: ["me"], queryFn: ()=> api.me(), enabled: !!token, retry: false })
  const role = me.data?.role as ("CLIENT"|"PROVIDER"|"ADMIN"|undefined)
  const isOwner = role === "PROVIDER" || role === "ADMIN"

  return (
    <div className="home-shell">
      <section className="hero-section">
        <div className="hero-text">
          <p className="hero-label">Beauty concierge</p>
          <h1>Your beauty, without waiting</h1>
          <p>Nails, hair, brows, massage. Book women-led studios in two clicks, no calls or long chats.</p>
          <div className="hero-actions">
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
        </div>
        <div className="hero-photo" />
      </section>

      <section className="stats-row">
        {stats.map(item=>(
          <div key={item.label}>
            <div className="stats-value">{item.value}</div>
            <div className="stats-label">{item.label}</div>
          </div>
        ))}
      </section>

      <section className="collections-grid">
        {collections.map(card=>(
          <div key={card.title} className="collection-card">
            <img src={card.img} alt={card.title} loading="lazy" />
            <div className="collection-overlay">
              <div className="collection-title">{card.title}</div>
              <p>{card.desc}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="feature-grid">
        {features.map(item=>(
          <div key={item.title} className="feature-card">
            <div className="badge">{item.tag}</div>
            <div className="feature-title">{item.title}</div>
            <p>{item.desc}</p>
          </div>
        ))}
      </section>
    </div>
  )
}
