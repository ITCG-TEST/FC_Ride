import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const FIVE_MIN = 5 * 60 * 1000;
const THIRTY_MIN = 30 * 60 * 1000;

function statusColor(recordedAt) {
  const age = Date.now() - new Date(recordedAt).getTime();
  if (age < FIVE_MIN) return "#10b981"; // live
  if (age < THIRTY_MIN) return "#f59e0b"; // stale
  return "#ef4444"; // likely out of range
}

export default function LiveMap({ riders, trail, selectedId, onSelectRider, height = 420 }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersLayerRef = useRef(null);
  const trailLayerRef = useRef(null);
  const hasFitOnceRef = useRef(false);

  useEffect(() => {
    const map = L.map(containerRef.current, { attributionControl: false });
    map.setView([20.5937, 78.9629], 5);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);
    markersLayerRef.current = L.layerGroup().addTo(map);
    trailLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layer = markersLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();
    const trackedRiders = riders.filter((r) => r.lat != null && r.lng != null);
    if (trackedRiders.length === 0) return;

    const bounds = [];
    for (const r of trackedRiders) {
      const color = statusColor(r.recordedAt);
      const isSelected = r.riderId === selectedId;
      const marker = L.circleMarker([r.lat, r.lng], {
        radius: isSelected ? 10 : 7,
        color: "#0f172a",
        weight: isSelected ? 3 : 2,
        fillColor: color,
        fillOpacity: 1,
      }).addTo(layer);
      marker.bindTooltip(`#${r.bibNumber ?? "?"} ${r.name}`, { direction: "top" });
      marker.on("click", () => onSelectRider?.(r.riderId));
      bounds.push([r.lat, r.lng]);
    }

    if (!hasFitOnceRef.current && bounds.length > 0) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
      hasFitOnceRef.current = true;
    }
  }, [riders, selectedId, onSelectRider]);

  useEffect(() => {
    const layer = trailLayerRef.current;
    if (!layer) return;
    layer.clearLayers();
    if (trail && trail.length > 1) {
      L.polyline(trail, { color: "#7C5CFF", weight: 3, dashArray: "6 6" }).addTo(layer);
    }
  }, [trail]);

  return <div ref={containerRef} style={{ height }} className="w-full rounded-2xl" />;
}
