"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { useSession } from "next-auth/react"
import { resolveRole, canWrite } from "@/lib/roles"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Pencil, Trash2, ChevronRight } from "lucide-react"

interface Node {
  id: string
  name: string
  hierarchy: string
  email?: string
}

const empty: Partial<Node> = { name: "", hierarchy: "", email: "" }

export default function NodesPage() {
  const qc = useQueryClient()
  const { data: session } = useSession()
  const role = resolveRole(session?.user?.email)
  const writable = canWrite(role)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Partial<Node>>(empty)
  const [isNew, setIsNew] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ["node", selectedId, "children"],
    enabled: !!selectedId,
    queryFn: async () => {
      const res = await fetch(`/api/nodes/${selectedId}/children`)
      if (!res.ok) throw new Error("Failed to load")
      return res.json()
    },
  })

  const nodes: Node[] = data?.data ?? []

  const save = useMutation({
    mutationFn: async (node: Partial<Node>) => {
      const url = isNew ? "/api/nodes" : `/api/nodes/${node.id}`
      const method = isNew ? "POST" : "PATCH"
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(node) })
      if (!res.ok) throw new Error((await res.json()).error)
    },
    onSuccess: () => {
      toast.success(isNew ? "Node created" : "Node updated")
      qc.invalidateQueries({ queryKey: ["node"] })
      setOpen(false)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/nodes/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error((await res.json()).error)
    },
    onSuccess: () => {
      toast.success("Node deleted")
      qc.invalidateQueries({ queryKey: ["node"] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  function openCreate() {
    setIsNew(true)
    setEditing(empty)
    setOpen(true)
  }

  function openEdit(node: Node) {
    setIsNew(false)
    setEditing(node)
    setOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Nodes</h2>
          <p className="text-sm text-muted-foreground">Organizational hierarchy nodes</p>
        </div>
        {writable && (
          <Button onClick={openCreate} size="sm">
            <Plus className="w-4 h-4 mr-1" /> New Node
          </Button>
        )}
      </div>

      <div className="flex gap-2 items-center">
        <Label>Node ID</Label>
        <Input
          className="w-60"
          placeholder="Enter node ID to browse children"
          onChange={(e) => setSelectedId(e.target.value || null)}
        />
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}

      {nodes.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Hierarchy</TableHead>
              <TableHead>Email</TableHead>
              {writable && <TableHead className="w-24">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {nodes.map((node) => (
              <TableRow key={node.id}>
                <TableCell>
                  <button
                    className="flex items-center gap-1 text-blue-600 hover:underline text-sm"
                    onClick={() => setSelectedId(node.id)}
                  >
                    {node.id} <ChevronRight className="w-3 h-3" />
                  </button>
                </TableCell>
                <TableCell>{node.name}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-mono text-xs">{node.hierarchy}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{node.email ?? "—"}</TableCell>
                {writable && (
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(node)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => remove.mutate(node.id)}>
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isNew ? "Create Node" : "Edit Node"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Name</Label>
              <Input value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            </div>
            <div>
              <Label>Hierarchy</Label>
              <Input
                value={editing.hierarchy ?? ""}
                placeholder="e.g. COMPANY.DIVISION.DEPT"
                onChange={(e) => setEditing({ ...editing, hierarchy: e.target.value })}
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={editing.email ?? ""} onChange={(e) => setEditing({ ...editing, email: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => save.mutate(editing)} disabled={save.isPending}>
              {save.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
