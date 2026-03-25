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

interface Designation { id: string; ehid: string; node_id: string; role_id: string }
const empty: Partial<Designation> = { ehid: "", node_id: "", role_id: "" }

export default function DesignationsPage() {
  const qc = useQueryClient()
  const { data: session } = useSession()
  const writable = canWrite(resolveRole(session?.user?.email))
  const [searchId, setSearchId] = useState("")
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Partial<Designation>>(empty)
  const [isNew, setIsNew] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ["designation", searchId],
    enabled: !!searchId,
    queryFn: async () => {
      const res = await fetch(`/api/designations/${searchId}`)
      if (!res.ok) throw new Error("Not found")
      return res.json()
    },
  })

  const designation: Designation | null = data?.data ?? null

  const save = useMutation({
    mutationFn: async (d: Partial<Designation>) => {
      const url = isNew ? "/api/designations" : `/api/designations/${d.id}`
      const method = isNew ? "POST" : "PATCH"
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(d) })
      if (!res.ok) throw new Error((await res.json()).error)
    },
    onSuccess: () => { toast.success(isNew ? "Designation created" : "Designation updated"); qc.invalidateQueries({ queryKey: ["designation"] }); setOpen(false) },
    onError: (e: Error) => toast.error(e.message),
  })

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/designations/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error((await res.json()).error)
    },
    onSuccess: () => { toast.success("Designation deleted"); qc.invalidateQueries({ queryKey: ["designation"] }) },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Designations</h2>
          <p className="text-sm text-muted-foreground">Assign employees to roles within nodes</p>
        </div>
        {writable && (
          <Button size="sm" onClick={() => { setIsNew(true); setEditing(empty); setOpen(true) }}>
            <Plus className="w-4 h-4 mr-1" /> New Designation
          </Button>
        )}
      </div>

      <div className="flex gap-2 items-center">
        <Label>Designation ID</Label>
        <Input className="w-60" placeholder="Enter designation ID" onChange={(e) => setSearchId(e.target.value)} />
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}

      {designation && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>EHID</TableHead>
              <TableHead>Node ID</TableHead>
              <TableHead>Role ID</TableHead>
              {writable && <TableHead className="w-24">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>{designation.id}</TableCell>
              <TableCell>{designation.ehid}</TableCell>
              <TableCell>{designation.node_id}</TableCell>
              <TableCell>{designation.role_id}</TableCell>
              {writable && (
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => { setIsNew(false); setEditing(designation); setOpen(true) }}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => remove.mutate(designation.id)}>
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
          <DialogHeader><DialogTitle>{isNew ? "Create Designation" : "Edit Designation"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>EHID</Label><Input value={editing.ehid ?? ""} onChange={(e) => setEditing({ ...editing, ehid: e.target.value })} /></div>
            <div><Label>Node ID</Label><Input value={editing.node_id ?? ""} onChange={(e) => setEditing({ ...editing, node_id: e.target.value })} /></div>
            <div><Label>Role ID</Label><Input value={editing.role_id ?? ""} onChange={(e) => setEditing({ ...editing, role_id: e.target.value })} /></div>
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
