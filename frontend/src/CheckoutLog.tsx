import { useEffect, useState } from "react"

const apiBaseUrl = (
  import.meta.env.VITE_API_URL ?? `http://${window.location.hostname}:8000`
).replace(/\/$/, "")

type Checkout = {
  id: string
  item_title: string
  name: string
  checked_out_date: string
}

function parseCheckouts(payload: unknown): Checkout[] {
  const records = Array.isArray(payload)
    ? payload
    : typeof payload === "object" &&
        payload !== null &&
        "results" in payload &&
        Array.isArray(payload.results)
      ? payload.results
      : null

  if (!records) {
    throw new Error("The server returned an invalid checkout log.")
  }

  return records.map((record) => {
    if (
      typeof record !== "object" ||
      record === null ||
      !("id" in record) ||
      !("item_title" in record) ||
      !("name" in record) ||
      !("checked_out_date" in record) ||
      typeof record.name !== "string" ||
      typeof record.checked_out_date !== "string"
    ) {
      throw new Error("The server returned an incomplete checkout record.")
    }

    return {
      id: String(record.id),
      item_title: typeof record.item_title === "string" ? record.item_title : "",
      name: record.name,
      checked_out_date: record.checked_out_date,
    }
  })
}

function formatDate(value: string): string {
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString()
}

async function getCsrfToken(): Promise<string> {
  const response = await fetch(`${apiBaseUrl}/api/auth/csrf/`, {
    credentials: "include",
  })
  if (!response.ok) {
    throw new Error("Could not verify the delete request. Refresh and retry.")
  }

  const payload: unknown = await response.json()
  if (
    typeof payload !== "object" ||
    payload === null ||
    !("csrfToken" in payload) ||
    typeof payload.csrfToken !== "string"
  ) {
    throw new Error("The server did not return a CSRF token.")
  }
  return payload.csrfToken
}

export default function CheckoutLog({
  onCountChange,
}: {
  onCountChange: (count: number | null) => void
}) {
  const [checkouts, setCheckouts] = useState<Checkout[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingCheckoutId, setDeletingCheckoutId] = useState<string | null>(
    null,
  )

  useEffect(() => {
    const controller = new AbortController()

    async function loadCheckouts() {
      try {
        const response = await fetch(`${apiBaseUrl}/api/checkouts/`, {
          headers: { Accept: "application/json" },
          credentials: "include",
          signal: controller.signal,
        })

        if (response.status === 401 || response.status === 403) {
          throw new Error(
            "Sign in with a Django superuser account to view checkouts.",
          )
        }
        if (!response.ok) {
          throw new Error(
            `Could not load checkout log (HTTP ${response.status}).`,
          )
        }

        const loadedCheckouts = parseCheckouts(await response.json())
        setCheckouts(loadedCheckouts)
        onCountChange(loadedCheckouts.length)
      } catch (loadError) {
        if (loadError instanceof Error && loadError.name === "AbortError")
          return

        onCountChange(null)
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Could not load checkout log.",
        )
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }

    void loadCheckouts()
    return () => controller.abort()
  }, [onCountChange])

  async function deleteCheckout(checkout: Checkout) {
    if (
      !window.confirm(
        `Delete the checkout record for "${checkout.item_title}" by ${checkout.name}? This cannot be undone.`,
      )
    ) {
      return
    }

    setDeletingCheckoutId(checkout.id)
    setError(null)
    try {
      const csrfToken = await getCsrfToken()
      const response = await fetch(
        `${apiBaseUrl}/api/checkouts/${encodeURIComponent(checkout.id)}/`,
        {
          method: "DELETE",
          headers: {
            Accept: "application/json",
            "X-CSRFToken": csrfToken,
          },
          credentials: "include",
        },
      )

      if (!response.ok) {
        throw new Error(`Could not delete checkout (HTTP ${response.status}).`)
      }

      const remainingCheckouts = checkouts.filter(
        (entry) => entry.id !== checkout.id,
      )
      setCheckouts(remainingCheckouts)
      onCountChange(remainingCheckouts.length)
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Could not delete checkout.",
      )
    } finally {
      setDeletingCheckoutId(null)
    }
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-[#dce9e3] bg-white shadow-sm">
      <header className="border-b border-[#dce9e3] p-6 sm:p-8">
        <p className="font-['Figtree:Bold'] text-xs font-bold tracking-[0.14em] text-[#006747] uppercase">
          Staff-only log
        </p>
        <h2 className="mt-2 font-['Outfit:Bold'] text-2xl font-bold text-[#17212b]">
          Item checkouts
        </h2>
        <p className="mt-1 text-sm text-[#64748b]">
          Each checkout records the student’s name, date, and item.
        </p>
      </header>

      {error && (
        <p
          className="m-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {error}
        </p>
      )}
      {isLoading ? (
        <p className="px-6 py-12 text-center text-sm text-[#64748b]">
          Loading checkout log…
        </p>
      ) : checkouts.length === 0 ? (
        <p className="px-6 py-12 text-center text-sm text-[#64748b]">
          No item checkouts have been recorded.
        </p>
      ) : (
        <div className="overflow-x-auto p-6 sm:p-8">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#e8efeb] text-[#64748b]">
                <th className="pb-3 pr-4 font-medium">Name</th>
                <th className="pb-3 pr-4 font-medium">Date checked out</th>
                <th className="pb-3 font-medium">Item name</th>
                <th className="pb-3 pl-4 font-medium">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e8efeb]">
              {checkouts.map((checkout) => (
                <tr className="text-[#334155]" key={checkout.id}>
                  <td className="py-3 pr-4">{checkout.name}</td>
                  <td className="py-3 pr-4">
                    {formatDate(checkout.checked_out_date)}
                  </td>
                  <td className="py-3">
                    {checkout.item_title || "Found item"}
                  </td>
                  <td className="py-3 pl-4 text-right">
                    <button
                      aria-label={`Delete checkout for ${checkout.item_title}`}
                      className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={deletingCheckoutId !== null}
                      onClick={() => void deleteCheckout(checkout)}
                      type="button"
                    >
                      {deletingCheckoutId === checkout.id
                        ? "Deleting…"
                        : "Delete"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
