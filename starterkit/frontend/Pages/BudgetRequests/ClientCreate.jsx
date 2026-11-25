import { Head, Link, useForm } from "@inertiajs/react"
import { ArrowLeft, Send } from "lucide-react"
import { BudgetLayout } from "@/Layouts/BudgetLayout"
import { useRoute } from "@/composables/useRoute"

export default function ClientCreate({ errors = {}, form }) {
  const route = useRoute()
  const { data, setData, post, processing } = useForm({
    title: form?.title || "",
    amount: form?.amount || "",
    business_justification: form?.business_justification || "",
  })

  return (
    <>
      <Head title="New budget request" />
      <Link href={route("budget_client_requests")} className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-950">
        <ArrowLeft className="h-4 w-4" /> My requests
      </Link>
      <div className="max-w-2xl rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-5">
          <h2 className="font-semibold">Submit a funding proposal</h2>
          <p className="mt-1 text-sm text-slate-500">A manager will review this request. Provide enough context to support a decision.</p>
        </div>
        <form onSubmit={(event) => { event.preventDefault(); post(route("budget_request_create")) }} className="space-y-5 p-6">
          <div>
            <label className="mb-2 block text-sm font-medium">Request title</label>
            <input value={data.title} onChange={(event) => setData("title", event.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200" placeholder="e.g. Field equipment refresh" />
            {errors.title?.map((error) => <p key={error} className="mt-1.5 text-xs text-rose-600">{error}</p>)}
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-sm text-slate-400">$</span>
              <input type="number" min="0.01" step="0.01" value={data.amount} onChange={(event) => setData("amount", event.target.value)} className="w-full rounded-lg border border-slate-300 py-2.5 pl-7 pr-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200" placeholder="0.00" />
            </div>
            {errors.amount?.map((error) => <p key={error} className="mt-1.5 text-xs text-rose-600">{error}</p>)}
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Business justification</label>
            <textarea rows="5" value={data.business_justification} onChange={(event) => setData("business_justification", event.target.value)} className="w-full resize-y rounded-lg border border-slate-300 px-3 py-2.5 text-sm leading-6 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200" placeholder="Explain the need, expected impact, and timing." />
            {errors.business_justification?.map((error) => <p key={error} className="mt-1.5 text-xs text-rose-600">{error}</p>)}
          </div>
          <div className="flex justify-end border-t border-slate-100 pt-5">
            <button type="submit" disabled={processing} className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60">
              <Send className="h-4 w-4" /> Submit request
            </button>
          </div>
        </form>
      </div>
    </>
  )
}

ClientCreate.layout = (page) => <BudgetLayout title="New request">{page}</BudgetLayout>
