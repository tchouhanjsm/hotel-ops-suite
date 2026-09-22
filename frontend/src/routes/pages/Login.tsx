import { useState } from "react";
import type { FormEvent } from "react";
import { ArrowRight, LockKeyhole } from "lucide-react";
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
    <main className="hos-app-bg relative flex min-h-screen items-center justify-center overflow-hidden p-6">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[#f4e6d1]/70 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-[#e8edf9]/70 blur-3xl" />
      </div>

      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-[28px] border border-white/70 bg-white/65 shadow-[0_24px_80px_rgba(20,32,51,0.10)] backdrop-blur-xl lg:grid-cols-[1.05fr_.95fr]">
        <div className="hidden min-h-[620px] flex-col justify-between bg-gradient-to-br from-[#17212d] via-[#29443e] to-[#8f672f] p-10 text-white lg:flex">
          <div>
            <img
              src="/hotel-fort-mark.svg"
              alt="Hotel Ops Suite"
              className="h-14 w-14"
            />

            <div className="mt-10 max-w-md">
              <p className="text-sm font-medium text-white/65">
                Hotel Operations Platform
              </p>

              <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-[-0.04em]">
                Run the stay.
                <br />
                Shape the experience.
              </h1>

              <p className="mt-5 max-w-sm text-sm leading-6 text-white/70">
                A calm workspace for bookings, rooms, guests, folios and
                payments.
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur-sm">
            <div className="text-xs uppercase tracking-[0.16em] text-white/50">
              Garh Jaisal Haveli
            </div>
            <div className="mt-2 text-sm text-white/75">
              Jaisalmer · Rajasthan
            </div>
          </div>
        </div>

        <div className="flex items-center p-7 sm:p-10">
          <Card
            solid
            className="w-full border-0 bg-white/80 p-7 shadow-none sm:p-9"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--hos-brand-soft)] text-[var(--hos-brand-dark)]">
              <LockKeyhole size={19} />
            </div>

            <h2 className="mt-7 text-2xl font-semibold tracking-tight text-[var(--hos-ink)]">
              Welcome back
            </h2>

            <p className="mt-1 text-sm text-[var(--hos-muted)]">
              Sign in to Hotel Ops Suite.
            </p>

            <form onSubmit={handleSubmit} className="mt-7 space-y-4">
              <input
                className="hos-search min-h-12 w-full rounded-xl px-4 text-sm outline-none"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Username"
                autoComplete="username"
              />

              <input
                className="hos-search min-h-12 w-full rounded-xl px-4 text-sm outline-none"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Password"
                autoComplete="current-password"
              />

              {error && (
                <div className="rounded-xl border border-[var(--hos-red)]/15 bg-[var(--hos-red-soft)] p-3 text-sm text-[var(--hos-red)]">
                  {error}
                </div>
              )}

              <Button type="submit" className="mt-2 w-full" disabled={loading}>
                {loading ? "Signing in..." : "Sign in"}
                {!loading && <ArrowRight size={16} />}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </main>
  );
}
