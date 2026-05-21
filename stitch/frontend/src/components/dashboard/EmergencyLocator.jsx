import React, { useState } from 'react';
import { FiMapPin, FiPhone, FiNavigation, FiAlertCircle, FiClock, FiActivity } from 'react-icons/fi';

const EmergencyLocator = () => {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Premium Hospital Data (Simulated for Hackathon Demo)
  const mockHospitals = [
    { name: "City General Hospital", distance: "0.8 km", phone: "911-001", open: "24/7", rating: 4.8 },
    { name: "Wellness Emergency Care", distance: "1.2 km", phone: "911-002", open: "24/7", rating: 4.5 },
    { name: "St. Jude Medical Center", distance: "2.5 km", phone: "911-003", open: "24/7", rating: 4.9 }
  ];

  const getMyLocation = () => {
    setLoading(true);
    setError(null);
    
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser. Please search manually.");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        // In a real app, we would use these coordinates to fetch real data
        // For the demo, we'll "locate" the user and show premium facilities
        setTimeout(() => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setLoading(false);
        }, 1500);
      },
      (err) => {
        console.error("Location error:", err);
        setError("Unable to retrieve your location. Please check browser permissions.");
        setLoading(false);
      },
      { timeout: 10000 }
    );
  };

  const getGoogleMapsUrl = (hospitalName) => {
    const query = encodeURIComponent(`${hospitalName} near me`);
    return `https://www.google.com/maps/search/?api=1&query=${query}`;
  };

  return (
    <div className="medical-card animate-pulse-glow" style={{ 
      padding: '28px', 
      border: '1px solid rgba(239, 68, 68, 0.2)',
      background: 'linear-gradient(160deg, rgba(255, 255, 255, 1) 0%, rgba(254, 242, 242, 1) 100%)',
      marginTop: '24px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Decorative pulse element */}
      <div style={{
        position: 'absolute',
        top: '-10px',
        right: '-10px',
        width: '100px',
        height: '100px',
        background: 'rgba(239, 68, 68, 0.03)',
        borderRadius: '50%',
        zIndex: 0
      }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '24px', position: 'relative', zIndex: 1 }}>
        <div style={{ 
          width: '56px', height: '56px', borderRadius: '16px', 
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', 
          color: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 16px rgba(239, 68, 68, 0.25)',
          flexShrink: 0
        }}>
          <FiAlertCircle size={28} className="animate-heartbeat" />
        </div>
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#991b1b', marginBottom: '4px' }}>
            Nearby Care Locator 🆘
          </h3>
          <p style={{ fontSize: '0.9rem', color: '#7f1d1d', opacity: 0.8, lineHeight: 1.4 }}>
            Your screening risk level is currently elevated. We've prepared nearby care options in case you want professional support.
          </p>
        </div>
      </div>

      {!location && !loading && !error && (
        <div style={{ textAlign: 'center', padding: '10px 0' }}>
          <button 
            onClick={getMyLocation} 
            className="btn-primary" 
            style={{ 
              background: '#ef4444', 
              borderColor: '#ef4444',
              padding: '14px 32px',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)'
            }}
          >
            <FiMapPin /> Find Nearest Help Now
          </button>
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '30px 0' }}>
          <div className="spinner" style={{ margin: '0 auto', borderTopColor: '#ef4444', width: '50px', height: '50px' }} />
          <p style={{ marginTop: '16px', fontSize: '0.9rem', color: '#991b1b', fontWeight: 600 }}>
            Triangulating your position...
          </p>
        </div>
      )}

      {location && (
        <div className="stagger-children" style={{ display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
            Top Rated Facilities Near You
          </div>
          {mockHospitals.map((h, i) => (
            <div key={i} className="medical-card" style={{ 
              padding: '18px', background: 'white', borderRadius: '16px', 
              border: '1px solid #fee2e2',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              boxShadow: '0 4px 6px rgba(0,0,0,0.02)',
              transition: 'transform 0.2s ease'
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{h.name}</h4>
                  <span style={{ fontSize: '0.7rem', background: '#fff7ed', color: '#c2410c', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                    ★ {h.rating}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '16px', marginTop: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <FiMapPin size={14} color="#ef4444" /> {h.distance}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10b981', fontWeight: 600 }}>
                    <FiClock size={14} /> Open {h.open}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <a href={`tel:${h.phone}`} className="btn-ghost" title="Call Now" style={{ 
                  width: '40px', height: '40px', padding: 0, 
                  color: '#ef4444', borderColor: '#fee2e2',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: '12px'
                }}>
                  <FiPhone size={20} />
                </a>
                <a href={getGoogleMapsUrl(h.name)} target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ 
                  padding: '8px 16px', fontSize: '0.85rem', fontWeight: 700,
                  borderColor: '#ef4444', color: '#ef4444',
                  background: 'white'
                }}>
                  <FiNavigation /> Maps
                </a>
              </div>
            </div>
          ))}
          <div style={{ 
            marginTop: '12px', 
            padding: '12px', 
            background: 'rgba(239, 68, 68, 0.05)', 
            borderRadius: '12px',
            textAlign: 'center',
            fontSize: '0.8rem',
            color: '#991b1b'
          }}>
            <FiActivity style={{ marginRight: '6px' }} /> 
            <strong>Medical Notice:</strong> If you are experiencing chest pain or difficulty breathing, call <strong>911</strong> or your local emergency number immediately.
          </div>
        </div>
      )}

      {error && (
        <div style={{ textAlign: 'center', padding: '20px' }}>
           <p style={{ color: '#ef4444', fontSize: '0.9rem', marginBottom: '16px', fontWeight: 500 }}>{error}</p>
           <a 
            href="https://www.google.com/maps/search/hospitals+near+me" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="btn-primary" 
            style={{ background: '#ef4444', borderColor: '#ef4444' }}
          >
            Search Manually on Maps
          </a>
        </div>
      )}

      <style>{`
        @keyframes pulse-glow-red {
          0%, 100% { box-shadow: 0 4px 20px rgba(239, 68, 68, 0.05); border-color: rgba(239, 68, 68, 0.2); }
          50% { box-shadow: 0 4px 30px rgba(239, 68, 68, 0.15); border-color: rgba(239, 68, 68, 0.4); }
        }
        .animate-pulse-glow {
          animation: pulse-glow-red 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default EmergencyLocator;
