const BASE = "http://localhost:8080"

export function setToken(token: string | null) {
  if (!token) localStorage.removeItem("token")
  else localStorage.setItem("token", token)
}
export function getToken() { return localStorage.getItem("token") }

function qs(obj: Record<string, any>) {
  const p = Object.entries(obj).filter(([,v])=> v!==undefined && v!==null && v!=="")
  if (!p.length) return ""
  return "?" + p.map(([k,v])=> k+"="+encodeURIComponent(String(v))).join("&")
}

async function req(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers || {})
  headers.set("Content-Type", "application/json")
  const t = getToken()
  if (t) headers.set("Authorization", "Bearer " + t)
  const res = await fetch(BASE + path, { ...init, headers })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export const api = {
  // auth
  register: (email: string, password: string) => req("/auth/register", { method: "POST", body: JSON.stringify({ email, password }) }),
  login:    (email: string, password: string) => req("/auth/login",    { method: "POST", body: JSON.stringify({ email, password }) }),
  me: () => req("/auth/me"),

  // public
  providers: (opts?: { q?: string; service?: string; minPrice?: number; maxPrice?: number }) =>
    req("/providers" + qs(opts||{})),
  provider: (id: string) => req(`/providers/${id}`),
  providerServices: (id: string) => req(`/providers/${id}/services`),
  availability: (id: string, date: string, serviceId?: string) => req(`/providers/${id}/availability?date=${date}${serviceId?`&serviceId=${serviceId}`:""}`),

  // appointments
  createAppointment: (payload: any) => req("/appointments", { method: "POST", body: JSON.stringify(payload) }),
  myBookings: () => req("/appointments?mine=true"),
  changeAppointment: (id: string, action: "cancel"|"confirm") => req(`/appointments/${id}`, { method: "PATCH", body: JSON.stringify({ action }) }),

  // owner
  myProvider: async () => {
    const headers = new Headers()
    headers.set("Content-Type", "application/json")
    const t = getToken()
    if (t) headers.set("Authorization", "Bearer " + t)
    const res = await fetch(BASE + "/providers/me", { headers })
    if (res.status === 404 || res.status === 401) return null
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  },
  createProvider: (data: {name:string, description?:string, address?:string}) => req("/providers", { method: "POST", body: JSON.stringify(data) }),
  updateProvider: (id: string, data: any) => req(`/providers/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  createService: (id: string, data: {title:string, price:number, durationMin:number, isActive?:boolean}) => req(`/providers/${id}/services`, { method: "POST", body: JSON.stringify(data) }),
  updateService: (id: string, sid: string, data: any) => req(`/providers/${id}/services/${sid}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteService: (id: string, sid: string) => fetch(`${BASE}/providers/${id}/services/${sid}`, { method: "DELETE", headers: { "Authorization": "Bearer " + (getToken()||"") } }),
  providerAppointments: (id: string, date: string) => req(`/providers/${id}/appointments?date=${date}`),

  // hours
  getWorkingHours: (id: string) => req(`/providers/${id}/working-hours`),
  setWorkingHours: (id: string, items: Array<{weekday:number,startTime:string,endTime:string}>) =>
    req(`/providers/${id}/working-hours`, { method: "PUT", body: JSON.stringify(items) }),
  setDefaultHours: (id: string) => req(`/providers/${id}/working-hours/default`, { method: "POST" }),
}
export type API = typeof api
