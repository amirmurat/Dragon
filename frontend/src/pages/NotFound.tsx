import { Link } from "react-router-dom"
import { useTitle } from "@/ui/useTitle"

export default function NotFound(){
  useTitle("Page not found — Zapis")
  return (
    <div className="max-w-md mx-auto text-center">
      <div className="text-6xl font-display">404</div>
      <div className="mt-2 text-[--muted]">Page not found</div>
      <div className="mt-6 flex items-center justify-center gap-3">
        <Link to="/" className="btn btn-outline">Home</Link>
        <Link to="/providers" className="btn btn-primary">Providers</Link>
      </div>
    </div>
  )
}
