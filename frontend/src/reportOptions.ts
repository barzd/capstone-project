import { campusLocations } from "./campus-building-labels"

// Dropdown choices shared by the Report Lost Item and Report Found Item forms.
//
// Keeping one list means lost and found reports use exactly the same names,
// which the Search Filters and AI Matching user stories rely on.
// To add or rename a choice, change it here and both forms update.

// Shown at the end of a dropdown. Choosing it opens a text box.
export const OTHER_OPTION = "Other"

// Lost items only: people often don't know where they lost something.
export const NOT_SURE_OPTION = "Not sure"

export const ITEM_CATEGORIES = [
  "Accessories",
  "Bags & Backpacks",
  "Books & School Supplies",
  "Clothing",
  "Electronics",
  "ID & Cards",
  "Keys",
  "Jewelry",
  "Wallets & Money",
  "Water Bottles",
]

export const ITEM_COLORS = [
  "Black",
  "White",
  "Gray",
  "Silver",
  "Gold",
  "Brown",
  "Beige",
  "Red",
  "Orange",
  "Yellow",
  "Green",
  "Blue",
  "Purple",
  "Pink",
  "Clear",
  "Multicolor",
]

// Building names come from the same list used by the campus map.
// ChoiceField adds its own Other option.
export const CAMPUS_LOCATIONS = campusLocations.filter((location) => location !== OTHER_OPTION)

// Where found items are kept until they're claimed.
// Per FSC's lost property policy, found items go to University Police, except
// items found in the residence halls, which the Residence Hall Director holds.
export const STORAGE_LOCATIONS = [
  "University Police",
  "Residence Hall Director",
]
