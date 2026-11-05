export type CampusBuildingLabel = {
  name: string
  /** Alternate names used in inventory's found-at location. */
  locations?: string[]
  coordinates: [number, number]
  /** Pixel adjustment [right, down] to place the label above the roof. */
  offset?: [number, number]
  /** Minimum zoom for this label (default 15.4). Selected labels remain visible. */
  minZoom?: number
  /** Higher values win when labels overlap. */
  priority?: number
}

// Edit names here and add one entry per building. Coordinates are [longitude, latitude].
// In development, right-click the map and copy the entry from the browser console.
// Empty names are hidden, so you can position entries before naming them.
export const campusBuildingLabels: CampusBuildingLabel[] = [
  { name: "Laffin Hall", coordinates: [-73.42853, 40.750807] },
  { name: "Roosevelt Hall", coordinates: [-73.4297554, 40.7507291] },
  { name: "Lupton Hall", coordinates: [-73.4310534, 40.7508253] },
  { name: "Hale Hall", coordinates: [-73.4305028, 40.7520031] },
  { name: "Greenley Hall", coordinates: [-73.4294305, 40.7518177], locations: ["Greenley Library"] },
  { name: "Knapp Hall", coordinates: [-73.4283110, 40.7516336] },
  { name: "Memorial Hall", coordinates: [-73.4273578, 40.7507108] },
  { name: "Hopper Hall", coordinates: [-73.4273143, 40.7511357], locations: ["Hooper Hall"] },
  { name: "Alumni Hall", coordinates: [-73.4268687, 40.7512567] },
  { name: "Health and Wellness Center", coordinates: [-73.4269133, 40.7508706], locations: ["Health & Wellness Center"] },
  { name: "Dewey Hall", coordinates: [-73.4257707, 40.7517292] },
  { name: "Sinclair Hall", coordinates: [-73.4254883, 40.7523608] },
  { name: "Orchard Hall", coordinates: [-73.4245350, 40.7510439] },
  { name: "Nold Athletic Complex", coordinates: [-73.4316108, 40.7489389] },
  { name: "School of Business", coordinates: [-73.4270821, 40.7520187], locations: ["Business School"] },
  { name: "Whitman Hall", coordinates: [-73.4280490, 40.7526067] },
  { name: "Ward Hall", coordinates: [-73.4290380, 40.7525480] },
  { name: "Gleeson Hall", coordinates: [-73.4285531, 40.7530852] },
  { name: "Quintyne Hall", coordinates: [-73.4289274, 40.7536143], locations: ["Conklin Hall", "Delores Quintyne Hall", "Delores Y. Quintyne Hall"] },
  { name: "Campus Center", coordinates: [-73.4285588, 40.7541629], locations: ["Bookstore"] },
  { name: "Thompson Hall", coordinates: [-73.4275689, 40.7536528] },
  { name: "Ampitheater", coordinates: [-73.4279606, 40.7539239], locations: ["Amphitheater", "The Amphitheater"] },
  { name: "Campus Commons", coordinates: [-73.4274703, 40.7541947] },
  { name: "Hicks Hall", coordinates: [-73.4267680, 40.7535500] },
  { name: "Cutler Hall", coordinates: [-73.4262864, 40.7535982] },
  { name: "University Police", coordinates: [-73.4262844, 40.7556117] },
  { name: "Horton Hall", coordinates: [-73.4274364, 40.7550730] },




]
