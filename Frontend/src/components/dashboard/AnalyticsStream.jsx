import React from 'react';
import { Line, Bar } from 'react-chartjs-2';
import { TrendingUp, Activity, MapPin, Trees } from 'lucide-react';

/* 2×2 mini metric card */
const MiniCard = ({ label, value, color }) => (
  <div className="card-raised" style={{ padding: 12, borderRadius: 8, border: '1px solid var(--color-border)' }}>
    <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-text-muted)', marginBottom: 6 }}>
      {label}
    </div>
    <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 18, color }}>
      {value}
    </div>
  </div>
);

const AnalyticsStream = ({
  lineData, barData, chartConfig,
  selectedProject, avgCarbon = 0, avgBio = 0, siteCount = 0,
}) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>

    {/* 2×2 metric grid */}
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
      <MiniCard label="Avg carbon" value={`${avgCarbon}%`} color="var(--color-green)" />
      <MiniCard label="Total sites" value={siteCount}       color="var(--color-blue)"  />
      <MiniCard label="Biodiversity" value={`${avgBio}%`}   color="var(--color-amber)" />
      <MiniCard label="Status" value="Active"                color="var(--color-green)" />
    </div>

    {/* Charts card */}
    <div className="card" style={{ padding: 16, flex: 1, display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Carbon trend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
        <TrendingUp size={13} color="var(--color-green)" strokeWidth={1.5} />
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>
          Carbon score trend
        </span>
      </div>
      <div style={{ height: 90, marginBottom: 16 }}>
        <Line data={lineData} options={{ ...chartConfig, maintainAspectRatio: false }} />
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'var(--color-border)', margin: '0 0 14px' }} />

      {/* Biodiversity by site */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
        <Activity size={13} color="var(--color-blue)" strokeWidth={1.5} />
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>
          Biodiversity by site
        </span>
      </div>
      <div style={{ height: 80, flex: 'none' }}>
        <Bar data={barData} options={{ ...chartConfig, maintainAspectRatio: false }} />
      </div>
    </div>

    {/* Project summary row */}
    <div style={{
      borderTop: '1px solid var(--color-border)',
      paddingTop: 12,
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <MapPin size={14} color="var(--color-green)" strokeWidth={1.5} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selectedProject?.name || '—'}
        </div>
        <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 1 }}>
          {siteCount} site{siteCount !== 1 ? 's' : ''} monitored
        </div>
      </div>
      <Trees size={14} color="var(--color-green)" strokeWidth={1.5} />
    </div>
  </div>
);

export default AnalyticsStream;
