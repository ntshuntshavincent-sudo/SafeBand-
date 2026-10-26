import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

export interface ResponderMarker {
  id: string;
  name: string;
  lat: number;
  lng: number;
  status: 'en_route' | 'on_scene' | 'patrolling';
  etaMinutes?: number;
}

interface RealTimeMapProps {
  latitude: number;
  longitude: number;
  accuracy: number;
  breadcrumbs: Array<{ lat: number; lng: number }>;
  safeZones?: Array<{ name: string; lat: number; lng: number; radiusMeters: number; type: string }>;
  responderUnits?: ResponderMarker[];
  isSimulating?: boolean;
  pinLabel?: string;
}

export const RealTimeMap: React.FC<RealTimeMapProps> = ({
  latitude,
  longitude,
  accuracy,
  breadcrumbs,
  safeZones = [],
  responderUnits = [],
  pinLabel = 'Live Owner Location',
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const accuracyCircleRef = useRef<L.Circle | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const safeZoneLayersRef = useRef<L.LayerGroup | null>(null);
  const responderLayersRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Avoid duplicate initialization
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [latitude, longitude],
        zoom: 16,
        zoomControl: false,
        attributionControl: false,
      });

      // Add high-contrast dark tactical tiles (CartoDB Dark Matter / Voyager)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      // Add zoom control to top-right
      L.control.zoom({ position: 'topright' }).addTo(map);

      // Custom pulsing SVG icon for the survivor / owner
      const pulsingIcon = L.divIcon({
        className: 'custom-live-marker',
        html: `
          <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 28px; height: 28px; border-radius: 50%; background: rgba(225, 29, 72, 0.4); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="position: relative; width: 16px; height: 16px; border-radius: 50%; background: #e11d48; border: 3px solid #ffffff; box-shadow: 0 0 10px rgba(0,0,0,0.5);"></div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([latitude, longitude], { icon: pulsingIcon }).addTo(map);
      marker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 11px; color: #0f172a; padding: 2px;">
          <strong>${pinLabel}</strong><br/>
          Accuracy: ±${accuracy}m<br/>
          ${latitude.toFixed(5)}, ${longitude.toFixed(5)}
        </div>
      `);

      const accuracyCircle = L.circle([latitude, longitude], {
        radius: Math.max(accuracy, 15),
        color: '#e11d48',
        weight: 1,
        fillColor: '#e11d48',
        fillOpacity: 0.12,
      }).addTo(map);

      // Breadcrumb polyline
      const latlngs = breadcrumbs.map(b => [b.lat, b.lng] as [number, number]);
      const polyline = L.polyline(latlngs, {
        color: '#f43f5e',
        weight: 3.5,
        opacity: 0.75,
        dashArray: '6, 6',
      }).addTo(map);

      // Safe zones layer
      const zoneGroup = L.layerGroup().addTo(map);
      safeZones.forEach(sz => {
        const isSafe = sz.type !== 'high_risk_corridor';
        const color = isSafe ? '#10b981' : '#f43f5e';
        const circle = L.circle([sz.lat, sz.lng], {
          radius: sz.radiusMeters,
          color: color,
          weight: 1.5,
          fillColor: color,
          fillOpacity: 0.15,
        });
        circle.bindPopup(`<strong>${sz.name}</strong><br/>Radius: ${sz.radiusMeters}m`);
        zoneGroup.addLayer(circle);
      });

      // Responder units layer
      const responderGroup = L.layerGroup().addTo(map);

      mapInstanceRef.current = map;
      markerRef.current = marker;
      accuracyCircleRef.current = accuracyCircle;
      polylineRef.current = polyline;
      safeZoneLayersRef.current = zoneGroup;
      responderLayersRef.current = responderGroup;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update map when coordinates or breadcrumbs change
  useEffect(() => {
    if (!mapInstanceRef.current || !markerRef.current || !accuracyCircleRef.current) return;

    markerRef.current.setLatLng([latitude, longitude]);
    accuracyCircleRef.current.setLatLng([latitude, longitude]);
    accuracyCircleRef.current.setRadius(Math.max(accuracy, 15));

    if (polylineRef.current) {
      const latlngs = breadcrumbs.map(b => [b.lat, b.lng] as [number, number]);
      polylineRef.current.setLatLngs(latlngs);
    }

    // Pan smoothly to updated location
    mapInstanceRef.current.panTo([latitude, longitude], { animate: true, duration: 1 });
  }, [latitude, longitude, accuracy, breadcrumbs]);

  // Update responder markers on map
  useEffect(() => {
    if (!mapInstanceRef.current || !responderLayersRef.current) return;

    responderLayersRef.current.clearLayers();

    responderUnits.forEach(unit => {
      const unitIcon = L.divIcon({
        className: 'custom-responder-marker',
        html: `
          <div style="background: #2563eb; color: #ffffff; border: 2px solid #93c5fd; border-radius: 8px; padding: 2px 6px; font-size: 10px; font-weight: 700; font-family: monospace; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.4); display: flex; align-items: center; gap: 4px; white-space: nowrap;">
            <span>🚓</span>
            <span>${unit.name}</span>
          </div>
        `,
        iconSize: [120, 24],
        iconAnchor: [60, 12],
      });

      const responderMarker = L.marker([unit.lat, unit.lng], { icon: unitIcon });
      responderMarker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 11px; padding: 2px;">
          <strong>${unit.name}</strong><br/>
          Status: ${unit.status.toUpperCase()}<br/>
          ${unit.etaMinutes ? `ETA: ${unit.etaMinutes} min` : ''}
        </div>
      `);
      responderLayersRef.current?.addLayer(responderMarker);
    });
  }, [responderUnits]);

  return (
    <div className="relative w-full h-full min-h-[320px] rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-inner">
      <div ref={mapContainerRef} className="w-full h-full min-h-[320px]" />

      {/* Floating Tactical Overlay Controls */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 flex items-center gap-2 shadow-lg">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        <span className="font-semibold text-white">Live OpenStreetMap Stream</span>
        <span className="text-[10px] text-slate-400 font-mono">
          {latitude.toFixed(4)}, {longitude.toFixed(4)}
        </span>
      </div>

      <div className="absolute top-3 left-3 z-[1000]">
        <button
          onClick={() => {
            if (mapInstanceRef.current) {
              mapInstanceRef.current.setView([latitude, longitude], 17, { animate: true });
            }
          }}
          className="px-3 py-1.5 bg-slate-900/95 hover:bg-slate-800 text-slate-100 border border-slate-700/80 rounded-xl text-xs font-semibold shadow-lg flex items-center gap-1.5 active:scale-95 transition cursor-pointer"
        >
          <span>🎯 Center Pin</span>
        </button>
      </div>
    </div>
  );
};
