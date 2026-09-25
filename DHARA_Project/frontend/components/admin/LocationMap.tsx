"use client";

import { useEffect, useRef } from "react";

export default function LocationMap({
  lat,
  lng,
  onChange,
}: {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const initMap = () => {
      const L = (window as any).L;
      if (!L || !mapRef.current) return;
      if (leafletRef.current) return; // already initialized

      leafletRef.current = L.map(mapRef.current).setView([lat, lng], 13);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(leafletRef.current);

      markerRef.current = L.marker([lat, lng], { draggable: true }).addTo(leafletRef.current);

      markerRef.current.on("dragend", () => {
        const pos = markerRef.current.getLatLng();
        onChange(pos.lat, pos.lng);
      });
    };

    if (!(window as any).L) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);

      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = initMap;
      document.head.appendChild(script);
    } else {
      initMap();
    }

    return () => {
      if (leafletRef.current) {
        leafletRef.current.remove();
        leafletRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (leafletRef.current && markerRef.current) {
      const currentPos = markerRef.current.getLatLng();
      if (currentPos.lat !== lat || currentPos.lng !== lng) {
        markerRef.current.setLatLng([lat, lng]);
        leafletRef.current.setView([lat, lng]);
      }
    }
  }, [lat, lng]);

  return (
    <div className="w-full relative border border-stone-line">
      <div ref={mapRef} className="h-[400px] w-full z-0 relative" />
      <div className="bg-ink text-white text-xs py-1.5 px-3 rounded-full absolute bottom-4 left-4 z-[400] flex items-center gap-2 shadow-sm pointer-events-none">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        Manually move the pointer on the map to point to the exact location of the property or input lat and lng to get the pin
      </div>
    </div>
  );
}
