import { useEffect, useState } from "react"

const apiBaseUrl = (import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000").replace(/\/$/, "")
const lostItemsApiUrl = `${apiBaseUrl}/api/lost-items/`
const inventoryApiUrl = `${apiBaseUrl}/api/inventory/`

type ReportItem = {
  id: string
  title: string
  description: string
  category: string
  color: string
  location: string
  date: string
}

function optionalText(value: unknown, field: string): string {
  if (value === undefined || value === null) return ""
  if (typeof value !== "string") {
    throw new Error(`An item has an invalid ${field} value.`)
  }
  return value
}

function parseReports(payload: unknown): ReportItem[] {
  let records: unknown[]

  if (Array.isArray(payload)) {
    records = payload
  } else if (
    typeof payload === "object" &&
    payload !== null &&
    "results" in payload &&
    Array.isArray(payload.results)
  ) {
    records = payload.results
  } else {
    throw new Error("The API returned an unexpected response.")
  }

  return records.map((record) => {
    if (
      typeof record !== "object" ||
      record === null ||
      !("id" in record) ||
      !("title" in record) ||
      typeof record.title !== "string"
    ) {
      throw new Error("An item is missing its ID or name.")
    }

    return {
      id: String(record.id),
      title: record.title,
      description: optionalText(
        "description" in record ? record.description : undefined,
        "description",
      ),
      category: optionalText(
        "category" in record ? record.category : undefined,
        "category",
      ),
      color: optionalText(
        "color" in record ? record.color : undefined,
        "color",
      ),
      location: optionalText(
        "location" in record ? record.location : undefined,
        "location",
      ),
      date: optionalText("date" in record ? record.date : undefined, "date"),
    }
  })
}

function formatDate(date: string): string {
  return date ? new Date(`${date}T00:00:00`).toLocaleDateString() : "—"
}

function ReportSection({
  title,
  description,
  items,
  isLoading,
  error,
}: {
  title: string
  description: string
  items: ReportItem[]
  isLoading: boolean
  error: string | null
}) {
  return (
    <section className="overflow-hidden rounded-3xl border border-[#dce9e3] bg-white shadow-sm">
      <div className="flex flex-col justify-between gap-3 border-b border-[#dce9e3] p-6 sm:flex-row sm:items-center sm:p-8">
        <div>
          <p className="font-['Figtree:Bold'] text-xs font-bold tracking-[0.14em] text-[#006747] uppercase">
            Community reports
          </p>
          <h2 className="mt-2 font-['Outfit:Bold'] text-2xl font-bold text-[#17212b]">
            {title}
          </h2>
          <p className="mt-1 text-sm text-[#64748b]">{description}</p>
        </div>
        <span className="w-fit rounded-full bg-emerald-50 px-3 py-1.5 font-['Figtree:SemiBold'] text-xs font-semibold text-[#006747]">
          {isLoading ? "Loading…" : `${items.length} items`}
        </span>
      </div>

      {error ? (
        <p className="px-6 py-10 text-center text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : isLoading ? (
        <p className="px-6 py-10 text-center text-sm text-[#64748b]">
          Loading {title.toLowerCase()}…
        </p>
      ) : items.length === 0 ? (
        <p className="px-6 py-10 text-center text-sm text-[#64748b]">
          No {title.toLowerCase()} have been reported yet.
        </p>
      ) : (
        <ul className="divide-y divide-[#e8efeb]">
          {items.map((item) => (
            <li
              className="grid gap-3 px-6 py-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start sm:px-8"
              key={item.id}
            >
              <div>
                <h3 className="font-['Figtree:SemiBold'] font-semibold text-[#17212b]">
                  {item.title}
                </h3>
                <p className="mt-1 text-sm text-[#64748b]">
                  {[item.category, item.color, item.location]
                    .filter(Boolean)
                    .join(" · ") || "No item details provided"}
                </p>
                {item.description && (
                  <p className="mt-2 whitespace-pre-wrap text-sm text-[#334155]">
                    {item.description}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-[#64748b]">
                <span>{formatDate(item.date)}</span>
                <code className="max-w-40 break-all rounded-md border border-[#dce3e0] bg-[#f8faf9] px-2 py-1 font-mono">
                  {item.id}
                </code>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default function ReportsScreen() {
  const [selectedType, setSelectedType] = useState<"lost" | "found">("lost")
  const [lostItems, setLostItems] = useState<ReportItem[]>([])
  const [foundItems, setFoundItems] = useState<ReportItem[]>([])
  const [lostError, setLostError] = useState<string | null>(null)
  const [foundError, setFoundError] = useState<string | null>(null)
  const [isLoadingLost, setIsLoadingLost] = useState(true)
  const [isLoadingFound, setIsLoadingFound] = useState(true)

  useEffect(() => {
    const controller = new AbortController()

    async function load(url: string, type: "lost" | "found") {
      try {
        const response = await fetch(url, {
          headers: { Accept: "application/json" },
          credentials: "include",
          signal: controller.signal,
        })
        if (!response.ok) {
          throw new Error(`Could not load reports (HTTP ${response.status}).`)
        }
        const items = parseReports(await response.json())
        if (type === "lost") setLostItems(items)
        else setFoundItems(items)
      } catch (loadError) {
        if (loadError instanceof Error && loadError.name === "AbortError") {
          return
        }
        const message =
          loadError instanceof Error
            ? loadError.message
            : "An unexpected error occurred while loading reports."
        if (type === "lost") setLostError(message)
        else setFoundError(message)
      } finally {
        if (!controller.signal.aborted) {
          if (type === "lost") setIsLoadingLost(false)
          else setIsLoadingFound(false)
        }
      }
    }

    void load(lostItemsApiUrl, "lost")
    void load(inventoryApiUrl, "found")

    return () => controller.abort()
  }, [])

  const showingLostItems = selectedType === "lost"
  const visibleItems = showingLostItems ? lostItems : foundItems
  const isLoading = showingLostItems ? isLoadingLost : isLoadingFound
  const error = showingLostItems ? lostError : foundError
  const title = showingLostItems ? "Lost Items" : "Found Items"

  return (
    <div className="w-full max-w-6xl space-y-6">
      <section className="rounded-3xl bg-gradient-to-br from-[#004f3a] via-[#006747] to-[#00a676] p-7 text-white shadow-xl shadow-emerald-950/10 sm:p-9">
        <p className="font-['Figtree:Bold'] text-xs font-bold tracking-[0.16em] text-emerald-100 uppercase">
          Community reports
        </p>
        <h1 className="mt-2 font-['Outfit:Bold'] text-3xl leading-tight font-bold sm:text-4xl">
          Browse Item Reports
        </h1>
        <p className="mt-3 max-w-2xl font-['Figtree:Medium'] text-sm leading-6 font-medium text-white/85 sm:text-base">
          Browse active lost reports and items found across campus. Choose a
          section to view its latest reports.
        </p>
      </section>

      <nav
        aria-label="Report type"
        className="grid grid-cols-2 gap-3 rounded-2xl border border-[#dce9e3] bg-white p-2 shadow-sm"
      >
        {[
          {
            id: "lost" as const,
            label: "Lost Items",
            count: lostItems.length,
            isLoading: isLoadingLost,
          },
          {
            id: "found" as const,
            label: "Found Items",
            count: foundItems.length,
            isLoading: isLoadingFound,
          },
        ].map((option) => {
          const isSelected = selectedType === option.id

          return (
            <button
              aria-pressed={isSelected}
              className={`flex min-h-14 cursor-pointer items-center justify-between gap-3 rounded-xl px-4 py-3 text-left transition-colors sm:px-6 ${
                isSelected
                  ? "bg-[#006747] text-white shadow-sm"
                  : "text-[#334155] hover:bg-emerald-50"
              }`}
              key={option.id}
              onClick={() => setSelectedType(option.id)}
              type="button"
            >
              <span className="font-['Figtree:SemiBold'] text-sm font-semibold sm:text-base">
                {option.label}
              </span>
              <span
                className={`min-w-8 rounded-full px-2.5 py-1 text-center text-xs font-semibold ${
                  isSelected
                    ? "bg-white/15 text-white"
                    : "bg-[#f0f7f3] text-[#006747]"
                }`}
              >
                {option.isLoading ? "…" : option.count}
              </span>
            </button>
          )
        })}
      </nav>

      <ReportSection
        description={
          showingLostItems
            ? "Items people are looking to get back."
            : "Items reported as found and added to Inventory."
        }
        error={error}
        isLoading={isLoading}
        items={visibleItems}
        title={title}
      />
    </div>
  )
}
