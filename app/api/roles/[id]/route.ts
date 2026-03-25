import { NextRequest, NextResponse } from "next/server"
import { requireAuth, requireWrite, apiError } from "@/lib/bff"
import { orgClient } from "@/lib/org-client"

type Params = { params: Promise<{ id: string }> }

export async function GET(_: NextRequest, { params }: Params) {
  const auth = await requireAuth()
  if ("error" in auth) return auth.error
  try {
    const { id } = await params
    return NextResponse.json(await orgClient.getRole(id))
  } catch (e) { return apiError(e) }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const auth = await requireWrite()
  if ("error" in auth) return auth.error
  try {
    const { id } = await params
    const body = await req.json()
    return NextResponse.json(await orgClient.updateRole(id, body))
  } catch (e) { return apiError(e) }
}

export async function DELETE(_: NextRequest, { params }: Params) {
  const auth = await requireWrite()
  if ("error" in auth) return auth.error
  try {
    const { id } = await params
    return NextResponse.json(await orgClient.deleteRole(id))
  } catch (e) { return apiError(e) }
}
