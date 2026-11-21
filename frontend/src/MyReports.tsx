import { useEffect, useState, type FormEvent } from "react"
import ChoiceField, {
  LocationDetailsField,
  readChoice,
  readLocation,
  splitLocation,
} from "./ChoiceField"
import PhotoField, { ItemPhoto } from "./PhotoField"
import AIMatches from "./AIMatches"
import {
  CAMPUS_LOCATIONS,
  ITEM_CATEGORIES,
  ITEM_COLORS,
  NOT_SURE_OPTION,
} from "./reportOptions"

const apiBaseUrl = (import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000").replace(/\/$/, "")
const lostItemsApiUrl = `${apiBaseUrl}/api/lost-items/`
const myReportsApiUrl = `${lostItemsApiUrl}mine/`
const csrfApiUrl = `${apiBaseUrl}/api/auth/csrf/`

const labelClass = "space-y-1.5 text-sm font-semibold text-[#17212b]"
const inputClass =
  "w-full rounded-xl border border-[#cbd8d2] px-3 py-2.5 font-normal outline-none focus:border-[#006747] focus:ring-2 focus:ring-[#006747]/15"

export type MyReport = {
  id: string
  title: string
  description: string
  category: string
  color: string
  location: string
  date: string
  photo_url: string | null
}

function text(record: Record<string, unknown>, key: string): string {
  const value = record[key]
  return typeof value === "string" ? value : ""
}

function parseReport(record: unknown): MyReport {
  if (typeof record !== "object" || record === null || !("id" in record)) {
    throw new Error("A report is missing its ID.")
  }
  const r = record as Record<string, unknown>
  return {
    id: String(r.id),
    title: text(r, "title"),
    description: text(r, "description"),
    category: text(r, "category"),
    color: text(r, "color"),
    location: text(r, "location"),
    date: text(r, "date"),
    photo_url: typeof r.photo_url === "string" ? r.photo_url : null,
  }
}

async function getCsrfToken(): Promise<string> {
  const response = await fetch(csrfApiUrl, { credentials: "include" })
  if (!response.ok) throw new Error("Could not reach the server. Is the backend running?")
  const payload = (await response.json()) as { csrfToken?: string }
  if (!payload.csrfToken) throw new Error("The server did not return a CSRF token.")
  return payload.csrfToken
}

async function errorMessage(response: Response, fallback: string): Promise<string> {
  if (response.status === 401) return "Your session has expired. Please sign in again."
  if (response.status === 403) return "You can only change reports you submitted."
  const payload: unknown = await response.json().catch(() => null)
  if (typeof payload === "object" && payload !== null) {
    if ("detail" in payload && typeof payload.detail === "string") return payload.detail
    for (const messages of Object.values(payload)) {
      if (Array.isArray(messages) && typeof messages[0] === "string") return messages[0]
    }
  }
  return `${fallback} (HTTP ${response.status}).`
}

function formatDate(date: string): string {
  return date ? new Date(`${date}T00:00:00`).toLocaleDateString() : "—"
}

function todayValue(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${now.getFullYear()}-${month}-${day}`
}

function EditReportForm({
  report,
  onCancel,
  onSaved,
}: {
  report: MyReport
  onCancel: () => void
  onSaved: (report: MyReport) => void
}) {
  const [photo, setPhoto] = useState<Blob | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { place, details } = splitLocation(report.location, [
    ...CAMPUS_LOCATIONS,
    NOT_SURE_OPTION,
  ])

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSaving(true)
    setError(null)

    const formData = new FormData(event.currentTarget)
    const body = new FormData()
    body.append("title", String(formData.get("title") ?? "").trim())
    body.append("description", String(formData.get("description") ?? "").trim())
    body.append("category", readChoice(formData, "category"))
    body.append("color", readChoice(formData, "color"))
    body.append("location", readLocation(formData))
    body.append("date", String(formData.get("date") ?? ""))
    if (photo) body.append("photo", photo, "photo.jpg")

    try {
      const csrfToken = await getCsrfToken()
      const response = await fetch(`${lostItemsApiUrl}${encodeURIComponent(report.id)}/`, {
        method: "PATCH",
        headers: { Accept: "application/json", "X-CSRFToken": csrfToken },
        credentials: "include",
        body,
      })
      if (!response.ok) {
        throw new Error(await errorMessage(response, "Could not save your changes"))
      }
      onSaved(parseReport(await response.json()))
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save your changes.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form
      aria-label={`Edit report for ${report.title}`}
      className="mt-4 space-y-5 rounded-2xl border border-[#dce9e3] bg-[#f8faf9] p-5"
      onSubmit={save}
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <label className={labelClass}>
          Item name
          <input
            className={inputClass}
            defaultValue={report.title}
            maxLength={200}
            name="title"
            required
          />
        </label>
        <ChoiceField
          defaultValue={report.category}
          label="Category"
          name="category"
          options={ITEM_CATEGORIES}
          otherLabel="Specify category"
          otherPlaceholder="Enter a category"
          placeholder="Select a category"
          required
        />
        <ChoiceField
          defaultValue={report.color}
          label="Color"
          name="color"
          options={ITEM_COLORS}
          otherLabel="Specify color"
          otherMaxLength={50}
          otherPlaceholder="e.g. Navy and white"
          placeholder="Select a color (optional)"
        />
        <ChoiceField
          defaultValue={place}
          extraOptions={[NOT_SURE_OPTION]}
          label="Location last seen"
          name="location"
          options={CAMPUS_LOCATIONS}
          otherLabel="Specify location"
          otherMaxLength={70}
          otherPlaceholder="e.g. Bus stop on Melville Road"
          placeholder="Select a campus location"
          required
        />
        <LocationDetailsField defaultValue={details} />
        <label className={labelClass}>
          Date lost
          <input
            className={inputClass}
            defaultValue={report.date}
            max={todayValue()}
            name="date"
            required
            type="date"
          />
        </label>
      </div>

      <label className={`block ${labelClass}`}>
        Description
        <textarea
          className={`min-h-24 ${inputClass}`}
          defaultValue={report.description}
          name="description"
        />
      </label>

      {report.photo_url && !photo && (
        <div className="flex items-center gap-3 text-sm text-[#64748b]">
          <ItemPhoto title={report.title} url={report.photo_url} />
          <span>Current photo. Choose a new one below to replace it.</span>
        </div>
      )}
      <PhotoField disabled={isSaving} onChange={setPhoto} />

      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          className="rounded-xl bg-[#006747] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#00523a] disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isSaving}
          type="submit"
        >
          {isSaving ? "Saving…" : "Save changes"}
        </button>
        <button
          className="rounded-xl border border-[#cbd8d2] bg-white px-5 py-2.5 text-sm font-semibold text-[#334155] hover:bg-emerald-50"
          disabled={isSaving}
          onClick={onCancel}
          type="button"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

/**
 * The signed-in student's own open lost reports, with Edit and Close.
 * User story: Report Management.
 */
export default function MyReports({
  onChanged,
  onCountChange,
}: {
  /** Called after an edit or close so other lists can refresh. */
  onChanged: () => void
  onCountChange: (count: number | null) => void
}) {
  const [reports, setReports] = useState<MyReport[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [closingId, setClosingId] = useState<string | null>(null)
  const [matchesId, setMatchesId] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    async function load() {
      try {
        const response = await fetch(myReportsApiUrl, {
          headers: { Accept: "application/json" },
          credentials: "include",
          signal: controller.signal,
        })
        if (response.status === 401 || response.status === 403) {
          throw new Error("Sign in to see and manage your reports.")
        }
        if (!response.ok) {
          throw new Error(`Could not load your reports (HTTP ${response.status}).`)
        }
        const payload: unknown = await response.json()
        if (!Array.isArray(payload)) throw new Error("Unexpected response from the server.")
        const items = payload.map(parseReport)
        setReports(items)
        onCountChange(items.length)
      } catch (loadError) {
        if (loadError instanceof Error && loadError.name === "AbortError") return
        setError(loadError instanceof Error ? loadError.message : "Could not load your reports.")
        onCountChange(null)
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }
    void load()
    return () => controller.abort()
    // Load once when the tab opens (onCountChange is a stable state setter).
  }, [])

  async function closeReport(report: MyReport) {
    if (
      !window.confirm(
        `Close your report for "${report.title}"?\n\nDo this if you found your item or no longer need help. It will be removed from the Lost Items list.`,
      )
    ) {
      return
    }
    setClosingId(report.id)
    setError(null)
    setNotice(null)
    try {
      const csrfToken = await getCsrfToken()
      const response = await fetch(
        `${lostItemsApiUrl}${encodeURIComponent(report.id)}/close/`,
        {
          method: "POST",
          headers: { Accept: "application/json", "X-CSRFToken": csrfToken },
          credentials: "include",
        },
      )
      if (!response.ok) {
        throw new Error(await errorMessage(response, "Could not close the report"))
      }
      const remaining = reports.filter((item) => item.id !== report.id)
      setReports(remaining)
      onCountChange(remaining.length)
      setNotice(`Closed your report for "${report.title}".`)
      onChanged()
    } catch (closeError) {
      setError(closeError instanceof Error ? closeError.message : "Could not close the report.")
    } finally {
      setClosingId(null)
    }
  }

  function saved(updated: MyReport) {
    setReports((items) => items.map((item) => (item.id === updated.id ? updated : item)))
    setEditingId(null)
    setNotice(`Saved your changes to "${updated.title}".`)
    onChanged()
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-[#dce9e3] bg-white shadow-sm">
      <div className="border-b border-[#dce9e3] p-6 sm:p-8">
        <p className="font-['Figtree:Bold'] text-xs font-bold tracking-[0.14em] text-[#006747] uppercase">
          Your reports
        </p>
        <h2 className="mt-2 font-['Outfit:Bold'] text-2xl font-bold text-[#17212b]">
          My Lost Item Reports
        </h2>
        <p className="mt-1 text-sm text-[#64748b]">
          Update your reports, or close one once you've found your item.
        </p>
      </div>

      {notice && (
        <p className="mx-6 mt-5 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-[#006747] sm:mx-8" role="status">
          {notice}
        </p>
      )}

      {error ? (
        <p className="px-6 py-10 text-center text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : isLoading ? (
        <p className="px-6 py-10 text-center text-sm text-[#64748b]">Loading your reports…</p>
      ) : reports.length === 0 ? (
        <p className="px-6 py-10 text-center text-sm text-[#64748b]">
          You don't have any open lost item reports.
        </p>
      ) : (
        <ul className="divide-y divide-[#e8efeb]">
          {reports.map((report) => (
            <li className="px-6 py-5 sm:px-8" key={report.id}>
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div className="flex min-w-0 gap-4">
                  <ItemPhoto title={report.title} url={report.photo_url} />
                  <div className="min-w-0">
                    <h3 className="font-['Figtree:SemiBold'] font-semibold text-[#17212b]">
                      {report.title}
                    </h3>
                    <p className="mt-1 text-sm text-[#64748b]">
                      {[report.category, report.color, report.location, formatDate(report.date)]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    {report.description && (
                      <p className="mt-2 whitespace-pre-wrap text-sm text-[#334155]">
                        {report.description}
                      </p>
                    )}
                  </div>
                </div>
                {editingId !== report.id && (
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <button
                      aria-expanded={matchesId === report.id}
                      className="rounded-xl border border-[#006747] px-4 py-2 text-sm font-semibold text-[#006747] hover:bg-emerald-50 disabled:opacity-50"
                      onClick={() => setMatchesId(matchesId === report.id ? null : report.id)}
                      type="button"
                    >
                      {matchesId === report.id ? "Hide matches" : "✨ Find matches"}
                    </button>
                    <button
                      className="rounded-xl border border-[#cbd8d2] px-4 py-2 text-sm font-semibold text-[#334155] hover:bg-emerald-50 disabled:opacity-50"
                      disabled={closingId !== null}
                      onClick={() => {
                        setNotice(null)
                        setEditingId(report.id)
                      }}
                      type="button"
                    >
                      Edit
                    </button>
                    <button
                      className="rounded-xl bg-[#006747] px-4 py-2 text-sm font-semibold text-white hover:bg-[#00523a] disabled:opacity-50"
                      disabled={closingId !== null}
                      onClick={() => closeReport(report)}
                      type="button"
                    >
                      {closingId === report.id ? "Closing…" : "Close report"}
                    </button>
                  </div>
                )}
              </div>
              {matchesId === report.id && editingId !== report.id && (
                <AIMatches reportId={report.id} />
              )}
              {editingId === report.id && (
                <EditReportForm
                  onCancel={() => setEditingId(null)}
                  onSaved={saved}
                  report={report}
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
