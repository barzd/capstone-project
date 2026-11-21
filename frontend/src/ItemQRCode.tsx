import { QRCodeSVG } from "qrcode.react"

const apiBaseUrl = (
  import.meta.env.VITE_API_URL ?? `http://${window.location.hostname}:8000`
).replace(/\/$/, "")

export default function ItemQRCode({
  itemId,
  title,
  size = 112,
}: {
  itemId: string
  title: string
  size?: number
}) {
  const itemUrl = `${apiBaseUrl}/api/inventory/${encodeURIComponent(itemId)}/`

  return (
    <div className="inline-flex flex-col items-center gap-1 rounded-xl border border-[#dce9e3] bg-white p-2 text-center">
      <QRCodeSVG
        aria-label={`QR code for ${title}`}
        level="M"
        size={size}
        title={`QR code for ${title}`}
        value={itemUrl}
      />
      <span className="text-[11px] font-medium text-[#64748b]">
        Scan for item details
      </span>
    </div>
  )
}
