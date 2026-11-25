import * as React from "react"
import { Head, Link, router, useForm, usePage } from "@inertiajs/react"
import { Clock3, FilePenLine, Plus, Trash2 } from "lucide-react"
import { BudgetLayout } from "@/Layouts/BudgetLayout"
import { useRoute } from "@/composables/useRoute"

const statusStyle = {
  PENDING: "bg-amber-50 text-amber-700 ring-amber-600/20",
  APPROVED: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  REJECTED: "bg-rose-50 text-rose-700 ring-rose-600/20",
}

function money(value) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(value || 0))
}

export default function ClientIndex({ requests }) {
  const route = useRoute()
  const { flash } = usePage().props

  const withdraw = (id) => {
    if (window.confirm("Withdraw this request? This cannot be undone.")) {
      router.post(route("budget_request_withdraw", { budget_request_id: id }))
    }
  }

  return (
    <>
      <Head title="My budget requests" />
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">My requests</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">Funding proposals</h2>
        </div>
        <Link href={route("budget_request_create_page")} className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-slate-800">
          <Plus className="h-4 w-4" /> New request
        </Link>
      </div>

      {flash?.map((item, index) => (
        <div key={index} className="mb-4 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm">{item.message}</div>
      ))}

      <div className="grid gap-4">
        {requests.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <Clock3 className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-3 font-medium">No budget requests yet</p>
            <p className="mt-1 text-sm text-slate-500">Start by submitting a clear funding proposal.</p>
          </div>
        ) : requests.map((request) => (
          <article key={request.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold">{request.title}</h3>
                  <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ring-1 ring-inset ${statusStyle[request.status]}`}>{request.status}</span>
                </div>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{request.business_justification}</p>
                {request.feedback && (
                  <div className="mt-3 rounded-lg border-l-2 border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                    <span className="font-medium text-slate-800">Reviewer note:</span> {request.feedback}
                  </div>
                )}
              </div>
              <div className="shrink-0 text-right">
                <p className="text-lg font-semibold tabular-nums">{money(request.amount)}</p>
                <p className="mt-1 text-xs text-slate-400">#{request.id}</p>
              </div>
            </div>
            {request.status === "PENDING" && <PendingActions request={request} withdraw={withdraw} />}
          </article>
        ))}
      </div>
    </>
  )
}

function PendingActions({ request, withdraw }) {
  const route = useRoute()
  const [editing, setEditing] = React.useState(false)
  const { data, setData, post, processing } = useForm({
    title: request.title,
    amount: request.amount,
    business_justification: request.business_justification,
  })

  if (!editing) {
    return (
      <div className="mt-4 flex gap-4 border-t border-slate-100 pt-4">
        <button type="button" onClick={() => setEditing(true)} className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-950">
          <FilePenLine className="h-4 w-4" /> Edit
        </button>
        <button type="button" onClick={() => withdraw(request.id)} className="inline-flex items-center gap-2 text-sm font-medium text-rose-600 hover:text-rose-700">
          <Trash2 className="h-4 w-4" /> Withdraw
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={(event) => { event.preventDefault(); post(route("budget_request_update", { budget_request_id: request.id }), { preserveScroll: true, onSuccess: () => setEditing(false) }) }} className="mt-4 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-[1fr_180px]">
      <input value={data.title} onChange={(event) => setData("title", event.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" aria-label="Request title" />
      <input type="number" min="0.01" step="0.01" value={data.amount} onChange={(event) => setData("amount", event.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" aria-label="Amount" />
      <textarea rows="3" value={data.business_justification} onChange={(event) => setData("business_justification", event.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm sm:col-span-2" aria-label="Business justification" />
      <div className="flex gap-2 sm:col-span-2">
        <button type="submit" disabled={processing} className="rounded-lg bg-slate-950 px-3 py-2 text-sm font-medium text-white">Save changes</button>
        <button type="button" onClick={() => setEditing(false)} className="rounded-lg px-3 py-2 text-sm text-slate-500">Cancel</button>
      </div>
    </form>
  )
}

ClientIndex.layout = (page) => <BudgetLayout title="My requests">{page}</BudgetLayout>
