import { NextRequest, NextResponse } from "next/server"
import { requireAuth, requireWrite, apiError } from "@/lib/bff"
import { orgClient } from "@/lib/org-client"

export async function POST(req: NextRequest) {
  const auth = await requireWrite()
  if ("error" in auth) return auth.error
  try {
    const body = await req.json()
    const data = await orgClient.createNode(body)
    return NextResponse.json(data)
  } catch (e) { return apiError(e) }
}
