import { Route, MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { OptimizeButton } from "@/components/admin/AdminButtons";

export const dynamic = "force-dynamic";

export default async function Dispatch() {
  const me = await getSessionUser();
  if (!me?.roles.includes("admin") && !me?.roles.includes("support")) {
    return <main className="px-5 pt-12"><p className="text-ink-500">Enable admin access on the Overview tab.</p></main>;
  }
  const supabase = await createClient();

  const { data: routes } = await supabase
    .from("routes")
    .select("id,status,total_distance_miles,optimization_provider,created_at,shopper_id")
    .order("created_at", { ascending: false })
    .limit(20);

  const { data: stops } = await supabase.from("route_stops").select("route_id,stop_type");
  const stopCount = new Map<string, number>();
  (stops ?? []).forEach((s: any) => stopCount.set(s.route_id, (stopCount.get(s.route_id) ?? 0) + 1));

  return (
    <main className="px-5 pt-12 pb-28 space-y-5">
      <h1 className="text-2xl font-bold text-ink-900 flex items-center gap-2">
        <Route size={22} className="text-brand-600" /> Dispatch
      </h1>

      <div className="card p-4">
        <p className="text-sm text-ink-500 mb-3">
          Batch all vendor-confirmed orders into an optimized multi-stop route. Uses Google Directions
          when a Maps key is configured, otherwise a nearest-neighbor solver.
        </p>
        <OptimizeButton />
      </div>

      <section>
        <h2 className="font-semibold text-ink-900 mb-3">Routes</h2>
        {(!routes || routes.length === 0) && <p className="text-sm text-ink-400">No routes yet. Optimize to create one.</p>}
        <div className="space-y-3">
          {(routes ?? []).map((r: any) => (
            <div key={r.id} className="card p-4">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-ink-900 capitalize">{r.status}</span>
                <span className="chip bg-brand-50 text-brand-700">{r.optimization_provider}</span>
              </div>
              <p className="text-sm text-ink-500 mt-1 flex items-center gap-1">
                <MapPin size={13} /> {stopCount.get(r.id) ?? 0} stops
                {r.total_distance_miles ? ` · ${r.total_distance_miles} mi` : ""}
                {r.shopper_id ? " · assigned" : " · unassigned"}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
