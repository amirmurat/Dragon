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
  const ct = res.headers.get("content-type") || ""
  const isJson = ct.includes("application/json")
  const body = isJson ? await res.json().catch(()=> ({})) : await res.text().catch(()=> "")

  if (res.status === 401) {
    // токен невалиден/нет прав -> выходим и на /login
    setToken(null)
    try { location.href = "/login" } catch {}
    throw new Error("unauthorized")
  }
  if (!res.ok) {
    const msg = (isJson ? (body?.error || body?.message) : body) || `HTTP ${res.status}`
    throw new Error(String(msg))
  }
  return isJson ? body : JSON.parse(String(body||"{}"))
}

export const api = {
  // auth
  register: (email: string, password: string) =>
    req("/auth/register", { method: "POST", body: JSON.stringify({ email, password }) }),
  login: (email: string, password: string) =>
    req("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  me: () => req("/auth/me"),
  verifyEmail: (token: string) =>
    req(`/auth/verify?token=${encodeURIComponent(token)}`),

  // public (теперь после логина)
  providers: (opts?: { q?: string; service?: string; categoryId?: string; minPrice?: number; maxPrice?: number; page?: number; pageSize?: number; sortBy?: string; sortOrder?: string }) =>
    req("/providers" + qs(opts||{})),
  provider: (id: string) => req(`/providers/${id}`),
  providerServices: (id: string) => req(`/providers/${id}/services`),
  availability: (id: string, date: string, serviceId?: string) =>
    req(`/providers/${id}/availability?date=${date}${serviceId?`&serviceId=${serviceId}`:""}`),

  // appointments
  createAppointment: (payload: any) => req("/appointments", { method: "POST", body: JSON.stringify(payload) }),
  myBookings: (opts?: { page?: number; pageSize?: number; status?: string[]; dateFrom?: string; dateTo?: string; sortBy?: string; sortOrder?: string }) => {
    const params: Record<string, any> = { mine: true, ...(opts || {}) }
    if (Array.isArray(params.status)) params.status = params.status.join(",")
    return req("/appointments" + qs(params))
  },
  changeAppointment: (id: string, action: "cancel"|"confirm") =>
    req(`/appointments/${id}`, { method: "PATCH", body: JSON.stringify({ action }) }),

  // owner
  myProvider: async () => {
    const headers = new Headers()
    headers.set("Content-Type", "application/json")
    const t = getToken()
    if (t) headers.set("Authorization", "Bearer " + t)
    const res = await fetch(BASE + "/providers/me", { headers })
    if (res.status === 404) return null
    if (res.status === 401) { setToken(null); try{ location.href="/login" }catch{}; return null }
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  },
  createProvider: (data: {name:string, description?:string, address?:string}) =>
    req("/providers", { method: "POST", body: JSON.stringify(data) }),
  updateProvider: (id: string, data: any) =>
    req(`/providers/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  createService: (id: string, data: {title:string, price:number, durationMin:number, isActive?:boolean, categoryId?:string}) =>
    req(`/providers/${id}/services`, { method: "POST", body: JSON.stringify(data) }),
  updateService: (id: string, sid: string, data: any) =>
    req(`/providers/${id}/services/${sid}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteService: (id: string, sid: string) =>
    req(`/providers/${id}/services/${sid}`, { method: "DELETE" }),

  // hours
  getWorkingHours: (id: string) => req(`/providers/${id}/working-hours`),
  setWorkingHours: (id: string, items: Array<{weekday:number,startTime:string,endTime:string}>) =>
    req(`/providers/${id}/working-hours`, { method: "PUT", body: JSON.stringify(items) }),
  setDefaultHours: (id: string) => req(`/providers/${id}/working-hours/default`, { method: "POST" }),

  // provider day appointments (owner/admin)
  providerAppointments: (id: string, date: string) =>
    req(`/providers/${id}/appointments?date=${encodeURIComponent(date)}`),

  // categories
  categories: () => req("/providers/categories"),
}
export type API = typeof api
