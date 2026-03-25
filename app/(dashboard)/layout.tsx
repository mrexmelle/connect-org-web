import { auth } from "@/auth"
import { signOut } from "@/auth"
import { resolveRole } from "@/lib/roles"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Network, Shield, UserCheck, Users, Search, LogOut
} from "lucide-react"

const navItems = [
  { href: "/nodes",        label: "Nodes",        icon: Network },
  { href: "/roles",        label: "Roles",        icon: Shield },
  { href: "/designations", label: "Designations", icon: UserCheck },
  { href: "/memberships",  label: "Memberships",  icon: Users },
  { href: "/members",      label: "Member Lookup",icon: Search },
]

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect("/login")

  const role = resolveRole(session.user?.email)
  const initials = (session.user?.name ?? "?")
    .split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 border-r bg-gray-50 flex flex-col">
        <div className="px-5 py-4 border-b">
          <h1 className="font-semibold text-lg tracking-tight">Connect Org</h1>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-200 transition-colors"
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="px-4 py-4 border-t flex items-center gap-3">
          <Avatar className="w-8 h-8">
            <AvatarImage src={session.user?.image ?? ""} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{session.user?.name}</p>
            <Badge variant={role === "admin" ? "default" : "secondary"} className="text-xs mt-0.5">
              {role}
            </Badge>
          </div>
          <form action={async () => { "use server"; await signOut({ redirectTo: "/login" }) }}>
            <Button type="submit" variant="ghost" size="icon" title="Sign out">
              <LogOut className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-8">
        {children}
      </main>
    </div>
  )
}
