import { lazy, Suspense, useEffect, useState } from "react"
import InventoryScreen from "./Inventory"
import { campusLocations } from "./campus-building-labels"
const CampusMap = lazy(() => import("./CampusMap"))
import FoundItemReport from "./FoundItemReport"
import LostItemReport from "./LostItemReport"
import ReportsScreen from "./Reports"

const assetPathPrefix = `${import.meta.env.BASE_URL}assets`
const imgHomeIcon = `${assetPathPrefix}/6c43b.svg`
const imgMapPinCheck = `${assetPathPrefix}/3ce53.svg`
const imgMapPinCheck1 = `${assetPathPrefix}/64aaa.svg`
const imgPackageCheck = `${assetPathPrefix}/c05e7.svg`
const imgListFilter = `${assetPathPrefix}/b8859.svg`
const imgMapPin = `${assetPathPrefix}/8aaa7.svg`
const imgHistory = `${assetPathPrefix}/09af2.svg`
const imgBellRing = `${assetPathPrefix}/39ed8.svg`
const imgBookmark = `${assetPathPrefix}/18d19.svg`
const imgMessageCircle = `${assetPathPrefix}/611f4.svg`
const imgCircleHelp = `${assetPathPrefix}/a0603.svg`
const imgCircleX = `${assetPathPrefix}/85624.svg`
const lostItemsApiUrl = `http://${window.location.hostname}:8000/api/lost-items/`
const inventoryApiUrl = `http://${window.location.hostname}:8000/api/inventory/`

type NavItem = {
  id: string
  label: string
  icon: string
  badge?: number
}

type Section = {
  id: string
  title: string
  items: NavItem[]
}

const sections: Section[] = [
  {
    id: "inventory",
    title: "INVENTORY",
    items: [{ id: "inventory", label: "Inventory", icon: imgPackageCheck }],
  },
  {
    id: "reports",
    title: "REPORTS",
    items: [
      { id: "report-list", label: "Report List", icon: imgListFilter },
      { id: "campus-map", label: "Campus Map", icon: imgMapPin },
      { id: "recently-resolved", label: "Recently Resolved", icon: imgHistory },
    ],
  },
  {
    id: "my-activity",
    title: "MY ACTIVITY",
    items: [
      {
        id: "notifications",
        label: "Notifications",
        icon: imgBellRing,
        badge: 0,
      },
      { id: "bookmark-item", label: "Bookmark Item", icon: imgBookmark },
      {
        id: "staff-chat",
        label: "Staff Chat",
        icon: imgMessageCircle,
        badge: 0,
      },
    ],
  },
  {
    id: "faq",
    title: "FSC LOST AND FOUND FAQ",
    items: [
      { id: "how-it-works", label: "How it Works", icon: imgCircleHelp },
      { id: "rules-safety", label: "Rules & Safety", icon: imgCircleX },
    ],
  },
  {
    id: "preferences",
    title: "PREFERENCES",
    items: [{ id: "settings", label: "Settings", icon: imgListFilter }],
  },
]

type PageContent = {
  title: string
  eyebrow: string
  description: string
  icon: string
  gradient: string
  tint: string
 stats: { value: string, label: string }[]
  highlights: { title: string, description: string }[]
  action: string
  panelLabel: string
  panelTitle: string
  panelStyle?: "compact"
}

const pageContent: Record<string, PageContent> = {
  "report-lost": {
    title: "Report a Lost Item",
    eyebrow: "Start a report",
    description:
      "Tell us what went missing and where you last saw it. Detailed reports help the campus community identify your belongings faster.",
    icon: imgMapPinCheck,
    gradient: "from-[#006747] to-[#00a676]",
    tint: "bg-emerald-50 border-emerald-100",
    stats: [
      { value: "3 min", label: "Average report time" },
      { value: "24/7", label: "Report availability" },
      { value: "Private", label: "Contact details" },
    ],
    highlights: [
      {
        title: "Describe the item",
        description: "Add its color, brand, category, and any unique details.",
      },
      {
        title: "Pin the location",
        description:
          "Choose the campus building or area where it was last seen.",
      },
      {
        title: "Get match alerts",
        description:
          "We will notify you when a similar found item is reported.",
      },
    ],
    action: "Begin lost item report",
    panelLabel: "Build a strong report",
    panelTitle: "A few details make a big difference",
  },
  "report-found": {
    title: "Report a Found Item",
    eyebrow: "Help reunite an item",
    description:
      "Found something on campus? Share a few details and arrange a safe handoff with the Lost & Found team.",
    icon: imgPackageCheck,
    gradient: "from-[#006747] to-[#16a34a]",
    tint: "bg-emerald-50 border-emerald-100",
    stats: [
      { value: "42", label: "Items returned this month" },
      { value: "9", label: "Campus drop-off points" },
      { value: "Fast", label: "Staff follow-up" },
    ],
    highlights: [
      {
        title: "Log what you found",
        description: "Add only enough detail for the owner to recognize it.",
      },
      {
        title: "Choose a safe handoff",
        description: "Select a staffed campus location for drop-off.",
      },
      {
        title: "Protect ownership",
        description: "Verification questions keep valuable items secure.",
      },
    ],
    action: "Begin found item report",
    panelLabel: "Safe handoff",
    panelTitle: "Help us return it with confidence",
  },
  "report-list": {
    title: "Browse Item Reports",
    eyebrow: "Community reports",
    description:
      "Search recent lost and found reports from across campus. Filter by category, date, or location to narrow the results.",
    icon: imgListFilter,
    gradient: "from-[#004f3a] to-[#16a34a]",
    tint: "bg-emerald-50 border-emerald-100",
    stats: [
      { value: "24", label: "Active reports" },
      { value: "8", label: "Added today" },
      { value: "12", label: "Potential matches" },
    ],
    highlights: [
      {
        title: "Smart filters",
        description: "Sort by item type, status, date, and campus area.",
      },
      {
        title: "Clear status labels",
        description: "See which items are lost, found, matched, or resolved.",
      },
      {
        title: "Save promising reports",
        description: "Bookmark an item so it is easy to revisit later.",
      },
    ],
    action: "Browse all reports",
    panelLabel: "Search tools",
    panelTitle: "Find the right report faster",
  },
  "campus-map": {
    title: "Explore the Campus Map",
    eyebrow: "Location view",
    description:
      "See where items are most frequently reported and quickly identify the closest Lost & Found drop-off location.",
    icon: imgMapPin,
    gradient: "from-[#006747] to-[#059669]",
    tint: "bg-green-50 border-green-100",
    stats: [
      { value: "9", label: "Drop-off locations" },
      { value: "6", label: "Recent map reports" },
      { value: "2", label: "Open after 5 PM" },
    ],
    highlights: [
      {
        title: "Campus hotspots",
        description: "View report activity around buildings and common areas.",
      },
      {
        title: "Staffed locations",
        description:
          "Find hours and directions for every official drop-off point.",
      },
      {
        title: "Accessible routes",
        description: "Plan a convenient route across campus before you go.",
      },
    ],
    action: "Open interactive map",
    panelLabel: "Map ready",
    panelTitle: "Explore reports by location",
    panelStyle: "compact",
  },
  "recently-resolved": {
    title: "Recently Reunited",
    eyebrow: "Success stories",
    description:
      "Celebrate items that made it back to their owners and see how community reports turn into successful matches.",
    icon: imgHistory,
    gradient: "from-[#004f3a] to-[#00a676]",
    tint: "bg-emerald-50 border-emerald-100",
    stats: [
      { value: "18", label: "Resolved this week" },
      { value: "84%", label: "Matched within 48 hours" },
      { value: "126", label: "Returned this semester" },
    ],
    highlights: [
      {
        title: "Water bottle",
        description: "Reunited after a match near the Campus Center.",
      },
      {
        title: "Student ID",
        description: "Returned safely through University Police.",
      },
      {
        title: "Headphones",
        description:
          "Owner verified details and collected them at Greenley Hall.",
      },
    ],
    action: "View resolved reports",
    panelLabel: "Recent returns",
    panelTitle: "A few happy endings from this week",
  },
  notifications: {
    title: "Your Notifications",
    eyebrow: "Stay informed",
    description:
      "Keep up with possible matches, report updates, staff messages, and reminders about saved items.",
    icon: imgBellRing,
    gradient: "from-[#006747] to-[#65a30d]",
    tint: "bg-lime-50 border-lime-100",
    stats: [
      { value: "0", label: "Unread alerts" },
      { value: "3", label: "Updates this week" },
      { value: "On", label: "Match notifications" },
    ],
    highlights: [
      {
        title: "Potential matches",
        description: "Get an alert when report details look similar.",
      },
      {
        title: "Status updates",
        description: "Follow every change to your submitted reports.",
      },
      {
        title: "Pickup reminders",
        description: "Never miss a collection window or staff response.",
      },
    ],
    action: "Manage notification settings",
    panelLabel: "You're all caught up",
    panelTitle: "Choose which updates reach you",
    panelStyle: "compact",
  },
  "bookmark-item": {
    title: "Saved Items",
    eyebrow: "Your collection",
    description:
      "Keep interesting reports together while you compare details or wait for more information from the owner or finder.",
    icon: imgBookmark,
    gradient: "from-[#005c42] to-[#16a34a]",
    tint: "bg-green-50 border-green-100",
    stats: [
      { value: "4", label: "Saved reports" },
      { value: "1", label: "Recently updated" },
      { value: "2", label: "Possible matches" },
    ],
    highlights: [
      {
        title: "One-click saving",
        description: "Bookmark any report directly from the report list.",
      },
      {
        title: "Update tracking",
        description: "See when a saved report changes status.",
      },
      {
        title: "Easy comparison",
        description: "Review key details without repeating your search.",
      },
    ],
    action: "View saved reports",
    panelLabel: "Saved for later",
    panelTitle: "Keep possible matches close",
    panelStyle: "compact",
  },
  "staff-chat": {
    title: "Chat with Lost & Found",
    eyebrow: "Staff support",
    description:
      "Ask a question, confirm a report detail, or get help planning an item pickup from the campus team.",
    icon: imgMessageCircle,
    gradient: "from-[#006747] to-[#0d9488]",
    tint: "bg-emerald-50 border-emerald-100",
    stats: [
      { value: "0", label: "Unread messages" },
      { value: "< 1 hr", label: "Typical reply" },
      { value: "9–5", label: "Weekday support" },
    ],
    highlights: [
      {
        title: "Report assistance",
        description: "Get help adding details or updating an existing report.",
      },
      {
        title: "Pickup coordination",
        description: "Confirm where and when an item can be collected.",
      },
      {
        title: "Private conversation",
        description: "Sensitive report details stay between you and staff.",
      },
    ],
    action: "Start a conversation",
    panelLabel: "Need a hand?",
    panelTitle: "The campus team is ready to help",
    panelStyle: "compact",
  },
  "how-it-works": {
    title: "How It Works",
    eyebrow: "Three simple steps",
    description:
      "FSC Lost & Found brings reports, potential matches, and safe item returns into one clear process.",
    icon: imgCircleHelp,
    gradient: "from-[#004f3a] to-[#059669]",
    tint: "bg-green-50 border-green-100",
    stats: [
      { value: "1", label: "Create a report" },
      { value: "2", label: "Review matches" },
      { value: "3", label: "Arrange a return" },
    ],
    highlights: [
      {
        title: "Report",
        description:
          "Share useful details while keeping identifying information private.",
      },
      {
        title: "Match",
        description:
          "Compare reports and verify ownership through secure questions.",
      },
      {
        title: "Reunite",
        description: "Complete the handoff at an approved campus location.",
      },
    ],
    action: "Read the full guide",
    panelLabel: "The process",
    panelTitle: "From report to reunion",
  },
  "rules-safety": {
    title: "Rules & Safety",
    eyebrow: "Safe returns first",
    description:
      "Follow these campus guidelines to protect your privacy, verify ownership, and complete every item handoff safely.",
    icon: imgCircleX,
    gradient: "from-[#003f2d] to-[#15803d]",
    tint: "bg-emerald-50 border-emerald-100",
    stats: [
      { value: "Never", label: "Share passwords" },
      { value: "Always", label: "Verify ownership" },
      { value: "Use", label: "Official locations" },
    ],
    highlights: [
      {
        title: "Protect personal details",
        description:
          "Do not post IDs, addresses, passwords, or financial information.",
      },
      {
        title: "Use campus handoffs",
        description: "Meet at a staffed Lost & Found location—not off campus.",
      },
      {
        title: "Report concerns",
        description:
          "Contact University Police for suspicious or hazardous items.",
      },
    ],
    action: "View all safety guidelines",
    panelLabel: "Important guidelines",
    panelTitle: "Keep every exchange safe",
  },
}

const persistentPageIds = new Set([
  "home",
  "report-lost",
  "report-found",
  "inventory",
  "settings",
  ...sections.flatMap((section) => section.items.map((item) => item.id)),
  ...Object.keys(pageContent),
])

function TopBar({ username }: { username: string }) {
  return (
    <header className="shrink-0 bg-white" data-node-id="18:9">
      <div className="h-[5px] bg-[#006747]" data-node-id="18:10" />
      <div
        className="flex h-[72px] items-center gap-5 px-5 sm:px-10"
        data-node-id="18:11"
      >
        <div className="size-8 shrink-0" aria-hidden="true" />

        <div
          className="flex min-w-0 flex-1 items-center justify-center gap-5"
          data-node-id="18:14"
        >
          <div
            className="min-w-0 text-center md:w-[520px]"
            data-node-id="18:15"
          >
            <p className="site-title truncate font-['Outfit:Bold'] text-[22px] leading-[1.1] font-bold text-black sm:text-[26px] md:text-[30px]">
              Farmingdale State College
            </p>
            <p className="site-subtitle mt-0.5 hidden font-['Inter:Semi_Bold'] text-[11px] leading-[1.2] font-semibold whitespace-nowrap text-[#006747] uppercase sm:block">
              State University of New York
            </p>
          </div>
          <div
            className="hidden h-9 w-px shrink-0 bg-[#babfbc] sm:block"
            data-node-id="18:18"
          />
          <p className="product-title hidden w-[240px] font-['Outfit:Bold'] text-[28px] leading-[1.1] font-bold text-[#006747] md:block lg:w-[320px] lg:text-[34px]">
            Lost &amp; Found
          </p>
        </div>

        <div
          aria-label={`Signed in as ${username}`}
          className="account-badge flex max-w-[9rem] shrink-0 items-center gap-2 rounded-full border border-[#dce9e3] bg-[#f8faf9] py-1.5 pr-3 pl-1.5 sm:max-w-[12rem]"
          data-node-id="18:20"
          title={username}
        >
          <span
            aria-hidden="true"
            className="account-avatar flex size-7 shrink-0 items-center justify-center rounded-full bg-[#d1fae5] font-['Figtree:SemiBold'] text-xs font-semibold text-[#006747]"
          >
            {username.charAt(0).toUpperCase()}
          </span>
          <span className="account-username truncate font-['Figtree:SemiBold'] text-xs font-semibold text-[#17212b]">
            {username}
          </span>
        </div>
      </div>
      <div className="h-px bg-[#d7dfda]" data-node-id="18:21" />
    </header>
  )
}

function Sidebar({
  activeItem,
  onLogout,
  onSelect,
}: {
  activeItem: string
  onLogout: () => void
  onSelect: (id: string) => void
}) {
  return (
    <aside className={`minimal-scrollbar min-h-0 w-full shrink-0 overflow-y-auto overscroll-contain border-b border-[#d1fae5] bg-white px-4 py-6 md:w-[280px] md:border-r md:border-b-0 ${activeItem === "campus-map" ? "max-h-[35dvh] md:max-h-none" : ""}`}>
      <div className="flex flex-col gap-7">
        <div className="flex items-center gap-2.5 pl-2">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-[#006456]">
            <img alt="" className="size-5" src={imgMapPinCheck} />
          </div>
          <div className="flex flex-col gap-px">
            <p className="font-['Figtree:ExtraBold'] text-[18px] leading-normal font-extrabold text-[#006456]">
              FSC Lost &amp; Found
            </p>
            <p className="font-['Figtree:Medium'] text-[11px] leading-normal font-medium text-[#0f172a]">
              Farmingdale State College
            </p>
          </div>
        </div>

        <div className="grid w-full gap-2.5 sm:grid-cols-2 md:grid-cols-1">
          <button
            aria-current={activeItem === "home" ? "page" : undefined}
            className={`flex h-11 w-full cursor-pointer items-center gap-3 rounded-xl px-3 transition-colors ${
              activeItem === "home"
                ? "bg-[#e8f5ef] text-[#006747]"
                : "bg-white text-[#334155] hover:bg-[#f8faf9]"
            }`}
            onClick={() => onSelect("home")}
            type="button"
          >
            <img alt="" className="size-5" src={imgHomeIcon} />
            <span className="font-['Figtree:SemiBold'] text-sm font-semibold">
              Home
            </span>
          </button>
        </div>

        <div className="grid w-full gap-2.5 sm:grid-cols-2 md:grid-cols-1">
          <button
            className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-black bg-[#006456] p-3.5 drop-shadow-[0px_4px_6px_rgba(22,163,74,0.2)] transition-colors hover:bg-[#005548]"
            onClick={() => onSelect("report-lost")}
            type="button"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/20">
              <img alt="" className="size-[18px]" src={imgMapPinCheck1} />
            </span>
            <span className="flex-1 text-left font-['Figtree:SemiBold'] text-[14px] leading-normal font-semibold text-white">
              Report Lost Item
            </span>
          </button>

          <button
            className="report-found-button flex w-full cursor-pointer items-center gap-3 rounded-xl border border-[#86efac] bg-[#f0fdf4] p-3.5 transition-colors hover:bg-[#dcfce7]"
            onClick={() => onSelect("report-found")}
            type="button"
          >
            <span className="report-found-icon flex size-9 shrink-0 items-center justify-center rounded-lg bg-[rgba(22,163,74,0.13)]">
              <img alt="" className="size-[18px]" src={imgPackageCheck} />
            </span>
            <span className="flex-1 text-left font-['Figtree:SemiBold'] text-[14px] leading-normal font-semibold text-[#0f172a]">
              Report Found Item
            </span>
          </button>
        </div>

        <nav
          aria-label="Lost and found navigation"
          className="grid w-full gap-5 sm:grid-cols-3 md:grid-cols-1"
        >
          {sections.map((section) => (
            <div key={section.id} className="flex w-full flex-col gap-1">
              <div className="px-3 pb-1">
                <p className="font-['Figtree:Bold'] text-[11px] leading-normal font-bold text-[#94a3b8] uppercase">
                  {section.title}
                </p>
              </div>
              {section.items.map((item) => {
                const isActive = activeItem === item.id
                return (
                  <button
                    aria-current={isActive ? "page" : undefined}
                    className={`flex h-10 w-full cursor-pointer items-center gap-3 rounded-lg px-3 transition-colors ${
                      isActive ? "bg-[#f0fdf4]" : "bg-white hover:bg-gray-50"
                    }`}
                    key={item.id}
                    onClick={() => onSelect(item.id)}
                    type="button"
                  >
                    <img
                      alt=""
                      className="size-[18px] shrink-0"
                      src={item.icon}
                    />
                    <span
                      className={`flex-1 text-left text-[14px] leading-normal ${
                        isActive
                          ? "font-['Figtree:SemiBold'] font-semibold text-[#2d3445]"
                          : "font-['Figtree:Medium'] font-medium text-[#0f172a]"
                      }`}
                    >
                      {item.label}
                    </span>
                    {item.badge !== undefined && (
                      <span className="shrink-0 rounded-[10px] bg-[#e2e8f0] px-1.5 py-0.5 font-['Figtree:SemiBold'] text-[11px] leading-normal font-semibold whitespace-nowrap text-[#475569]">
                        {item.badge}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          ))}
        </nav>

        <button
          className="w-full cursor-pointer rounded-xl border border-[#cbd8d2] bg-white px-4 py-3 font-['Figtree:SemiBold'] text-sm font-semibold text-[#475569] transition-colors hover:border-[#006747] hover:bg-emerald-50 hover:text-[#006747]"
          onClick={onLogout}
          type="button"
        >
          Log out
        </button>
      </div>
    </aside>
  )
}

function LoginScreen({
  error,
  onAuthenticated,
}: {
  error: string
  onAuthenticated: () => void
}) {
  const [isRegistering, setIsRegistering] = useState(false)
  const [identifier, setIdentifier] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [formError, setFormError] = useState("")
  const [formMessage, setFormMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const submitCredentials = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError("")
    setFormMessage("")

    if (isRegistering && password !== confirmPassword) {
      setFormError("Passwords do not match.")
      return
    }

    setIsSubmitting(true)
    try {
      const csrfResponse = await fetch(`${API_BASE_URL}/api/auth/csrf/`, {
        headers: { Accept: "application/json" },
        credentials: "include",
      })
      if (!csrfResponse.ok) {
        setFormError("Could not get a CSRF token from Django. Reload and try again.")
        return
      }
      const { csrfToken } = await csrfResponse.json()

      const endpoint = isRegistering
        ? `${API_BASE_URL}/api/auth/registration/`
        : `${API_BASE_URL}/api/auth/login/`
      const body = isRegistering
        ? {
            username: identifier.trim(),
            email: email.trim(),
            password1: password,
            password2: confirmPassword,
          }
        : {
            ...(identifier.includes("@")
              ? { email: identifier.trim() }
              : { username: identifier.trim() }),
            password,
          }
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "X-CSRFToken": csrfToken,
        },
        credentials: "include",
        body: JSON.stringify(body),
      })

      const responseBody = await response.json().catch(() => null)
      if (!response.ok) {
        const firstError = responseBody && Object.values(responseBody).flat()[0]
        setFormError(
          typeof firstError === "string"
            ? firstError
            : "Could not complete the request. Check your details and try again.",
        )
        return
      }

      if (isRegistering) {
        setIsRegistering(false)
        setIdentifier(email.trim())
        setPassword("")
        setConfirmPassword("")
        setFormMessage("Account created. Sign in with your new credentials.")
      } else {
        onAuthenticated()
      }
    } catch {
      setFormError("Could not reach Django. Check that the backend is running.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main
      className="relative flex min-h-screen items-center justify-center bg-cover bg-center px-5 py-10"
      style={{ backgroundImage: `url('${assetPathPrefix}/fsc-campus-login.jpg')` }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/5 via-transparent to-emerald-950/35" />
      <section
        className="relative z-10 w-full max-w-[420px] rounded-md border border-black/15 bg-white p-7 shadow-2xl sm:p-9"
      >
        <div className="text-center">
          <p className="font-['Outfit:Bold'] text-[30px] leading-tight font-bold text-[#006747]">
            FSC Lost &amp; Found
          </p>
          <p className="mt-2 font-['Figtree:Medium'] text-sm font-medium text-[#64748b]">
            {isRegistering
              ? "Create an account to join the campus community"
              : "Sign in to view and manage campus reports"}
          </p>
        </div>

        {(formError || error) && (
          <p className="mt-3 rounded-md bg-red-50 px-3 py-2 font-['Figtree:Medium'] text-xs font-medium text-red-700">
            {formError || error}
          </p>
        )}

        {formMessage && (
          <p className="mt-3 rounded-md bg-emerald-50 px-3 py-2 font-['Figtree:Medium'] text-xs font-medium text-emerald-700">
            {formMessage}
          </p>
        )}

        <form className="mt-7" onSubmit={submitCredentials}>
          <label
            className="block font-['Figtree:SemiBold'] text-xs font-semibold text-[#17212b]"
            htmlFor="login-identifier"
          >
            {isRegistering ? "Username" : "Username or Email"}
          </label>
          <input
            autoComplete={isRegistering ? "username" : "username"}
            className="mt-1.5 w-full rounded border border-[#9ca3af] bg-white px-3 py-2.5 font-['Figtree:Medium'] text-sm font-medium text-[#17212b] outline-none transition-shadow placeholder:text-[#94a3b8] focus:border-[#006747] focus:ring-2 focus:ring-[#006747]/20"
            id="login-identifier"
            onChange={(event) => setIdentifier(event.target.value)}
            placeholder={isRegistering ? "Choose a username" : "Enter your username or email"}
            required
            type="text"
            value={identifier}
          />

          {isRegistering && (
            <div className="mt-4">
              <label
                className="block font-['Figtree:SemiBold'] text-xs font-semibold text-[#17212b]"
                htmlFor="register-email"
              >
                Email
              </label>
              <input
                autoComplete="email"
                className="mt-1.5 w-full rounded border border-[#9ca3af] bg-white px-3 py-2.5 font-['Figtree:Medium'] text-sm font-medium text-[#17212b] outline-none transition-shadow placeholder:text-[#94a3b8] focus:border-[#006747] focus:ring-2 focus:ring-[#006747]/20"
                id="register-email"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.edu"
                required
                type="email"
                value={email}
              />
            </div>
          )}

          <div className="mt-4">
            <label
              className="block font-['Figtree:SemiBold'] text-xs font-semibold text-[#17212b]"
              htmlFor="login-password"
            >
              Password
            </label>
            <input
              autoComplete={isRegistering ? "new-password" : "current-password"}
              className="mt-1.5 w-full rounded border border-[#9ca3af] bg-white px-3 py-2.5 font-['Figtree:Medium'] text-sm font-medium text-[#17212b] outline-none transition-shadow placeholder:text-[#94a3b8] focus:border-[#006747] focus:ring-2 focus:ring-[#006747]/20"
              id="login-password"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              required
              type="password"
              value={password}
            />
          </div>
                      {!isRegistering && (
            <div className="mt-2 text-right">
              <a
                href={`${API_BASE_URL}/forgot-password/`}
                className="font-['Figtree:Medium'] text-xs font-medium text-[#006747] hover:underline"
              >
                Forgot Password?
              </a>
            </div>
          )}
          {isRegistering && (
            <div className="mt-4">
              <label
                className="block font-['Figtree:SemiBold'] text-xs font-semibold text-[#17212b]"
                htmlFor="confirm-password"
              >
                Confirm password
              </label>
              <input
                autoComplete="new-password"
                className="mt-1.5 w-full rounded border border-[#9ca3af] bg-white px-3 py-2.5 font-['Figtree:Medium'] text-sm font-medium text-[#17212b] outline-none transition-shadow placeholder:text-[#94a3b8] focus:border-[#006747] focus:ring-2 focus:ring-[#006747]/20"
                id="confirm-password"
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Re-enter your password"
                required
                type="password"
                value={confirmPassword}
              />
            </div>
          )}

          <button
            className="mt-6 w-full cursor-pointer rounded bg-[#006747] px-4 py-3 font-['Figtree:SemiBold'] text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#005548] disabled:cursor-wait disabled:opacity-70"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting
              ? "Please wait..."
              : isRegistering
                ? "Create Account"
                : "Log In"}
          </button>
        </form>

        <button
          className="mt-2 w-full cursor-pointer rounded border-2 border-[#006747] bg-white px-4 py-2.5 font-['Figtree:SemiBold'] text-sm font-semibold text-[#006747] transition-colors hover:bg-emerald-50"
          onClick={() => {
            setIsRegistering(!isRegistering)
            setFormError("")
            setFormMessage("")
          }}
          type="button"
        >
          {isRegistering ? "Back to Log In" : "Register"}
        </button>

        <div className="my-5 flex items-center gap-3 text-xs font-medium text-[#64748b]">
          <span className="h-px flex-1 bg-[#d1d5db]" />
          OR
          <span className="h-px flex-1 bg-[#d1d5db]" />
        </div>

        <button
          className="flex w-full cursor-pointer items-center justify-center gap-3 rounded border border-[#9ca3af] bg-white px-4 py-3 font-['Figtree:SemiBold'] text-sm font-semibold text-[#17212b] shadow-sm transition-colors hover:bg-[#f8faf9]"
          onClick={() => {
            const returnToApp = new URL(window.location.origin)
            if (
              returnToApp.hostname === "localhost" &&
              new URL(API_BASE_URL).hostname === "127.0.0.1"
            ) {
              returnToApp.hostname = "127.0.0.1"
            }
            returnToApp.searchParams.set("auth", "google")
            const googleLoginUrl = new URL(
              "/accounts/google/login/",
              API_BASE_URL,
            )
            googleLoginUrl.searchParams.set("process", "login")
            googleLoginUrl.searchParams.set("next", returnToApp.toString())
            window.location.assign(googleLoginUrl.toString())
          }}
          type="button"
        >
          <span aria-hidden="true" className="font-['Outfit:Bold'] text-lg font-bold text-[#4285f4]">G</span>
          Continue with Google
        </button>
      </section>
    </main>
  )
}

function HomeScreen({ onSelect }: { onSelect: (id: string) => void }) {
  const [lostItemCount, setLostItemCount] = useState<number | null>(null)
  const [foundItemCount, setFoundItemCount] = useState<number | null>(null)
  const [lostItemsError, setLostItemsError] = useState<string | null>(null)
  const [foundItemsError, setFoundItemsError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function loadCount(
      url: string,
      setCount: (count: number) => void,
      setError: (message: string) => void,
    ) {
      try {
        const response = await fetch(url, {
          headers: { Accept: "application/json" },
          credentials: "include",
          signal: controller.signal,
        })
        if (!response.ok) {
          throw new Error(`Could not load item count (HTTP ${response.status}).`)
        }

        const payload: unknown = await response.json()
        if (Array.isArray(payload)) {
          setCount(payload.length)
          return
        }
        if (typeof payload === "object" && payload !== null) {
          if ("count" in payload && typeof payload.count === "number") {
            setCount(payload.count)
            return
          }
          if ("results" in payload && Array.isArray(payload.results)) {
            setCount(payload.results.length)
            return
          }
        }
        throw new Error("The items API returned an unexpected response.")
      } catch (loadError) {
        if (loadError instanceof Error && loadError.name === "AbortError") {
          return
        }
        setError(
          loadError instanceof Error
            ? loadError.message
            : "An unexpected error occurred while loading item counts.",
        )
      }
    }

    void loadCount(
      lostItemsApiUrl,
      setLostItemCount,
      setLostItemsError,
    )
    void loadCount(inventoryApiUrl, setFoundItemCount, setFoundItemsError)

    return () => controller.abort()
  }, [])

  return (
    <div className="w-full max-w-6xl space-y-6">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#004f3a] via-[#006747] to-[#00a676] p-7 text-white shadow-xl shadow-emerald-950/10 sm:p-10">
        <div className="absolute -top-20 -right-16 size-64 rounded-full border-[40px] border-white/10" />
        <div className="absolute -bottom-24 left-1/2 size-56 rounded-full bg-white/5" />
        <div className="relative">
          <p className="font-['Figtree:Bold'] text-xs font-bold tracking-[0.16em] text-emerald-100 uppercase">
            Welcome to FSC Lost &amp; Found
          </p>
          <div className="max-w-2xl">
          <p className="mt-3 font-['Outfit:Bold'] text-4xl leading-tight font-bold sm:text-5xl">
            Let&apos;s get your item back where it belongs.
          </p>
          <p className="mt-4 max-w-xl font-['Figtree:Medium'] text-base leading-7 font-medium text-emerald-50/90">
            Report a missing item, help return something you found, or explore
            current reports from across the Farmingdale campus.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <button
              className="home-hero-primary-button cursor-pointer rounded-xl bg-white px-5 py-3 font-['Figtree:SemiBold'] text-sm font-semibold text-[#006747] shadow-lg transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              onClick={() => onSelect("report-lost")}
              type="button"
            >
              Report a lost item
            </button>
            <button
              className="cursor-pointer rounded-xl border border-white/40 bg-white/10 px-5 py-3 font-['Figtree:SemiBold'] text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20"
              onClick={() => onSelect("report-found")}
              type="button"
            >
              I found something
            </button>
          </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {[
          {
            value: lostItemCount === null ? (lostItemsError ? "—" : "…") : lostItemCount,
            label: "Lost items",
            detail: lostItemsError ?? "Open lost reports",
          },
          {
            value: foundItemCount === null ? (foundItemsError ? "—" : "…") : foundItemCount,
            label: "Found items",
            detail: foundItemsError ?? "Items in inventory",
          },
        ].map(({ value, label, detail }) => (
          <div
            className="rounded-2xl border border-[#dce9e3] bg-white p-5 shadow-sm"
            key={label}
          >
            <p className="font-['Outfit:Bold'] text-3xl font-bold text-[#006747]">
              {value}
            </p>
            <p className="mt-1 font-['Figtree:SemiBold'] text-sm font-semibold text-[#17212b]">
              {label}
            </p>
            <p className="mt-1 font-['Figtree:Medium'] text-xs font-medium text-[#7c8b85]">
              {detail}
            </p>
          </div>
        ))}
      </section>

      <section className="rounded-3xl border border-[#dce9e3] bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <div>
            <p className="font-['Figtree:Bold'] text-xs font-bold tracking-[0.14em] text-[#006747] uppercase">
              Quick access
            </p>
            <p className="mt-2 font-['Outfit:Bold'] text-2xl font-bold text-[#17212b]">
              What would you like to do?
            </p>
          </div>
          <button
            className="cursor-pointer font-['Figtree:SemiBold'] text-sm font-semibold text-[#006747] hover:underline"
            onClick={() => onSelect("report-list")}
            type="button"
          >
            View all reports →
          </button>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            {
              id: "report-list",
              title: "Browse reports",
              text: "Search active lost and found items.",
              icon: imgListFilter,
              style: "bg-emerald-50 border-emerald-100",
            },
            {
              id: "campus-map",
              title: "Explore the map",
              text: "Find reports and drop-off locations.",
              icon: imgMapPin,
              style: "bg-green-50 border-green-100",
            },
            {
              id: "how-it-works",
              title: "Learn the process",
              text: "See how matching and returns work.",
              icon: imgCircleHelp,
              style: "bg-lime-50 border-lime-100",
            },
          ].map((item) => (
            <button
              className={`cursor-pointer rounded-2xl border p-5 text-left transition-transform hover:-translate-y-1 ${item.style}`}
              key={item.id}
              onClick={() => onSelect(item.id)}
              type="button"
            >
              <span className="flex size-11 items-center justify-center rounded-xl bg-white shadow-sm">
                <img alt="" className="size-5" src={item.icon} />
              </span>
              <span className="mt-4 block font-['Figtree:SemiBold'] text-base font-semibold text-[#17212b]">
                {item.title}
              </span>
              <span className="mt-1 block font-['Figtree:Medium'] text-sm leading-5 font-medium text-[#64748b]">
                {item.text}
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}

const resolvedReports = [
  {
    item: "Black wireless headphones",
    category: "Electronics",
    location: "Greenley Library",
    resolved: "Today",
    returnedTo: "Verified owner",
    type: "Found items",
    color: "bg-emerald-100 text-emerald-700",
  },
  {
    item: "Blue insulated water bottle",
    category: "Personal item",
    location: "Campus Center",
    resolved: "Yesterday",
    returnedTo: "Verified owner",
    type: "Lost items",
    color: "bg-green-100 text-green-700",
  },
  {
    item: "FSC student ID card",
    category: "Identification",
    location: "University Police",
    resolved: "2 days ago",
    returnedTo: "Student pickup",
    type: "Found items",
    color: "bg-lime-100 text-lime-700",
  },
  {
    item: "Silver key ring",
    category: "Keys",
    location: "Nold Athletic Complex",
    resolved: "5 days ago",
    returnedTo: "Verified owner",
    type: "Lost items",
    color: "bg-emerald-100 text-emerald-800",
  },
]

function ResolvedReportsScreen({
  onBrowseActiveReports,
}: {
  onBrowseActiveReports: () => void
}) {
  const [filter, setFilter] = useState("All")
  const filters = ["All", "This week", "Lost items", "Found items"]
  const visibleReports = resolvedReports.filter((report) => {
    if (filter === "All" || filter === "This week") return true
    return report.type === filter
  })

  return (
    <div className="w-full max-w-6xl space-y-6">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#004f3a] via-[#006747] to-[#00a676] p-7 text-white shadow-xl shadow-emerald-950/10 sm:p-9">
        <div className="absolute -top-16 -right-12 size-52 rounded-full border-[32px] border-white/10" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
          <span className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
            <img
              alt=""
              className="size-8 brightness-0 invert"
              src={imgHistory}
            />
          </span>
          <div>
            <p className="font-['Figtree:Bold'] text-xs font-bold tracking-[0.16em] text-emerald-100 uppercase">
              Resolved reports
            </p>
            <p className="mt-2 font-['Outfit:Bold'] text-3xl leading-tight font-bold sm:text-4xl">
              Items reunited with their owners
            </p>
            <p className="mt-3 max-w-3xl font-['Figtree:Medium'] text-sm leading-6 font-medium text-white/85 sm:text-base">
              Browse recently completed reports and see how the Farmingdale
              community is helping belongings find their way home.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          {
            value: "18",
            label: "Resolved this week",
            detail: "6 more than last week",
          },
          {
            value: "84%",
            label: "Matched within 48 hours",
            detail: "Average response time",
          },
          {
            value: "126",
            label: "Returned this semester",
            detail: "Across all campus locations",
          },
        ].map((stat) => (
          <div
            className="rounded-2xl border border-[#d7e9df] bg-white p-5 shadow-sm"
            key={stat.label}
          >
            <p className="font-['Outfit:Bold'] text-3xl font-bold text-[#006747]">
              {stat.value}
            </p>
            <p className="mt-1 font-['Figtree:SemiBold'] text-sm font-semibold text-[#17212b]">
              {stat.label}
            </p>
            <p className="mt-1 font-['Figtree:Medium'] text-xs font-medium text-[#7c8b85]">
              {stat.detail}
            </p>
          </div>
        ))}
      </section>

      <section className="overflow-hidden rounded-3xl border border-[#dce9e3] bg-white shadow-sm">
        <div className="border-b border-[#e7eeea] p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <p className="font-['Figtree:Bold'] text-xs font-bold tracking-[0.14em] text-[#006747] uppercase">
                Reunion history
              </p>
              <p className="mt-2 font-['Outfit:Bold'] text-2xl font-bold text-[#17212b]">
                Recently resolved items
              </p>
              <p className="mt-1 font-['Figtree:Medium'] text-sm font-medium text-[#64748b]">
                Showing {visibleReports.length} completed reports
              </p>
            </div>
            <div
              className="flex flex-wrap gap-2"
              aria-label="Filter resolved reports"
            >
              {filters.map((option) => (
                <button
                  aria-pressed={filter === option}
                  className={`cursor-pointer rounded-full px-4 py-2 font-['Figtree:SemiBold'] text-xs font-semibold transition-colors ${
                    filter === option
                      ? "bg-[#006747] text-white"
                      : "border border-[#dce3e0] bg-white text-[#52615b] hover:bg-emerald-50"
                  }`}
                  key={option}
                  onClick={() => setFilter(option)}
                  type="button"
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="divide-y divide-[#e7eeea]">
          {visibleReports.map((report) => (
            <article
              className="group grid gap-4 p-6 transition-colors hover:bg-[#f7fcf9] sm:grid-cols-[auto_1fr_auto] sm:items-center sm:px-8"
              key={report.item}
            >
              <div
                className={`flex size-12 items-center justify-center rounded-2xl ${report.color}`}
              >
                <img alt="" className="size-5" src={imgPackageCheck} />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-['Figtree:SemiBold'] text-base font-semibold text-[#17212b]">
                    {report.item}
                  </p>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-['Figtree:SemiBold'] text-[10px] font-semibold text-emerald-700 uppercase">
                    Resolved
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 font-['Figtree:Medium'] text-xs font-medium text-[#64748b]">
                  <span>{report.category}</span>
                  <span>{report.location}</span>
                  <span>{report.returnedTo}</span>
                </div>
              </div>
              <div className="flex items-center justify-between gap-4 sm:block sm:text-right">
                <p className="font-['Figtree:SemiBold'] text-sm font-semibold text-[#334155]">
                  {report.resolved}
                </p>
                <p className="mt-1 font-['Figtree:Medium'] text-xs font-medium text-[#94a3b8]">
                  {report.type}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-['Figtree:SemiBold'] text-base font-semibold text-[#064e3b]">
            Recognize one of these stories?
          </p>
          <p className="mt-1 font-['Figtree:Medium'] text-sm font-medium text-[#4f7667]">
            Resolved reports hide private ownership details while preserving
            useful community outcomes.
          </p>
        </div>
        <button
          className="w-fit shrink-0 cursor-pointer rounded-xl bg-[#006747] px-5 py-3 font-['Figtree:SemiBold'] text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#00523a]"
          onClick={onBrowseActiveReports}
          type="button"
        >
          Browse active reports
        </button>
      </section>
    </div>
  )
}

type FontSize = "small" | "default" | "large"

function SettingsScreen({
  darkMode,
  fontSize,
  onDarkModeChange,
  onFontSizeChange,
}: {
  darkMode: boolean
  fontSize: FontSize
  onDarkModeChange: (enabled: boolean) => void
  onFontSizeChange: (size: FontSize) => void
}) {
  const fontOptions: {
    id: FontSize
    label: string
    sample: string
    detail: string
  }[] = [
    { id: "small", label: "Small", sample: "Aa", detail: "90%" },
    { id: "default", label: "Default", sample: "Aa", detail: "100%" },
    { id: "large", label: "Large", sample: "Aa", detail: "112.5%" },
  ]

  return (
    <div className="w-full max-w-5xl space-y-6">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#004f3a] via-[#006747] to-[#00a676] p-7 text-white shadow-xl shadow-emerald-950/10 sm:p-9">
        <div className="absolute -top-16 -right-12 size-52 rounded-full border-[32px] border-white/10" />
        <div className="relative">
          <p className="font-['Figtree:Bold'] text-xs font-bold tracking-[0.16em] text-emerald-100 uppercase">
            Preferences
          </p>
          <p className="mt-2 font-['Outfit:Bold'] text-3xl leading-tight font-bold sm:text-4xl">
            Make the site comfortable for you
          </p>
          <p className="mt-3 max-w-2xl font-['Figtree:Medium'] text-sm leading-6 font-medium text-white/85 sm:text-base">
            Adjust the appearance and text size across FSC Lost &amp; Found.
            Your choices are saved on this device.
          </p>
        </div>
      </section>

      <section className="rounded-3xl border border-[#dce9e3] bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50">
              <span
                aria-hidden="true"
                className="size-6 rounded-full border-[6px] border-[#006747] border-r-emerald-200"
              />
            </span>
            <p className="font-['Figtree:SemiBold'] text-2xl font-semibold whitespace-nowrap text-[#17212b]">
              Dark mode
            </p>
          </div>
          <button
            aria-label="Toggle dark mode"
            aria-pressed={darkMode}
            className={`relative h-8 w-14 shrink-0 cursor-pointer rounded-full transition-colors ${
              darkMode ? "bg-[#006747]" : "bg-[#cbd5e1]"
            }`}
            onClick={() => onDarkModeChange(!darkMode)}
            type="button"
          >
            <span
              className={`absolute top-1 left-1 size-6 rounded-full bg-white shadow-sm transition-transform ${
                darkMode ? "translate-x-6" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </section>

      <section className="rounded-3xl border border-[#dce9e3] bg-white p-6 shadow-sm sm:p-8">
        <div>
          <p className="font-['Figtree:SemiBold'] text-lg font-semibold text-[#17212b]">
            Text size
          </p>
          <p className="mt-1 font-['Figtree:Medium'] text-sm leading-6 font-medium text-[#64748b]">
            Change the base text size throughout the website.
          </p>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {fontOptions.map((option) => {
            const isSelected = fontSize === option.id
            return (
              <button
                aria-pressed={isSelected}
                className={`cursor-pointer rounded-2xl border p-5 text-left transition-colors ${
                  isSelected
                    ? "border-[#006747] bg-emerald-50 ring-2 ring-[#006747]/15"
                    : "border-[#dce3e0] bg-white hover:bg-[#f8faf9]"
                }`}
                key={option.id}
                onClick={() => onFontSizeChange(option.id)}
                type="button"
              >
                <span
                  className={`block font-['Outfit:Bold'] font-bold text-[#17212b] ${
                    option.id === "small"
                      ? "text-xl"
                      : option.id === "large"
                        ? "text-3xl"
                        : "text-2xl"
                  }`}
                >
                  {option.sample}
                </span>
                <span className="mt-3 block font-['Figtree:SemiBold'] text-sm font-semibold text-[#17212b]">
                  {option.label}
                </span>
                <span className="mt-1 block font-['Figtree:Medium'] text-xs font-medium text-[#64748b]">
                  {option.detail} base size
                </span>
              </button>
            )
          })}
        </div>
      </section>
    </div>
  )
}

function ExampleChat({ onClose }: { onClose: () => void }) {
  const [draft, setDraft] = useState("")
  const [messages, setMessages] = useState([
    {
      sender: "staff",
      text: "Hi! You’ve reached the FSC Lost & Found team. How can we help today?",
    },
    {
      sender: "user",
      text: "I submitted a report for a black backpack that I lost near the Campus Center.",
    },
    {
      sender: "staff",
      text: "Thanks for checking in. Do you remember which floor or entrance you were closest to?",
    },
  ])

  const sendMessage = () => {
    const message = draft.trim()
    if (!message) return
    setMessages((current) => [
      ...current,
      { sender: "user", text: message },
      {
        sender: "staff",
        text: "Thanks for the additional detail. A staff member will compare it with recent found-item reports and follow up here.",
      },
    ])
    setDraft("")
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <section
        aria-labelledby="example-chat-title"
        aria-modal="true"
        className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-[#dce9e3] bg-white shadow-2xl"
        role="dialog"
      >
        <div className="flex items-center justify-between border-b border-[#dce9e3] bg-[#006747] px-5 py-4 text-white sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-white/15">
              <img
                alt=""
                className="size-5 brightness-0 invert"
                src={imgMessageCircle}
              />
            </span>
            <div>
              <p
                className="font-['Figtree:SemiBold'] text-base font-semibold"
                id="example-chat-title"
              >
                FSC Lost &amp; Found
              </p>
              <p className="font-['Figtree:Medium'] text-xs font-medium text-emerald-100">
                Staff support · Example chat
              </p>
            </div>
          </div>
          <button
            aria-label="Close example chat"
            className="cursor-pointer rounded-lg border border-white/25 px-3 py-2 font-['Figtree:SemiBold'] text-xs font-semibold text-white transition-colors hover:bg-white/10"
            onClick={onClose}
            type="button"
          >
            Close
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto bg-[#f7faf8] p-5 sm:p-6">
          <p className="text-center font-['Figtree:Medium'] text-xs font-medium text-[#7c8b85]">
            Today
          </p>
          {messages.map((message, index) => (
            <div
              className={`flex ${
                message.sender === "user" ? "justify-end" : "justify-start"
              }`}
              key={`${message.sender}-${index}`}
            >
              <div
                className={`max-w-[82%] rounded-2xl px-4 py-3 font-['Figtree:Medium'] text-sm leading-6 font-medium ${
                  message.sender === "user"
                    ? "rounded-br-md bg-[#006747] text-white"
                    : "rounded-bl-md border border-[#dce9e3] bg-white text-[#334155]"
                }`}
              >
                {message.text}
              </div>
            </div>
          ))}
        </div>

        <form
          className="flex gap-3 border-t border-[#dce9e3] bg-white p-4 sm:p-5"
          onSubmit={(event) => {
            event.preventDefault()
            sendMessage()
          }}
        >
          <input
            aria-label="Chat message"
            className="min-w-0 flex-1 rounded-xl border border-[#cbd8d2] bg-white px-4 py-3 font-['Figtree:Medium'] text-sm font-medium text-[#17212b] outline-none transition-shadow placeholder:text-[#94a3b8] focus:border-[#006747] focus:ring-2 focus:ring-[#006747]/15"
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Type a message…"
            value={draft}
          />
          <button
            className="cursor-pointer rounded-xl bg-[#006747] px-5 py-3 font-['Figtree:SemiBold'] text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#00523a] disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!draft.trim()}
            type="submit"
          >
            Send
          </button>
        </form>
      </section>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Report Lost Item / Report Found Item
// Both forms share one component (ItemReportScreen). Each saves a new item to
// the Django backend's lost-items or inventory endpoint.
// Change the backend address with VITE_API_URL in frontend/.env if needed.
// ---------------------------------------------------------------------------

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000"
if (
  typeof window !== "undefined" &&
  window.location.hostname === "localhost" &&
  new URL(API_BASE_URL).hostname === "127.0.0.1"
) {
  const canonicalUrl = new URL(window.location.href)
  canonicalUrl.hostname = "127.0.0.1"
  window.location.replace(canonicalUrl.toString())
}

const itemCategories = [
  "Electronics",
  "Identification / cards",
  "Keys",
  "Wallet / money",
  "Bag / backpack",
  "Clothing",
  "Water bottle",
  "Books / school supplies",
  "Jewelry / accessories",
  "Other",
]

// Staffed places where a finder can hand in an item (found reports only).
const dropOffLocations = [
  "University Police",
  "Campus Center Information Desk",
  "Greenley Library Front Desk",
  "Nold Athletic Complex Front Desk",
]

type ReportKind = "lost" | "found"

type ItemReportForm = {
  title: string
  category: string
  color: string
  location: string
  otherLocation: string
  date: string
  description: string
  dropOff: string
}

type SavedItem = {
  id: string
  title: string
  category: string
  color: string
  location: string
  date: string
  description: string
}

const emptyItemReport: ItemReportForm = {
  title: "",
  category: "",
  color: "",
  location: "",
  otherLocation: "",
  date: "",
  description: "",
  dropOff: "",
}

// Wording that differs between the lost and found forms.
const reportCopy: Record<
  ReportKind,
  {
    pageId: string
    formTitle: string
    titlePlaceholder: string
    locationLabel: string
    locationError: string
    dateLabel: string
    dateError: string
    descriptionLabel: string
    descriptionPlaceholder: string
    submitLabel: string
    successTitle: (title: string) => string
    successText: string
  }
> = {
  lost: {
    pageId: "report-lost",
    formTitle: "What did you lose?",
    titlePlaceholder: "e.g. Black JanSport backpack",
    locationLabel: "Last seen at",
    locationError: "Choose where you last had it.",
    dateLabel: "Date lost",
    dateError: "Choose the date you lost it.",
    descriptionLabel: "Identifying details",
    descriptionPlaceholder:
      "Brand, stickers, scratches, what was inside… Leave out anything private like ID numbers.",
    submitLabel: "Submit lost item report",
    successTitle: (title) => `Your report for “${title}” is live`,
    successText:
      "Your report is saved. We'll notify you when a similar found item is reported.",
  },
  found: {
    pageId: "report-found",
    formTitle: "What did you find?",
    titlePlaceholder: "e.g. Silver iPhone with a blue case",
    locationLabel: "Where did you find it?",
    locationError: "Choose where you found it.",
    dateLabel: "Date found",
    dateError: "Choose the date you found it.",
    descriptionLabel: "General description",
    descriptionPlaceholder:
      "Describe it just enough to recognize it. Leave out names, serial numbers, and what's inside so the real owner can prove it's theirs.",
    submitLabel: "Submit found item report",
    successTitle: (title) => `Thanks for reporting “${title}”`,
    successText:
      "Your report is saved. Please hand the item in at the drop-off point below so staff can return it to its owner.",
  },
}

function todayIso() {
  const now = new Date()
  const offset = now.getTimezoneOffset() * 60000
  return new Date(now.getTime() - offset).toISOString().slice(0, 10)
}

function formatReportDate(isoDate: string) {
  const [year, month, day] = isoDate.split("-").map(Number)
  if (!year || !month || !day) return isoDate
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

const fieldLabelClass =
  "block font-['Figtree:SemiBold'] text-sm font-semibold text-[#17212b]"
const fieldInputClass =
  "mt-1.5 w-full rounded-xl border border-[#cbd8d2] bg-white px-3.5 py-2.5 font-['Figtree:Medium'] text-sm font-medium text-[#17212b] outline-none transition-shadow placeholder:text-[#94a3b8] focus:border-[#006747] focus:ring-2 focus:ring-[#006747]/15"
const fieldErrorClass =
  "mt-1 font-['Figtree:Medium'] text-xs font-medium text-red-600"

function ItemReportScreen({
  kind,
  onDone,
}: {
  kind: ReportKind
  onDone: () => void
}) {
  const [form, setForm] = useState<ItemReportForm>(emptyItemReport)
  const [errors, setErrors] = useState<Partial<Record<keyof ItemReportForm, string>>>({})
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState("")
  const [savedItem, setSavedItem] = useState<SavedItem | null>(null)
  const [savedDropOff, setSavedDropOff] = useState("")

  const copy = reportCopy[kind]
  const content = pageContent[copy.pageId]
  const isFound = kind === "found"

  const update = (field: keyof ItemReportForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  const validate = () => {
    const next: Partial<Record<keyof ItemReportForm, string>> = {}
    if (!form.title.trim()) next.title = "Tell us what the item is."
    if (!form.category) next.category = "Choose a category."
    if (!form.location) next.location = copy.locationError
    if (form.location === "Other" && !form.otherLocation.trim())
      next.otherLocation = "Describe the location."
    if (!form.date) next.date = copy.dateError
    else if (form.date > todayIso()) next.date = "The date can't be in the future."
    if (isFound && !form.dropOff) next.dropOff = "Choose where you'll hand it in."
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const submit = async () => {
    setServerError("")
    if (!validate()) return

    const payload: Record<string, string> = {
      title: form.title.trim(),
      category: form.category,
      color: form.color.trim(),
      location:
        form.location === "Other" ? form.otherLocation.trim() : form.location,
      date: form.date,
      description: form.description.trim(),
      status: kind,
    }
    // storage_location is added to the Item model on the
    // InventoryFeature-Addition branch. Until that is merged the backend
    // ignores this field.
    if (isFound) payload.storage_location = form.dropOff

    setSubmitting(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/${isFound ? "inventory" : "lost-items"}/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!response.ok) {
        const body = await response.json().catch(() => null)
        const detail =
          body && typeof body === "object"
            ? Object.entries(body)
                .map(([field, messages]) =>
                  `${field}: ${Array.isArray(messages) ? messages.join(" ") : String(messages)}`,
                )
                .join(" · ")
            : ""
        setServerError(
          `The server couldn't save your report (error ${response.status}).${detail ? ` ${detail}` : ""}`,
        )
        return
      }
      setSavedItem((await response.json()) as SavedItem)
      setSavedDropOff(form.dropOff)
    } catch {
      setServerError(
        "Couldn't reach the server. Make sure the backend is running (python manage.py runserver) and try again.",
      )
    } finally {
      setSubmitting(false)
    }
  }

  const startOver = () => {
    setForm(emptyItemReport)
    setErrors({})
    setServerError("")
    setSavedItem(null)
    setSavedDropOff("")
  }

  const summaryRows: [string, string][] = savedItem
    ? [
        ["Item", savedItem.title],
        ["Category", savedItem.category],
        ["Color", savedItem.color || "—"],
        [isFound ? "Found at" : "Last seen", savedItem.location],
        [copy.dateLabel, formatReportDate(savedItem.date)],
        ...(isFound ? ([["Drop off at", savedDropOff]] as [string, string][]) : []),
        ["Report ID", savedItem.id],
      ]
    : []

  return (
    <div className="w-full max-w-6xl space-y-6">
      <section
        className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${content.gradient} p-7 text-white shadow-xl shadow-slate-900/10 sm:p-9`}
      >
        <div className="absolute -top-16 -right-12 size-52 rounded-full border-[32px] border-white/10" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
          <span className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
            <img alt="" className="size-8 brightness-0 invert" src={content.icon} />
          </span>
          <div className="max-w-3xl">
            <p className="font-['Figtree:Bold'] text-xs font-bold tracking-[0.16em] text-white/75 uppercase">
              {content.eyebrow}
            </p>
            <p className="mt-2 font-['Outfit:Bold'] text-3xl leading-tight font-bold sm:text-4xl">
              {content.title}
            </p>
            <p className="mt-3 font-['Figtree:Medium'] text-sm leading-6 font-medium text-white/85 sm:text-base">
              {content.description}
            </p>
          </div>
        </div>
      </section>

      {savedItem ? (
        <section className="rounded-3xl border border-[#dce9e3] bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-start gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#006747]">
              <img alt="" className="size-6 brightness-0 invert" src={content.icon} />
            </span>
            <div>
              <p className="font-['Figtree:Bold'] text-xs font-bold tracking-[0.14em] text-[#006747] uppercase">
                Report submitted
              </p>
              <p className="mt-1 font-['Outfit:Bold'] text-2xl font-bold text-[#17212b]">
                {copy.successTitle(savedItem.title)}
              </p>
              <p className="mt-2 max-w-2xl font-['Figtree:Medium'] text-sm leading-6 font-medium text-[#64748b]">
                {copy.successText}
              </p>
            </div>
          </div>

          <dl className="mt-6 grid gap-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-5 sm:grid-cols-2">
            {summaryRows.map(([label, value]) => (
              <div key={label}>
                <dt className="font-['Figtree:Medium'] text-xs font-medium text-[#64748b]">
                  {label}
                </dt>
                <dd className="mt-0.5 font-['Figtree:SemiBold'] text-sm font-semibold break-words text-[#17212b]">
                  {value}
                </dd>
              </div>
            ))}
            {savedItem.description && (
              <div className="sm:col-span-2">
                <dt className="font-['Figtree:Medium'] text-xs font-medium text-[#64748b]">
                  Details
                </dt>
                <dd className="mt-0.5 font-['Figtree:Medium'] text-sm leading-6 font-medium text-[#17212b]">
                  {savedItem.description}
                </dd>
              </div>
            )}
          </dl>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              className="cursor-pointer rounded-xl bg-[#006747] px-5 py-3 font-['Figtree:SemiBold'] text-sm font-semibold text-white shadow-md transition-colors hover:bg-[#00523a]"
              onClick={onDone}
              type="button"
            >
              Back to home
            </button>
            <button
              className="cursor-pointer rounded-xl border border-[#cbd8d2] bg-white px-5 py-3 font-['Figtree:SemiBold'] text-sm font-semibold text-[#334155] transition-colors hover:bg-emerald-50"
              onClick={startOver}
              type="button"
            >
              Report another item
            </button>
          </div>
        </section>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          <form
            className="min-w-0 rounded-3xl border border-[#dce9e3] bg-white p-6 shadow-sm sm:p-8"
            noValidate
            onSubmit={(event) => {
              event.preventDefault()
              void submit()
            }}
          >
            <p className="font-['Figtree:Bold'] text-xs font-bold tracking-[0.14em] text-[#006747] uppercase">
              Item details
            </p>
            <p className="mt-2 font-['Outfit:Bold'] text-2xl font-bold text-[#17212b]">
              {copy.formTitle}
            </p>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={fieldLabelClass} htmlFor={`${kind}-title`}>
                  Item name <span className="text-red-600">*</span>
                </label>
                <input
                  className={fieldInputClass}
                  id={`${kind}-title`}
                  maxLength={200}
                  onChange={(event) => update("title", event.target.value)}
                  placeholder={copy.titlePlaceholder}
                  value={form.title}
                />
                {errors.title && <p className={fieldErrorClass}>{errors.title}</p>}
              </div>

              <div>
                <label className={fieldLabelClass} htmlFor={`${kind}-category`}>
                  Category <span className="text-red-600">*</span>
                </label>
                <select
                  className={fieldInputClass}
                  id={`${kind}-category`}
                  onChange={(event) => update("category", event.target.value)}
                  value={form.category}
                >
                  <option value="">Select a category</option>
                  {itemCategories.map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </select>
                {errors.category && (
                  <p className={fieldErrorClass}>{errors.category}</p>
                )}
              </div>

              <div>
                <label className={fieldLabelClass} htmlFor={`${kind}-color`}>
                  Color
                </label>
                <input
                  className={fieldInputClass}
                  id={`${kind}-color`}
                  maxLength={50}
                  onChange={(event) => update("color", event.target.value)}
                  placeholder="e.g. Black"
                  value={form.color}
                />
              </div>

              <div>
                <label className={fieldLabelClass} htmlFor={`${kind}-location`}>
                  {copy.locationLabel} <span className="text-red-600">*</span>
                </label>
                <select
                  className={fieldInputClass}
                  id={`${kind}-location`}
                  onChange={(event) => update("location", event.target.value)}
                  value={form.location}
                >
                  <option value="">Select a campus location</option>
                  {campusLocations.map((location) => (
                    <option key={location}>{location}</option>
                  ))}
                </select>
                {errors.location && (
                  <p className={fieldErrorClass}>{errors.location}</p>
                )}
              </div>

              <div>
                <label className={fieldLabelClass} htmlFor={`${kind}-date`}>
                  {copy.dateLabel} <span className="text-red-600">*</span>
                </label>
                <input
                  className={fieldInputClass}
                  id={`${kind}-date`}
                  max={todayIso()}
                  onChange={(event) => update("date", event.target.value)}
                  type="date"
                  value={form.date}
                />
                {errors.date && <p className={fieldErrorClass}>{errors.date}</p>}
              </div>

              {form.location === "Other" && (
                <div className="sm:col-span-2">
                  <label className={fieldLabelClass} htmlFor={`${kind}-other-location`}>
                    Describe the location <span className="text-red-600">*</span>
                  </label>
                  <input
                    className={fieldInputClass}
                    id={`${kind}-other-location`}
                    maxLength={200}
                    onChange={(event) => update("otherLocation", event.target.value)}
                    placeholder="e.g. Bench outside the bookstore"
                    value={form.otherLocation}
                  />
                  {errors.otherLocation && (
                    <p className={fieldErrorClass}>{errors.otherLocation}</p>
                  )}
                </div>
              )}

              {isFound && (
                <div className="sm:col-span-2">
                  <label className={fieldLabelClass} htmlFor="found-dropoff">
                    Where will you hand it in? <span className="text-red-600">*</span>
                  </label>
                  <select
                    className={fieldInputClass}
                    id="found-dropoff"
                    onChange={(event) => update("dropOff", event.target.value)}
                    value={form.dropOff}
                  >
                    <option value="">Select a staffed drop-off point</option>
                    {dropOffLocations.map((location) => (
                      <option key={location}>{location}</option>
                    ))}
                  </select>
                  {errors.dropOff ? (
                    <p className={fieldErrorClass}>{errors.dropOff}</p>
                  ) : (
                    <p className="mt-1 font-['Figtree:Medium'] text-xs font-medium text-[#64748b]">
                      Please don&apos;t arrange a handoff off campus. Staff will
                      verify the owner before returning it.
                    </p>
                  )}
                </div>
              )}

              <div className="sm:col-span-2">
                <label className={fieldLabelClass} htmlFor={`${kind}-description`}>
                  {copy.descriptionLabel}
                </label>
                <textarea
                  className={`${fieldInputClass} min-h-28 resize-y`}
                  id={`${kind}-description`}
                  onChange={(event) => update("description", event.target.value)}
                  placeholder={copy.descriptionPlaceholder}
                  value={form.description}
                />
              </div>
            </div>

            {serverError && (
              <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 font-['Figtree:Medium'] text-sm font-medium text-red-700">
                {serverError}
              </p>
            )}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                className="cursor-pointer rounded-xl bg-[#006747] px-5 py-3 font-['Figtree:SemiBold'] text-sm font-semibold text-white shadow-md transition-colors hover:bg-[#00523a] disabled:cursor-not-allowed disabled:opacity-60"
                disabled={submitting}
                type="submit"
              >
                {submitting ? "Submitting…" : copy.submitLabel}
              </button>
              <button
                className="cursor-pointer rounded-xl border border-[#cbd8d2] bg-white px-5 py-3 font-['Figtree:SemiBold'] text-sm font-semibold text-[#334155] transition-colors hover:bg-emerald-50"
                onClick={onDone}
                type="button"
              >
                Cancel
              </button>
              <p className="font-['Figtree:Medium'] text-xs font-medium text-[#7c8b85] sm:ml-auto">
                <span className="text-red-600">*</span> Required
              </p>
            </div>
          </form>

          <aside className="h-fit rounded-3xl border border-emerald-100 bg-emerald-50 p-6">
            <p className="font-['Figtree:Bold'] text-xs font-bold tracking-[0.14em] text-[#006747] uppercase">
              {content.panelLabel}
            </p>
            <p className="mt-2 font-['Outfit:Bold'] text-xl font-bold text-[#17212b]">
              {content.panelTitle}
            </p>
            <ol className="mt-5 space-y-4">
              {content.highlights.map((highlight, index) => (
                <li className="flex gap-3" key={highlight.title}>
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white font-['Outfit:Bold'] text-xs font-bold text-[#006747] shadow-sm">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-['Figtree:SemiBold'] text-sm font-semibold text-[#17212b]">
                      {highlight.title}
                    </p>
                    <p className="mt-0.5 font-['Figtree:Medium'] text-xs leading-5 font-medium text-[#64748b]">
                      {highlight.description}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </aside>
        </div>
      )}
    </div>
  )
}

function SectionScreen({ content }: { content: PageContent }) {
  const [chatOpen, setChatOpen] = useState(false)
  const openChat = () => {
    if (content.action === "Start a conversation") setChatOpen(true)
  }

  return (
    <div className="w-full max-w-6xl space-y-6">
      <section
        className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${content.gradient} p-7 text-white shadow-xl shadow-slate-900/10 sm:p-9`}
      >
        <div className="absolute -top-16 -right-12 size-52 rounded-full border-[32px] border-white/10" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
          <span className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
            <img
              alt=""
              className="size-8 brightness-0 invert"
              src={content.icon}
            />
          </span>
          <div className="max-w-3xl">
            <p className="font-['Figtree:Bold'] text-xs font-bold tracking-[0.16em] text-white/75 uppercase">
              {content.eyebrow}
            </p>
            <p className="mt-2 font-['Outfit:Bold'] text-3xl leading-tight font-bold sm:text-4xl">
              {content.title}
            </p>
            <p className="mt-3 font-['Figtree:Medium'] text-sm leading-6 font-medium text-white/85 sm:text-base">
              {content.description}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {content.stats.map((stat) => (
          <div
            className="rounded-2xl border border-[#dce9e3] bg-white p-5 shadow-sm"
            key={stat.label}
          >
            <p className="font-['Outfit:Bold'] text-2xl font-bold text-[#17212b]">
              {stat.value}
            </p>
            <p className="mt-1 font-['Figtree:Medium'] text-sm font-medium text-[#64748b]">
              {stat.label}
            </p>
          </div>
        ))}
      </section>

      {content.panelStyle === "compact" ? (
        <section
          className={`flex flex-col gap-5 rounded-3xl border p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-8 ${content.tint}`}
        >
          <div className="flex items-start gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm">
              <img alt="" className="size-6" src={content.icon} />
            </span>
            <div>
              <p className="font-['Figtree:Bold'] text-xs font-bold tracking-[0.14em] text-[#006747] uppercase">
                {content.panelLabel}
              </p>
              <p className="mt-1 font-['Outfit:Bold'] text-2xl font-bold text-[#17212b]">
                {content.panelTitle}
              </p>
              <p className="mt-2 max-w-2xl font-['Figtree:Medium'] text-sm leading-6 font-medium text-[#64748b]">
                {content.highlights[0].description}
              </p>
            </div>
          </div>
          <button
            className="w-fit shrink-0 cursor-pointer rounded-xl bg-[#006747] px-5 py-3 font-['Figtree:SemiBold'] text-sm font-semibold text-white shadow-md transition-colors hover:bg-[#00523a]"
            onClick={openChat}
            type="button"
          >
            {content.action}
          </button>
        </section>
      ) : (
        <section className="rounded-3xl border border-[#dce9e3] bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <p className="font-['Figtree:Bold'] text-xs font-bold tracking-[0.14em] text-[#006747] uppercase">
                {content.panelLabel}
              </p>
              <p className="mt-2 font-['Outfit:Bold'] text-2xl font-bold text-[#17212b]">
                {content.panelTitle}
              </p>
            </div>
            <button
              className="w-fit cursor-pointer rounded-xl bg-[#006747] px-5 py-3 font-['Figtree:SemiBold'] text-sm font-semibold text-white shadow-md transition-colors hover:bg-[#00523a]"
              onClick={openChat}
              type="button"
            >
              {content.action}
            </button>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {content.highlights.map((highlight, index) => (
              <div
                className={`rounded-2xl border p-5 ${content.tint}`}
                key={highlight.title}
              >
                <span className="flex size-8 items-center justify-center rounded-full bg-white font-['Outfit:Bold'] text-sm font-bold text-[#006747] shadow-sm">
                  {index + 1}
                </span>
                <p className="mt-4 font-['Figtree:SemiBold'] text-base font-semibold text-[#17212b]">
                  {highlight.title}
                </p>
                <p className="mt-2 font-['Figtree:Medium'] text-sm leading-6 font-medium text-[#64748b]">
                  {highlight.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
      {chatOpen && <ExampleChat onClose={() => setChatOpen(false)} />}
    </div>
  )
}

export default function App() {
  const authReturn = new URLSearchParams(window.location.search).get("auth")
  const returningFromAdmin =
    new URLSearchParams(window.location.search).get("admin_inventory") === "1"
  const [isLoggedIn, setIsLoggedIn] = useState(returningFromAdmin)
  const [username, setUsername] = useState<string | null>(null)
  const [authError, setAuthError] = useState("")
  const [activeItem, setActiveItem] = useState(() => {
    if (returningFromAdmin) return "inventory"
    const savedPage = localStorage.getItem("fsc-active-page")
    return savedPage && persistentPageIds.has(savedPage) ? savedPage : "home"
  })
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("fsc-dark-mode") === "true",
  )
  const [fontSize, setFontSize] = useState<FontSize>(() => {
    const saved = localStorage.getItem("fsc-font-size")
    return saved === "small" || saved === "large" ? saved : "default"
  })

  async function loadCurrentUsername(signal?: AbortSignal): Promise<string> {
    const response = await fetch(`${API_BASE_URL}/api/auth/user/`, {
      headers: { Accept: "application/json" },
      credentials: "include",
      signal,
    })
    if (!response.ok) {
      throw new Error(`Django could not load the current user (HTTP ${response.status}).`)
    }

    const user: unknown = await response.json()
    if (
      typeof user !== "object" ||
      user === null ||
      !("username" in user) ||
      typeof user.username !== "string" ||
      user.username.trim() === ""
    ) {
      throw new Error("Django returned account details without a username.")
    }
    return user.username
  }

  useEffect(() => {
    const controller = new AbortController()

    async function checkDjangoSession() {
      try {
        const currentUsername = await loadCurrentUsername(controller.signal)
        setUsername(currentUsername)
        setIsLoggedIn(true)
        if (authReturn === "google") setActiveItem("home")
      } catch (error) {
        if (controller.signal.aborted) return
        if (authReturn === "google") {
          setAuthError(
            error instanceof Error && error.message.includes("HTTP 401")
              ? "Django did not receive the Google session. Use 127.0.0.1 for the app and try again."
              : error instanceof Error && error.message.includes("HTTP 403")
                ? "Django did not receive the Google session. Use 127.0.0.1 for the app and try again."
                : "Could not verify your Google sign-in with Django.",
          )
        } else if (returningFromAdmin) {
          setUsername("Username unavailable")
        }
      } finally {
        if (authReturn === "google" && !controller.signal.aborted) {
          const url = new URL(window.location.href)
          url.searchParams.delete("auth")
          window.history.replaceState({}, "", url)
        }
      }
    }

    void checkDjangoSession()
    return () => controller.abort()
  }, [authReturn, returningFromAdmin])

  useEffect(() => {
    localStorage.setItem("fsc-dark-mode", String(darkMode))
  }, [darkMode])

  useEffect(() => {
    localStorage.setItem("fsc-active-page", activeItem)
  }, [activeItem])

  useEffect(() => {
    if (!returningFromAdmin) return

    const url = new URL(window.location.href)
    url.searchParams.delete("admin_inventory")
    window.history.replaceState({}, "", url)
  }, [returningFromAdmin])

  useEffect(() => {
    const sizes: Record<FontSize, string> = {
      small: "14.4px",
      default: "16px",
      large: "18px",
    }
    document.documentElement.style.fontSize = sizes[fontSize]
    localStorage.setItem("fsc-font-size", fontSize)
  }, [fontSize])

  if (!isLoggedIn) {
    return (
      <LoginScreen
        error={authError}
        onAuthenticated={() => {
          setIsLoggedIn(true)
          void loadCurrentUsername()
            .then(setUsername)
            .catch(() => setUsername("Username unavailable"))
        }}
      />
    )
  }

  return (
    <div
      className={`flex min-h-screen flex-col bg-[#f8faf9] ${activeItem === "campus-map" ? "h-dvh min-h-0 overflow-hidden" : ""} ${
        darkMode ? "theme-dark" : ""
      }`}
    >
      <TopBar username={username ?? "Loading username…"} />
      <div className={`flex flex-1 flex-col md:flex-row ${activeItem === "campus-map" ? "min-h-0 overflow-hidden" : ""}`}>
        <Sidebar
          activeItem={activeItem}
          onLogout={async () => {
            const csrfCookie = document.cookie
              .split("; ")
              .find((entry) => entry.startsWith("csrftoken="))
            const csrfToken = csrfCookie?.slice("csrftoken=".length)

            try {
              const response = await fetch(`${API_BASE_URL}/api/auth/logout/`, {
                method: "POST",
                headers: csrfToken ? { "X-CSRFToken": csrfToken } : {},
                credentials: "include",
              })

              if (!response.ok) {
                setAuthError("Django could not end the session. Sign in again after refreshing.")
              }
            } catch {
              setAuthError("Could not reach Django to end the session.")
            }

            setUsername(null)
            setIsLoggedIn(false)
          }}
          onSelect={setActiveItem}
        />
        <main className={`flex min-w-0 flex-1 justify-center ${activeItem === "campus-map" ? "min-h-0 overflow-hidden" : "items-start p-5 sm:p-8 lg:p-10"}`}>
          {activeItem === "home" ? (
            <HomeScreen onSelect={setActiveItem} />
          ) : activeItem === "inventory" ? (
            <InventoryScreen />
          ) : activeItem === "campus-map" ? (
            <Suspense fallback={<p className="p-8 text-sm text-[#64748b]">Loading campus map…</p>}>
              <CampusMap />
            </Suspense>
          ) : activeItem === "report-lost" ? (
            <LostItemReport />
          ) : activeItem === "report-list" ? (
            <ReportsScreen />
          ) : activeItem === "report-found" ? (
            <FoundItemReport onOpenInventory={() => setActiveItem("inventory")} />
          ) : activeItem === "recently-resolved" ? (
            <ResolvedReportsScreen
              onBrowseActiveReports={() => setActiveItem("report-list")}
            />
          ) : activeItem === "settings" ? (
            <SettingsScreen
              darkMode={darkMode}
              fontSize={fontSize}
              onDarkModeChange={setDarkMode}
              onFontSizeChange={setFontSize}
            />
          ) : (
            <SectionScreen content={pageContent[activeItem]} />
          )}
        </main>
      </div>
    </div>
  )
}
