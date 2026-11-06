import { useState, type FormEvent } from "react"
import ChoiceField, {
  LocationDetailsField,
  readChoice,
  readLocation,
} from "./ChoiceField"
import {
  CAMPUS_LOCATIONS,
  ITEM_CATEGORIES,
  ITEM_COLORS,
  NOT_SURE_OPTION,
} from "./reportOptions"

const lostItemsApiUrl = `http://${window.location.hostname}:8000/api/lost-items/`
const csrfApiUrl = `http://${window.location.hostname}:8000/api/auth/csrf/`

// Reports are linked to the logged-in user, so requests must carry the Django
// session cookie plus a CSRF token (the same pattern the login screen uses).
async function getCsrfToken(): Promise<string> {
  const response = await fetch(csrfApiUrl, { credentials: "include" })
  if (!response.ok) throw new Error("Could not reach the server. Is the backend running?")
  const payload = (await response.json()) as { csrfToken?: string }
  if (!payload.csrfToken) throw new Error("The server did not return a CSRF token.")
  return payload.csrfToken
}

function localDateValue(): string {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function getErrorMessage(payload: unknown, status: number): string {
  if (typeof payload === "object" && payload !== null && "detail" in payload) {
    const detail = payload.detail
    if (typeof detail === "string") return detail
  }
  return `Could not submit the lost item (HTTP ${status}).`
}

export default function LostItemReport() {
  // Changing the key after a successful submit clears every field.
  const [formKey, setFormKey] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submittedItemId, setSubmittedItemId] = useState<string | null>(null)

  async function submitReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setSubmittedItemId(null)

    const formData = new FormData(event.currentTarget)
    const item = {
      title: String(formData.get("title") ?? "").trim(),
      description: String(formData.get("description") ?? "").trim(),
      category: readChoice(formData, "category"),
      color: readChoice(formData, "color"),
      location: readLocation(formData),
      date: String(formData.get("date") ?? ""),
    }

    try {
      const csrfToken = await getCsrfToken()
      const response = await fetch(lostItemsApiUrl, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "X-CSRFToken": csrfToken,
        },
        credentials: "include",
        body: JSON.stringify(item),
      })

      if (response.status === 401 || response.status === 403) {
        throw new Error(
          "Your session has expired. Please log out, sign in again, and resubmit.",
        )
      }

      const payload: unknown = await response.json()

      if (!response.ok) {
        throw new Error(getErrorMessage(payload, response.status))
      }

      if (
        typeof payload !== "object" ||
        payload === null ||
        !("id" in payload) ||
        (typeof payload.id !== "string" && typeof payload.id !== "number")
      ) {
        throw new Error(
          "The item was saved, but the API did not return its generated ID.",
        )
      }

      setSubmittedItemId(String(payload.id))
      setFormKey((key) => key + 1)
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "An unexpected error occurred while submitting the lost item.",
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-4xl space-y-6">
      <section className="rounded-3xl bg-gradient-to-br from-[#004f3a] via-[#006747] to-[#00a676] p-7 text-white shadow-xl shadow-emerald-950/10 sm:p-9">
        <p className="font-['Figtree:Bold'] text-xs font-bold tracking-[0.16em] text-emerald-100 uppercase">
          Lost item report
        </p>
        <h1 className="mt-2 font-['Outfit:Bold'] text-3xl leading-tight font-bold sm:text-4xl">
          Report a Lost Item
        </h1>
        <p className="mt-3 max-w-2xl font-['Figtree:Medium'] text-sm leading-6 font-medium text-white/85 sm:text-base">
          Share what went missing and where you last saw it. Your report will be
          added to Lost Items, separate from found items in Inventory.
        </p>
      </section>

      {submittedItemId && (
        <section
          className="lost-item-success rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-950"
          role="status"
        >
          <p className="font-['Figtree:SemiBold'] text-base font-semibold">
            Lost item report submitted.
          </p>
          <p className="mt-1 text-sm">
            Generated item ID:{" "}
            <code className="lost-item-id rounded bg-white px-2 py-1 font-mono">
              {submittedItemId}
            </code>
          </p>
        </section>
      )}

      <form
        className="space-y-5 rounded-3xl border border-[#dce9e3] bg-white p-6 shadow-sm sm:p-8"
        key={formKey}
        onSubmit={submitReport}
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="space-y-1.5 text-sm font-semibold text-[#17212b]">
            Item name
            <input
              autoComplete="off"
              className="w-full rounded-xl border border-[#cbd8d2] px-3 py-2.5 font-normal outline-none focus:border-[#006747] focus:ring-2 focus:ring-[#006747]/15"
              maxLength={200}
              name="title"
              placeholder="e.g. Water bottle"
              required
            />
          </label>
          <ChoiceField
            label="Category"
            name="category"
            options={ITEM_CATEGORIES}
            otherLabel="Specify category"
            otherPlaceholder="Enter a category"
            placeholder="Select a category"
            required
          />
          <ChoiceField
            label="Color"
            name="color"
            options={ITEM_COLORS}
            otherLabel="Specify color"
            otherMaxLength={50}
            otherPlaceholder="e.g. Navy and white"
            placeholder="Select a color (optional)"
          />
          <ChoiceField
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
          <LocationDetailsField />
          <label className="space-y-1.5 text-sm font-semibold text-[#17212b]">
            Date lost
            <input
              className="w-full rounded-xl border border-[#cbd8d2] px-3 py-2.5 font-normal outline-none focus:border-[#006747] focus:ring-2 focus:ring-[#006747]/15"
              defaultValue={localDateValue()}
              name="date"
              required
              type="date"
            />
          </label>
        </div>
        <label className="block space-y-1.5 text-sm font-semibold text-[#17212b]">
          Description
          <textarea
            className="min-h-28 w-full rounded-xl border border-[#cbd8d2] px-3 py-2.5 font-normal outline-none focus:border-[#006747] focus:ring-2 focus:ring-[#006747]/15"
            name="description"
            placeholder="Add helpful identifying details"
          />
        </label>

        {error && (
          <p
            className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
            role="alert"
          >
            {error}
          </p>
        )}

        <button
          className="rounded-xl bg-[#006747] px-5 py-3 font-['Figtree:SemiBold'] text-sm font-semibold text-white transition-colors hover:bg-[#00523a] disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "Submitting report…" : "Submit Lost Item Report"}
        </button>
      </form>
    </div>
  )
}
