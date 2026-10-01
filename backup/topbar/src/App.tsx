const assetPathPrefix = "/assets";
const homeIcon = `${assetPathPrefix}/6c43b.svg`;

export default function App() {
  return (
    <header className="w-full bg-white">
      <div className="h-[5px] w-full bg-[#006747]" />
      <div className="flex h-[72px] w-full items-center gap-5 px-4 sm:px-10">
        <a
          href="/"
          aria-label="Home"
          className="shrink-0 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#006747]"
        >
          <img src={homeIcon} alt="" className="size-7" />
        </a>

        <div className="flex min-w-0 flex-1 items-center justify-center gap-3 sm:gap-5">
          <div className="flex min-w-0 flex-col items-center gap-0.5 text-center sm:w-[520px]">
            <p className="font-['Outfit:Bold'] text-[20px] leading-[1.1] font-bold text-black whitespace-nowrap sm:text-[30px]">
              Farmingdale State College
            </p>
            <p className="font-['Inter:Semi_Bold'] text-[8px] leading-[1.2] font-semibold text-[#006747] uppercase whitespace-nowrap sm:text-[11px]">
              State University of New York
            </p>
          </div>
          <div className="h-9 w-px shrink-0 bg-[#babfbc]" />
          <p className="font-['Outfit:Bold'] text-center text-[23px] leading-[1.1] font-bold text-[#006747] whitespace-nowrap sm:w-[320px] sm:text-[34px]">
            Lost &amp; Found
          </p>
        </div>

        <div aria-hidden="true" className="hidden size-7 shrink-0 sm:block" />
      </div>
      <div className="h-px w-full bg-[#d7dfda]" />
    </header>
  );
}
