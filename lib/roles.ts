/**
 * Role resolution for connect-org-web.
 *
 * Currently backed by the ADMIN_EMAILS environment variable.
 * To migrate to a database: replace `isAdmin` with a DB lookup
 * (e.g. SELECT role FROM users WHERE email = ?) and keep the
 * rest of this file and all callers unchanged.
 */

export type UserRole = "admin" | "viewer"

export function resolveRole(email: string | null | undefined): UserRole {
  if (!email) return "viewer"
  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
  return adminEmails.includes(email.toLowerCase()) ? "admin" : "viewer"
}

export function canWrite(role: UserRole): boolean {
  return role === "admin"
}
