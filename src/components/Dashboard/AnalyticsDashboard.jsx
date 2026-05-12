import React from 'react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  BarChart, Bar, Legend
} from 'recharts';
import { X, Users, Clock, TrendingUp, Activity } from 'lucide-react';

const GENDER_COLORS = { Male: '#60a5fa', Female: '#f472b6', Unknown: '#94a3b8' };
const DWELL_COLORS = ['#a855f7', '#3b82f6', '#10b981', '#f59e0b'];

const KPICard = ({ label, value, icon: Icon, color }) => (
  <div style={{
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '12px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    flex: '1 1 calc(50% - 8px)',
    minWidth: '120px'
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <Icon size={14} color={color} />
      <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '1px', fontWeight: 700 }}>{label}</span>
    </div>
    <span style={{ fontSize: '1.8rem', fontWeight: 700, color, lineHeight: 1 }}>{value ?? '—'}</span>
  </div>
);

const SectionTitle = ({ children }) => (
  <div style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '1px', color: 'var(--text-muted)', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: '12px' }}>
    {children}
  </div>
);

const AnalyticsDashboard = ({ isOpen, onClose, analytics, history, areas }) => {
  if (!isOpen) return null;

  const summary = analytics?.analytics || {};
  const totalSeen = summary.total_seen ?? 0;
  const men = summary.men ?? 0;
  const women = summary.women ?? 0;

  // Gender pie data
  const genderData = React.useMemo(() => [
    { name: 'Men', value: men },
    { name: 'Women', value: women },
    { name: 'Unknown', value: Math.max(0, totalSeen - men - women) },
  ].filter(d => d.value > 0), [men, women, totalSeen]);

  // Use pre-calculated stats from backend (or defaults)
  const stats = {
    dwellBuckets: summary.dwell_buckets || [],
    avgDwell: summary.avg_dwell || 0,
    peak: summary.peak_occupancy || 0,
    zoneActivity: summary.zone_activity || {}
  };

  // Downsample history for the line chart if it's too large (limit to ~100 points)
  const lineChartData = React.useMemo(() => {
    if (history.length <= 120) return history;
    const step = Math.ceil(history.length / 100);
    return history.filter((_, i) => i % step === 0);
  }, [history]);

  const tooltipStyle = { backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#f8fafc', fontSize: '0.7rem' };

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.4)' }} />

      {/* Panel */}
      <div style={{
        position: 'absolute', top: 0, right: 0, height: '100%',
        width: '380px', zIndex: 201, overflowY: 'auto',
        background: 'rgba(10, 15, 30, 0.92)',
        backdropFilter: 'blur(24px)',
        borderLeft: '1px solid rgba(255,255,255,0.1)',
        padding: '24px 20px',
        display: 'flex', flexDirection: 'column', gap: '24px',
      }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Analytics Dashboard</h2>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>Real-time intelligence</p>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}>
            <X size={18} />
          </button>
        </div>

        {/* KPIs */}
        <div>
          <SectionTitle>KEY METRICS</SectionTitle>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            <KPICard label="TOTAL DETECTED" value={totalSeen} icon={Users} color="var(--primary)" />
            <KPICard label="PEAK OCCUPANCY" value={stats.peak} icon={TrendingUp} color="#f59e0b" />
            <KPICard 
              label="AVG DWELL" 
              value={stats.avgDwell < 60 ? `${stats.avgDwell}s` : `${(stats.avgDwell / 60).toFixed(1)}m`} 
              icon={Clock} 
              color="#10b981" 
            />
            <KPICard label="IN ROI NOW" value={summary.people_in_roi} icon={Activity} color="#3b82f6" />
          </div>
        </div>

        {/* Gender Pie */}
        <div>
          <SectionTitle>GENDER DISTRIBUTION</SectionTitle>
          {genderData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={genderData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value" isAnimationActive={false}>
                  {genderData.map((entry) => (
                    <Cell key={entry.name} fill={GENDER_COLORS[entry.name]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '0.7rem' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.7rem', padding: '20px 0' }}>Waiting for data...</div>
          )}
        </div>

        {/* People over time */}
        <div>
          <SectionTitle>OCCUPANCY OVER TIME</SectionTitle>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={lineChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis 
                dataKey="ts" 
                type="number"
                domain={['auto', 'auto']}
                tick={{ fontSize: 9, fill: '#64748b' }} 
                tickFormatter={v => v < 60 ? `${Math.round(v)}s` : `${(v / 60).toFixed(1)}m`}
                minTickGap={30}
              />
              <YAxis 
                domain={[0, 'auto']}
                allowDecimals={false}
                tick={{ fontSize: 9, fill: '#64748b' }} 
              />
              <Tooltip 
                contentStyle={tooltipStyle} 
                labelFormatter={v => v < 60 ? `Time: ${parseFloat(v).toFixed(1)}s` : `Time: ${(v / 60).toFixed(1)}m`} 
              />
              <Line 
                type="monotone" 
                dataKey="active_people" 
                stroke="#a855f7" 
                strokeWidth={2} 
                dot={false} 
                name="Active" 
                isAnimationActive={false}
              />
              <Line 
                type="monotone" 
                dataKey="people_in_roi" 
                stroke="#10b981" 
                strokeWidth={2} 
                dot={false} 
                name="In ROI" 
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Dwell time distribution */}
        <div>
          <SectionTitle>DWELL TIME DISTRIBUTION</SectionTitle>
          <ResponsiveContainer width="100%" height={130}>
            <BarChart data={stats.dwellBuckets} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 9, fill: '#64748b' }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" name="Persons" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                {stats.dwellBuckets.map((_, i) => <Cell key={i} fill={DWELL_COLORS[i]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Zone Activity */}
        {areas.length > 0 && (
          <div>
            <SectionTitle>ZONE ACTIVITY</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {areas.map(area => {
                const count = stats.zoneActivity[area.id] || 0;
                const pct = totalSeen > 0 ? (count / totalSeen) * 100 : 0;
                return (
                  <div key={area.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>{area.name}</span>
                      <span style={{ fontSize: '0.7rem', color: area.color, fontWeight: 700 }}>{count} unique visitors</span>
                    </div>
                    <div style={{ height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: area.color, borderRadius: '2px', transition: 'width 0.5s' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </>
  );
};

export default AnalyticsDashboard;
