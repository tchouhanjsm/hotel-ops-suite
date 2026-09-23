import { useState } from "react";
import type { FormEvent } from "react";
import {
  ArrowRight,
  BedDouble,
  CalendarCheck2,
  LockKeyhole,
  Sparkles,
} from "lucide-react";
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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--hos-bg)] p-4 sm:p-6">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 -top-28 h-96 w-96 rounded-full bg-[#e8eeff]/80 blur-3xl" />
        <div className="absolute -right-20 top-12 h-80 w-80 rounded-full bg-[#fff0e4]/75 blur-3xl" />
        <div className="absolute bottom-[-12rem] left-1/3 h-96 w-96 rounded-full bg-[#f2ecff]/70 blur-3xl" />
      </div>

      <div className="relative grid w-full max-w-6xl overflow-hidden rounded-[28px] border border-white/80 bg-white/62 shadow-[0_28px_90px_rgba(37,46,77,0.11)] backdrop-blur-2xl lg:grid-cols-[1.08fr_.92fr]">
        <section className="relative hidden min-h-[640px] overflow-hidden p-10 lg:flex lg:flex-col lg:justify-between xl:p-12">
          <div>
            <div className="flex items-center gap-3">
              <div className="hos-logo flex h-12 w-12 items-center justify-center rounded-2xl p-2">
                <img
                  src="/hotel-fort-mark.svg"
                  alt="Hotel Ops Suite"
                  className="h-full w-full rounded-xl"
                />
              </div>

              <div>
                <div className="text-sm font-semibold text-[var(--hos-ink)]">
                  Hotel Ops Suite
                </div>
                <div className="text-xs text-[var(--hos-muted)]">
                  Hotel operations, simplified.
                </div>
              </div>
            </div>

            <div className="mt-14 max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/72 px-3 py-1.5 text-xs font-medium text-[var(--hos-lilac)] shadow-sm backdrop-blur">
                <Sparkles size={14} />
                Calm hotel operations
              </div>

              <h1 className="mt-5 text-5xl font-semibold leading-[1.02] tracking-[-0.055em] text-[var(--hos-ink)] xl:text-6xl">
                Run the stay.
                <br />
                Shape the experience.
              </h1>

              <p className="mt-6 max-w-lg text-[15px] leading-7 text-[var(--hos-muted)]">
                One workspace for bookings, rooms, guests, folios, payments
                and the decisions that keep the day moving.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-white/80 bg-white/66 p-4 shadow-sm backdrop-blur-xl">
              <CalendarCheck2
                size={18}
                className="text-[var(--hos-blue)]"
              />
              <div className="mt-5 text-lg font-semibold text-[var(--hos-ink)]">
                Bookings
              </div>
              <div className="mt-1 text-xs leading-5 text-[var(--hos-muted)]">
                Arrivals and departures in one place.
              </div>
            </div>

            <div className="rounded-2xl border border-white/80 bg-white/66 p-4 shadow-sm backdrop-blur-xl">
              <BedDouble size={18} className="text-[var(--hos-mint)]" />
              <div className="mt-5 text-lg font-semibold text-[var(--hos-ink)]">
                Rooms
              </div>
              <div className="mt-1 text-xs leading-5 text-[var(--hos-muted)]">
                See what needs attention.
              </div>
            </div>

            <div className="rounded-2xl border border-white/80 bg-white/66 p-4 shadow-sm backdrop-blur-xl">
              <Sparkles size={18} className="text-[var(--hos-lilac)]" />
              <div className="mt-5 text-lg font-semibold text-[var(--hos-ink)]">
                AI-ready
              </div>
              <div className="mt-1 text-xs leading-5 text-[var(--hos-muted)]">
                A future-ready operations assistant.
              </div>
            </div>
          </div>
        </section>

        <section className="flex items-center bg-white/52 p-5 sm:p-8 lg:p-10">
          <Card
            solid
            className="w-full border-white/90 bg-white/78 p-7 shadow-[0_18px_48px_rgba(37,46,77,0.07)] backdrop-blur-xl sm:p-9"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#f6f0ff] to-[#edf4ff] text-[var(--hos-lilac)]">
              <LockKeyhole size={19} />
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
                <Sparkles size={17} className="mt-0.5 shrink-0 text-[var(--hos-lilac)]" />
                <div>
                  <div className="text-xs font-semibold text-[var(--hos-ink)]">
                    Built for calm operations
                  </div>
                  <div className="mt-1 text-xs leading-5 text-[var(--hos-muted)]">
                    Keep the front desk focused on the guest, not the software.
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </section>
      </div>
    </main>
  );
}
