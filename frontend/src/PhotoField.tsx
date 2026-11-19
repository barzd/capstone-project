import { useEffect, useId, useState, type ChangeEvent } from "react"

// Photos are resized in the browser before upload: smaller files are faster to
// send and store, and re-saving the image drops hidden metadata such as the
// GPS location many phones add to photos.
const MAX_DIMENSION = 1600
const JPEG_QUALITY = 0.85
const MAX_ORIGINAL_BYTES = 25 * 1024 * 1024

async function loadImage(file: File): Promise<CanvasImageSource & { width: number; height: number }> {
  if ("createImageBitmap" in window) {
    return createImageBitmap(file)
  }
  const url = URL.createObjectURL(file)
  try {
    const image = new Image()
    image.src = url
    await image.decode()
    return image
  } finally {
    URL.revokeObjectURL(url)
  }
}

/** Shrink a photo to at most MAX_DIMENSION px and re-save it as a JPEG. */
export async function preparePhoto(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose an image file (JPG, PNG, or WebP).")
  }
  if (file.size > MAX_ORIGINAL_BYTES) {
    throw new Error("That photo is too large. Please choose one under 25 MB.")
  }

  let image: CanvasImageSource & { width: number; height: number }
  try {
    image = await loadImage(file)
  } catch {
    throw new Error(
      "This browser can't read that photo format. Please choose a JPG or PNG.",
    )
  }

  const scale = Math.min(1, MAX_DIMENSION / Math.max(image.width, image.height))
  const canvas = document.createElement("canvas")
  canvas.width = Math.round(image.width * scale)
  canvas.height = Math.round(image.height * scale)
  const context = canvas.getContext("2d")
  if (!context) throw new Error("Could not process the photo.")
  // White background so transparent PNGs don't turn black as JPEGs.
  context.fillStyle = "#ffffff"
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.drawImage(image, 0, 0, canvas.width, canvas.height)
  if ("close" in image && typeof image.close === "function") image.close()

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not process the photo."))),
      "image/jpeg",
      JPEG_QUALITY,
    )
  })
}

/**
 * Optional photo picker with a preview. Calls onChange with the processed
 * photo (or null when removed). Give it a new `key` to reset it.
 */
export default function PhotoField({
  onChange,
  disabled = false,
}: {
  onChange: (photo: Blob | null) => void
  disabled?: boolean
}) {
  const inputId = useId()
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [inputKey, setInputKey] = useState(0)

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  async function choosePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0]
    if (!file) return
    setError(null)
    setIsProcessing(true)
    try {
      const photo = await preparePhoto(file)
      setPreviewUrl(URL.createObjectURL(photo))
      onChange(photo)
    } catch (photoError) {
      setPreviewUrl(null)
      onChange(null)
      setInputKey((key) => key + 1)
      setError(
        photoError instanceof Error ? photoError.message : "Could not use that photo.",
      )
    } finally {
      setIsProcessing(false)
    }
  }

  function removePhoto() {
    setPreviewUrl(null)
    setError(null)
    setInputKey((key) => key + 1)
    onChange(null)
  }

  return (
    <div className="space-y-2 text-sm font-semibold text-[#17212b]">
      <label className="block" htmlFor={inputId}>
        Photo (optional)
      </label>
      <p className="font-normal text-[#64748b]">
        A clear photo helps others recognize the item. Keep personal information
        (like names or ID numbers) out of the frame.
      </p>

      {previewUrl ? (
        <div className="flex items-center gap-4 rounded-xl border border-[#cbd8d2] p-3">
          <img
            alt="Selected item photo preview"
            className="size-24 rounded-lg object-cover"
            src={previewUrl}
          />
          <button
            className="rounded-lg border border-[#cbd8d2] px-3 py-2 text-sm font-semibold text-[#334155] hover:bg-emerald-50"
            disabled={disabled}
            onClick={removePhoto}
            type="button"
          >
            Remove photo
          </button>
        </div>
      ) : (
        <input
          accept="image/*"
          className="block w-full rounded-xl border border-dashed border-[#cbd8d2] px-3 py-3 font-normal file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-2 file:font-semibold file:text-[#006747]"
          disabled={disabled || isProcessing}
          id={inputId}
          key={inputKey}
          onChange={choosePhoto}
          type="file"
        />
      )}

      {isProcessing && <p className="font-normal text-[#64748b]">Preparing photo…</p>}
      {error && (
        <p className="font-normal text-red-700" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

/** Show a report's photo, or nothing if it has none. */
export function ItemPhoto({
  url,
  title,
  className = "size-16",
}: {
  url: string | null
  title: string
  className?: string
}) {
  if (!url) return null
  return (
    <a href={url} rel="noreferrer" target="_blank" title="Open full-size photo">
      <img
        alt={`Photo of ${title}`}
        className={`${className} shrink-0 rounded-lg border border-[#dce3e0] object-cover`}
        loading="lazy"
        src={url}
      />
    </a>
  )
}
