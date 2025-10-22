export type Role = "CLIENT" | "PROVIDER" | "ADMIN"

export const ROLE_LABELS: Record<Role, string> = {
  CLIENT: "Пользователь",
  PROVIDER: "Владелец бизнеса",
  ADMIN: "Администратор",
}
