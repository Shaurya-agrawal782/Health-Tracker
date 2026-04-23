import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const ActivityChart = ({ data }) => {
  const chartData = data?.map(d => ({
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    exercise: d.exerciseMinutes,
    steps: Math.round(d.steps / 100)
  })) || [];

  return (
    <div className="medical-card" style={{ padding: '20px' }}>
      <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '16px' }}>
        Activity Overview
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
          <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.8rem' }}
            labelStyle={{ fontWeight: 600 }}
          />
          <Bar dataKey="exercise" fill="#0d6e5b" radius={[4, 4, 0, 0]} name="Exercise (min)" />
          <Bar dataKey="steps" fill="#a0d9c9" radius={[4, 4, 0, 0]} name="Steps (×100)" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ActivityChart;
