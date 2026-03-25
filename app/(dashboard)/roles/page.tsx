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

interface Role { id: string; name: string; rank: number; max_count: number }
const empty: Partial<Role> = { name: "", rank: 0, max_count: 0 }

export default function RolesPage() {
  const qc = useQueryClient()
  const { data: session } = useSession()
  const writable = canWrite(resolveRole(session?.user?.email))
  const [searchId, setSearchId] = useState("")
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Partial<Role>>(empty)
  const [isNew, setIsNew] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ["role", searchId],
    enabled: !!searchId,
    queryFn: async () => {
      const res = await fetch(`/api/roles/${searchId}`)
      if (!res.ok) throw new Error("Not found")
      return res.json()
    },
  })

  const role: Role | null = data?.data ?? null

  const save = useMutation({
    mutationFn: async (r: Partial<Role>) => {
      const url = isNew ? "/api/roles" : `/api/roles/${r.id}`
      const method = isNew ? "POST" : "PATCH"
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(r) })
      if (!res.ok) throw new Error((await res.json()).error)
    },
    onSuccess: () => { toast.success(isNew ? "Role created" : "Role updated"); qc.invalidateQueries({ queryKey: ["role"] }); setOpen(false) },
    onError: (e: Error) => toast.error(e.message),
  })

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/roles/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error((await res.json()).error)
    },
    onSuccess: () => { toast.success("Role deleted"); qc.invalidateQueries({ queryKey: ["role"] }) },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Roles</h2>
          <p className="text-sm text-muted-foreground">Job roles with rank and capacity</p>
        </div>
        {writable && (
          <Button size="sm" onClick={() => { setIsNew(true); setEditing(empty); setOpen(true) }}>
            <Plus className="w-4 h-4 mr-1" /> New Role
          </Button>
        )}
      </div>

      <div className="flex gap-2 items-center">
        <Label>Role ID</Label>
        <Input className="w-60" placeholder="Enter role ID" onChange={(e) => setSearchId(e.target.value)} />
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}

      {role && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Rank</TableHead>
              <TableHead>Max Count</TableHead>
              {writable && <TableHead className="w-24">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>{role.id}</TableCell>
              <TableCell>{role.name}</TableCell>
              <TableCell>{role.rank}</TableCell>
              <TableCell>{role.max_count}</TableCell>
              {writable && (
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => { setIsNew(false); setEditing(role); setOpen(true) }}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => remove.mutate(role.id)}>
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
          <DialogHeader><DialogTitle>{isNew ? "Create Role" : "Edit Role"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Name</Label><Input value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></div>
            <div><Label>Rank</Label><Input type="number" value={editing.rank ?? 0} onChange={(e) => setEditing({ ...editing, rank: Number(e.target.value) })} /></div>
            <div><Label>Max Count</Label><Input type="number" value={editing.max_count ?? 0} onChange={(e) => setEditing({ ...editing, max_count: Number(e.target.value) })} /></div>
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
