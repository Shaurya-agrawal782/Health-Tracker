import React, { useState } from 'react';
import { FiMapPin, FiAlertTriangle, FiInfo, FiWind, FiCloudRain, FiSun } from 'react-icons/fi';

const HealthMap = () => {
  const [activePoint, setActivePoint] = useState(null);

  const points = [
    { id: 1, x: '25%', y: '40%', type: 'alert', title: 'Flu Outbreak', detail: 'High incidence of viral fever in the North District. Avoid crowded areas.', severity: 'high' },
    { id: 2, x: '65%', y: '30%', type: 'info', title: 'Air Quality Alert', detail: 'AQI is 185 (Unhealthy). Wear a mask if you have respiratory issues.', severity: 'medium' },
    { id: 3, x: '45%', y: '70%', type: 'check', title: 'Vaccination Camp', detail: 'Free health screening and boosters available at City Center Mall.', severity: 'low' },
    { id: 4, x: '80%', y: '60%', type: 'alert', title: 'Dengue Warning', detail: 'Increased mosquito activity reported in the Eastern Suburbs.', severity: 'medium' }
  ];

  return (
    <div className="medical-card" style={{ padding: 0, overflow: 'hidden', position: 'relative', height: '500px' }}>
      
      {/* Map Background (Abstract Simulation) */}
      <div style={{
        width: '100%',
        height: '100%',
        background: '#f8fafc',
        backgroundImage: `
          radial-gradient(#e2e8f0 2px, transparent 2px),
          linear-gradient(rgba(13, 148, 136, 0.05) 1px, transparent 1px),
          linear-gradient(90deg, rgba(13, 148, 136, 0.05) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px, 100px 100px, 100px 100px',
        position: 'absolute',
        top: 0,
        left: 0
      }} />

      {/* Map Title Overlay */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        zIndex: 10,
        background: 'rgba(255,255,255,0.9)',
        padding: '12px 20px',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
      }}>
        <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: '#0f172a' }}>Regional Health Pulse</h4>
        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
          <span style={{ fontSize: '0.7rem', color: '#ef4444', fontWeight: 700 }}>● Live Alerts</span>
          <span style={{ fontSize: '0.7rem', color: '#3b82f6', fontWeight: 700 }}>● Safe Zones</span>
        </div>
      </div>

      {/* Interactive Points */}
      {points.map(point => (
        <div 
          key={point.id}
          style={{
            position: 'absolute',
            top: point.y,
            left: point.x,
            transform: 'translate(-50%, -50%)',
            zIndex: 20
          }}
          onMouseEnter={() => setActivePoint(point)}
          onMouseLeave={() => setActivePoint(null)}
        >
          <div className={`map-pulse-${point.severity}`} style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: point.severity === 'high' ? '#ef4444' : point.severity === 'medium' ? '#f59e0b' : '#10b981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            cursor: 'pointer',
            boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
          }}>
            {point.type === 'alert' ? <FiAlertTriangle size={12} /> : <FiInfo size={12} />}
          </div>

          {activePoint?.id === point.id && (
            <div style={{
              position: 'absolute',
              bottom: '35px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '220px',
              background: 'white',
              padding: '16px',
              borderRadius: '16px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
              border: '1px solid #f1f5f9',
              zIndex: 30,
              animation: 'fadeInUp 0.3s ease-out'
            }}>
              <h5 style={{ margin: '0 0 8px 0', fontSize: '0.9rem', fontWeight: 800, color: '#0f172a' }}>{point.title}</h5>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b', lineHeight: 1.4 }}>{point.detail}</p>
              <div style={{ marginTop: '12px', fontSize: '0.7rem', fontWeight: 700, color: point.severity === 'high' ? '#ef4444' : '#0d9488', textTransform: 'uppercase' }}>
                Action: {point.severity === 'high' ? 'Strict Caution' : 'Stay Alert'}
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Environmental Stats Overlay */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        right: '20px',
        zIndex: 10,
        background: '#0f172a',
        padding: '16px',
        borderRadius: '16px',
        color: 'white',
        width: '240px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
      }}>
        <h4 style={{ margin: '0 0 12px 0', fontSize: '0.8rem', color: '#2dd4bf', textTransform: 'uppercase' }}>Local Environment</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FiWind color="#2dd4bf" />
            <div>
              <div style={{ fontSize: '0.6rem', opacity: 0.7 }}>AQI Index</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>85 (Good)</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FiCloudRain color="#3b82f6" />
            <div>
              <div style={{ fontSize: '0.6rem', opacity: 0.7 }}>Humidity</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>64%</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FiSun color="#f59e0b" />
            <div>
              <div style={{ fontSize: '0.6rem', opacity: 0.7 }}>UV Index</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>Moderate</div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .map-pulse-high { animation: pulse-red 2s infinite; }
        .map-pulse-medium { animation: pulse-orange 2s infinite; }
        .map-pulse-low { animation: pulse-green 2s infinite; }
        
        @keyframes pulse-red {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
          70% { box-shadow: 0 0 0 15px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
        @keyframes pulse-orange {
          0% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.4); }
          70% { box-shadow: 0 0 0 15px rgba(245, 158, 11, 0); }
          100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); }
        }
        @keyframes pulse-green {
          0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
          70% { box-shadow: 0 0 0 15px rgba(16, 185, 129, 0); }
          100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
      `}</style>
    </div>
  );
};

export default HealthMap;
