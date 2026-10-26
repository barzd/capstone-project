import { useState, type ReactNode } from "react"

type IconName = "arrow" | "search"

const iconPaths: Record<IconName, ReactNode> = {
  arrow: <path d="m9 18 6-6-6-6" />,
  search: <><circle cx="11" cy="11" r="7" /><path d="m16 16 4 4" /></>,
}

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
      width={size}
    >
      {iconPaths[name]}
    </svg>
  )
}

function Button({
  children,
  onClick,
  variant = "primary",
  type = "button",
}: {
  children: ReactNode
  onClick?: () => void
  variant?: "primary" | "secondary"
  type?: "button" | "submit"
}) {
  const variantClass =
    variant === "primary"
      ? "bg-[#006747] text-white shadow-sm hover:bg-[#00523a]"
      : "border border-[#006747]/25 bg-white text-[#006747] hover:bg-emerald-50"

  return (
    <button
      className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${variantClass}`}
      onClick={onClick}
      type={type}
    >
      {children}
    </button>
  )
}

function Logo() {
  return (
    <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#006747] text-white">
      <Icon name="search" />
    </div>
  )
}

export function Login({ onLogin }: { onLogin: () => void }) {
  const [registering, setRegistering] = useState(false)

  return (
    <main className="grid min-h-screen place-items-center bg-gradient-to-br from-[#0f172a] via-[#064e3b] to-[#006747] p-5">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center text-white">
          <Logo />
        </div>
        <section className="rounded-3xl bg-white p-7 shadow-2xl md:p-9">
          <div className="text-center">
            <p className="text-xs font-bold tracking-[0.14em] text-[#006747] uppercase">
              {registering ? "Join the community" : "Welcome to"}
            </p>
            <h1 className="mt-2 font-['Outfit'] text-3xl font-bold text-slate-950">
              {registering ? "Create your account" : "FSC Lost & Found"}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              {registering
                ? "Use your Farmingdale State College email"
                : "Sign in with your campus account"}
            </p>
          </div>

          <form
            className="mt-7 grid gap-4"
            key={registering ? "register" : "login"}
            onSubmit={(event) => {
              event.preventDefault()
              onLogin()
            }}
          >
            {registering && (
              <div className="grid grid-cols-2 gap-3">
                <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
                  First name
                  <input
                    autoComplete="given-name"
                    className="rounded-xl border border-slate-200 px-3.5 py-3 text-sm font-normal outline-none focus:border-[#006747] focus:ring-4 focus:ring-emerald-100"
                    placeholder="First name"
                    required
                  />
                </label>
                <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
                  Last name
                  <input
                    autoComplete="family-name"
                    className="rounded-xl border border-slate-200 px-3.5 py-3 text-sm font-normal outline-none focus:border-[#006747] focus:ring-4 focus:ring-emerald-100"
                    placeholder="Last name"
                    required
                  />
                </label>
              </div>
            )}

            <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
              Campus email
              <input
                autoComplete="email"
                className="rounded-xl border border-slate-200 px-3.5 py-3 text-sm font-normal outline-none focus:border-[#006747] focus:ring-4 focus:ring-emerald-100"
                placeholder="name@farmingdale.edu"
                required
                type="email"
              />
            </label>

            {registering && (
              <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
                RAM ID number
                <input
                  autoComplete="off"
                  className="rounded-xl border border-slate-200 px-3.5 py-3 text-sm font-normal uppercase outline-none focus:border-[#006747] focus:ring-4 focus:ring-emerald-100"
                  pattern="R[0-9]{8}"
                  placeholder="R12345678"
                  required
                  title="Enter R followed by 8 numbers"
                />
                <span className="text-[10px] font-normal text-slate-400">
                  Enter the R followed by 8 digits shown on your FSC ID.
                </span>
              </label>
            )}

            <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
              Password
              <input
                autoComplete={registering ? "new-password" : "current-password"}
                className="rounded-xl border border-slate-200 px-3.5 py-3 text-sm font-normal outline-none focus:border-[#006747] focus:ring-4 focus:ring-emerald-100"
                minLength={8}
                placeholder={registering ? "At least 8 characters" : "Your password"}
                required
                type="password"
              />
            </label>

            {registering ? (
              <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
                Confirm password
                <input
                  autoComplete="new-password"
                  className="rounded-xl border border-slate-200 px-3.5 py-3 text-sm font-normal outline-none focus:border-[#006747] focus:ring-4 focus:ring-emerald-100"
                  minLength={8}
                  placeholder="Enter your password again"
                  required
                  type="password"
                />
              </label>
            ) : (
              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 font-medium text-slate-600">
                  <input className="accent-emerald-700" type="checkbox" />
                  Remember me
                </label>
                <button className="font-semibold text-[#006747]" type="button">
                  Forgot password?
                </button>
              </div>
            )}

            {registering && (
              <label className="flex items-start gap-2 text-xs leading-5 text-slate-500">
                <input className="mt-1 accent-emerald-700" required type="checkbox" />
                <span>
                  I agree to the campus acceptable use and privacy policies.
                </span>
              </label>
            )}

            <Button type="submit">
              {registering ? "Create account" : "Sign in"}
              <Icon name="arrow" size={16} />
            </Button>
          </form>

          <div className="my-5 flex items-center gap-3 text-[10px] tracking-wider text-slate-400 uppercase">
            <span className="h-px flex-1 bg-slate-200" />or
            <span className="h-px flex-1 bg-slate-200" />
          </div>
          <Button
            onClick={() => setRegistering((current) => !current)}
            variant="secondary"
          >
            {registering ? "Back to sign in" : "Register for an account"}
          </Button>
          <p className="mt-6 text-center text-[11px] leading-5 text-slate-400">
            {registering
              ? "Registration is limited to active FSC community members."
              : "Authorized Farmingdale State College users only."}
            <br />
            Need help? Contact the Helpdesk.
          </p>
        </section>
      </div>
    </main>
  )
}