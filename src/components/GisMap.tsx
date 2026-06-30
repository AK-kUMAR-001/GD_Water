import React, { useEffect, useRef } from 'react';

interface Complaint {
  id: string;
  category: string;
  locationName: string;
  latitude: number;
  longitude: number;
  severity: string;
  status: string;
}

interface GisMapProps {
  complaints: Complaint[];
  selectedComplaintId?: string;
  onSelectComplaint?: (id: string) => void;
  height?: string;
}

export const GisMap: React.FC<GisMapProps> = ({
  complaints,
  selectedComplaintId,
  onSelectComplaint,
  height = '350px'
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    // 1. Inject Leaflet CDN Assets if not already present
    const loadLeaflet = async () => {
      if (!(window as any).L) {
        // Inject CSS
        const cssLink = document.createElement('link');
        cssLink.rel = 'stylesheet';
        cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(cssLink);

        // Inject JS
        await new Promise((resolve) => {
          const jsScript = document.createElement('script');
          jsScript.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          jsScript.onload = resolve;
          document.head.appendChild(jsScript);
        });
      }
      
      initializeMap();
    };

    const initializeMap = () => {
      if (!mapContainerRef.current) return;
      
      // Cleanup previous map instance if exists
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const L = (window as any).L;
      if (!L) return;

      // Center of Coimbatore coordinates area
      const coimbatoreCenter = [11.0168, 76.9558];
      const map = L.map(mapContainerRef.current, {
        scrollWheelZoom: true
      }).setView(coimbatoreCenter, 12);
      mapInstanceRef.current = map;

      // Add OpenStreetMap tile layer (provides the real street path backgrounds)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      // Add markers
      markersRef.current = [];
      complaints.forEach((c) => {
        if (!c.latitude || !c.longitude) return;

        // Color mapping
        let markerColor = '#8BC34A'; // Default Low / Greenish Yellow
        if (c.status === 'Resolved') {
          markerColor = '#138808'; // Green
        } else if (c.severity === 'Critical') {
          markerColor = '#E64A19'; // Bright Orange-Red
        } else if (c.severity === 'High') {
          markerColor = '#FF9800'; // Bright Orange
        } else {
          markerColor = '#FFC107'; // Amber Yellow
        }
        
        const marker = L.circleMarker([c.latitude, c.longitude], {
          radius: 9,
          fillColor: markerColor,
          color: '#FFFFFF',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.95
        }).addTo(map);

        // Bind interactive popup card
        marker.bindPopup(`
          <div style="font-family: sans-serif; font-size: 12px; color: #1F2937; padding: 4px; min-width: 140px;">
            <strong style="color: #002147; font-size: 13px;">🎫 ${c.id}</strong>
            <p style="margin: 4px 0; font-weight: bold;">${c.category}</p>
            <p style="margin: 4px 0 8px 0; color: #6B7280; font-size: 11px;">📍 ${c.locationName}</p>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="display: inline-block; padding: 2px 6px; border-radius: 2px; font-weight: bold; font-size: 9px; background: ${c.status === 'Resolved' ? '#E8F5E9' : '#FFF3E0'}; color: ${c.status === 'Resolved' ? '#138808' : '#EF6C00'};">
                ${c.status}
              </span>
            </div>
          </div>
        `);

        marker.on('click', () => {
          if (onSelectComplaint) {
            onSelectComplaint(c.id);
          }
        });

        markersRef.current.push({ id: c.id, marker, lat: c.latitude, lng: c.longitude });
      });

      // Adjust view to show all markers if there are multiple and no active selection
      if (complaints.length > 1 && !selectedComplaintId && markersRef.current.length > 0) {
        const group = L.featureGroup(markersRef.current.map(m => m.marker));
        map.fitBounds(group.getBounds().pad(0.15));
      }

      // Smooth focus zoom on selected complaint marker
      if (selectedComplaintId) {
        const found = markersRef.current.find(m => m.id === selectedComplaintId);
        if (found) {
          map.setView([found.lat, found.lng], 15);
          found.marker.openPopup();
        }
      }
    };

    loadLeaflet();
  }, [complaints, selectedComplaintId]);

  return (
    <div className="gis-map" style={{ height, position: 'relative' }}>
      
      {/* Floating Interactive Map Legend Box overlay */}
      <div style={{
        position: 'absolute',
        top: '12px',
        left: '12px',
        background: 'rgba(255, 255, 255, 0.95)',
        border: '1.5px solid var(--border-color)',
        borderRadius: '4px',
        padding: '8px 12px',
        fontSize: '0.7rem',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        boxShadow: 'var(--box-shadow)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold' }}>
          <span style={{ width: '9px', height: '9px', borderRadius: '50%', backgroundColor: '#E64A19', display: 'inline-block' }}></span> Critical Burst/Pollution
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold' }}>
          <span style={{ width: '9px', height: '9px', borderRadius: '50%', backgroundColor: '#FF9800', display: 'inline-block' }}></span> High Severity Theft/Leak
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold' }}>
          <span style={{ width: '9px', height: '9px', borderRadius: '50%', backgroundColor: '#FFC107', display: 'inline-block' }}></span> Medium/Low Leakage
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold' }}>
          <span style={{ width: '9px', height: '9px', borderRadius: '50%', backgroundColor: '#138808', display: 'inline-block' }}></span> Resolved Repairs
        </div>
      </div>

      <div 
        ref={mapContainerRef} 
        style={{ height: '100%', width: '100%', borderRadius: '4px', zIndex: 1 }} 
      />
    </div>
  );
};
