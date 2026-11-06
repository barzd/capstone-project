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

// Farmingdale State College buildings and areas.
// Sources: FSC Rambassadors "Navigating FSC" and FSC's Wikipedia article.
export const CAMPUS_LOCATIONS = [
  "Campus Center",
  "Conklin Hall",
  "Cutler Hall",
  "Gleeson Hall",
  "Greenley Library",
  "Hale Hall",
  "Health and Wellness Center",
  "Hicks Hall",
  "Horton Hall",
  "Knapp Hall",
  "Lupton Hall",
  "Nold Athletic Complex",
  "Residence Halls",
  "School of Business",
  "Thompson Hall",
  "University Police Headquarters",
  "Ward Hall",
  "Whitman Hall",
  "Parking Lot",
  "Outdoors / Walkway",
]

// Where found items are kept until they're claimed.
// Per FSC's lost property policy, found items go to University Police, except
// items found in the residence halls, which the Residence Hall Director holds.
export const STORAGE_LOCATIONS = [
  "University Police",
  "Residence Hall Director",
]
