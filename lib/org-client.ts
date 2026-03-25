/**
 * Server-side HTTP client for connect-org backend.
 * Never called from the browser — only from Next.js API routes (BFF layer).
 */

const BASE_URL = process.env.ORG_API_URL ?? "http://localhost:8081"

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data?.error ?? `Request failed: ${res.status}`)
  }

  return data as T
}

export const orgClient = {
  // Nodes
  getNode: (id: string) => request(`/nodes/${id}`),
  getNodeChildren: (id: string) => request(`/nodes/${id}/children`),
  getNodeLineage: (id: string) => request(`/nodes/${id}/lineage`),
  getNodeLineageSiblings: (id: string) => request(`/nodes/${id}/lineage-siblings`),
  getNodeOfficers: (id: string) => request(`/nodes/${id}/officers`),
  getNodeMembers: (id: string) => request(`/nodes/${id}/members`),
  createNode: (body: unknown) =>
    request("/nodes", { method: "POST", body: JSON.stringify(body) }),
  updateNode: (id: string, body: unknown) =>
    request(`/nodes/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteNode: (id: string) =>
    request(`/nodes/${id}`, { method: "DELETE" }),

  // Roles
  getRole: (id: string) => request(`/roles/${id}`),
  createRole: (body: unknown) =>
    request("/roles", { method: "POST", body: JSON.stringify(body) }),
  updateRole: (id: string, body: unknown) =>
    request(`/roles/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteRole: (id: string) =>
    request(`/roles/${id}`, { method: "DELETE" }),

  // Designations
  getDesignation: (id: string) => request(`/designations/${id}`),
  createDesignation: (body: unknown) =>
    request("/designations", { method: "POST", body: JSON.stringify(body) }),
  updateDesignation: (id: string, body: unknown) =>
    request(`/designations/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteDesignation: (id: string) =>
    request(`/designations/${id}`, { method: "DELETE" }),

  // Memberships
  getMembership: (id: string) => request(`/memberships/${id}`),
  createMembership: (body: unknown) =>
    request("/memberships", { method: "POST", body: JSON.stringify(body) }),
  updateMembership: (id: string, body: unknown) =>
    request(`/memberships/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteMembership: (id: string) =>
    request(`/memberships/${id}`, { method: "DELETE" }),

  // Members
  getMemberNodes: (ehid: string) => request(`/members/${ehid}/nodes`),
  getMemberHistory: (ehid: string) => request(`/members/${ehid}/history`),
}
