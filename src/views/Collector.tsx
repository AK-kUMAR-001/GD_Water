import React from 'react';
import { translations, type Language } from '../utils/translations';
import { SlaTimer } from '../components/SlaTimer';

interface Complaint {
  id: string;
  category: string;
  locationName: string;
  latitude: number;
  longitude: number;
  severity: string;
  status: string;
  dateReported: string;
  dateVerified: string;
  slaHours: number;
  slaDeadline: string;
  escalationLevel: number;
  supervisorId: string;
  engineerId: string;
}

interface CollectorProps {
  lang: Language;
  complaints: Complaint[];
  users: any[];
  isMobile?: boolean;
}

export const Collector: React.FC<CollectorProps> = ({ lang, complaints, users, isMobile }) => {
  const t = translations[lang];

  // Aggregated Statistics (Calculated Dynamically)
  const total = complaints.length;
  const resolved = complaints.filter(c => c.status === 'Resolved').length;
  const escalated = complaints.filter(c => c.escalationLevel > 0 && c.status !== 'Resolved').length;
  const activeCount = complaints.filter(c => c.status !== 'Resolved').length;

  // Average resolution speed
  const resolvedDiffs = complaints
    .filter(c => c.status === 'Resolved' && c.dateVerified && c.dateReported)
    .map(c => new Date(c.dateVerified).getTime() - new Date(c.dateReported).getTime());
  const avgSpeedHours = resolvedDiffs.length > 0
    ? (resolvedDiffs.reduce((a, b) => a + b, 0) / resolvedDiffs.length / 3600000).toFixed(1)
    : '14.5';

  const complianceRate = total > 0
    ? ((resolved / total) * 100).toFixed(1)
    : '92.3';

  // Excel report download handler
  const handleExportExcel = () => {
    window.open('/api/reports/excel', '_blank');
  };

  // Hotspots count by ward for GIS Heatmap representation
  const wardFails = {
    'Ward 61': complaints.filter(c => c.locationName.includes('Ward 61') || c.locationName.includes('Sundarapuram')).length,
    'Ward 62': complaints.filter(c => c.locationName.includes('Ward 62') || c.locationName.includes('Kurichi')).length,
    'Ward 12': complaints.filter(c => c.locationName.includes('Ward 12') || c.locationName.includes('Saravanampatti')).length,
    'Ward 15': complaints.filter(c => c.locationName.includes('Ward 15') || c.locationName.includes('Ganapathy')).length,
  };

  // Dynamic Category Calculations
  const bursts = complaints.filter(c => c.category === 'Pipeline Burst').length;
  const sewer = complaints.filter(c => c.category === 'Sewer Mixing').length;
  const contamination = complaints.filter(c => c.category === 'Water Contamination').length;
  const lowPressure = complaints.filter(c => c.category === 'Low Water Pressure').length;
  const others = complaints.filter(c => !['Pipeline Burst', 'Sewer Mixing', 'Water Contamination', 'Low Water Pressure'].includes(c.category)).length;

  const categoriesList = [
    { name: lang === 'ta' ? 'குழாய் வெடிப்பு (Pipeline Burst)' : 'Pipeline Burst', count: bursts, color: '#E64A19' },
    { name: lang === 'ta' ? 'சாக்கடை கலப்பு (Sewer Mixing)' : 'Sewer Mixing', count: sewer, color: '#D81B60' },
    { name: lang === 'ta' ? 'நீர் மாசுபாடு (Water Contamination)' : 'Water Contamination', count: contamination, color: '#8E24AA' },
    { name: lang === 'ta' ? 'குறைந்த நீர் அழுத்தம் (Low Water Pressure)' : 'Low Water Pressure', count: lowPressure, color: '#0288D1' },
    { name: lang === 'ta' ? 'இதர புகார்கள் (Others)' : 'Other Complaints', count: others, color: '#00897B' },
  ];

  // Dynamic Staff active workload counters
  const rajeshActive = complaints.filter(c => c.engineerId === 'eng-1' && c.status !== 'Resolved').length;
  const preethaActive = complaints.filter(c => c.engineerId === 'eng-2' && c.status !== 'Resolved').length;
  const jagadeesanActive = complaints.filter(c => c.supervisorId === 'super-1' && c.status !== 'Resolved').length;
  const ramanathanActive = complaints.filter(c => c.supervisorId === 'super-2' && c.status !== 'Resolved').length;

  return (
    <div className="dashboard-grid col-12" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(12, 1fr)', gap: '20px' }}>
      
      {/* Header Profile Info */}
      <div className="col-12 glass-panel" style={{ padding: '15px 20px', background: '#F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: '4px solid var(--accent)' }}>
        <div>
          <h2 style={{ color: 'var(--primary)', fontSize: '1.2rem', fontWeight: 800 }}>Coimbatore District Collectorate Desk</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '2px' }}>
            Officer-in-Charge: <strong style={{ color: 'var(--primary)' }}>S. Kranthi Kumar Pati, IAS (District Collector)</strong> | Jurisdiction: <strong style={{ color: 'var(--primary)' }}>Coimbatore Corporation</strong>
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-primary" onClick={handleExportExcel} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem' }}>
            📥 {t.exportExcel}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="col-12" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap: '15px' }}>
        
        <div className="glass-panel stat-card">
          <div>
            <span className="stat-label">Total / Active Grievances</span>
            <div className="stat-val">{total} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/ {activeCount} Pending</span></div>
            <span className="stat-change" style={{ background: 'rgba(10, 116, 218, 0.1)', color: 'var(--secondary)' }}>
              {users.filter(u => u.role !== 'Citizen').length} Active Wards Officers
            </span>
          </div>
          <div className="stat-icon-wrapper">🚰</div>
        </div>

        <div className="glass-panel stat-card">
          <div>
            <span className="stat-label">SLA Compliance Rate</span>
            <div className="stat-val" style={{ color: 'var(--success)' }}>{complianceRate}%</div>
            <span className="stat-change" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>Target: &gt;90%</span>
          </div>
          <div className="stat-icon-wrapper" style={{ color: 'var(--success)' }}>📊</div>
        </div>

        <div className="glass-panel stat-card">
          <div>
            <span className="stat-label">Avg. Resolution Speed</span>
            <div className="stat-val" style={{ color: 'var(--warning)' }}>{avgSpeedHours}h</div>
            <span className="stat-change" style={{ background: 'var(--warning-bg)', color: 'var(--warning)' }}>Limit: 24.0h</span>
          </div>
          <div className="stat-icon-wrapper" style={{ color: 'var(--warning)' }}>⏱</div>
        </div>

        <div className="glass-panel stat-card">
          <div>
            <span className="stat-label">Active SLA Breaches</span>
            <div className="stat-val" style={{ color: 'var(--danger)' }}>{escalated}</div>
            <span className="stat-change" style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}>Action Memo Required</span>
          </div>
          <div className="stat-icon-wrapper" style={{ color: 'var(--danger)' }}>🚨</div>
        </div>

      </div>

      {/* Row 2 Left: SLA Escalation monitoring lists */}
      <div className="col-8 glass-panel">
        <div className="card-header">
          <h3>🚨 Active Collectorate SLA Escalation Watch</h3>
        </div>
        <div className="card-body">
          {complaints.filter(c => c.escalationLevel > 0 && c.status !== 'Resolved').length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
              <span style={{ fontSize: '2.2rem' }}>✓</span>
              <p style={{ marginTop: '6px', fontSize: '0.82rem' }}>Zero active SLA breaches. All ward operations on schedule!</p>
            </div>
          ) : (
            <div className="data-table-container" style={{ maxHeight: '250px', overflowY: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Grievance ID</th>
                    <th>Category</th>
                    <th>Breached Authority</th>
                    <th>SLA Deadline Countdown</th>
                    <th>Administrative Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {complaints
                    .filter(c => c.escalationLevel > 0 && c.status !== 'Resolved')
                    .map(c => {
                      const levelRoles = [
                        'Crew representative',
                        'Supervisor R. Jagadeesan',
                        'Junior Engineer',
                        'Executive Engineer',
                        'Municipal Commissioner',
                        'District Collector',
                        'State Water Department'
                      ];
                      return (
                        <tr key={c.id}>
                          <td style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{c.id}</td>
                          <td style={{ fontWeight: 'bold' }}>{c.category}</td>
                          <td style={{ color: 'var(--danger)', fontWeight: '700' }}>
                            Level {c.escalationLevel}: {levelRoles[c.escalationLevel] || 'High Authority'}
                          </td>
                          <td>
                            <SlaTimer deadline={c.slaDeadline} />
                          </td>
                          <td>
                            <button
                              className="btn btn-danger"
                              style={{ padding: '4px 8px', fontSize: '0.65rem' }}
                              onClick={() => {
                                alert(`Collectorate Official Memo issued to ${levelRoles[c.escalationLevel]}. Required immediate report.`);
                              }}
                            >
                              Issue Breach Memo
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Row 2 Right: Side hotspot heatmaps */}
      <div className="col-4 glass-panel">
        <div className="card-header">
          <h3>🔥 Ward Incident Hotspots</h3>
        </div>
        <div className="card-body">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                <span>Ward 61 - Sundarapuram (South Zone)</span>
                <strong>{wardFails['Ward 61']} Reports</strong>
              </div>
              <div style={{ width: '100%', background: '#ECEFF1', height: '6px', borderRadius: '3px' }}>
                <div style={{ width: `${total > 0 ? (wardFails['Ward 61'] / total) * 100 : 0}%`, background: 'var(--danger)', height: '100%', borderRadius: '3px' }}></div>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                <span>Ward 62 - Kurichi (South Zone)</span>
                <strong>{wardFails['Ward 62']} Reports</strong>
              </div>
              <div style={{ width: '100%', background: '#ECEFF1', height: '6px', borderRadius: '3px' }}>
                <div style={{ width: `${total > 0 ? (wardFails['Ward 62'] / total) * 100 : 0}%`, background: 'var(--warning)', height: '100%', borderRadius: '3px' }}></div>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                <span>Ward 12 - Saravanampatti (North Zone)</span>
                <strong>{wardFails['Ward 12']} Reports</strong>
              </div>
              <div style={{ width: '100%', background: '#ECEFF1', height: '6px', borderRadius: '3px' }}>
                <div style={{ width: `${total > 0 ? (wardFails['Ward 12'] / total) * 100 : 0}%`, background: 'var(--secondary)', height: '100%', borderRadius: '3px' }}></div>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                <span>Ward 15 - Ganapathy (North Zone)</span>
                <strong>{wardFails['Ward 15']} Reports</strong>
              </div>
              <div style={{ width: '100%', background: '#ECEFF1', height: '6px', borderRadius: '3px' }}>
                <div style={{ width: `${total > 0 ? (wardFails['Ward 15'] / total) * 100 : 0}%`, background: 'var(--secondary)', height: '100%', borderRadius: '3px' }}></div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Row 3: Dynamic Category Analytics Chart Panel */}
      <div className="col-12 glass-panel">
        <div className="card-header">
          <h3>📈 Dynamic Grievance Category Distribution</h3>
        </div>
        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {categoriesList.map((cat, index) => {
            const pct = total > 0 ? ((cat.count / total) * 100).toFixed(1) : '0.0';
            return (
              <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <span style={{ width: '220px', fontSize: '0.78rem', fontWeight: 'bold', color: 'var(--text-dark)' }}>
                  {cat.name}
                </span>
                <div style={{ flex: 1, background: '#ECEFF1', height: '16px', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, background: cat.color, height: '100%', borderRadius: '4px', transition: 'width 0.5s ease-out' }}></div>
                </div>
                <span style={{ width: '80px', fontSize: '0.78rem', fontWeight: 'bold', color: cat.color, textAlign: 'right' }}>
                  {cat.count} ({pct}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Staff work statistics and ranking */}
      <div className="col-12 glass-panel">
        <div className="card-header">
          <h3>👨‍💼 Corporate Division Staff Workload & Performance Scorecards</h3>
        </div>
        <div className="card-body">
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Officer Name</th>
                  <th>Designation Role</th>
                  <th>Division Area</th>
                  <th>Active Wards Charges</th>
                  <th>SLA Compliance Score</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ fontWeight: 'bold', color: 'var(--primary)' }}>Er. K. Rajesh, M.E.</td>
                  <td>Junior Engineer</td>
                  <td>South Zone (Ward 61, 62)</td>
                  <td style={{ fontWeight: 'bold', color: rajeshActive > 0 ? 'var(--danger)' : 'var(--success)' }}>
                    📂 {rajeshActive} Active Grievances
                  </td>
                  <td style={{ fontWeight: 'bold', color: 'var(--success)' }}>94.1%</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 'bold', color: 'var(--primary)' }}>Er. M. Preetha, B.E.</td>
                  <td>Assistant Engineer</td>
                  <td>North Zone (Ward 12, 15)</td>
                  <td style={{ fontWeight: 'bold', color: preethaActive > 0 ? 'var(--warning)' : 'var(--success)' }}>
                    📂 {preethaActive} Active Grievances
                  </td>
                  <td style={{ fontWeight: 'bold', color: 'var(--success)' }}>98.2%</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 'bold', color: 'var(--primary)' }}>R. Jagadeesan</td>
                  <td>Supervisor</td>
                  <td>South Zone Wards</td>
                  <td style={{ fontWeight: 'bold', color: jagadeesanActive > 0 ? 'var(--danger)' : 'var(--success)' }}>
                    📂 {jagadeesanActive} Dispatched
                  </td>
                  <td style={{ fontWeight: 'bold', color: 'var(--warning)' }}>88.5%</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 'bold', color: 'var(--primary)' }}>V. Ramanathan</td>
                  <td>Supervisor</td>
                  <td>North Zone Wards</td>
                  <td style={{ fontWeight: 'bold', color: ramanathanActive > 0 ? 'var(--warning)' : 'var(--success)' }}>
                    📂 {ramanathanActive} Dispatched
                  </td>
                  <td style={{ fontWeight: 'bold', color: 'var(--success)' }}>95.0%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
};
