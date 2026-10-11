import "leaflet/dist/leaflet.css";
import { useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import { MapContainer, Marker, Polyline, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { LocateFixed } from "lucide-react";
import { MapLegend } from "@/components/FormControls";
import { NYC_CENTER, NYC_ZOOM } from "@/lib/geo";
import type { Place } from "@/types/api";

export interface TripMapProps {
  pickup: Place | null;
  dropoff: Place | null;
  /** [lat, lng] pairs */
  route: [number, number][] | null;
  clicksDisabled?: boolean;
  onMapClick: (lat: number, lon: number) => void;
  onMarkerDrag: (kind: "pickup" | "dropoff", lat: number, lon: number) => void;
}

const icon = (kind: "pickup" | "dropoff") =>
  L.divIcon({
    className: "",
    html: `<span class="map-pin map-pin--${kind}"></span>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });

function ClickHandler({ onClick, disabled }: { onClick: TripMapProps["onMapClick"]; disabled?: boolean | undefined }) {
  useMapEvents({
    click(e) {
      if (!disabled) onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  const key = points.map((p) => p.join(",")).join("|");
  useEffect(() => {
    if (points.length >= 2) map.fitBounds(L.latLngBounds(points), { padding: [48, 48], maxZoom: 15 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, map]);
  return null;
}

function Overlay() {
  const map = useMap();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) {
      L.DomEvent.disableClickPropagation(ref.current);
      L.DomEvent.disableScrollPropagation(ref.current);
    }
  }, []);
  return (
    <div ref={ref} className="pointer-events-none absolute inset-0 z-[1000]">
      <button
        type="button"
        onClick={() => map.setView(NYC_CENTER, NYC_ZOOM)}
        className="pointer-events-auto absolute right-3 top-3 flex items-center gap-2 rounded-md border bg-card px-3 py-2 text-small font-semibold shadow-lg hover:bg-secondary"
      >
        <LocateFixed className="size-4" aria-hidden /> Recenter on NYC
      </button>
      <div className="pointer-events-auto absolute bottom-6 left-3">
        <MapLegend />
      </div>
    </div>
  );
}

export default function TripMap({ pickup, dropoff, route, clicksDisabled, onMapClick, onMarkerDrag }: TripMapProps) {
  const pickupIcon = useMemo(() => icon("pickup"), []);
  const dropoffIcon = useMemo(() => icon("dropoff"), []);
  const straight: [number, number][] | null =
    pickup && dropoff ? [[pickup.lat, pickup.lon], [dropoff.lat, dropoff.lon]] : null;

  return (
    <MapContainer center={NYC_CENTER} zoom={NYC_ZOOM} className="size-full" zoomControl>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler onClick={onMapClick} disabled={clicksDisabled} />
      {route ? (
        <>
          <Polyline positions={route} pathOptions={{ color: "#1F2328", weight: 9, opacity: 0.9 }} />
          <Polyline positions={route} pathOptions={{ color: "#F7B500", weight: 5 }} />
        </>
      ) : (
        straight && <Polyline positions={straight} pathOptions={{ color: "#1F2328", weight: 3, dashArray: "6 8" }} />
      )}
      {pickup && (
        <Marker
          position={[pickup.lat, pickup.lon]}
          icon={pickupIcon}
          draggable={!clicksDisabled}
          title="Pickup"
          eventHandlers={{ dragend: (e) => { const ll = (e.target as L.Marker).getLatLng(); onMarkerDrag("pickup", ll.lat, ll.lng); } }}
        />
      )}
      {dropoff && (
        <Marker
          position={[dropoff.lat, dropoff.lon]}
          icon={dropoffIcon}
          draggable={!clicksDisabled}
          title="Dropoff"
          eventHandlers={{ dragend: (e) => { const ll = (e.target as L.Marker).getLatLng(); onMarkerDrag("dropoff", ll.lat, ll.lng); } }}
        />
      )}
      <FitBounds points={route ?? straight ?? []} />
      <Overlay />
    </MapContainer>
  );
}
