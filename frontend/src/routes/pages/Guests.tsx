import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { RefreshCw, Search, UserRound } from "lucide-react";

import { getGuests, type Guest } from "../../api/guests";
import Alert from "../../components/ui/Alert";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Loading from "../../components/ui/Loading";

export default function Guests() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadGuests(searchQuery = search) {
    setLoading(true);
    setError("");

    try {
      const data = await getGuests(searchQuery);
      setGuests(data.filter((guest) => guest.is_active));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load guests.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    getGuests("")
      .then((data) => {
        if (!cancelled) {
          setGuests(data.filter((guest) => guest.is_active));
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Unable to load guests.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalized = query.trim();

    if (normalized.length === 1) {
      setError("Search must contain at least 2 characters.");
      return;
    }

    setSearch(normalized);
    void loadGuests(normalized);
  }

  function clearSearch() {
    setQuery("");
    setSearch("");
    void loadGuests("");
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Guests</h1>
          <p className="mt-1 text-sm text-gray-500">
            Guest profiles and contact information.
          </p>
        </div>

        <Button
          variant="secondary"
          onClick={() => void loadGuests()}
          disabled={loading}
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </Button>
      </div>

      <Card className="p-4">
        <form
          onSubmit={handleSearch}
          className="flex flex-col gap-3 sm:flex-row"
        >
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by guest name or phone"
              className="input input-bordered w-full pl-10"
            />
          </div>

          <Button type="submit">Search</Button>

          {search && (
            <Button type="button" variant="ghost" onClick={clearSearch}>
              Clear
            </Button>
          )}
        </form>
      </Card>

      {error && <Alert>{error}</Alert>}

      {loading ? (
        <Card className="p-4">
          <Loading />
        </Card>
      ) : guests.length === 0 ? (
        <Card className="p-10 text-center">
          <UserRound className="mx-auto text-gray-400" size={28} />
          <div className="mt-3 font-medium">No guests found</div>
          <div className="mt-1 text-sm text-gray-500">
            {search
              ? `No active guests matched "${search}".`
              : "There are no active guests yet."}
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Guest</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Location</th>
                </tr>
              </thead>

              <tbody>
                {guests.map((guest) => (
                  <tr key={guest.id}>
                    <td className="font-medium">
                      {guest.first_name} {guest.last_name}
                    </td>
                    <td>{guest.phone}</td>
                    <td>{guest.email || "—"}</td>
                    <td>
                      {[guest.city, guest.country].filter(Boolean).join(", ") ||
                        "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </section>
  );
}
