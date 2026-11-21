import { QRCodeSVG } from "qrcode.react"

export default function ItemQRCode({
  itemId,

  title,

  size = 112,
}: {
  itemId: string

  title: string

  size?: number
}) {
  const checkoutUrl = new URL(import.meta.env.BASE_URL, window.location.origin)

  checkoutUrl.searchParams.set("checkout", itemId)

  return (
    <div className="inline-flex flex-col items-center gap-1 rounded-xl border border-[#dce9e3] bg-white p-2 text-center">
      <QRCodeSVG
        aria-label={`QR code for ${title}`}
        level="M"
        size={size}
        title={`QR code for ${title}`}
        value={checkoutUrl.toString()}
      />
      <span className="text-[11px] font-medium text-[#64748b]">
        Scan to record a checkout
      </span>
    </div>
  )
}
