import { useState } from "react";

const assetPathPrefix = "/assets";
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

export default function App() {
  const [activeItem, setActiveItem] = useState<string>("report-list");

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-8">
      <div
        className="bg-white border border-[#d1fae5] flex flex-col gap-7 px-4 py-6 rounded-2xl w-[280px]"
        data-node-id="1:3"
      >
        {/* Logo */}
        <div className="flex gap-2.5 items-center pl-2">
          <div
            className="flex flex-col items-center justify-center rounded-[10px] shrink-0 size-9"
            style={{
              backgroundImage:
                "linear-gradient(90deg, rgba(0,100,86,0.2) 0%, rgba(0,100,86,0.2) 100%), linear-gradient(90deg, rgb(0,100,86) 0%, rgb(0,100,86) 100%)",
            }}
          >
            <div className="relative size-5">
              <img alt="" className="absolute inset-0 size-full" src={imgMapPinCheck} />
            </div>
          </div>
          <div className="flex flex-col gap-px">
            <p className="font-['Figtree:ExtraBold'] font-extrabold text-[#006456] text-[18px] leading-normal">
              FSC Lost &amp; Found
            </p>
            <p className="font-['Figtree:Medium'] font-medium text-[#0f172a] text-[11px] leading-normal">
              Farmingdale State College
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 w-full">
          <button
            onClick={() => setActiveItem("report-lost")}
            className="bg-[#006456] border border-black drop-shadow-[0px_4px_6px_rgba(22,163,74,0.2)] flex gap-3 items-center p-3.5 rounded-xl w-full cursor-pointer hover:bg-[#005548] transition-colors"
          >
            <div className="bg-white/20 flex flex-col items-center justify-center rounded-lg shrink-0 size-9">
              <div className="relative size-[18px]">
                <img alt="" className="absolute inset-0 size-full" src={imgMapPinCheck1} />
              </div>
            </div>
            <p className="font-['Figtree:SemiBold'] font-semibold text-[14px] text-white leading-normal text-left flex-1">
              Report Lost Item
            </p>
          </button>

          <button
            onClick={() => setActiveItem("report-found")}
            className="bg-[#f0fdf4] border border-[#86efac] flex gap-3 items-center p-3.5 rounded-xl w-full cursor-pointer hover:bg-[#dcfce7] transition-colors"
          >
            <div className="bg-[rgba(22,163,74,0.13)] flex flex-col items-center justify-center rounded-lg shrink-0 size-9">
              <div className="relative size-[18px]">
                <img alt="" className="absolute inset-0 size-full" src={imgPackageCheck} />
              </div>
            </div>
            <p className="font-['Figtree:SemiBold'] font-semibold text-[#0f172a] text-[14px] leading-normal text-left flex-1">
              Report Found Item
            </p>
          </button>
        </div>

        {/* Navigation */}
        <div className="flex flex-col gap-5 w-full">
          {sections.map((section) => (
            <div key={section.id} className="flex flex-col gap-1 w-full">
              <div className="px-3 pb-1">
                <p className="font-['Figtree:Bold'] font-bold text-[#94a3b8] text-[11px] uppercase leading-normal">
                  {section.title}
                </p>
              </div>
              {section.items.map((item) => {
                const isActive = activeItem === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveItem(item.id)}
                    className={`flex gap-3 h-10 items-center px-3 rounded-lg w-full cursor-pointer transition-colors ${
                      isActive
                        ? "bg-[#f0fdf4]"
                        : "bg-white hover:bg-gray-50"
                    }`}
                  >
                    <div className="relative shrink-0 size-[18px]">
                      <img alt="" className="absolute inset-0 size-full" src={item.icon} />
                    </div>
                    <p
                      className={`flex-1 text-left leading-normal text-[14px] ${
                        isActive
                          ? "font-['Figtree:SemiBold'] font-semibold text-[#2d3445]"
                          : "font-['Figtree:Medium'] font-medium text-[#0f172a]"
                      }`}
                    >
                      {item.label}
                    </p>
                    {item.badge !== undefined && (
                      <div className="bg-[#e2e8f0] flex items-center justify-center px-1.5 py-0.5 rounded-[10px] shrink-0">
                        <p className="font-['Figtree:SemiBold'] font-semibold text-[#475569] text-[11px] whitespace-nowrap leading-normal">
                          {item.badge}
                        </p>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
