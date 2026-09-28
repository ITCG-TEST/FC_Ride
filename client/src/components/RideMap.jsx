import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const START_STYLE = { radius: 7, color: "#0f172a", weight: 2, fillColor: "#10b981", fillOpacity: 1 };
const END_STYLE = { radius: 7, color: "#0f172a", weight: 2, fillColor: "#ef4444", fillOpacity: 1 };

export default function RideMap({ points = [], height = 260, live = false }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);

  useEffect(() => {
    const map = L.map(containerRef.current, { attributionControl: false });
    map.setView([20.5937, 78.9629], 5);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();
    if (points.length === 0) return;

    // Points may carry a trailing timestamp ([lat, lng, epochMs]) for speed
    // analysis — Leaflet only wants [lat, lng] pairs.
    const latLngs = points.map(([lat, lng]) => [lat, lng]);

    const line = L.polyline(latLngs, { color: "#0D9488", weight: 4 }).addTo(layer);
    L.circleMarker(latLngs[0], START_STYLE).addTo(layer);
    if (!live && latLngs.length > 1) {
      L.circleMarker(latLngs[latLngs.length - 1], END_STYLE).addTo(layer);
    }

    if (live) {
      map.setView(latLngs[latLngs.length - 1], Math.max(map.getZoom(), 16));
    } else if (latLngs.length > 1) {
      map.fitBounds(line.getBounds(), { padding: [24, 24], maxZoom: 17 });
    } else {
      map.setView(latLngs[0], 16);
    }
  }, [points, live]);

  return <div ref={containerRef} style={{ height }} className="w-full rounded-2xl" />;
}
