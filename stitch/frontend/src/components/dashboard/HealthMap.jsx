import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { FiWind, FiCloudRain, FiSun, FiActivity, FiAlertCircle, FiNavigation, FiCrosshair } from 'react-icons/fi';

// Custom SVG Icon for Premium Markers
const createCustomIcon = (color) => {
  return L.divIcon({
    className: 'custom-map-marker',
    html: `<div style="
      width: 24px; 
      height: 24px; 
      background: ${color}; 
      border-radius: 50%; 
      border: 3px solid white;
      box-shadow: 0 0 10px ${color}66;
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="width: 6px; height: 6px; background: white; border-radius: 50%;"></div>
    </div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
};

// Component to handle map centering and user position
const LocationMarker = ({ position, setPosition }) => {
  const map = useMap();

  useEffect(() => {
    if (!position) {
      map.locate().on("locationfound", function (e) {
        setPosition(e.latlng);
        map.flyTo(e.latlng, map.getZoom());
      });
    }
  }, [map, position, setPosition]);

  const userIcon = L.divIcon({
    className: 'user-marker',
    html: `<div style="
      width: 20px; 
      height: 20px; 
      background: #3b82f6; 
      border-radius: 50%; 
      border: 3px solid white;
      box-shadow: 0 0 15px #3b82f6;
    " class="animate-pulse"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });

  return position === null ? null : (
    <Marker position={position} icon={userIcon}>
      <Popup>
        <div style={{ fontWeight: 800, fontSize: '0.85rem' }}>You are here 📍</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Location data provided by your browser.</div>
      </Popup>
    </Marker>
  );
};

const HealthMap = () => {
  const [userPos, setUserPos] = useState(null);

  const points = [
    { id: 1, lat: 40.7128, lng: -74.0060, title: 'Wellness Alert (High)', detail: 'Community wellness reports are elevated in the Downtown area.', severity: 'high', color: '#ef4444' },
    { id: 2, lat: 40.7306, lng: -73.9352, title: 'Air Quality Alert', detail: 'AQI is 185 (Unhealthy). Wear a mask for outdoor activities.', severity: 'medium', color: '#f59e0b' },
    { id: 3, lat: 40.6782, lng: -73.9442, title: 'Community Wellness Camp', detail: 'Free wellness screening available at City Center Mall.', severity: 'low', color: '#10b981' },
    { id: 4, lat: 40.7589, lng: -73.9851, title: 'Wellness Zone', detail: 'High density of community fitness activities reported.', severity: 'low', color: '#10b981' }
  ];

  return (
    <div className="medical-card" style={{ padding: 0, overflow: 'hidden', position: 'relative', height: '500px', border: '1px solid #e2e8f0' }}>
      
      {/* Real Interactive Map */}
      <MapContainer 
        center={[40.7128, -74.0060]} 
        zoom={12} 
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%', zIndex: 1 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        <LocationMarker position={userPos} setPosition={setUserPos} />
        
        {points.map(point => (
          <Marker 
            key={point.id} 
            position={[point.lat, point.lng]}
            icon={createCustomIcon(point.color)}
          >
            <Popup className="premium-popup">
              <div style={{ padding: '8px', minWidth: '180px' }}>
                <h5 style={{ margin: '0 0 6px 0', fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
                  {point.title}
                </h5>
                <p style={{ margin: '0 0 10px 0', fontSize: '0.8rem', color: '#64748b', lineHeight: 1.4 }}>
                  {point.detail}
                </p>
                <div style={{ 
                  fontSize: '0.7rem', 
                  fontWeight: 800, 
                  color: point.color, 
                  textTransform: 'uppercase',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <FiAlertCircle size={12} />
                  Status: {point.severity.charAt(0).toUpperCase() + point.severity.slice(1)} Risk
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Map Header Overlay */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        zIndex: 100,
        background: 'rgba(255,255,255,0.95)',
        padding: '16px 24px',
        borderRadius: '20px',
        border: '1px solid #e2e8f0',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 10px 30px rgba(0,0,0,0.08)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <div style={{ width: '10px', height: '10px', background: '#ef4444', borderRadius: '50%', animation: 'pulse-soft 2s infinite' }}></div>
          <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.3px' }}>
            Live Regional Wellness Pulse
          </h4>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>● Alerts</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>● Vaccination Camps</span>
          </div>
        </div>
      </div>

      {/* Recenter Button */}
      <button 
        onClick={() => setUserPos(null)} // Setting to null triggers the re-locate effect
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          zIndex: 100,
          background: 'white',
          border: '1px solid #e2e8f0',
          width: '45px',
          height: '45px',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          color: 'var(--primary)'
        }}
        title="Recenter to my location"
      >
        <FiCrosshair size={22} />
      </button>

      {/* Environmental Stats Sidebar */}
      <div style={{
        position: 'absolute',
        bottom: '24px',
        right: '24px',
        zIndex: 100,
        background: '#0f172a',
        padding: '24px',
        borderRadius: '24px',
        color: 'white',
        width: '280px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h4 style={{ margin: 0, fontSize: '0.8rem', color: '#2dd4bf', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 800 }}>
            Environment Stats
          </h4>
          <FiActivity color="#2dd4bf" />
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ 
              width: '40px', height: '40px', background: 'rgba(45, 212, 191, 0.1)', 
              borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' 
            }}>
              <FiWind color="#2dd4bf" size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.65rem', opacity: 0.5, fontWeight: 700 }}>AIR QUALITY INDEX</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 900 }}>85 (Good)</div>
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FiCloudRain color="#3b82f6" />
              <div>
                <div style={{ fontSize: '0.6rem', opacity: 0.5 }}>Humidity</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>64%</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FiSun color="#f59e0b" />
              <div>
                <div style={{ fontSize: '0.6rem', opacity: 0.5 }}>UV Index</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>Moderate</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .custom-map-marker { background: none !important; border: none !important; }
        .premium-popup .leaflet-popup-content-wrapper {
          border-radius: 16px;
          padding: 8px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        }
        .premium-popup .leaflet-popup-tip { background: white; }
        @keyframes pulse-soft {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.6; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default HealthMap;
