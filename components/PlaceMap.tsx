"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { Place } from "@/lib/types";
import "leaflet/dist/leaflet.css";

// react-leaflet uses window — must lazy-load with ssr:false.
const MapContainer = dynamic(() => import("react-leaflet").then((m) => m.MapContainer), { ssr: false });
const TileLayer    = dynamic(() => import("react-leaflet").then((m) => m.TileLayer),    { ssr: false });
const Marker       = dynamic(() => import("react-leaflet").then((m) => m.Marker),       { ssr: false });
const Popup        = dynamic(() => import("react-leaflet").then((m) => m.Popup),        { ssr: false });

type Props = {
  places: Place[];        // pre-filtered list — caller decides scope
  lang: string;
  height?: number;        // px, default 480
};

export default function PlaceMap({ places, lang, height = 480 }: Props) {
  const [icon, setIcon] = useState<unknown>(null);
  const [loaded, setLoaded] = useState(false);

  // Default Leaflet markers point to a missing image asset under bundlers
  // — replace with a tiny SVG-data URI so we don't ship asset files.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      const pinSvg = `<svg xmlns='http://www.w3.org/2000/svg' width='28' height='40' viewBox='0 0 28 40'><path d='M14 0C6.3 0 0 6.3 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.3 21.7 0 14 0z' fill='%2310b981'/><circle cx='14' cy='14' r='6' fill='white'/></svg>`;
      const ic = L.icon({
        iconUrl: `data:image/svg+xml;utf8,${pinSvg}`,
        iconSize: [28, 40],
        iconAnchor: [14, 40],
        popupAnchor: [0, -36],
      });
      if (!cancelled) { setIcon(ic); setLoaded(true); }
    })();
    return () => { cancelled = true; };
  }, []);

  const mapped = places.filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));
  if (mapped.length === 0) {
    return (
      <div
        className="grid place-items-center rounded-2xl border border-dashed border-ink-200 bg-ink-50 p-8 text-sm muted dark:border-ink-700 dark:bg-ink-900"
        style={{ height }}
      >
        No mapped venues yet — coordinates are missing for this set.
      </div>
    );
  }

  // Center on average of all markers
  const avgLat = mapped.reduce((s, p) => s + p.lat!, 0) / mapped.length;
  const avgLng = mapped.reduce((s, p) => s + p.lng!, 0) / mapped.length;

  if (!loaded || !icon) {
    return (
      <div
        className="grid place-items-center rounded-2xl bg-ink-50 text-xs muted dark:bg-ink-900"
        style={{ height }}
      >
        Loading map…
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-ink-100 dark:border-ink-800" style={{ height }}>
      <MapContainer center={[avgLat, avgLng]} zoom={12} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {mapped.map((p) => (
          <Marker key={p.id} position={[p.lat!, p.lng!]} icon={icon as unknown as never}>
            <Popup>
              <div className="min-w-[180px] text-[12px] leading-tight">
                <a href={`/${lang}/place/${p.slug}/`} className="font-bold text-emerald-700 hover:underline">
                  {p.name}
                </a>
                <div className="mt-1 text-[10px] text-gray-600">
                  {p.rating != null && <>★ {p.rating.toFixed(1)} · </>}
                  {p.city && <>{p.city} · </>}
                  Trust {p.trust_score}
                </div>
                {p.price_min_thb > 0 && (
                  <div className="mt-1 text-[11px] font-bold text-emerald-700">
                    ฿{p.price_min_thb.toLocaleString()}
                    {p.price_max_thb > p.price_min_thb ? `–${p.price_max_thb.toLocaleString()}` : ""}
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
