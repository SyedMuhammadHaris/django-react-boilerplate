import { Head, router } from "@inertiajs/react"
import { CircleDollarSign, FileText, Trash2 } from "lucide-react"
import { BudgetLayout } from "@/Layouts/BudgetLayout"
import { useRoute } from "@/composables/useRoute"

function money(value) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(value || 0))
}

export default function AdminDashboard({ totals, requests }) {
  const route = useRoute()

  const remove = (request) => {
    if (window.confirm(`Permanently delete "${request.title}"? This cannot be undone.`)) {
      router.post(route("budget_request_delete", { budget_request_id: request.id }))
    }
  }

  return (
    <>
      <Head title="Budget administration" />
      <div className="mb-6">
        <p className="text-sm font-medium text-slate-500">Executive overview</p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight">Budget administration</h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Metric title="Pending funding" value={money(totals.pending)} icon={CircleDollarSign} accent="text-amber-700 bg-amber-50" />
        <Metric title="Approved funding" value={money(totals.approved)} icon={CircleDollarSign} accent="text-emerald-700 bg-emerald-50" />
        <Metric title="All requests" value={totals.count} icon={FileText} accent="text-slate-700 bg-slate-100" />
      </div>

      <section className="mt-8">
        <h3 className="mb-3 text-sm font-semibold">All requests</h3>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          {requests.length === 0 ? (
            <p className="p-8 text-center text-sm text-slate-500">No budget requests have been submitted.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                  <tr><th className="px-4 py-3">Request</th><th className="px-4 py-3">Requester</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Action</th></tr>
                </thead>
                <tbody>
                  {requests.map((request) => (
                    <tr key={request.id} className="border-b border-slate-100 last:border-0">
                      <td className="max-w-xs px-4 py-4"><p className="font-medium">{request.title}</p><p className="mt-1 truncate text-xs text-slate-500">{request.business_justification}</p></td>
                      <td className="px-4 py-4 text-slate-600">{request.requesting_user.name}</td>
                      <td className="px-4 py-4 font-semibold tabular-nums">{money(request.amount)}</td>
                      <td className="px-4 py-4"><span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">{request.status}</span></td>
                      <td className="px-4 py-4 text-right"><button type="button" onClick={() => remove(request)} className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-rose-50 hover:text-rose-700" aria-label={`Delete ${request.title}`}><Trash2 className="h-4 w-4" /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </>
  )
}

function Metric({ title, value, icon: Icon, accent }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div><p className="text-sm text-slate-500">{title}</p><p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">{value}</p></div>
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${accent}`}><Icon className="h-4 w-4" /></div>
      </div>
    </div>
  )
}

AdminDashboard.layout = (page) => <BudgetLayout title="Budget administration">{page}</BudgetLayout>
