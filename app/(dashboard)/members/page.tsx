"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function MembersPage() {
  const [ehid, setEhid] = useState("")
  const [submitted, setSubmitted] = useState("")

  const { data: nodesData, isLoading: loadingNodes } = useQuery({
    queryKey: ["member-nodes", submitted],
    enabled: !!submitted,
    queryFn: async () => {
      const res = await fetch(`/api/members/${submitted}/nodes`)
      if (!res.ok) throw new Error("Not found")
      return res.json()
    },
  })

  const { data: historyData, isLoading: loadingHistory } = useQuery({
    queryKey: ["member-history", submitted],
    enabled: !!submitted,
    queryFn: async () => {
      const res = await fetch(`/api/members/${submitted}/history`)
      if (!res.ok) throw new Error("Not found")
      return res.json()
    },
  })

  const currentNodes = nodesData?.data ?? []
  const history = historyData?.data ?? []

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold">Member Lookup</h2>
        <p className="text-sm text-muted-foreground">View an employee's current positions and history</p>
      </div>

      <div className="flex gap-2 items-center">
        <Label>EHID</Label>
        <Input
          className="w-60"
          placeholder="Employee EHID"
          value={ehid}
          onChange={(e) => setEhid(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && setSubmitted(ehid)}
        />
        <button
          className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
          onClick={() => setSubmitted(ehid)}
        >
          Search
        </button>
      </div>

      {submitted && (
        <>
          <section className="space-y-3">
            <h3 className="font-medium">Current Positions</h3>
            {loadingNodes && <p className="text-sm text-muted-foreground">Loading...</p>}
            {currentNodes.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Node ID</TableHead>
                    <TableHead>Node Name</TableHead>
                    <TableHead>Hierarchy</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentNodes.map((n: { id: string; name: string; hierarchy: string }) => (
                    <TableRow key={n.id}>
                      <TableCell>{n.id}</TableCell>
                      <TableCell>{n.name}</TableCell>
                      <TableCell><Badge variant="outline" className="font-mono text-xs">{n.hierarchy}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : !loadingNodes && <p className="text-sm text-muted-foreground">No current positions.</p>}
          </section>

          <section className="space-y-3">
            <h3 className="font-medium">Membership History</h3>
            {loadingHistory && <p className="text-sm text-muted-foreground">Loading...</p>}
            {history.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Node ID</TableHead>
                    <TableHead>Node Name</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((h: { node_id: string; node_name: string; start_date: string; end_date?: string }, i: number) => (
                    <TableRow key={i}>
                      <TableCell>{h.node_id}</TableCell>
                      <TableCell>{h.node_name}</TableCell>
                      <TableCell>{h.start_date}</TableCell>
                      <TableCell>{h.end_date ?? <span className="text-muted-foreground">Present</span>}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : !loadingHistory && <p className="text-sm text-muted-foreground">No history found.</p>}
          </section>
        </>
      )}
    </div>
  )
}
