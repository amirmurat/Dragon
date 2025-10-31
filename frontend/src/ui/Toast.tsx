import { useEffect, useState } from "react"

type ToastItem = { id: number, type: "info"|"success"|"error", message: string }

let toasts: ToastItem[] = []
let listeners = new Set<(items: ToastItem[])=>void>()
let nextId = 1

function notify(){ listeners.forEach(l=> l([...toasts])) }

export function toast(message: string, type: "info"|"success"|"error" = "info"){
  const id = nextId++
  const item = { id, type, message }
  toasts = [...toasts, item]
  notify()
  window.setTimeout(()=> {
    toasts = toasts.filter(t=> t.id !== id)
    notify()
  }, 3000)
}

export function Toaster(){
  const [items, setItems] = useState<ToastItem[]>([])
  useEffect(()=>{
    const cb = (list: ToastItem[])=> setItems(list)
    listeners.add(cb)
    return ()=> { listeners.delete(cb) }
  }, [])

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {items.map(t=> (
        <div key={t.id} className="card card-pad min-w-[220px] shadow-md border toast-enter" style={{borderColor: t.type==="error"?"#fecaca": t.type==="success"?"#bbf7d0":"var(--brand-100)"}}>
          <div className="text-sm">
            {t.message}
          </div>
        </div>
      ))}
    </div>
  )
}
