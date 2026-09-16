import { useEffect, useState } from "react";
import { BedDouble, RefreshCw } from "lucide-react";

import { apiFetch } from "../../api/client";

type Room = {
  id: number;
  room_number: string;
  room_name: string;
  room_type: string;
  floor: number;
  capacity: number;
  status: string;
  is_active: boolean;
};

const STATUS_STYLES: Record<string, string> = {
  available: "bg-green-50 text-green-700",
  occupied: "bg-blue-50 text-blue-700",
  dirty: "bg-amber-50 text-amber-700",
  cleaning: "bg-purple-50 text-purple-700",
  maintenance: "bg-red-50 text-red-700",
  out_of_order: "bg-red-100 text-red-700",
};

export default function Rooms() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadRooms() {
    setLoading(true);
    setError("");

    try {
      setRooms(await apiFetch<Room[]>("/rooms"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load rooms.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRooms();
  }, []);

  return (
    <section className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Rooms</h1>
          <p className="mt-1 text-sm text-gray-500">
            Current room availability and housekeeping status.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadRooms()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
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

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {rooms.map((room) => (
          <div key={room.id} className="rounded-xl border bg-white p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-gray-100 p-2">
                  <BedDouble size={20} />
                </div>

                <div>
                  <div className="font-semibold">{room.room_number}</div>
                  <div className="text-sm text-gray-500">{room.room_name}</div>
                </div>
              </div>

              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${STATUS_STYLES[room.status] ?? "bg-gray-100 text-gray-600"}`}
              >
                {room.status.replace("_", " ")}
              </span>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3 border-t pt-4 text-sm">
              <div>
                <div className="text-xs text-gray-500">Type</div>
                <div className="mt-1">{room.room_type}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Floor</div>
                <div className="mt-1">{room.floor}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Capacity</div>
                <div className="mt-1">{room.capacity}</div>
              </div>
            </div>
          </div>
        ))}

        {!loading && rooms.length === 0 && (
          <div className="rounded-xl border bg-white p-10 text-center text-sm text-gray-500 sm:col-span-2 xl:col-span-3">
            No rooms found.
          </div>
        )}
      </div>
    </section>
  );
}
