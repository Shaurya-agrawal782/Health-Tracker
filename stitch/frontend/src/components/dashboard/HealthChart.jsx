import React from 'react';
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, BarChart, Bar, Cell, Legend
} from 'recharts';

const HealthChart = ({ data, type, title }) => {
  if (!data || data.length === 0) return null;

  // Format date for display
  const chartData = data.map(item => ({
    ...item,
    name: new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' })
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: 'white',
          padding: '12px',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          fontSize: '0.8rem'
        }}>
          <p style={{ fontWeight: 700, marginBottom: '4px', color: 'var(--text-primary)' }}>{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color, margin: 0 }}>
              {entry.name}: <span style={{ fontWeight: 600 }}>{entry.value}</span>
              {entry.unit ? ` ${entry.unit}` : ''}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    switch (type) {
      case 'sleep-stress':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorSleep" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorStress" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="sleepHours" 
                name="Sleep" 
                unit="hrs" 
                stroke="var(--primary)" 
                fillOpacity={1} 
                fill="url(#colorSleep)" 
                strokeWidth={3}
              />
              <Area 
                type="monotone" 
                dataKey="stressLevel" 
                name="Stress" 
                stroke="#ef4444" 
                fillOpacity={1} 
                fill="url(#colorStress)" 
                strokeWidth={3}
              />
            </AreaChart>
          </ResponsiveContainer>
        );
      case 'activity':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="steps" name="Steps" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.steps > 8000 ? 'var(--primary)' : '#cbd5e1'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
      default:
        return null;
    }
  };

  return (
    <div className="medical-card" style={{ padding: '24px', height: '100%' }}>
      <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '24px', color: 'var(--text-primary)' }}>
        {title}
      </h3>
      {renderChart()}
    </div>
  );
};

export default HealthChart;
