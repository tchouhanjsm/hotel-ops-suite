import { useState } from "react";
import type { FormEvent } from "react";
import { ArrowRight, CalendarCheck2, KeyRound, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../auth/useAuth";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      await login(username, password);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[var(--hos-bg)]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 -top-24 h-[34rem] w-[34rem] rounded-full bg-[#e8eeff]/75 blur-3xl" />
        <div className="absolute right-[-8rem] top-[-7rem] h-[34rem] w-[34rem] rounded-full bg-[#fff0e4]/65 blur-3xl" />
        <div className="absolute bottom-[-12rem] left-1/3 h-[30rem] w-[30rem] rounded-full bg-[#f2ecff]/70 blur-3xl" />
      </div>

      <img
        src="/jaisalmer-fort-landscape.svg"
        alt=""
        aria-hidden="true"
        className="hos-fort-art pointer-events-none absolute bottom-0 left-0 h-64 w-[58%] -translate-x-8 object-contain object-left-bottom opacity-[0.34] sm:h-80 lg:h-[28rem] lg:w-[54%]"
      />

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl items-center px-4 py-6 sm:px-8 lg:px-12">
        <div className="grid w-full overflow-hidden rounded-[32px] border border-white/80 bg-white/55 shadow-[0_30px_100px_rgba(37,46,77,0.10)] backdrop-blur-2xl lg:grid-cols-[1.15fr_.85fr]">
          <section className="relative hidden min-h-[700px] flex-col justify-between p-10 lg:flex xl:p-14">
            <div className="relative z-10">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff8eb] shadow-sm">
                  <img
                    src="/hotel-fort-mark.svg"
                    alt="Hotel Ops Suite"
                    className="h-10 w-10"
                  />
                </div>
                <div>
                  <div className="text-sm font-semibold text-[var(--hos-ink)]">
                    Hotel Ops Suite
                  </div>
                  <div className="text-xs text-[var(--hos-muted)]">
                    Garh Jaisal Haveli · Jaisalmer
                  </div>
                </div>
              </div>

              <div className="mt-20 max-w-xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/68 px-3 py-1.5 text-xs font-medium text-[var(--hos-lilac)] shadow-sm backdrop-blur">
                  <Sparkles size={14} />
                  Calm hotel operations
                </div>

                <h1 className="mt-6 text-5xl font-semibold leading-[1.04] tracking-[-0.06em] text-[var(--hos-ink)] xl:text-6xl">
                  Run the stay.
                  <br />
                  Shape the experience.
                </h1>

                <p className="mt-6 max-w-lg text-[15px] leading-7 text-[var(--hos-muted)]">
                  Bookings, rooms, guests, folios and payments in one clear
                  workspace, designed to keep the front desk moving.
                </p>

                <div className="mt-10 flex items-center gap-3">
                  <div className="font-[cursive] text-2xl italic text-[var(--hos-brand-dark)]">
                    Heritage hospitality, simplified.
                  </div>
                  <div className="hidden h-px w-16 bg-[var(--hos-brand)]/40 sm:block" />
                </div>
              </div>
            </div>

            <div className="relative z-10 grid max-w-2xl grid-cols-3 gap-3">
              <div className="rounded-2xl border border-white/80 bg-white/66 p-4 shadow-sm backdrop-blur-xl">
                <CalendarCheck2 size={18} className="text-[var(--hos-blue)]" />
                <div className="mt-4 text-sm font-semibold text-[var(--hos-ink)]">
                  Bookings
                </div>
                <div className="mt-1 text-xs leading-5 text-[var(--hos-muted)]">
                  Arrivals and stays.
                </div>
              </div>

              <div className="rounded-2xl border border-white/80 bg-white/66 p-4 shadow-sm backdrop-blur-xl">
                <Sparkles size={18} className="text-[var(--hos-lilac)]" />
                <div className="mt-4 text-sm font-semibold text-[var(--hos-ink)]">
                  One workspace
                </div>
                <div className="mt-1 text-xs leading-5 text-[var(--hos-muted)]">
                  Clear, connected workflows.
                </div>
              </div>

              <div className="rounded-2xl border border-white/80 bg-white/66 p-4 shadow-sm backdrop-blur-xl">
                <KeyRound size={18} className="text-[var(--hos-mint)]" />
                <div className="mt-4 text-sm font-semibold text-[var(--hos-ink)]">
                  Secure access
                </div>
                <div className="mt-1 text-xs leading-5 text-[var(--hos-muted)]">
                  Role-aware operations.
                </div>
              </div>
            </div>
          </section>

          <section className="flex items-center bg-white/58 p-5 sm:p-9 lg:p-11">
            <Card
              solid
              className="w-full border-white/90 bg-white/80 p-7 shadow-[0_20px_55px_rgba(37,46,77,0.08)] sm:p-9"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#f5f0ff] to-[#edf4ff] text-[var(--hos-lilac)]">
                <KeyRound size={19} />
              </div>

              <h2 className="mt-7 text-2xl font-semibold tracking-[-0.035em] text-[var(--hos-ink)]">
                Welcome back
              </h2>

              <p className="mt-1 text-sm text-[var(--hos-muted)]">
                Sign in to your hotel workspace.
              </p>

              <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-[var(--hos-text)]">
                    Username
                  </span>
                  <input
                    className="hos-search min-h-12 w-full rounded-xl px-4 text-sm outline-none"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    placeholder="Enter your username"
                    autoComplete="username"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-[var(--hos-text)]">
                    Password
                  </span>
                  <input
                    className="hos-search min-h-12 w-full rounded-xl px-4 text-sm outline-none"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                  />
                </label>

                {error && (
                  <div
                    role="alert"
                    className="rounded-xl border border-[var(--hos-red)]/15 bg-[var(--hos-red-soft)] p-3 text-sm text-[var(--hos-red)]"
                  >
                    {error}
                  </div>
                )}

                <Button type="submit" className="mt-2 w-full" disabled={loading}>
                  {loading ? "Signing in..." : "Sign in"}
                  {!loading && <ArrowRight size={16} />}
                </Button>
              </form>

              <div className="mt-6 rounded-2xl border border-[#eeeafb] bg-gradient-to-br from-[#faf8ff] to-[#f6f9ff] p-4">
                <div className="flex items-start gap-3">
                  <Sparkles
                    size={17}
                    className="mt-0.5 shrink-0 text-[var(--hos-lilac)]"
                  />
                  <div>
                    <div className="text-xs font-semibold text-[var(--hos-ink)]">
                      Built for calm operations
                    </div>
                    <div className="mt-1 text-xs leading-5 text-[var(--hos-muted)]">
                      Keep the front desk focused on the guest, not the
                      software.
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </section>
        </div>
      </div>
    </main>
  );
}