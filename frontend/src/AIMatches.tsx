import { useEffect, useState } from "react"
import { ItemPhoto } from "./PhotoField"

// User story: AI Matching & Search (Epic 3).
// Asks the backend, which asks Claude, for found items that may match one of
// the student's lost reports. The API key stays on the server.

const apiBaseUrl = (import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000").replace(/\/$/, "")

type Match = {
  id: string
  title: string
  category: string
  color: string
  location: string
  date: string
  storage_location: string
  photo_url: string | null
  match_score: number
  match_reason: string
}

function text(record: Record<string, unknown>, key: string): string {
  const value = record[key]
  return typeof value === "string" ? value : ""
}

function parseMatch(record: unknown): Match {
  const r = (typeof record === "object" && record !== null ? record : {}) as Record<string, unknown>
  return {
    id: String(r.id ?? ""),
    title: text(r, "title"),
    category: text(r, "category"),
    color: text(r, "color"),
    location: text(r, "location"),
    date: text(r, "date"),
    storage_location: text(r, "storage_location"),
    photo_url: typeof r.photo_url === "string" ? r.photo_url : null,
    match_score: typeof r.match_score === "number" ? r.match_score : 0,
    match_reason: text(r, "match_reason"),
  }
}

function scoreLabel(score: number): { label: string; className: string } {
  if (score >= 85) return { label: "Very likely", className: "bg-emerald-100 text-emerald-800" }
  if (score >= 65) return { label: "Likely", className: "bg-lime-100 text-lime-800" }
  return { label: "Possible", className: "bg-amber-100 text-amber-800" }
}

export default function AIMatches({ reportId }: { reportId: string }) {
  const [matches, setMatches] = useState<Match[] | null>(null)
  // "fallback" means the AI was unavailable and basic matching was used.
  const [source, setSource] = useState<string>("ai")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    async function load() {
      try {
        const response = await fetch(
          `${apiBaseUrl}/api/lost-items/${encodeURIComponent(reportId)}/matches/`,
          {
            headers: { Accept: "application/json" },
            credentials: "include",
            signal: controller.signal,
          },
        )
        const payload: unknown = await response.json().catch(() => null)
        if (!response.ok) {
          const detail =
            typeof payload === "object" && payload !== null && "detail" in payload
              ? String(payload.detail)
              : `Could not check for matches (HTTP ${response.status}).`
          throw new Error(detail)
        }
        const body = (payload ?? {}) as { source?: unknown; matches?: unknown }
        if (!Array.isArray(body.matches)) throw new Error("Unexpected response from the server.")
        setSource(typeof body.source === "string" ? body.source : "ai")
        setMatches(body.matches.map(parseMatch))
      } catch (loadError) {
        if (loadError instanceof Error && loadError.name === "AbortError") return
        setError(loadError instanceof Error ? loadError.message : "Could not check for matches.")
      }
    }
    void load()
    return () => controller.abort()
  }, [reportId])

  return (
    <div className="mt-4 rounded-2xl border border-[#dce9e3] bg-[#f8faf9] p-5">
      <p className="text-xs font-bold tracking-[0.14em] text-[#006747] uppercase">
        AI suggested matches
      </p>

      {source === "fallback" && matches !== null && (
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900" role="status">
          AI matching is unavailable right now, so these are basic matches by
          category, color, name, and building.
        </p>
      )}

      {error ? (
        <p className="mt-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : matches === null ? (
        <p className="mt-3 text-sm text-[#64748b]" role="status">
          Checking found items for possible matches…
        </p>
      ) : matches.length === 0 ? (
        <p className="mt-3 text-sm text-[#64748b]">
          No likely matches in the found items yet. Check back later.
        </p>
      ) : (
        <ul className="mt-3 space-y-3">
          {matches.map((match) => {
            const badge = scoreLabel(match.match_score)
            return (
              <li className="flex gap-4 rounded-xl border border-[#e8efeb] bg-white p-4" key={match.id}>
                <ItemPhoto title={match.title} url={match.photo_url} />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-semibold text-[#17212b]">{match.title}</h4>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${badge.className}`}>
                      {badge.label} · {match.match_score}%
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-[#64748b]">
                    {[match.category, match.color, `Found at ${match.location}`, match.date]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  <p className="mt-2 text-sm text-[#334155]">{match.match_reason}</p>
                  {match.storage_location && (
                    <p className="mt-1 text-sm text-[#334155]">
                      Held at: <strong>{match.storage_location}</strong>
                    </p>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <p className="mt-3 text-xs text-[#64748b]">
        Suggestions are made by AI and can be wrong. Check the photo and details before
        going to pick anything up.
      </p>
    </div>
  )
}
