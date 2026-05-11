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
  const genderData = [
    { name: 'Men', value: men },
    { name: 'Women', value: women },
    { name: 'Unknown', value: totalSeen - men - women },
  ].filter(d => d.value > 0);

  // Dwell time distribution — use the LAST known dwell per unique person
  // (avoid counting the same person multiple times across history frames)
  const latestDwellById = {};
  history.forEach(h => {
    (h.tracks || []).forEach(t => {
      latestDwellById[t.id] = t.dwell_seconds || 0;
    });
  });
  const uniqueTrackDwells = Object.values(latestDwellById);

  const dwellBuckets = [
    { name: '<5s', count: 0 },
    { name: '5-15s', count: 0 },
    { name: '15-30s', count: 0 },
    { name: '>30s', count: 0 },
  ];
  uniqueTrackDwells.forEach(d => {
    if (d < 5) dwellBuckets[0].count++;
    else if (d < 15) dwellBuckets[1].count++;
    else if (d < 30) dwellBuckets[2].count++;
    else dwellBuckets[3].count++;
  });

  // Average dwell time — over unique persons only
  const avgDwell = uniqueTrackDwells.length > 0
    ? (uniqueTrackDwells.reduce((s, d) => s + d, 0) / uniqueTrackDwells.length).toFixed(1)
    : 0;

  // Peak occupancy from history
  const peakOccupancy = history.reduce((max, h) => Math.max(max, h.active_people || 0), 0);

  // Zone activity — count UNIQUE person IDs per zone (not occurrences)
  const zoneUniqueIds = {};
  history.forEach(h => {
    (h.tracks || []).forEach(t => {
      if (t.roi_id != null) {
        if (!zoneUniqueIds[t.roi_id]) zoneUniqueIds[t.roi_id] = new Set();
        zoneUniqueIds[t.roi_id].add(t.id);
      }
    });
  });
  const zoneActivity = Object.fromEntries(
    Object.entries(zoneUniqueIds).map(([id, set]) => [id, set.size])
  );


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
            <KPICard label="PEAK OCCUPANCY" value={peakOccupancy} icon={TrendingUp} color="#f59e0b" />
            <KPICard label="AVG DWELL" value={`${avgDwell}s`} icon={Clock} color="#10b981" />
            <KPICard label="IN ROI NOW" value={summary.people_in_roi} icon={Activity} color="#3b82f6" />
          </div>
        </div>

        {/* Gender Pie */}
        <div>
          <SectionTitle>GENDER DISTRIBUTION</SectionTitle>
          {genderData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={genderData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
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
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={history} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="ts" tick={{ fontSize: 9, fill: '#64748b' }} tickFormatter={v => `${v.toFixed(0)}s`} />
              <YAxis tick={{ fontSize: 9, fill: '#64748b' }} />
              <Tooltip contentStyle={tooltipStyle} labelFormatter={v => `t=${parseFloat(v).toFixed(1)}s`} />
              <Line type="monotone" dataKey="active_people" stroke="#a855f7" strokeWidth={2} dot={false} name="Active" />
              <Line type="monotone" dataKey="people_in_roi" stroke="#10b981" strokeWidth={2} dot={false} name="In ROI" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Dwell time distribution */}
        <div>
          <SectionTitle>DWELL TIME DISTRIBUTION</SectionTitle>
          <ResponsiveContainer width="100%" height={130}>
            <BarChart data={dwellBuckets} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 9, fill: '#64748b' }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" name="Persons" radius={[4, 4, 0, 0]}>
                {dwellBuckets.map((_, i) => <Cell key={i} fill={DWELL_COLORS[i]} />)}
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
                const count = zoneActivity[area.id] || 0;
                const pct = totalSeen > 0 ? (count / totalSeen) * 100 : 0;
                return (
                  <div key={area.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>{area.name}</span>
                      <span style={{ fontSize: '0.7rem', color: area.color, fontWeight: 700 }}>{count} unique visitors</span>
                    </div>
                    <div style={{ height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px' }}>
                      <div style={{ width: `${totalSeen > 0 ? (count / totalSeen) * 100 : 0}%`, height: '100%', background: area.color, borderRadius: '2px', transition: 'width 0.5s' }} />
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
