import { createWriteStream, appendFileSync, mkdirSync } from "fs"
import path from "path"
import { fileURLToPath } from "url"
import morgan from "morgan"

const dirname = path.dirname(fileURLToPath(import.meta.url))
const logDir = path.join(dirname, "..", "logs")
mkdirSync(logDir, { recursive: true })
const accessPath = path.join(logDir, "access.log")
const activityPath = path.join(logDir, "activity.log")
const accessStream = createWriteStream(accessPath, { flags: "a" })

export const requestLogger = morgan("combined", { stream: accessStream })

export function logActivity(event, payload = {}) {
  const line = JSON.stringify({ ts: new Date().toISOString(), event, payload })
  appendFileSync(activityPath, line + "\n")
}

