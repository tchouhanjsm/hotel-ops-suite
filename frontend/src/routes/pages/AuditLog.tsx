import { useEffect, useMemo, useState } from "react";
import { RefreshCw, Search } from "lucide-react";

import { getAuditLogs, type AuditLog as AuditEntry } from "../../api/audit";

export default function AuditLog() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadLogs() {
    setLoading(true);
    setError("");

    try {
      setLogs(await getAuditLogs());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load audit log.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadLogs();
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return logs;
    }

    return logs.filter((log) =>
      [
        log.staff_username,
        log.staff_name,
        log.action,
        log.entity_type,
        String(log.entity_id ?? ""),
      ]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [logs, search]);

  return (
    <section className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Audit Log</h1>
          <p className="mt-1 text-sm text-gray-500">
            Track who performed operational actions and when.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadLogs()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-xl border bg-white p-4">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search staff, action, entity..."
            className="w-full rounded-lg border py-2.5 pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-gray-100"
          />
        </div>

        <div className="mt-3 text-xs text-gray-500">
          Showing {filtered.length} of {logs.length} events
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px] text-left text-sm">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-5 py-3">Time</th>
                <th className="px-5 py-3">Staff</th>
                <th className="px-5 py-3">Action</th>
                <th className="px-5 py-3">Entity</th>
                <th className="px-5 py-3">Details</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((log) => (
                <tr key={log.id} className="border-b last:border-0">
                  <td className="whitespace-nowrap px-5 py-4 text-gray-600">
                    {new Date(log.created_at).toLocaleString("en-IN")}
                  </td>

                  <td className="px-5 py-4">
                    <div className="font-medium">{log.staff_name}</div>
                    <div className="text-xs text-gray-500">
                      {log.staff_username}
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium">
                      {log.action.replaceAll("_", " ")}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    {log.entity_type}
                    {log.entity_id !== null ? ` #${log.entity_id}` : ""}
                  </td>

                  <td className="max-w-md px-5 py-4 text-xs text-gray-500">
                    <pre className="whitespace-pre-wrap break-words font-sans">
                      {log.details ? JSON.stringify(log.details) : "—"}
                    </pre>
                  </td>
                </tr>
              ))}

              {!loading && filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-12 text-center text-sm text-gray-500"
                  >
                    No audit events found.
                  </td>
                </tr>
              )}

              {loading && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-12 text-center text-sm text-gray-500"
                  >
                    Loading audit log...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
