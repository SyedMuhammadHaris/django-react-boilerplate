import { Link, router, usePage } from "@inertiajs/react"
import { ClipboardList, Gavel, LayoutDashboard, LogOut, ShieldCheck } from "lucide-react"
import { useRoute } from "@/composables/useRoute"

export function BudgetLayout({ title, children }) {
  const { auth } = usePage().props
  const route = useRoute()
  const role = auth?.user?.role

  const items = role === "Client"
    ? [{ label: "My requests", href: route("budget_client_requests"), icon: ClipboardList }]
    : role === "Manager"
      ? [{ label: "Review queue", href: route("budget_manager_queue"), icon: Gavel }]
      : role === "Admin"
        ? [{ label: "Executive overview", href: route("budget_admin_dashboard"), icon: LayoutDashboard }]
        : []

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-slate-900">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200 bg-white p-5 lg:flex lg:flex-col">
        <Link href="/" className="flex items-center gap-3 px-2 py-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-white">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold tracking-tight">Budget office</p>
            <p className="text-xs text-slate-500">{role || "Workspace"}</p>
          </div>
        </Link>
        <nav className="mt-8 space-y-1">
          {items.map((item) => (
            <Link key={item.label} href={item.href} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-950">
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto rounded-xl border border-slate-200 p-3">
          <p className="truncate text-sm font-medium">{auth?.user?.first_name || auth?.user?.username}</p>
          <button type="button" onClick={() => router.post(route("logout"))} className="mt-3 flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-900">
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </div>
      </aside>
      <main className="lg:pl-64">
        <header className="border-b border-slate-200 bg-white/90 px-5 py-4 backdrop-blur lg:px-8">
          <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
        </header>
        <div className="mx-auto max-w-6xl p-5 lg:p-8">{children}</div>
      </main>
    </div>
  )
}
