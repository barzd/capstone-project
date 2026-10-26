import { useEffect, useState } from "react"

const assetPathPrefix = "/assets"
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
  stats: { value: string label: string }[]
  highlights: { title: string description: string }[]
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

function TopBar() {
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
          className="size-8 shrink-0"
          aria-hidden="true"
          data-node-id="18:20"
        />
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
    <aside className="w-full shrink-0 border-b border-[#d1fae5] bg-white px-4 py-6 md:w-[280px] md:border-r md:border-b-0">
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

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [registrationMessage, setRegistrationMessage] = useState(false)

  const submitLogin = () => {
    if (!username.trim() || !password.trim()) {
      setError("Enter your username and password to continue.")
      return
    }
    setError("")
    onLogin()
  }

  return (
    <main
      className="relative flex min-h-screen items-center justify-center bg-cover bg-center px-5 py-10"
      style={{ backgroundImage: "url('/assets/fsc-campus-login.jpg')" }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/5 via-transparent to-emerald-950/35" />
      <form
        className="relative z-10 w-full max-w-[420px] rounded-md border border-black/15 bg-white p-7 shadow-2xl sm:p-9"
        onSubmit={(event) => {
          event.preventDefault()
          submitLogin()
        }}
      >
        <div className="text-center">
          <p className="font-['Outfit:Bold'] text-[30px] leading-tight font-bold text-[#006747]">
            FSC Lost &amp; Found
          </p>
          <p className="mt-2 font-['Figtree:Medium'] text-sm font-medium text-[#64748b]">
            Sign in to view and manage campus reports
          </p>
        </div>

        <div className="mt-7">
          <label
            className="block font-['Figtree:SemiBold'] text-xs font-semibold text-[#17212b]"
            htmlFor="username"
          >
            Username or Email
          </label>
          <input
            autoComplete="username"
            className="mt-1.5 w-full rounded border border-[#9ca3af] bg-white px-3 py-2.5 font-['Figtree:Medium'] text-sm font-medium text-[#17212b] outline-none transition-shadow placeholder:text-[#94a3b8] focus:border-[#006747] focus:ring-2 focus:ring-[#006747]/20"
            id="username"
            onChange={(event) => setUsername(event.target.value)}
            placeholder="Enter your username or email"
            type="text"
            value={username}
          />
        </div>

        <div className="mt-4">
          <label
            className="block font-['Figtree:SemiBold'] text-xs font-semibold text-[#17212b]"
            htmlFor="password"
          >
            Password
          </label>
          <input
            autoComplete="current-password"
            className="mt-1.5 w-full rounded border border-[#9ca3af] bg-white px-3 py-2.5 font-['Figtree:Medium'] text-sm font-medium text-[#17212b] outline-none transition-shadow placeholder:text-[#94a3b8] focus:border-[#006747] focus:ring-2 focus:ring-[#006747]/20"
            id="password"
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter your password"
            type="password"
            value={password}
          />
        </div>

        {error && (
          <p className="mt-3 rounded-md bg-red-50 px-3 py-2 font-['Figtree:Medium'] text-xs font-medium text-red-700">
            {error}
          </p>
        )}

        {registrationMessage && (
          <p className="mt-3 rounded-md bg-emerald-50 px-3 py-2 font-['Figtree:Medium'] text-xs font-medium text-emerald-700">
            Registration will be connected when the account backend is ready.
          </p>
        )}

        <button
          className="mt-6 w-full cursor-pointer rounded bg-[#006747] px-4 py-3 font-['Figtree:SemiBold'] text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#005548]"
          type="submit"
        >
          Log In
        </button>
        <button
          className="mt-2 w-full cursor-pointer rounded border-2 border-[#006747] bg-white px-4 py-2.5 font-['Figtree:SemiBold'] text-sm font-semibold text-[#006747] transition-colors hover:bg-emerald-50"
          onClick={() => {
            setRegistrationMessage(true)
            setError("")
          }}
          type="button"
        >
          Register
        </button>
      </form>
    </main>
  )
}

function HomeScreen({ onSelect }: { onSelect: (id: string) => void }) {
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
              className="cursor-pointer rounded-xl bg-white px-5 py-3 font-['Figtree:SemiBold'] text-sm font-semibold text-[#006747] shadow-lg transition-transform hover:-translate-y-0.5"
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

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          ["24", "Active reports", "Updated across campus"],
          ["12", "Potential matches", "Ready to review"],
          ["126", "Items reunited", "This semester"],
        ].map(([value, label, detail]) => (
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

function ResolvedReportsScreen() {
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
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [activeItem, setActiveItem] = useState("home")
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("fsc-dark-mode") === "true",
  )
  const [fontSize, setFontSize] = useState<FontSize>(() => {
    const saved = localStorage.getItem("fsc-font-size")
    return saved === "small" || saved === "large" ? saved : "default"
  })

  useEffect(() => {
    localStorage.setItem("fsc-dark-mode", String(darkMode))
  }, [darkMode])

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
    return <LoginScreen onLogin={() => setIsLoggedIn(true)} />
  }

  return (
    <div
      className={`flex min-h-screen flex-col bg-[#f8faf9] ${
        darkMode ? "theme-dark" : ""
      }`}
    >
      <TopBar />
      <div className="flex flex-1 flex-col md:flex-row">
        <Sidebar
          activeItem={activeItem}
          onLogout={() => setIsLoggedIn(false)}
          onSelect={setActiveItem}
        />
        <main className="flex min-w-0 flex-1 items-start justify-center p-5 sm:p-8 lg:p-10">
          {activeItem === "home" ? (
            <HomeScreen onSelect={setActiveItem} />
          ) : activeItem === "recently-resolved" ? (
            <ResolvedReportsScreen />
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
