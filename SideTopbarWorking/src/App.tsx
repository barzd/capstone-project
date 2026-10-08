import { useState } from "react";

const assetPathPrefix = "/assets";
const imgHomeIcon = `${assetPathPrefix}/6c43b.svg`;
const imgMapPinCheck = `${assetPathPrefix}/3ce53.svg`;
const imgMapPinCheck1 = `${assetPathPrefix}/64aaa.svg`;
const imgPackageCheck = `${assetPathPrefix}/c05e7.svg`;
const imgListFilter = `${assetPathPrefix}/b8859.svg`;
const imgMapPin = `${assetPathPrefix}/8aaa7.svg`;
const imgHistory = `${assetPathPrefix}/09af2.svg`;
const imgBellRing = `${assetPathPrefix}/39ed8.svg`;
const imgBookmark = `${assetPathPrefix}/18d19.svg`;
const imgMessageCircle = `${assetPathPrefix}/611f4.svg`;
const imgCircleHelp = `${assetPathPrefix}/a0603.svg`;
const imgCircleX = `${assetPathPrefix}/85624.svg`;

type NavItem = {
  id: string;
  label: string;
  icon: string;
  badge?: number;
};

type Section = {
  id: string;
  title: string;
  items: NavItem[];
};

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
      { id: "notifications", label: "Notifications", icon: imgBellRing, badge: 0 },
      { id: "bookmark-item", label: "Bookmark Item", icon: imgBookmark },
      { id: "staff-chat", label: "Staff Chat", icon: imgMessageCircle, badge: 0 },
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
];

const pageTitles: Record<string, string> = {
  "report-lost": "Report Lost Item",
  "report-found": "Report Found Item",
  ...Object.fromEntries(sections.flatMap((section) => section.items.map((item) => [item.id, item.label]))),
};

function TopBar({ onHome }: { onHome: () => void }) {
  return (
    <header className="shrink-0 bg-white" data-node-id="18:9">
      <div className="h-[5px] bg-[#006747]" data-node-id="18:10" />
      <div
        className="flex h-[72px] items-center gap-5 px-5 sm:px-10"
        data-node-id="18:11"
      >
        <button
          aria-label="Go to report list"
          className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md transition-colors hover:bg-[#f0f7f4] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006747]"
          onClick={onHome}
          type="button"
        >
          <img alt="" className="size-7" src={imgHomeIcon} />
        </button>

        <div
          className="flex min-w-0 flex-1 items-center justify-center gap-5"
          data-node-id="18:14"
        >
          <div className="min-w-0 text-center md:w-[520px]" data-node-id="18:15">
            <p className="truncate font-['Outfit:Bold'] text-[22px] leading-[1.1] font-bold text-black sm:text-[26px] md:text-[30px]">
              Farmingdale State College
            </p>
            <p className="mt-0.5 hidden font-['Inter:Semi_Bold'] text-[11px] leading-[1.2] font-semibold whitespace-nowrap text-[#006747] uppercase sm:block">
              State University of New York
            </p>
          </div>
          <div className="hidden h-9 w-px shrink-0 bg-[#babfbc] sm:block" data-node-id="18:18" />
          <p className="hidden w-[240px] font-['Outfit:Bold'] text-[28px] leading-[1.1] font-bold text-[#006747] md:block lg:w-[320px] lg:text-[34px]">
            Lost &amp; Found
          </p>
        </div>

        <div className="size-8 shrink-0" aria-hidden="true" data-node-id="18:20" />
      </div>
      <div className="h-px bg-[#d7dfda]" data-node-id="18:21" />
    </header>
  );
}

function Sidebar({
  activeItem,
  onSelect,
}: {
  activeItem: string;
  onSelect: (id: string) => void;
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
            className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-[#86efac] bg-[#f0fdf4] p-3.5 transition-colors hover:bg-[#dcfce7]"
            onClick={() => onSelect("report-found")}
            type="button"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[rgba(22,163,74,0.13)]">
              <img alt="" className="size-[18px]" src={imgPackageCheck} />
            </span>
            <span className="flex-1 text-left font-['Figtree:SemiBold'] text-[14px] leading-normal font-semibold text-[#0f172a]">
              Report Found Item
            </span>
          </button>
        </div>

        <nav aria-label="Lost and found navigation" className="grid w-full gap-5 sm:grid-cols-3 md:grid-cols-1">
          {sections.map((section) => (
            <div key={section.id} className="flex w-full flex-col gap-1">
              <div className="px-3 pb-1">
                <p className="font-['Figtree:Bold'] text-[11px] leading-normal font-bold text-[#94a3b8] uppercase">
                  {section.title}
                </p>
              </div>
              {section.items.map((item) => {
                const isActive = activeItem === item.id;
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
                    <img alt="" className="size-[18px] shrink-0" src={item.icon} />
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
                );
              })}
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
}

export default function App() {
  const [activeItem, setActiveItem] = useState("report-list");

  return (
    <div className="flex min-h-screen flex-col bg-[#f8faf9]">
      <TopBar onHome={() => setActiveItem("report-list")} />
      <div className="flex flex-1 flex-col md:flex-row">
        <Sidebar activeItem={activeItem} onSelect={setActiveItem} />
        <main className="flex min-w-0 flex-1 items-start justify-center p-6 sm:p-10">
          <section className="w-full max-w-4xl rounded-2xl border border-[#d7dfda] bg-white p-6 shadow-sm sm:p-8">
            <p className="font-['Figtree:Bold'] text-[11px] font-bold tracking-[0.12em] text-[#006747] uppercase">
              FSC Lost &amp; Found
            </p>
            <p className="mt-2 font-['Outfit:Bold'] text-3xl leading-tight font-bold text-[#0f172a]">
              {pageTitles[activeItem]}
            </p>
            <p className="mt-3 max-w-2xl font-['Figtree:Medium'] text-sm leading-6 font-medium text-[#64748b]">
              This area is ready for the {pageTitles[activeItem].toLowerCase()} workflow to be connected to your Django REST API.
            </p>
          </section>
        </main>
      </div>
    </div>
  );
}
