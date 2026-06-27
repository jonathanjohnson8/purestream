"use client";

import { useEffect, useState } from "react";
import { APIProvider, Map, AdvancedMarker, Pin } from "@vis.gl/react-google-maps";
import { Navigation, MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  shopperId: string | null;
  initialShopper: { lat: number; lng: number } | null;
  destination: { lat: number; lng: number } | null;
  vendor: { lat: number; lng: number } | null;
}

export function LiveMap({ shopperId, initialShopper, destination, vendor }: Props) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const [pos, setPos] = useState(initialShopper);

  // Subscribe to shopper location updates over Supabase Realtime.
  useEffect(() => {
    if (!shopperId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`shopper-loc-${shopperId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "shoppers", filter: `id=eq.${shopperId}` },
        (payload: any) => {
          const r = payload.new;
          if (r.current_lat && r.current_lng) setPos({ lat: r.current_lat, lng: r.current_lng });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [shopperId]);

  const center = pos ?? destination ?? vendor ?? { lat: 30.2672, lng: -97.7431 };

  if (!apiKey) {
    return (
      <div className="card overflow-hidden">
        <div className="h-44 bg-brand-50 grid place-items-center relative">
          <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(circle at 30% 40%, #93c5fd 0, transparent 40%), radial-gradient(circle at 70% 60%, #60a5fa 0, transparent 35%)" }} />
          <div className="text-center z-10">
            <Navigation className="mx-auto text-brand-600 mb-1" size={28} />
            <p className="text-sm font-semibold text-brand-700">Live tracking</p>
            <p className="text-xs text-ink-500 px-6 mt-1">Add a Google Maps API key to enable the live map.</p>
          </div>
        </div>
        <div className="p-3 flex items-center gap-2 text-xs text-ink-500">
          <MapPin size={14} className="text-brand-600" /> Driver near {center.lat.toFixed(3)}, {center.lng.toFixed(3)}
        </div>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="h-56">
        <APIProvider apiKey={apiKey}>
          <Map
            defaultCenter={center}
            defaultZoom={13}
            mapId="purestream"
            disableDefaultUI
            gestureHandling="greedy"
          >
            {vendor && (
              <AdvancedMarker position={vendor}>
                <Pin background="#2563eb" borderColor="#1d4ed8" glyphColor="#fff" />
              </AdvancedMarker>
            )}
            {destination && (
              <AdvancedMarker position={destination}>
                <Pin background="#0d1b14" borderColor="#000" glyphColor="#fff" />
              </AdvancedMarker>
            )}
            {pos && (
              <AdvancedMarker position={pos}>
                <Pin background="#3b82f6" borderColor="#2563eb" glyphColor="#fff" />
              </AdvancedMarker>
            )}
          </Map>
        </APIProvider>
      </div>
    </div>
  );
}
