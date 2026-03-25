import { NextRequest, NextResponse } from "next/server"
import { requireAuth, apiError } from "@/lib/bff"
import { orgClient } from "@/lib/org-client"

export async function GET(_: NextRequest, { params }: { params: Promise<{ ehid: string }> }) {
  const auth = await requireAuth()
  if ("error" in auth) return auth.error
  try {
    const { ehid } = await params
    return NextResponse.json(await orgClient.getMemberHistory(ehid))
  } catch (e) { return apiError(e) }
}
