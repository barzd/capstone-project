import { useEffect, useMemo, useRef, useState } from "react"
import {
  Map as MapLibreMap,
  NavigationControl,
  Marker,
  setWorkerUrl,
  type GeoJSONSource,
  type MapGeoJSONFeature,
  type ExpressionSpecification,
} from "maplibre-gl"
import mapLibreWorkerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url"
import "maplibre-gl/dist/maplibre-gl.css"
import campusBoundary from "./campus-boundary-display.json"
import { campusBuildingLabels } from "./campus-building-labels"
import "./campus-map-labels.css"
import type { Feature } from "geojson"
import { groupCampusInventory } from "./campus-inventory"

const apiBaseUrl = (import.meta.env.VITE_API_URL ?? `http://${window.location.hostname}:8000`).replace(/\/$/, "")
const itemsApiUrl = `${apiBaseUrl}/api/inventory/`
const buildingsLayerId = "campus-building-footprints"
const labeledBuildingsSourceId = "labeled-campus-buildings"
const campusOutlineSourceId = "campus-boundary-outline"
const campusOutlineLayerId = "campus-boundary-line"
const campusMaskSourceId = "campus-outside-mask-source"
const campusMaskLayerId = "campus-outside-mask"
const selectedBuildingLayerId = "selected-campus-building"
const selectedBuildingSourceId = "selected-campus-building-geometry"
const buildingHeight: ExpressionSpecification = [
  "max",
  4,
  ["to-number", ["get", "render_height"], ["to-number", ["get", "height"], 10]],
]
const campusBounds: [[number, number], [number, number]] = [
  [-73.435, 40.7463307],
  [-73.4222847, 40.7612244],
]
const navigationBounds: [[number, number], [number, number]] = [
  [campusBounds[0][0] - 0.015, campusBounds[0][1] - 0.008],
  [campusBounds[1][0] + 0.015, campusBounds[1][1] + 0.008],
]
const campusPolygons = campusBoundary.geometry.coordinates as number[][][][]
// Solar Car Port in Lot 5 (OSM way 813340825). Padding covers tile quantization.
const solarCarportExclusion = {
  type: "Polygon" as const,
  coordinates: [[
    [-73.43291, 40.75118],
    [-73.43222, 40.75118],
    [-73.43222, 40.75171],
    [-73.43291, 40.75171],
    [-73.43291, 40.75118],
  ]],
}

function pointInRing(point: [number, number], ring: number[][]) {
  let inside = false

  for (let current = 0, previous = ring.length - 1; current < ring.length; previous = current++) {
    const [currentX, currentY] = ring[current]
    const [previousX, previousY] = ring[previous]
    const crosses = (currentY > point[1]) !== (previousY > point[1])
      && point[0] < ((previousX - currentX) * (point[1] - currentY)) / (previousY - currentY) + currentX

    if (crosses) inside = !inside
  }

  return inside
}

function isInsideCampus(point: [number, number]) {
  return campusPolygons.some(([outerRing, ...holes]) =>
    pointInRing(point, outerRing) && !holes.some((hole) => pointInRing(point, hole)),
  )
}

function ringArea(ring: number[][]) {
  return ring.reduce((area, [x, y], index) => {
    const [nextX, nextY] = ring[(index + 1) % ring.length]
    return area + x * nextY - nextX * y
  }, 0) / 2
}

function ringWithWinding(ring: number[][], clockwise: boolean) {
  const isClockwise = ringArea(ring) < 0
  return isClockwise === clockwise ? ring : [...ring].reverse()
}

function campusMaskFeature() {
  const outsideRing = ringWithWinding([
    [-73.6, 40.7],
    [-73.3, 40.7],
    [-73.3, 40.9],
    [-73.6, 40.9],
    [-73.6, 40.7],
  ], false)

  return {
    type: "Feature" as const,
    properties: {},
    geometry: {
      type: "Polygon" as const,
      coordinates: [outsideRing, ...campusPolygons.map(([ring]) => ringWithWinding(ring, true))],
    },
  }
}

function polygonAtPoint(
  geometry: MapGeoJSONFeature["geometry"],
  point: [number, number],
): MapGeoJSONFeature["geometry"] | null {
  const polygons = (geometry.type === "Polygon" ? [geometry.coordinates]
    : geometry.type === "MultiPolygon" ? geometry.coordinates : []) as number[][][][]
  const campusPieces = polygons.filter(isCampusFootprint)
  if (!campusPieces.length) return null
  const polygon = campusPieces.find(([outerRing, ...holes]) =>
    pointInRing(point, outerRing) && !holes.some((hole) => pointInRing(point, hole)),
  ) ?? campusPieces.reduce((nearest, candidate) =>
    distanceToRing(point, candidate[0]) < distanceToRing(point, nearest[0]) ? candidate : nearest,
  )

  // A roof click can land just outside its ground footprint on the tilted map.
  // Never fall back to an unrelated component farther away.
  if (!pointInRing(point, polygon[0]) && distanceToRing(point, polygon[0]) > 40) return null
  return { type: "Polygon", coordinates: polygon }
}

function isCampusFootprint(polygon: number[][][]) {
  return polygon[0]?.length > 0 && polygon[0].every(([lng, lat]) =>
    isInsideCampus([lng, lat]) && !pointInRing([lng, lat], solarCarportExclusion.coordinates[0]),
  )
}

// Work in approximate local meters so longitude and latitude have comparable scales.
function distanceToRing(point: number[], ring: number[][]) {
  const scale = Math.cos(point[1] * Math.PI / 180)
  return Math.min(...ring.slice(1).map((end, index) => {
    const start = ring[index]
    const dx = (end[0] - start[0]) * scale
    const dy = end[1] - start[1]
    const px = (point[0] - start[0]) * scale
    const py = point[1] - start[1]
    const t = Math.max(0, Math.min(1, (px * dx + py * dy) / (dx * dx + dy * dy || 1)))
    return Math.hypot(px - t * dx, py - t * dy) * 111320
  }))
}

function completeBuildingGeometry(map: MapLibreMap, feature: MapGeoJSONFeature, point: [number, number]) {
  const seed = polygonAtPoint(feature.geometry, point)
  if (!seed || seed.type !== "Polygon") return null

  const polygons: number[][][][] = [seed.coordinates]
  const seen = new Set([JSON.stringify(seed.coordinates)])
  const candidates: number[][][][] = map.querySourceFeatures("openmaptiles", { sourceLayer: "building" })
    .filter((candidate) => feature.id == null || candidate.id === feature.id)
    .flatMap((candidate) => candidate.geometry.type === "Polygon"
      ? [candidate.geometry.coordinates]
      : candidate.geometry.type === "MultiPolygon" ? candidate.geometry.coordinates : [])
    .filter(isCampusFootprint)

  // Tile boundaries can split a footprint. Only join pieces touching this component;
  // a shared feature ID alone can also refer to disconnected, distant polygons.
  for (let index = 0; index < polygons.length; index++) {
    for (const candidate of candidates) {
      const key = JSON.stringify(candidate)
      if (seen.has(key)) continue
      const ring = polygons[index][0]
      if (!candidate[0].some((vertex) => distanceToRing(vertex, ring) < 0.25)
        && !ring.some((vertex) => distanceToRing(vertex, candidate[0]) < 0.25)) continue
      seen.add(key)
      polygons.push(candidate)
    }
  }
  return { type: "MultiPolygon" as const, coordinates: polygons }
}

type FoundItem = {
  id: string
  title: string
  description: string
  location: string
  date: string
}

function parseFoundItems(payload: unknown): FoundItem[] {
  const records = Array.isArray(payload)
    ? payload
    : typeof payload === "object" && payload !== null && "results" in payload && Array.isArray(payload.results)
      ? payload.results
      : null

  if (!records) throw new Error("The item service returned an unexpected response.")

  return records.flatMap((record) => {
    if (typeof record !== "object" || record === null || !("id" in record) || !("title" in record)) return []
    if ("status" in record && record.status !== "found") return []

    return [{
      id: String(record.id),
      title: typeof record.title === "string" ? record.title : "Found item",
      description: "description" in record && typeof record.description === "string" ? record.description : "",
      location: "location" in record && typeof record.location === "string" ? record.location : "",
      date: "date" in record && typeof record.date === "string" ? record.date : "",
    }]
  })
}

function formatDate(value: string) {
  if (!value) return "Date not listed"
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString()
}

export default function CampusMap() {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const [items, setItems] = useState<FoundItem[]>([])
  const [selectedBuilding, setSelectedBuilding] = useState("")
  const selectedBuildingRef = useRef(selectedBuilding)
  const refreshLabelsRef = useRef<(() => void) | null>(null)
  const refreshSelectionRef = useRef<(() => void) | null>(null)
  const refreshCountsRef = useRef<((counts: Map<string, number>, loading: boolean, failed: boolean) => void) | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isMapLoaded, setIsMapLoaded] = useState(false)
  const [loadError, setLoadError] = useState("")
  const [mapError, setMapError] = useState("")

  useEffect(() => {
    selectedBuildingRef.current = selectedBuilding
    refreshLabelsRef.current?.()
    refreshSelectionRef.current?.()
  }, [selectedBuilding])

  useEffect(() => {
    const controller = new AbortController()

    async function loadItems() {
      try {
        const response = await fetch(itemsApiUrl, {
          headers: { Accept: "application/json" },
          signal: controller.signal,
        })
        if (!response.ok) throw new Error(`Could not load reports (HTTP ${response.status}).`)
        setItems(parseFoundItems(await response.json()))
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return
        setLoadError(error instanceof Error ? error.message : "Could not load found items.")
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }

    void loadItems()
    return () => controller.abort()
  }, [])

  useEffect(() => {
    if (!mapContainerRef.current) return

    setWorkerUrl(mapLibreWorkerUrl)
    const map = new MapLibreMap({
      container: mapContainerRef.current,
      style: {
        version: 8,
        light: {
          anchor: "viewport",
          color: "#fffaf3",
          intensity: 0.25,
          position: [1.5, 210, 45],
        },
        sources: {
          aerial: {
            type: "raster",
            tiles: [
              "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
            ],
            tileSize: 256,
            attribution: "Imagery Source: Esri, Vantor, Earthstar Geographics, and the GIS User Community",
          },
          openmaptiles: {
            type: "vector",
            url: "https://tiles.openfreemap.org/planet",
            attribution: "© OpenStreetMap contributors",
          },
        },
        layers: [{ id: "aerial-imagery", type: "raster", source: "aerial" }],
      },
      center: [-73.4266988, 40.7529167],
      zoom: 15.6,
      minZoom: 14,
      maxZoom: 20,
      pitch: 58,
      bearing: -18,
      maxBounds: navigationBounds,
    })
    mapRef.current = map
    const resizeObserver = new ResizeObserver(() => map.resize())
    resizeObserver.observe(mapContainerRef.current)
    ;(window as Window & { campusDebugMap?: MapLibreMap }).campusDebugMap = map
    map.addControl(new NavigationControl({ showCompass: false }), "top-right")
    const labels = campusBuildingLabels.filter((label) => label.name.trim()).map((label) => {
      const element = document.createElement("div")
      element.className = "campus-map-label"
      const bubble = document.createElement("button")
      bubble.type = "button"
      bubble.className = "campus-map-label-bubble"
      const name = document.createElement("span")
      name.textContent = label.name
      const badge = document.createElement("span")
      badge.className = "campus-map-label-count"
      badge.textContent = "..."
      badge.setAttribute("aria-hidden", "true")
      bubble.append(name, badge)
      bubble.setAttribute("aria-label", `Select ${label.name}`)
      bubble.addEventListener("click", (event) => {
        event.stopPropagation()
        setSelectedBuilding(label.name)
      })
      bubble.addEventListener("dblclick", (event) => event.stopPropagation())
      element.append(bubble)
      const marker = new Marker({
        element,
        anchor: "bottom",
        offset: label.offset ?? [0, -18],
        pitchAlignment: "viewport",
        rotationAlignment: "viewport",
      }).setLngLat(label.coordinates).addTo(map)
      return { label, element, marker, bubble, badge }
    })
    const refreshLabels = () => {
      const occupied: DOMRect[] = []
      const container = map.getContainer().getBoundingClientRect()
      const ordered = [...labels].sort((a, b) =>
        Number(b.label.name === selectedBuildingRef.current) - Number(a.label.name === selectedBuildingRef.current)
        || (b.label.priority ?? 0) - (a.label.priority ?? 0),
      )
      for (const { label, element } of ordered) {
        const selected = label.name === selectedBuildingRef.current
        element.classList.toggle("is-selected", selected)
        element.querySelector("button")?.setAttribute("aria-pressed", String(selected))
        const bounds = element.getBoundingClientRect()
        const inView = bounds.right > container.left && bounds.left < container.right
          && bounds.bottom > container.top && bounds.top < container.bottom
        const overlaps = occupied.some((other) => bounds.left < other.right + 6
          && bounds.right + 6 > other.left && bounds.top < other.bottom + 6 && bounds.bottom + 6 > other.top)
        const visible = inView && (selected || (map.getZoom() >= (label.minZoom ?? 15.4) && !overlaps))
        element.style.visibility = visible ? "visible" : "hidden"
        if (visible) occupied.push(bounds)
      }
    }
    refreshLabelsRef.current = refreshLabels
    refreshCountsRef.current = (counts, loading, failed) => {
      for (const { label, bubble, badge } of labels) {
        const count = counts.get(label.name) ?? 0
        const summary = loading ? "Loading found items" : failed ? "Item count unavailable"
          : `${count} found ${count === 1 ? "item" : "items"}`
        badge.textContent = loading ? "..." : failed ? "?" : String(count)
        badge.classList.toggle("has-items", !loading && !failed && count > 0)
        bubble.setAttribute("aria-label", `Select ${label.name}: ${summary}`)
        bubble.title = `${label.name}: ${summary}`
      }
      refreshLabels()
    }
    map.on("render", refreshLabels)
    if (import.meta.env.DEV) {
      map.on("contextmenu", (event) => {
        event.preventDefault()
        console.info(`Building label: { name: "", coordinates: [${event.lngLat.lng.toFixed(7)}, ${event.lngLat.lat.toFixed(7)}] },`)
      })
    }

    map.on("load", () => {
      if (!map.getSource("openmaptiles")) {
        setMapError("The map style did not provide campus building data.")
        return
      }

      // Keep the vector tiles loaded for footprint matching, without displaying
      // every structure supplied by the basemap.
      map.addLayer({
        id: "campus-building-tile-loader",
        type: "fill",
        source: "openmaptiles",
        "source-layer": "building",
        minzoom: 14,
        paint: { "fill-opacity": 0 },
      })
      map.addSource(labeledBuildingsSourceId, {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      })
      let refreshFrame: number | undefined
      let labeledFootprints: Feature[] = []
      const refreshBuildingFootprints = () => {
        if (refreshFrame !== undefined) return
        refreshFrame = requestAnimationFrame(() => {
          refreshFrame = undefined
          if (mapRef.current !== map) return
          const candidates = map.querySourceFeatures("openmaptiles", { sourceLayer: "building" })
          const features = campusBuildingLabels.filter((label) => label.name.trim()).flatMap((label, index) => {
            let best: MapGeoJSONFeature | undefined
            let bestDistance = Infinity
            for (const candidate of candidates) {
              const geometry = polygonAtPoint(candidate.geometry, label.coordinates)
              if (!geometry || geometry.type !== "Polygon") continue
              const [outer, ...holes] = geometry.coordinates as number[][][]
              const inside = pointInRing(label.coordinates, outer)
                && !holes.some((hole) => pointInRing(label.coordinates, hole))
              const distance = inside ? 0 : distanceToRing(label.coordinates, outer)
              if (distance < bestDistance) {
                best = candidate as MapGeoJSONFeature
                bestDistance = distance
              }
            }
            // Labels placed on a tilted roof can sit outside the ground outline.
            if (!best || bestDistance > 25) return []
            const geometry = completeBuildingGeometry(map, best, label.coordinates)
            return geometry ? [{
              type: "Feature" as const,
              id: index,
              geometry,
              properties: { ...best.properties, name: label.name, campusLabel: label.name },
            }] : []
          })
          ;(map.getSource(labeledBuildingsSourceId) as GeoJSONSource).setData({ type: "FeatureCollection", features })
          labeledFootprints = features
          refreshSelectionRef.current?.()
        })
      }
      map.on("sourcedata", (event) => {
        if (event.sourceId === "openmaptiles" && event.isSourceLoaded) refreshBuildingFootprints()
      })
      map.on("moveend", refreshBuildingFootprints)
      refreshBuildingFootprints()
      map.addLayer({
        id: "campus-building-foundations",
        type: "line",
        source: labeledBuildingsSourceId,
        minzoom: 14,
        layout: { "line-join": "round" },
        paint: {
          "line-color": "#777268",
          "line-width": ["interpolate", ["linear"], ["zoom"], 14, 0.6, 18, 1.5],
          "line-opacity": 0.65,
        },
      })
      map.addLayer({
        id: buildingsLayerId,
        type: "fill-extrusion",
        source: labeledBuildingsSourceId,
        minzoom: 14,
        paint: {
          // Warm, opaque concrete with soft directional shading.
          "fill-extrusion-color": "#c9c3b8",
          "fill-extrusion-height": buildingHeight,
          "fill-extrusion-base": ["to-number", ["get", "render_min_height"], 0],
          "fill-extrusion-opacity": 1,
          "fill-extrusion-vertical-gradient": true,
        },
      })
      map.addSource(campusMaskSourceId, {
        type: "geojson",
        data: campusMaskFeature(),
      })
      map.addLayer({
        id: campusMaskLayerId,
        type: "fill",
        source: campusMaskSourceId,
        paint: {
          "fill-color": "#7b8490",
          "fill-opacity": 0.84,
        },
      })
      map.addSource(campusOutlineSourceId, {
        type: "geojson",
        data: campusBoundary as Feature,
      })
      map.addLayer({
        id: campusOutlineLayerId,
        type: "line",
        source: campusOutlineSourceId,
        paint: {
          "line-color": "#f3c64e",
          "line-width": 3,
          "line-opacity": 0.96,
        },
      })
      map.addSource(selectedBuildingSourceId, {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      })
      map.addLayer({
        id: "selected-campus-building-outline",
        type: "line",
        source: selectedBuildingSourceId,
        layout: { "line-join": "round" },
        paint: {
          "line-color": "#9f302c",
          "line-width": 2,
          "line-opacity": 0.9,
        },
      })
      map.addLayer({
        id: selectedBuildingLayerId,
        type: "fill-extrusion",
        source: selectedBuildingSourceId,
        paint: {
          "fill-extrusion-color": "#dc4038",
          "fill-extrusion-height": ["max", 30, buildingHeight],
          "fill-extrusion-base": ["to-number", ["get", "render_min_height"], 0],
          "fill-extrusion-opacity": 1,
          "fill-extrusion-vertical-gradient": true,
        },
      })
      refreshSelectionRef.current = () => {
        const feature = labeledFootprints.find((entry) => entry.properties?.campusLabel === selectedBuildingRef.current)
        ;(map.getSource(selectedBuildingSourceId) as GeoJSONSource).setData({
          type: "FeatureCollection",
          features: feature ? [feature] : [],
        })
        map.setFilter(buildingsLayerId, feature
          ? ["!=", ["get", "campusLabel"], selectedBuildingRef.current]
          : null)
      }
      map.fitBounds(campusBounds, {
        padding: 8,
        maxZoom: 15.4,
        pitch: 58,
        bearing: -18,
      })
      map.once("idle", () => setIsMapLoaded(true))
    })
    map.on("error", (event) => {
      if (event.error?.message) setMapError(`MapLibre could not load the map: ${event.error.message}`)
    })

    return () => {
      resizeObserver.disconnect()
      refreshCountsRef.current = null
      refreshSelectionRef.current = null
      refreshLabelsRef.current = null
      map.off("render", refreshLabels)
      labels.forEach(({ marker }) => marker.remove())
      map.remove()
      mapRef.current = null
    }
  }, [])

  const inventoryBuildings = useMemo(() => groupCampusInventory(items, campusBuildingLabels), [items])
  useEffect(() => {
    refreshCountsRef.current?.(
      new Map(inventoryBuildings.map((building) => [building.name, building.items.length])),
      isLoading,
      Boolean(loadError),
    )
  }, [inventoryBuildings, isLoading, loadError])
  const labeledItems = useMemo(() => {
    const matched = new Set(inventoryBuildings.flatMap((building) => building.items.map((item) => item.id)))
    return items.filter((item) => matched.has(item.id))
  }, [items, inventoryBuildings])
  const buildingItems = selectedBuilding
    ? inventoryBuildings.find((building) => building.name === selectedBuilding)?.items ?? []
    : labeledItems

  return (
    <section className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-white">
      <header className="flex shrink-0 flex-col gap-2 border-b border-[#e1e8e4] px-5 py-3 sm:flex-row sm:items-end sm:justify-between sm:px-7">
        <div>
          <p className="font-['Figtree:Bold'] text-xs font-bold tracking-[0.14em] text-[#006747] uppercase">Farmingdale State College</p>
          <h1 className="mt-1 font-['Outfit:Bold'] text-2xl font-bold text-[#17212b]">Found items by building</h1>
        </div>
        <p className="text-sm text-[#52615b]">{items.length} found {items.length === 1 ? "item" : "items"} on campus</p>
      </header>

      <div className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_minmax(0,0.65fr)] lg:grid-cols-[minmax(0,1fr)_340px] lg:grid-rows-1">
        <div
          className="relative min-h-0 min-w-0 bg-[#e7eee9]"
        >
          <div
            className="absolute inset-0"
            ref={mapContainerRef}
            style={{ position: "absolute", inset: 0 }}
          />
          {!isMapLoaded && !mapError && (
            <p className="pointer-events-none absolute inset-x-4 top-4 z-10 rounded-lg bg-white/95 px-4 py-3 text-sm text-[#52615b] shadow-sm">
              Loading campus map…
            </p>
          )}
          {mapError && (
            <div className="absolute inset-x-4 top-4 z-10 rounded-lg border border-[#e8c98a] bg-[#fff9e9] px-4 py-3 text-sm text-[#694b12] shadow-sm" role="alert">
              {mapError}
            </div>
          )}
          {!mapError && (
            <div className="pointer-events-none absolute bottom-4 left-4 rounded-md bg-white/95 px-3 py-2 text-xs font-semibold text-[#334155] shadow">
              Click a building label to see reported items
            </div>
          )}
        </div>

        <aside className="minimal-scrollbar flex min-h-0 flex-col overflow-y-auto overscroll-contain border-t border-[#e1e8e4] lg:border-t-0 lg:border-l">
          <div className="shrink-0 border-b border-[#e1e8e4] px-5 py-5">
            <p className="text-xs font-bold tracking-[0.12em] text-[#74827c] uppercase">Found inventory</p>
            <h2 className="mt-1 font-['Outfit:Bold'] text-xl font-bold text-[#17212b]">{selectedBuilding || "All labeled buildings"}</h2>
            <p className="mt-1 text-sm text-[#64748b]" aria-live="polite">
              {isLoading ? "Loading inventory..." : loadError ? "Inventory unavailable" : `${buildingItems.length} found ${buildingItems.length === 1 ? "item" : "items"}`}
            </p>
            {inventoryBuildings.length > 0 && (
              <label className="mt-4 block text-xs font-semibold text-[#52615b]">
                Filter by building
                <select
                  className="mt-1.5 h-10 w-full rounded-md border border-[#cbd8d2] bg-white px-3 text-sm text-[#17212b]"
                  onChange={(event) => setSelectedBuilding(event.target.value)}
                  value={selectedBuilding}
                >
                  <option value="">All labeled buildings{!isLoading && !loadError ? ` (${labeledItems.length})` : ""}</option>
                  {inventoryBuildings.map((building) => (
                    <option key={building.name} value={building.name}>
                      {building.name}{!isLoading && !loadError ? ` (${building.items.length})` : ""}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <p className="mt-2 text-xs leading-5 text-[#64748b]">Items are grouped by where they were found. Choose a building here or click its map label.</p>
          </div>

          <div className="flex-1 p-4">
            {loadError ? (
              <p className="rounded-lg bg-red-50 p-4 text-sm text-red-800" role="alert">{loadError}</p>
            ) : isLoading ? (
              <p className="py-8 text-center text-sm text-[#64748b]">Loading found items…</p>
            ) : buildingItems.length === 0 ? (
              <p className="py-8 text-center text-sm leading-6 text-[#64748b]">{selectedBuilding ? `No found items are listed for ${selectedBuilding}.` : "No found inventory items match the labeled buildings."}</p>
            ) : (
              <ul className="space-y-3">
                {buildingItems.map((item) => (
                  <li className="border-b border-[#e8efeb] px-1 pb-3 last:border-0" key={item.id}>
                    <p className="font-semibold text-[#17212b]">{item.title}</p>
                    {item.description && <p className="mt-1 line-clamp-3 text-sm leading-5 text-[#52615b]">{item.description}</p>}
                    <p className="mt-2 text-xs text-[#74827c]">{item.location} · {formatDate(item.date)}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </section>
  )
}
