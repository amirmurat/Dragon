import "dotenv/config"

const BASE = "http://localhost:8080"

async function mustJson(res){
  if (!res.ok) throw new Error(`HTTP ${res.status} ${await res.text().catch(()=> "")}`)
  return res.json()
}

const email = process.argv[2]
const pass  = process.argv[3]
if (!email || !pass) {
  console.error("Usage: node scripts/smoke.mjs email password")
  process.exit(1)
}

const health = await fetch(`${BASE}/api/health`)
console.log("health:", health.status, await health.text())

const login = await fetch(`${BASE}/auth/login`, {
  method:"POST", headers:{"Content-Type":"application/json"},
  body: JSON.stringify({ email, password: pass })
})
const loginJson = await mustJson(login)
console.log("login:", { hasToken: !!loginJson.token, user: loginJson.user })

const me = await fetch(`${BASE}/auth/me`, {
  headers: { Authorization: `Bearer ${loginJson.token}` }
})
console.log("me:", await mustJson(me))

const admin = await fetch(`${BASE}/admin/users`, {
  headers: { Authorization: `Bearer ${loginJson.token}` }
})
console.log("admin/users:", admin.status, admin.status===200? await admin.json(): await admin.text())
