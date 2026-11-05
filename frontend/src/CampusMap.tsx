import { useEffect, useMemo, useRef, useState } from "react"
import {
  Map as MapLibreMap,
  NavigationControl,
  setWorkerUrl,
  type GeoJSONSource,
  type MapGeoJSONFeature,
} from "maplibre-gl"
import mapLibreWorkerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url"
import "maplibre-gl/dist/maplibre-gl.css"
import campusBoundary from "./campus-boundary-display.json"

const apiBaseUrl = (import.meta.env.VITE_API_URL ?? `http://${window.location.hostname}:8000`).replace(/\/$/, "")
const itemsApiUrl = `${apiBaseUrl}/api/items/`
const buildingsLayerId = "campus-building-footprints"
const campusOutlineSourceId = "campus-boundary-outline"
const campusOutlineLayerId = "campus-boundary-line"
const campusMaskSourceId = "campus-outside-mask-source"
const campusMaskLayerId = "campus-outside-mask"
const hoveredBuildingSourceId = "hovered-building-geometry"
const hoveredBuildingLayerId = "hovered-building-highlight"
const selectedBuildingLayerId = "selected-campus-building"
const selectedBuildingSourceId = "selected-campus-building-geometry"
const campusBounds: [[number, number], [number, number]] = [
  [-73.435, 40.7463307],
  [-73.4222847, 40.7612244],
]
const navigationBounds: [[number, number], [number, number]] = [
  [campusBounds[0][0] - 0.015, campusBounds[0][1] - 0.008],
  [campusBounds[1][0] + 0.015, campusBounds[1][1] + 0.008],
]
const campusPolygons = campusBoundary.geometry.coordinates as number[][][][]

type CampusBuilding = {
  number: string
  name: string
  grid: string
  locations?: string[]
}

const campusBuildings: CampusBuilding[] = [
  { number: "65", name: "Alumni Hall", grid: "E-5" },
  { number: "08", name: "Campus Center / Bookstore", grid: "F-3", locations: ["Campus Center", "Bookstore"] },
  { number: "06", name: "Campus Commons", grid: "F-3" },
  { number: "33", name: "Children's Center", grid: "G-6" },
  { number: "12", name: "Conklin Hall", grid: "E-3" },
  { number: "03", name: "Cutler Hall", grid: "F-4" },
  { number: "91", name: "Dewey Hall", grid: "E-6" },
  { number: "07", name: "Gleeson Hall", grid: "E-3" },
  { number: "04", name: "Greenhouse", grid: "F-4" },
  { number: "18", name: "Greenley Library", grid: "D-4" },
  { number: "14", name: "Hale Hall", grid: "D-3" },
  { number: "89", name: "Health & Wellness Center", grid: "E-6" },
  { number: "71", name: "Heating Plant", grid: "E-2" },
  { number: "05", name: "Hicks Hall", grid: "F-4" },
  { number: "15", name: "Hooper Hall", grid: "E-5" },
  { number: "54", name: "Horton Hall", grid: "F-3" },
  { number: "40", name: "Knapp Hall", grid: "D-4" },
  { number: "02", name: "Laffin Hall", grid: "D-5", locations: ["Laffin Hall"] },
  { number: "92", name: "Lehman Hall", grid: "F-6" },
  { number: "63", name: "Lupton Hall", grid: "C-4" },
  { number: "66", name: "Memorial Hall", grid: "D-5" },
  { number: "85", name: "Nold Athletic Complex", grid: "B-5", locations: ["Nold Athletic Complex"] },
  { number: "115", name: "Orchard Hall", grid: "F-7" },
  { number: "42", name: "Roosevelt Hall", grid: "C-4" },
  { number: "70", name: "Service Building", grid: "E-2" },
  { number: "94", name: "Sinclair Hall", grid: "F-5" },
  { number: "", name: "Smart Energy House", grid: "D-6" },
  { number: "01", name: "The Cottage", grid: "F-5" },
  { number: "41", name: "Thompson Hall", grid: "F-4" },
  { number: "46", name: "University Police", grid: "G-3" },
  { number: "11", name: "Ward Hall", grid: "E-4" },
  { number: "50", name: "Whitman Hall", grid: "E-4" },
  { number: "116", name: "Business School", grid: "E-5" },
]

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
  return polygon[0]?.length > 0 && polygon[0].every(([lng, lat]) => isInsideCampus([lng, lat]))
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
  const [isLoading, setIsLoading] = useState(true)
  const [isMapLoaded, setIsMapLoaded] = useState(false)
  const [loadError, setLoadError] = useState("")
  const [mapError, setMapError] = useState("")

  function selectBuilding(building: CampusBuilding) {
    setSelectedBuilding(building.name)
  }

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
    ;(window as Window & { campusDebugMap?: MapLibreMap }).campusDebugMap = map
    map.addControl(new NavigationControl({ showCompass: false }), "top-right")

    map.on("load", () => {
      if (!map.getSource("openmaptiles")) {
        setMapError("The map style did not provide campus building data.")
        return
      }

      map.addLayer({
        id: buildingsLayerId,
        type: "fill-extrusion",
        source: "openmaptiles",
        "source-layer": "building",
        minzoom: 14,
        paint: {
          "fill-extrusion-color": "#ded9cd",
          "fill-extrusion-height": [
            "max",
            4,
            ["to-number", ["get", "render_height"], ["to-number", ["get", "height"], 10]],
          ],
          "fill-extrusion-base": ["to-number", ["get", "render_min_height"], 0],
          "fill-extrusion-opacity": 0.98,
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
        data: campusBoundary,
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
      map.addSource(hoveredBuildingSourceId, {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      })
      map.addLayer({
        id: hoveredBuildingLayerId,
        type: "fill-extrusion",
        source: hoveredBuildingSourceId,
        paint: {
          "fill-extrusion-color": "#facc15",
          "fill-extrusion-height": [
            "max",
            30,
            ["to-number", ["get", "render_height"], ["to-number", ["get", "height"], 10]],
          ],
          "fill-extrusion-base": ["to-number", ["get", "render_min_height"], 0],
          "fill-extrusion-opacity": 0.98,
          "fill-extrusion-vertical-gradient": false,
        },
      })
      map.addSource(selectedBuildingSourceId, {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      })
      map.addLayer({
        id: selectedBuildingLayerId,
        type: "fill-extrusion",
        source: selectedBuildingSourceId,
        paint: {
          "fill-extrusion-color": "#ef4444",
          "fill-extrusion-height": [
            "max",
            30,
            ["to-number", ["get", "render_height"], ["to-number", ["get", "height"], 10]],
          ],
          "fill-extrusion-base": ["to-number", ["get", "render_min_height"], 0],
          "fill-extrusion-opacity": 0.98,
          "fill-extrusion-vertical-gradient": false,
        },
      })
      map.on("mousemove", buildingsLayerId, (event) => {
        const hoveredSource = map.getSource(hoveredBuildingSourceId) as GeoJSONSource
        const feature = event.features?.[0] as MapGeoJSONFeature | undefined
        const point: [number, number] = [event.lngLat.lng, event.lngLat.lat]
        const geometry = feature && isInsideCampus(point) ? completeBuildingGeometry(map, feature, point) : null
        if (!feature || !geometry) {
          hoveredSource.setData({ type: "FeatureCollection", features: [] })
          map.getCanvas().style.cursor = ""
          return
        }

        map.getCanvas().style.cursor = "pointer"
        hoveredSource.setData({
          type: "FeatureCollection",
          features: [{
            type: "Feature",
            geometry,
            properties: { ...feature.properties },
          }],
        })
      })
      map.on("click", buildingsLayerId, (event) => {
        const feature = event.features?.[0] as MapGeoJSONFeature | undefined
        if (!feature) return
        if (!isInsideCampus([event.lngLat.lng, event.lngLat.lat])) return
        const geometry = completeBuildingGeometry(map, feature, [event.lngLat.lng, event.lngLat.lat])
        if (!geometry) return

        const properties = feature.properties ?? {}
        const featureName = [properties.name, properties.name_en, properties["addr:housename"]]
          .find((value) => typeof value === "string" && value.trim())
        const building = campusBuildings.find((entry) =>
          featureName && entry.name.toLocaleLowerCase().includes(String(featureName).toLocaleLowerCase()),
        )
        selectBuilding(building ?? { number: "", name: String(featureName ?? "Unnamed building"), grid: "" })
        const hoveredSource = map.getSource(hoveredBuildingSourceId) as GeoJSONSource
        hoveredSource.setData({ type: "FeatureCollection", features: [] })
        const selectedSource = map.getSource(selectedBuildingSourceId) as GeoJSONSource
        selectedSource.setData({
          type: "FeatureCollection",
          features: [{
            type: "Feature",
            geometry,
            properties: { ...properties },
          }],
        })
      })
      map.on("mouseenter", buildingsLayerId, () => { map.getCanvas().style.cursor = "pointer" })
      map.on("mouseleave", buildingsLayerId, () => {
        map.getCanvas().style.cursor = ""
        const hoveredSource = map.getSource(hoveredBuildingSourceId) as GeoJSONSource
        hoveredSource.setData({ type: "FeatureCollection", features: [] })
      })

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
      map.remove()
      mapRef.current = null
    }
  }, [])

  const buildingItems = useMemo(() => {
    if (!selectedBuilding) return []
    const building = campusBuildings.find((entry) => entry.name === selectedBuilding)
    const locations = (building?.locations ?? [selectedBuilding]).map((location) => location.toLocaleLowerCase())
    return items.filter((item) => locations.some((location) => item.location.toLocaleLowerCase().includes(location)))
  }, [items, selectedBuilding])

  return (
    <section className="w-full max-w-360 overflow-hidden rounded-xl border border-[#d6e0da] bg-white shadow-sm">
      <header className="flex flex-col gap-3 border-b border-[#e1e8e4] px-5 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-7">
        <div>
          <p className="font-['Figtree:Bold'] text-xs font-bold tracking-[0.14em] text-[#006747] uppercase">Farmingdale State College</p>
          <h1 className="mt-1 font-['Outfit:Bold'] text-2xl font-bold text-[#17212b]">Found items by building</h1>
        </div>
        <p className="text-sm text-[#52615b]">{items.length} found {items.length === 1 ? "item" : "items"} on campus</p>
      </header>

      <div className="grid min-h-155 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div
          className="relative min-h-105 bg-[#e7eee9]"
          style={{ height: "70vh", maxHeight: 760, minHeight: 420 }}
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
              Click a campus building footprint to see reported items
            </div>
          )}
        </div>

        <aside className="flex min-h-90 flex-col border-t border-[#e1e8e4] lg:border-t-0 lg:border-l">
          <div className="border-b border-[#e1e8e4] px-5 py-5">
            <p className="text-xs font-bold tracking-[0.12em] text-[#74827c] uppercase">Selected building</p>
            <h2 className="mt-1 font-['Outfit:Bold'] text-xl font-bold text-[#17212b]">{selectedBuilding || "Choose a building"}</h2>
            {selectedBuilding && <p className="mt-1 text-sm text-[#64748b]">{buildingItems.length} matching {buildingItems.length === 1 ? "report" : "reports"}</p>}
            {campusBuildings.length > 0 && (
              <label className="mt-4 block text-xs font-semibold text-[#52615b]">
                Or choose a building
                <select
                  className="mt-1.5 h-10 w-full rounded-md border border-[#cbd8d2] bg-white px-3 text-sm text-[#17212b]"
                  onChange={(event) => {
                    const building = campusBuildings.find((entry) => entry.name === event.target.value)
                    if (building) selectBuilding(building)
                  }}
                  value={selectedBuilding}
                >
                  <option value="">Select building</option>
                  {campusBuildings.map((building) => (
                    <option key={building.name} value={building.name}>
                      {building.number ? `${building.number} · ` : ""}{building.name} ({building.grid})
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {loadError ? (
              <p className="rounded-lg bg-red-50 p-4 text-sm text-red-800" role="alert">{loadError}</p>
            ) : isLoading ? (
              <p className="py-8 text-center text-sm text-[#64748b]">Loading found items…</p>
            ) : !selectedBuilding ? (
              <p className="py-8 text-center text-sm leading-6 text-[#64748b]">Select a green building on the map to inspect reported items.</p>
            ) : selectedBuilding === "Unnamed building" ? (
              <p className="py-8 text-center text-sm leading-6 text-[#64748b]">This footprint has no building label in the map data.</p>
            ) : buildingItems.length === 0 ? (
              <p className="py-8 text-center text-sm leading-6 text-[#64748b]">No found items are listed for {selectedBuilding}.</p>
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
