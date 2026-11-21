import { useEffect, useState, type FormEvent } from "react"

import { ItemPhoto } from "./PhotoField"

const apiBaseUrl = (
  import.meta.env.VITE_API_URL ?? `http://${window.location.hostname}:8000`
).replace(/\/$/, "")

type CheckoutItem = {
  id: string
  title: string
  category: string
  color: string
  location: string
  date: string
  photo_url: string | null
}

function parseItem(payload: unknown): CheckoutItem {
  if (
    typeof payload !== "object" ||
    payload === null ||
    !("id" in payload) ||
    !("title" in payload) ||
    typeof payload.title !== "string"
  ) {
    throw new Error("The server returned an invalid item.")
  }

  const text = (key: string) => {
    const value = key in payload ? payload[key] : ""
    return typeof value === "string" ? value : ""
  }

  return {
    id: String(payload.id),
    title: payload.title,
    category: text("category"),
    color: text("color"),
    location: text("location"),
    date: text("date"),
    photo_url: text("photo_url") || null,
  }
}

function getErrorMessage(payload: unknown, fallback: string): string {
  if (typeof payload === "object" && payload !== null) {
    if ("detail" in payload && typeof payload.detail === "string") {
      return payload.detail
    }

    for (const value of Object.values(payload)) {
      if (Array.isArray(value) && typeof value[0] === "string") {
        return value[0]
      }
    }
  }

  return fallback
}

function today(): string {
  const currentDate = new Date()
  const month = String(currentDate.getMonth() + 1).padStart(2, "0")
  const day = String(currentDate.getDate()).padStart(2, "0")
  return `${currentDate.getFullYear()}-${month}-${day}`
}

export default function ItemCheckout({ itemId }: { itemId: string }) {
  const [item, setItem] = useState<CheckoutItem | null>(null)
  const [checkedOutDate, setCheckedOutDate] = useState(today)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function loadItem() {
      try {
        const response = await fetch(
          `${apiBaseUrl}/api/inventory/${encodeURIComponent(itemId)}/checkout-info/`,
          {
            headers: { Accept: "application/json" },
            signal: controller.signal,
          },
        )

        if (response.status === 409) {
          throw new Error("A checkout has already been recorded for this item.")
        }
        if (response.status === 404) {
          throw new Error("This found item is no longer available.")
        }
        if (!response.ok) {
          throw new Error(`Could not load this item (HTTP ${response.status}).`)
        }

        setItem(parseItem(await response.json()))
      } catch (loadError) {
        if (loadError instanceof Error && loadError.name === "AbortError")
          return

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Could not load this item.",
        )
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }

    void loadItem()
    return () => controller.abort()
  }, [itemId])

  async function submitCheckout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!item) return

    const formData = new FormData(event.currentTarget)
    const name = String(formData.get("name") ?? "").trim()

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`${apiBaseUrl}/api/checkouts/`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          item_id: item.id,
          name,
          checked_out_date: checkedOutDate,
        }),
      })

      const payload: unknown = await response.json()
      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            payload,
            `Could not record this checkout (HTTP ${response.status}).`,
          ),
        )
      }

      setIsSubmitted(true)
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Could not record this checkout.",
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="w-full max-w-3xl space-y-6">
      <section className="rounded-3xl border border-[#dce9e3] bg-white p-6 shadow-sm sm:p-8">
        <p className="font-['Figtree:Bold'] text-xs font-bold tracking-[0.14em] text-[#006747] uppercase">
          Found item checkout
        </p>
        <h1 className="mt-2 font-['Outfit:Bold'] text-3xl font-bold text-[#17212b]">
          Record a checkout
        </h1>
        <p className="mt-2 text-sm leading-6 text-[#64748b]">
          Enter your name and the date you checked out this item. This
          information is only available to staff.
        </p>

        {error && (
          <p
            className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
            role="alert"
          >
            {error}
          </p>
        )}

        {isLoading ? (
          <p className="mt-8 text-sm text-[#64748b]">Loading item…</p>
        ) : item ? (
          <>
            <div className="mt-6 flex flex-col gap-5 rounded-2xl bg-[#f8faf9] p-4 sm:flex-row">
              <ItemPhoto
                className="h-40 w-full rounded-xl object-cover sm:w-48"
                title={item.title}
                url={item.photo_url}
              />
              <div className="min-w-0">
                <h2 className="font-['Outfit:Bold'] text-xl font-bold text-[#17212b]">
                  {item.title}
                </h2>
                <p className="mt-1 text-sm text-[#64748b]">
                  {[item.category, item.color, item.location]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
            </div>

            {isSubmitted ? (
              <p
                className="mt-6 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"
                role="status"
              >
                Checkout recorded. Thank you.
              </p>
            ) : (
              <form className="mt-6 space-y-5" onSubmit={submitCheckout}>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-[#17212b]">
                    Name
                  </span>
                  <input
                    autoComplete="name"
                    className="w-full rounded-xl border border-[#cbd8d2] px-4 py-3 text-sm text-[#17212b] outline-none focus:border-[#006747] focus:ring-2 focus:ring-emerald-100"
                    maxLength={150}
                    name="name"
                    required
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-[#17212b]">
                    Date checked out
                  </span>
                  <input
                    className="w-full rounded-xl border border-[#cbd8d2] px-4 py-3 text-sm text-[#17212b] outline-none focus:border-[#006747] focus:ring-2 focus:ring-emerald-100"
                    max={today()}
                    onChange={(event) => setCheckedOutDate(event.target.value)}
                    required
                    type="date"
                    value={checkedOutDate}
                  />
                </label>

                <button
                  className="w-full rounded-xl bg-[#006747] px-5 py-3 font-semibold text-white transition-colors hover:bg-[#00523a] disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isSubmitting}
                  type="submit"
                >
                  {isSubmitting ? "Recording…" : "Submit checkout"}
                </button>
              </form>
            )}
          </>
        ) : null}
      </section>
    </main>
  )
}
