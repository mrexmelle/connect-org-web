import { auth } from "@/auth"
import { resolveRole, canWrite } from "@/lib/roles"
import { NextResponse } from "next/server"

export async function requireAuth() {
  const session = await auth()
  if (!session?.user?.email) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  }
  const role = resolveRole(session.user.email)
  return { session, role }
}

export async function requireWrite() {
  const result = await requireAuth()
  if ("error" in result) return result
  if (!canWrite(result.role)) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) }
  }
  return result
}

export function apiError(e: unknown) {
  const message = e instanceof Error ? e.message : "Internal server error"
  return NextResponse.json({ error: message }, { status: 500 })
}
