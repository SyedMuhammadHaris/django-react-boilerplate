import { Head, useForm } from "@inertiajs/react"
import { Check, Clock3, X } from "lucide-react"
import { BudgetLayout } from "@/Layouts/BudgetLayout"
import { useRoute } from "@/composables/useRoute"

function money(value) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(value || 0))
}

function ReviewCard({ request }) {
  const route = useRoute()
  const { data, setData, post, processing, reset } = useForm({ status: "APPROVED", feedback: "" })

  const decide = (status) => {
    post(route("budget_request_review", { budget_request_id: request.id }), {
      data: { status, feedback: data.feedback },
      preserveScroll: true,
      onFinish: () => reset(),
    })
  }

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Request #{request.id}</p>
          <h3 className="mt-1 font-semibold">{request.title}</h3>
          <p className="mt-1 text-xs text-slate-500">Submitted by {request.requesting_user.name}</p>
        </div>
        <p className="shrink-0 text-lg font-semibold tabular-nums">{money(request.amount)}</p>
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-600">{request.business_justification}</p>
      <div className="mt-5 border-t border-slate-100 pt-4">
        <label className="mb-2 block text-xs font-medium text-slate-600">Review note {data.status === "REJECTED" && <span className="text-rose-600">(required for rejection)</span>}</label>
        <textarea rows="2" value={data.feedback} onChange={(event) => setData("feedback", event.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200" placeholder="Add context for the requester..." />
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" disabled={processing} onClick={() => decide("APPROVED")} className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-3.5 py-2 text-sm font-medium text-white hover:bg-emerald-800">
            <Check className="h-4 w-4" /> Approve
          </button>
          <button type="button" disabled={processing} onClick={() => setData("status", "REJECTED")} className="inline-flex items-center gap-2 rounded-lg border border-rose-200 px-3.5 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50">
            <X className="h-4 w-4" /> Reject
          </button>
          {data.status === "REJECTED" && (
            <button type="button" disabled={processing} onClick={() => decide("REJECTED")} className="ml-auto rounded-lg bg-rose-700 px-3.5 py-2 text-sm font-medium text-white">Confirm rejection</button>
          )}
        </div>
      </div>
    </article>
  )
}

export default function ManagerQueue({ pending, historical }) {
  return (
    <>
      <Head title="Review queue" />
      <div className="mb-6">
        <p className="text-sm font-medium text-slate-500">Management workspace</p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight">Review queue</h2>
      </div>
      <section>
        <h3 className="mb-3 text-sm font-semibold">Awaiting decision <span className="ml-1 text-slate-400">{pending.length}</span></h3>
        <div className="grid gap-4 lg:grid-cols-2">
          {pending.length === 0 ? (
            <div className="col-span-full rounded-xl border border-dashed border-slate-300 bg-white py-14 text-center">
              <Clock3 className="mx-auto h-7 w-7 text-slate-300" />
              <p className="mt-3 text-sm text-slate-500">No requests are waiting for review.</p>
            </div>
          ) : pending.map((request) => <ReviewCard key={request.id} request={request} />)}
        </div>
      </section>
      <section className="mt-8">
        <h3 className="mb-3 text-sm font-semibold">Decision history</h3>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          {historical.length === 0 ? <p className="p-6 text-sm text-slate-500">No decisions yet.</p> : historical.map((request) => (
            <div key={request.id} className="grid gap-2 border-b border-slate-100 p-4 last:border-0 sm:grid-cols-[1fr_120px_120px] sm:items-center">
              <div><p className="text-sm font-medium">{request.title}</p><p className="mt-1 text-xs text-slate-500">by {request.requesting_user.name}</p></div>
              <p className="text-sm font-semibold tabular-nums">{money(request.amount)}</p>
              <span className={`justify-self-start rounded-full px-2 py-1 text-xs font-semibold ${request.status === "APPROVED" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>{request.status}</span>
              {request.feedback && <p className="text-xs text-slate-500 sm:col-span-3">Note: {request.feedback}</p>}
            </div>
          ))}
        </div>
      </section>
    </>
  )
}

ManagerQueue.layout = (page) => <BudgetLayout title="Review queue">{page}</BudgetLayout>
