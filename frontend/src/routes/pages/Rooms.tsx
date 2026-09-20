import { useEffect, useState } from "react";
import { BedDouble, RefreshCw } from "lucide-react";

import { getRooms, type Room } from "../../api/bookings";
import Alert from "../../components/ui/Alert";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Loading from "../../components/ui/Loading";

const STATUS_VARIANTS: Record<
  string,
  "neutral" | "success" | "info" | "warning" | "error"
> = {
  available: "success",
  occupied: "info",
  dirty: "warning",
  cleaning: "neutral",
  maintenance: "error",
  out_of_order: "error",
};

export default function Rooms() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadRooms() {
    setLoading(true);
    setError("");

    try {
      setRooms(await getRooms());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load rooms.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    getRooms()
      .then((data) => {
        if (!cancelled) {
          setRooms(data);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Unable to load rooms.",
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

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Rooms</h1>
          <p className="mt-1 text-sm text-gray-500">
            Current room availability and housekeeping status.
          </p>
        </div>

        <Button
          variant="secondary"
          onClick={() => void loadRooms()}
          disabled={loading}
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </Button>
      </div>

      {error && <Alert>{error}</Alert>}

      {loading ? (
        <Card className="p-4">
          <Loading />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rooms.map((room) => (
            <Card key={room.id} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-base-200 p-2">
                    <BedDouble size={20} />
                  </div>

                  <div>
                    <div className="font-semibold">{room.room_number}</div>
                    <div className="text-sm text-gray-500">
                      {room.room_name}
                    </div>
                  </div>
                </div>

                <Badge variant={STATUS_VARIANTS[room.status] ?? "neutral"}>
                  {room.status.replace("_", " ")}
                </Badge>
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
            </Card>
          ))}

          {rooms.length === 0 && (
            <Card className="p-10 text-center text-sm text-gray-500 sm:col-span-2 xl:col-span-3">
              No rooms found.
            </Card>
          )}
        </div>
      )}
    </section>
  );
}
