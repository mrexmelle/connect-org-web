import { NextRequest, NextResponse } from "next/server"
import { requireAuth, apiError } from "@/lib/bff"
import { orgClient } from "@/lib/org-client"

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth()
  if ("error" in auth) return auth.error
  try {
    const { id } = await params
    return NextResponse.json(await orgClient.getNodeOfficers(id))
  } catch (e) { return apiError(e) }
}
