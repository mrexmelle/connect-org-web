"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { useSession } from "next-auth/react"
import { resolveRole, canWrite } from "@/lib/roles"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Pencil, Trash2 } from "lucide-react"

interface Membership { id: string; ehid: string; node_id: string; start_date: string; end_date?: string }
const empty: Partial<Membership> = { ehid: "", node_id: "", start_date: "", end_date: "" }

export default function MembershipsPage() {
  const qc = useQueryClient()
  const { data: session } = useSession()
  const writable = canWrite(resolveRole(session?.user?.email))
  const [searchId, setSearchId] = useState("")
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Partial<Membership>>(empty)
  const [isNew, setIsNew] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ["membership", searchId],
    enabled: !!searchId,
    queryFn: async () => {
      const res = await fetch(`/api/memberships/${searchId}`)
      if (!res.ok) throw new Error("Not found")
      return res.json()
    },
  })

  const membership: Membership | null = data?.data ?? null

  const save = useMutation({
    mutationFn: async (m: Partial<Membership>) => {
      const url = isNew ? "/api/memberships" : `/api/memberships/${m.id}`
      const method = isNew ? "POST" : "PATCH"
      const body = { ...m }
      if (!body.end_date) delete body.end_date
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      if (!res.ok) throw new Error((await res.json()).error)
    },
    onSuccess: () => { toast.success(isNew ? "Membership created" : "Membership updated"); qc.invalidateQueries({ queryKey: ["membership"] }); setOpen(false) },
    onError: (e: Error) => toast.error(e.message),
  })

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/memberships/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error((await res.json()).error)
    },
    onSuccess: () => { toast.success("Membership deleted"); qc.invalidateQueries({ queryKey: ["membership"] }) },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Memberships</h2>
          <p className="text-sm text-muted-foreground">Employee tenure in organizational positions</p>
        </div>
        {writable && (
          <Button size="sm" onClick={() => { setIsNew(true); setEditing(empty); setOpen(true) }}>
            <Plus className="w-4 h-4 mr-1" /> New Membership
          </Button>
        )}
      </div>

      <div className="flex gap-2 items-center">
        <Label>Membership ID</Label>
        <Input className="w-60" placeholder="Enter membership ID" onChange={(e) => setSearchId(e.target.value)} />
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}

      {membership && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>EHID</TableHead>
              <TableHead>Node ID</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              {writable && <TableHead className="w-24">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>{membership.id}</TableCell>
              <TableCell>{membership.ehid}</TableCell>
              <TableCell>{membership.node_id}</TableCell>
              <TableCell>{membership.start_date}</TableCell>
              <TableCell>{membership.end_date ?? "—"}</TableCell>
              {writable && (
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => { setIsNew(false); setEditing(membership); setOpen(true) }}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => remove.mutate(membership.id)}>
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              )}
            </TableRow>
          </TableBody>
        </Table>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{isNew ? "Create Membership" : "Edit Membership"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>EHID</Label><Input value={editing.ehid ?? ""} onChange={(e) => setEditing({ ...editing, ehid: e.target.value })} /></div>
            <div><Label>Node ID</Label><Input value={editing.node_id ?? ""} onChange={(e) => setEditing({ ...editing, node_id: e.target.value })} /></div>
            <div><Label>Start Date</Label><Input type="date" value={editing.start_date ?? ""} onChange={(e) => setEditing({ ...editing, start_date: e.target.value })} /></div>
            <div><Label>End Date <span className="text-muted-foreground">(optional)</span></Label><Input type="date" value={editing.end_date ?? ""} onChange={(e) => setEditing({ ...editing, end_date: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => save.mutate(editing)} disabled={save.isPending}>{save.isPending ? "Saving..." : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
