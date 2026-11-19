import { useState } from "react"
import { OTHER_OPTION } from "./reportOptions"

const labelClass = "space-y-1.5 text-sm font-semibold text-[#17212b]"
const inputClass =
  "w-full rounded-xl border border-[#cbd8d2] px-3 py-2.5 font-normal outline-none focus:border-[#006747] focus:ring-2 focus:ring-[#006747]/15"

type ChoiceFieldProps = {
  label: string
  name: string
  options: string[]
  placeholder: string
  required?: boolean
  /** Choices added before "Other", e.g. "Not sure". */
  extraOptions?: string[]
  /** Label and placeholder for the text box shown when "Other" is chosen. */
  otherLabel: string
  otherPlaceholder: string
  otherMaxLength?: number
  /** Value to start with, e.g. when editing a saved report. */
  defaultValue?: string
}

/**
 * A dropdown with an "Other" choice that opens a text box.
 * Read the chosen value with readChoice(formData, name).
 */
export default function ChoiceField({
  label,
  name,
  options,
  placeholder,
  required = false,
  extraOptions = [],
  otherLabel,
  otherPlaceholder,
  otherMaxLength = 100,
  defaultValue = "",
}: ChoiceFieldProps) {
  // A saved value that isn't one of the choices goes in the "Other" box.
  const isListed = [...options, ...extraOptions].includes(defaultValue)
  const [selected, setSelected] = useState(
    !defaultValue ? "" : isListed ? defaultValue : OTHER_OPTION,
  )

  return (
    <>
      <label className={labelClass}>
        {label}
        {/* lost-category-select provides the dark-mode styling in index.css */}
        <select
          className={`lost-category-select ${inputClass}`}
          name={name}
          onChange={(event) => setSelected(event.target.value)}
          required={required}
          value={selected}
        >
          <option disabled={required} value="">
            {placeholder}
          </option>
          {[...options, ...extraOptions, OTHER_OPTION].map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
      {selected === OTHER_OPTION && (
        <label className={labelClass}>
          {otherLabel}
          <input
            autoComplete="off"
            className={inputClass}
            maxLength={otherMaxLength}
            defaultValue={!isListed ? defaultValue : undefined}
            name={`${name}_other`}
            placeholder={otherPlaceholder}
            required
          />
        </label>
      )}
    </>
  )
}

/** The value of a ChoiceField: the chosen option, or the typed text for "Other". */
export function readChoice(formData: FormData, name: string): string {
  const selected = String(formData.get(name) ?? "").trim()
  if (selected === OTHER_OPTION) {
    return String(formData.get(`${name}_other`) ?? "").trim()
  }
  return selected
}

/** Building plus optional details, e.g. "Greenley Library - 2nd floor". */
export function readLocation(formData: FormData): string {
  const place = readChoice(formData, "location")
  const details = String(formData.get("location_details") ?? "").trim()
  return details ? `${place} - ${details}` : place
}

/**
 * Split a saved location like "Greenley Library - 2nd floor" back into the
 * dropdown choice and the "Where exactly?" details.
 */
export function splitLocation(
  location: string,
  places: string[],
): { place: string; details: string } {
  for (const place of places) {
    if (location === place) return { place, details: "" }
    if (location.startsWith(`${place} - `)) {
      return { place, details: location.slice(place.length + 3) }
    }
  }
  return { place: location, details: "" }
}

export function LocationDetailsField({ defaultValue = "" }: { defaultValue?: string }) {
  return (
    <label className={labelClass}>
      Where exactly? (optional)
      <input
        autoComplete="off"
        className={inputClass}
        maxLength={120}
        defaultValue={defaultValue}
        name="location_details"
        placeholder="e.g. 2nd floor, near the printers"
      />
    </label>
  )
}
