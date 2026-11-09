import { useEffect, useState } from "react"

const imgPackageCheck = `${import.meta.env.BASE_URL}assets/c05e7.svg`

const inventoryApiUrl = `http://${window.location.hostname}:8000/api/inventory/`
const lostItemsApiUrl = `http://${window.location.hostname}:8000/api/lost-items/`

const inventoryReturnPath = `/inventory-return/?origin=${encodeURIComponent(window.location.origin)}`
const adminLoginUrl = `http://${window.location.hostname}:8000/admin/login/?next=${encodeURIComponent(inventoryReturnPath)}`

type InventoryItem = {
  id: string
  title: string
  description: string
  location: string
  date: string
  storage_location: string
}

function optionalText(value: unknown, field: string): string {
  if (value === undefined || value === null) return ""
  if (typeof value !== "string") {
    throw new Error(`Inventory item has an invalid ${field} value.`)
  }
  return value
}

function parseInventoryItems(payload: unknown): InventoryItem[] {
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
    throw new Error("The inventory API returned an unexpected response.")
  }

  return records.map((record) => {
    if (
      typeof record !== "object" ||
      record === null ||
      !("id" in record) ||
      !("title" in record) ||
      typeof record.title !== "string"
    ) {
      throw new Error("An inventory item is missing its ID or name.")
    }

    return {
      id: String(record.id),
      title: record.title,
      description: optionalText(
        "description" in record ? record.description : undefined,
        "description",
      ),
      location: optionalText(
        "location" in record ? record.location : undefined,
        "location",
      ),
      date: optionalText("date" in record ? record.date : undefined, "date"),
      storage_location: optionalText(
        "storage_location" in record ? record.storage_location : undefined,
        "storage location",
      ),
    }
  })
}

function getCsrfToken(): string | null {
  const cookie = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith("csrftoken="))
  return cookie ? cookie.slice("csrftoken=".length) : null
}

function InventoryScreen() {
  const [selectedTab, setSelectedTab] = useState<"requests" | "found">(
    "requests",
  )
  const [items, setItems] = useState<InventoryItem[]>([])
  const [lostItems, setLostItems] = useState<InventoryItem[]>([])

  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingLostItems, setIsLoadingLostItems] = useState(true)

  const [error, setError] = useState<string | null>(null)
  const [lostItemsError, setLostItemsError] = useState<string | null>(null)

  const [needsSuperuserLogin, setNeedsSuperuserLogin] = useState(false)

  const [deletingItemId, setDeletingItemId] = useState<string | null>(null)
  const [resolvingItemId, setResolvingItemId] = useState<string | null>(null)

  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [resolveError, setResolveError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function loadInventory() {
      try {
        const response = await fetch(inventoryApiUrl, {
          headers: { Accept: "application/json" },
          credentials: "include",
          signal: controller.signal,
        })

        if (response.status === 401 || response.status === 403) {
          setNeedsSuperuserLogin(true)

          throw new Error(
            "Sign in with a Django superuser account. Staff accounts do not have access.",
          )
        }

        if (!response.ok) {
          throw new Error(`Could not load inventory (HTTP ${response.status}).`)
        }

        const data: unknown = await response.json()
        setItems(parseInventoryItems(data))
      } catch (loadError) {
        if (loadError instanceof Error && loadError.name === "AbortError") {
          return
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "An unexpected error occurred while loading inventory.",
        )
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    async function loadLostItems() {
      try {
        const response = await fetch(lostItemsApiUrl, {
          headers: { Accept: "application/json" },
          credentials: "include",
          signal: controller.signal,
        })
        if (!response.ok) {
          throw new Error(
            `Could not load lost items (HTTP ${response.status}).`,
          )
        }
        setLostItems(parseInventoryItems(await response.json()))
      } catch (loadError) {
        if (loadError instanceof Error && loadError.name === "AbortError") {
          return
        }
        setLostItemsError(
          loadError instanceof Error
            ? loadError.message
            : "An unexpected error occurred while loading lost items.",
        )
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingLostItems(false)
        }
      }
    }

    loadInventory()
    loadLostItems()

    return () => controller.abort()
  }, [])

  async function resolveLostItem(item: InventoryItem) {
    const csrfToken = getCsrfToken()
    if (!csrfToken) {
      setResolveError(
        "Could not verify this request. Refresh the page and try again.",
      )
      return
    }

    setResolvingItemId(item.id)
    setResolveError(null)

    try {
      const response = await fetch(
        `${lostItemsApiUrl}${encodeURIComponent(item.id)}/resolve/`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "X-CSRFToken": csrfToken,
          },
          credentials: "include",
        },
      )

      if (
        response.status === 403 &&
        response.headers.get("content-type")?.includes("text/html")
      ) {
        throw new Error(
          "Django rejected the request's CSRF origin. Restart the backend server, refresh this page, and try again.",
        )
      }
      if (response.status === 401 || response.status === 403) {
        setNeedsSuperuserLogin(true)
        throw new Error(
          "Sign in with a Django superuser account to resolve lost items.",
        )
      }
      if (!response.ok) {
        throw new Error(`Could not resolve the item (HTTP ${response.status}).`)
      }

      const updatedItem = parseInventoryItems([await response.json()])[0]
      setLostItems((currentItems) =>
        currentItems.filter((currentItem) => currentItem.id !== item.id),
      )
      setItems((currentItems) =>
        currentItems.some((currentItem) => currentItem.id === updatedItem.id)
          ? currentItems
          : [updatedItem, ...currentItems],
      )
    } catch (requestError) {
      setResolveError(
        requestError instanceof Error
          ? requestError.message
          : "An unexpected error occurred while resolving the item.",
      )
    } finally {
      setResolvingItemId(null)
    }
  }

  async function deleteItem(item: InventoryItem) {
    if (
      !window.confirm(
        `Mark "${item.title}" as retrieved and remove it from the inventory? This cannot be undone.`,
      )
    ) {
      return
    }

    const csrfToken = getCsrfToken()
    if (!csrfToken) {
      setDeleteError(
        "Could not verify this delete request. Refresh the page and try again.",
      )
      return
    }

    setDeletingItemId(item.id)
    setDeleteError(null)

    try {
      const response = await fetch(
        `${inventoryApiUrl}${encodeURIComponent(item.id)}/`,
        {
          method: "DELETE",
          headers: {
            Accept: "application/json",
            "X-CSRFToken": csrfToken,
          },
          credentials: "include",
        },
      )

      if (response.status === 403 && response.headers.get("content-type")?.includes("text/html")) {
        throw new Error(
          "Django rejected the request's CSRF origin. Restart the backend server, refresh this page, and try again.",
        )
      }
      if (response.status === 401 || response.status === 403) {
        setNeedsSuperuserLogin(true)
        throw new Error(
          "Your superuser session is missing or expired. Sign in again and retry.",
        )
      }
      if (!response.ok) {
        throw new Error(`Could not delete the item (HTTP ${response.status}).`)
      }

      setItems((currentItems) =>
        currentItems.filter((currentItem) => currentItem.id !== item.id),
      )
    } catch (requestError) {
      setDeleteError(
        requestError instanceof Error
          ? requestError.message
          : "An unexpected error occurred while deleting the item.",
      )
    } finally {
      setDeletingItemId(null)
    }
  }

  return (
    <div className="w-full max-w-6xl space-y-6">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#004f3a] via-[#006747] to-[#00a676] p-7 text-white shadow-xl shadow-emerald-950/10 sm:p-9">
        <div className="absolute -top-16 -right-12 size-52 rounded-full border-[32px] border-white/10" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
          <span className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
            <img
              alt=""
              className="size-8 brightness-0 invert"
              src={imgPackageCheck}
            />
          </span>
          <div>
            <p className="font-['Figtree:Bold'] text-xs font-bold tracking-[0.16em] text-emerald-100 uppercase">
              Staff inventory
            </p>
            <h1 className="mt-2 font-['Outfit:Bold'] text-3xl leading-tight font-bold sm:text-4xl">
              Stored items
            </h1>
            <p className="mt-3 max-w-3xl font-['Figtree:Medium'] text-sm leading-6 font-medium text-white/85 sm:text-base">
              Review found items and their storage locations.
            </p>
          </div>
        </div>
      </section>

      <nav
        aria-label="Inventory section"
        className="grid grid-cols-2 gap-3 rounded-2xl border border-[#dce9e3] bg-white p-2 shadow-sm"
      >
        {[
          {
            id: "found" as const,
            label: "Found Items",
            count: items.length,
            isLoading,
          },
          {
            id: "requests" as const,
            label: "Item Requests",
            count: lostItems.length,
            isLoading: isLoadingLostItems,
          },
        ].map((tab) => {
          const isSelected = selectedTab === tab.id

          return (
            <button
              aria-pressed={isSelected}
              className={`flex min-h-14 cursor-pointer items-center justify-between gap-3 rounded-xl px-4 py-3 text-left transition-colors sm:px-6 ${
                isSelected
                  ? "bg-[#006747] text-white shadow-sm"
                  : "text-[#334155] hover:bg-emerald-50"
              }`}
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              type="button"
            >
              <span className="font-['Figtree:SemiBold'] text-sm font-semibold sm:text-base">
                {tab.label}
              </span>
              <span
                className={`min-w-8 rounded-full px-2.5 py-1 text-center text-xs font-semibold ${
                  isSelected
                    ? "bg-white/15 text-white"
                    : "bg-[#f0f7f3] text-[#006747]"
                }`}
              >
                {tab.isLoading ? "…" : tab.count}
              </span>
            </button>
          )
        })}
      </nav>

      {selectedTab === "requests" ? (
      <section className="overflow-hidden rounded-3xl border border-[#dce9e3] bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-4 border-b border-[#dce9e3] p-6 sm:flex-row sm:items-center sm:p-8">
          <div>
            <p className="font-['Figtree:Bold'] text-xs font-bold tracking-[0.14em] text-[#006747] uppercase">
              Staff requests
            </p>
            <h2 className="mt-2 font-['Outfit:Bold'] text-2xl font-bold text-[#17212b]">
              Item Requests
            </h2>
            <p className="mt-1 text-sm text-[#64748b]">
              Mark a recovered request as resolved to move it into found
              inventory.
            </p>
          </div>
          <span className="w-fit rounded-full bg-amber-50 px-3 py-1.5 font-['Figtree:SemiBold'] text-xs font-semibold text-amber-800">
            {isLoadingLostItems
              ? "Loading…"
              : `${lostItems.length} open reports`}
          </span>
        </div>

        {resolveError && (
          <p className="px-6 pt-5 text-sm text-red-700" role="alert">
            {resolveError}
            {needsSuperuserLogin && (
              <>
                {" "}
                <a className="font-semibold underline" href={adminLoginUrl}>
                  Sign in to Django admin
                </a>
              </>
            )}
          </p>
        )}
        {lostItemsError ? (
          <p className="px-6 py-10 text-center text-sm text-red-700" role="alert">
            {lostItemsError}
          </p>
        ) : isLoadingLostItems ? (
          <p className="px-6 py-10 text-center text-sm text-[#64748b]">
            Loading lost reports…
          </p>
        ) : lostItems.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-[#64748b]">
            There are no lost reports to resolve.
          </p>
        ) : (
          <ul className="divide-y divide-[#e8efeb]">
            {lostItems.map((item) => (
              <li
                className="flex flex-col justify-between gap-4 px-6 py-5 sm:flex-row sm:items-center sm:px-8"
                key={item.id}
              >
                <div className="min-w-0">
                  <p className="font-['Figtree:SemiBold'] font-semibold text-[#17212b]">
                    {item.title}
                  </p>
                  <p className="mt-1 text-sm text-[#64748b]">
                    {[item.location, item.date && `Lost ${item.date}`]
                      .filter(Boolean)
                      .join(" · ") || "No location or date provided"}
                  </p>
                  {item.description && (
                    <p className="mt-1 whitespace-pre-wrap text-sm text-[#64748b]">
                      {item.description}
                    </p>
                  )}
                  <code className="mt-2 inline-block max-w-full break-all rounded-md border border-[#dce3e0] bg-[#f8faf9] px-2 py-1 font-mono text-xs text-[#334155]">
                    {item.id}
                  </code>
                </div>
                <button
                  className="w-fit shrink-0 rounded-xl bg-[#006747] px-4 py-2.5 font-['Figtree:SemiBold'] text-sm font-semibold text-white transition-colors hover:bg-[#00523a] disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={resolvingItemId !== null}
                  onClick={() => resolveLostItem(item)}
                  type="button"
                >
                  {resolvingItemId === item.id
                    ? "Resolving…"
                    : "Resolve & Add to Inventory"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      ) : (
      <section className="overflow-hidden rounded-3xl border border-[#dce9e3] bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-4 border-b border-[#dce9e3] p-6 sm:flex-row sm:items-center sm:p-8">
          <div>
            <p className="font-['Figtree:Bold'] text-xs font-bold tracking-[0.14em] text-[#006747] uppercase">
              Inventory list
            </p>
            <h2 className="mt-2 font-['Outfit:Bold'] text-2xl font-bold text-[#17212b]">
              Found items
            </h2>
          </div>
          <span className="w-fit rounded-full bg-emerald-50 px-3 py-1.5 font-['Figtree:SemiBold'] text-xs font-semibold text-[#006747]">
            {isLoading ? "Loading…" : `${items.length} items`}
          </span>
        </div>

        {error ? (
          <div className="px-6 py-12 text-center" role="alert">
            <p className="font-['Outfit:Bold'] text-xl font-bold text-[#17212b]">
              {needsSuperuserLogin
                ? "Superuser sign-in required"
                : "Inventory unavailable"}
            </p>
            <p className="mt-2 font-['Figtree:Medium'] text-sm leading-6 font-medium text-[#64748b]">
              {error}
            </p>
            {needsSuperuserLogin && (
              <a
                className="mt-5 inline-flex rounded-xl bg-[#006747] px-4 py-2.5 font-['Figtree:SemiBold'] text-sm font-semibold text-white hover:bg-[#004f3a]"
                href={adminLoginUrl}
              >
                Sign in to Django admin
              </a>
            )}
          </div>
        ) : isLoading ? (
          <div className="px-6 py-16 text-center text-sm font-medium text-[#64748b]">
            Loading inventory…
          </div>
        ) : items.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="font-['Outfit:Bold'] text-xl font-bold text-[#17212b]">
              No found items yet
            </p>
            <p className="mt-2 font-['Figtree:Medium'] text-sm leading-6 font-medium text-[#64748b]">
              Found items will appear here when they are added.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {deleteError && (
              <p className="px-6 py-3 text-sm text-red-700" role="alert">
                {deleteError}
              </p>
            )}
            <table className="w-full min-w-[900px] text-left">
              <thead className="bg-[#f8faf9] font-['Figtree:Bold'] text-[11px] font-bold tracking-[0.08em] text-[#64748b] uppercase">
                <tr>
                  <th className="px-6 py-3">Item</th>
                  <th className="px-6 py-3">Description</th>
                  <th className="px-6 py-3">Location found</th>
                  <th className="px-6 py-3">Date found</th>
                  <th className="px-6 py-3">Storage location</th>
                  <th className="px-6 py-3">Item ID</th>
                  <th className="px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e8efeb]">
                {items.map((item) => (
                  <tr
                    className="align-top text-sm text-[#334155]"
                    key={item.id}
                  >
                    <td className="px-6 py-4 font-semibold text-[#17212b]">
                      {item.title}
                    </td>
                    <td className="max-w-sm whitespace-pre-wrap px-6 py-4">
                      {item.description || "—"}
                    </td>
                    <td className="px-6 py-4">{item.location || "—"}</td>
                    <td className="px-6 py-4">
                      {item.date
                        ? new Date(`${item.date}T00:00:00`).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-6 py-4">
                      {item.storage_location || "—"}
                    </td>
                    <td className="px-6 py-4">
                      <code className="inventory-item-id inline-block max-w-[190px] break-all rounded-md border border-[#dce3e0] bg-[#f8faf9] px-2.5 py-1.5 font-mono text-xs text-[#334155]">
                        {item.id}
                      </code>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        className="item-retrieved-button rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 font-semibold text-emerald-800 transition-colors hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={deletingItemId !== null}
                        onClick={() => deleteItem(item)}
                        type="button"
                      >
                        {deletingItemId === item.id
                          ? "Retrieving…"
                          : "Item Retrieved"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      )}
    </div>
  )
}

export default InventoryScreen
