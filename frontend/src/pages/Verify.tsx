import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { useNavigate, useSearchParams, Link } from "react-router-dom"
import { useTitle } from "@/ui/useTitle"
import { toast } from "@/ui/Toast"

export default function Verify(){
  useTitle("Verify email — MoonSalon")
  const [params] = useSearchParams()
  const token = params.get("token")
  const [status, setStatus] = useState<"loading"|"success"|"error">("loading")
  const nav = useNavigate()

  useEffect(()=>{
    if (!token) {
      setStatus("error")
      return
    }

    api.verifyEmail(token).then(()=>{
      setStatus("success")
      toast("Email verified! You can now log in", "success")
      setTimeout(()=> nav("/login"), 2000)
    }).catch((e:any)=>{
      console.error("Verification error:", e)
      setStatus("error")
      toast(e?.message || "Verification failed", "error")
    })
  }, [token, nav])

  return (
    <div className="max-w-md mx-auto card card-pad text-center">
      <h1 className="text-2xl font-semibold mb-4">Verify email</h1>
      {status === "loading" && (
        <div className="space-y-3">
          <div className="spinner mx-auto" />
          <p className="text-[--muted]">Verifying your email...</p>
        </div>
      )}
      {status === "success" && (
        <div className="space-y-3">
          <div className="text-4xl">✓</div>
          <p className="text-green-700">Your email has been verified!</p>
          <p className="text-sm text-[--muted]">Redirecting to login...</p>
        </div>
      )}
      {status === "error" && (
        <div className="space-y-3">
          <div className="text-4xl">✗</div>
          <p className="text-red-600">Verification failed</p>
          <p className="text-sm text-[--muted]">The link may be invalid or expired</p>
          <div className="flex flex-wrap gap-2 justify-center pt-2">
            <Link to="/login" className="btn btn-primary">Go to login</Link>
            <Link to="/register" className="btn btn-outline">Sign up</Link>
          </div>
        </div>
      )}
    </div>
  )
}

