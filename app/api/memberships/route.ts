import { NextRequest, NextResponse } from "next/server"
import { requireWrite, apiError } from "@/lib/bff"
import { orgClient } from "@/lib/org-client"

export async function POST(req: NextRequest) {
  const auth = await requireWrite()
  if ("error" in auth) return auth.error
  try {
    const body = await req.json()
    return NextResponse.json(await orgClient.createMembership(body))
  } catch (e) { return apiError(e) }
}
