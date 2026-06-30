import React from 'react';
import { translations, type Language } from '../utils/translations';

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
}

interface CollectorProps {
  lang: Language;
  complaints: Complaint[];
  users: any[];
}

export const Collector: React.FC<CollectorProps> = ({ lang, complaints, users }) => {
  const t = translations[lang];

  // Aggregated Statistics
  const total = complaints.length;
  const resolved = complaints.filter(c => c.status === 'Resolved').length;
  const escalated = complaints.filter(c => c.escalationLevel > 0 && c.status !== 'Resolved').length;

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

  return (
    <div className="dashboard-grid col-12" style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '20px' }}>
      
      {/* Header Profile Info */}
      <div className="col-12 glass-panel" style={{ padding: '15px 20px', background: '#F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: '4px solid var(--accent)' }}>
        <div>
          <h2 style={{ color: 'var(--primary)', fontSize: '1.2rem', fontWeight: 800 }}>Coimbatore District Collectorate</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '2px' }}>
            Officer-in-Charge: <strong style={{ color: 'var(--primary)' }}>S. Kranthi Kumar Pati, IAS (District Collector)</strong> | Jurisdiction: <strong style={{ color: 'var(--primary)' }}>Coimbatore Corporation</strong>
          </p>
        </div>
        <div>
          <button className="btn btn-primary" onClick={handleExportExcel} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem' }}>
            📥 {t.exportExcel}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="col-12" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>
        
        <div className="glass-panel stat-card">
          <div>
            <span className="stat-label">Total Water Grievances</span>
            <div className="stat-val">{total}</div>
            <span className="stat-change" style={{ background: 'rgba(10, 116, 218, 0.1)', color: 'var(--secondary)' }}>
              {users.filter(u => u.role !== 'Citizen').length} Active Officers
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
            <span className="stat-label">SLA Escalations Breach</span>
            <div className="stat-val" style={{ color: 'var(--danger)' }}>{escalated}</div>
            <span className="stat-change" style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}>Action Required</span>
          </div>
          <div className="stat-icon-wrapper" style={{ color: 'var(--danger)' }}>🚨</div>
        </div>

      </div>

      {/* SLA Escalation monitoring lists */}
      <div className="col-8 glass-panel">
        <div className="card-header">
          <h3>🚨 Active Collectorate SLA Escalation Watch</h3>
        </div>
        <div className="card-body">
          {complaints.filter(c => c.escalationLevel > 0 && c.status !== 'Resolved').length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', textAlign: 'center', padding: '30px 0' }}>
              Zero active SLA breaches. All ward operations on schedule!
            </p>
          ) : (
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Category</th>
                    <th>Escalation Level</th>
                    <th>Breach Holder Authority</th>
                    <th>SLA Deadline</th>
                    <th>Actions</th>
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
                          <td style={{ fontWeight: 'bold' }}>{c.id}</td>
                          <td>{c.category}</td>
                          <td style={{ fontWeight: 'bold', color: 'var(--danger)' }}>Level {c.escalationLevel}</td>
                          <td style={{ color: 'var(--primary)', fontWeight: '700' }}>{levelRoles[c.escalationLevel] || 'High Authority'}</td>
                          <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            {new Date(c.slaDeadline).toLocaleString()}
                          </td>
                          <td>
                            <button
                              className="btn btn-primary"
                              style={{ padding: '4px 8px', fontSize: '0.65rem' }}
                              onClick={() => {
                                alert(`Collectorate Official Memo issued to ${levelRoles[c.escalationLevel]}. Required immediate report.`);
                              }}
                            >
                              Issue Memo
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

      {/* Side hotspot heatmaps */}
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
                <div style={{ width: `${(wardFails['Ward 61'] / (total || 1)) * 100}%`, background: 'var(--danger)', height: '100%', borderRadius: '3px' }}></div>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                <span>Ward 62 - Kurichi (South Zone)</span>
                <strong>{wardFails['Ward 62']} Reports</strong>
              </div>
              <div style={{ width: '100%', background: '#ECEFF1', height: '6px', borderRadius: '3px' }}>
                <div style={{ width: `${(wardFails['Ward 62'] / (total || 1)) * 100}%`, background: 'var(--warning)', height: '100%', borderRadius: '3px' }}></div>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                <span>Ward 12 - Saravanampatti (North Zone)</span>
                <strong>{wardFails['Ward 12']} Reports</strong>
              </div>
              <div style={{ width: '100%', background: '#ECEFF1', height: '6px', borderRadius: '3px' }}>
                <div style={{ width: `${(wardFails['Ward 12'] / (total || 1)) * 100}%`, background: 'var(--secondary)', height: '100%', borderRadius: '3px' }}></div>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                <span>Ward 15 - Ganapathy (North Zone)</span>
                <strong>{wardFails['Ward 15']} Reports</strong>
              </div>
              <div style={{ width: '100%', background: '#ECEFF1', height: '6px', borderRadius: '3px' }}>
                <div style={{ width: `${(wardFails['Ward 15'] / (total || 1)) * 100}%`, background: 'var(--secondary)', height: '100%', borderRadius: '3px' }}></div>
              </div>
            </div>

          </div>
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
                  <th>Active Tickets Under Charge</th>
                  <th>Avg. Resolution Speed</th>
                  <th>SLA Compliance Score</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ fontWeight: 'bold', color: 'var(--primary)' }}>Er. K. Rajesh, M.E.</td>
                  <td>Junior Engineer</td>
                  <td>South Zone (Ward 61, 62)</td>
                  <td style={{ fontWeight: 'bold', color: 'var(--warning)' }}>3 Active</td>
                  <td>14.2 Hours</td>
                  <td style={{ fontWeight: 'bold', color: 'var(--success)' }}>94.1%</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 'bold', color: 'var(--primary)' }}>Er. M. Preetha, B.E.</td>
                  <td>Assistant Engineer</td>
                  <td>North Zone (Ward 12, 15)</td>
                  <td style={{ fontWeight: 'bold', color: 'var(--success)' }}>1 Active</td>
                  <td>11.5 Hours</td>
                  <td style={{ fontWeight: 'bold', color: 'var(--success)' }}>98.2%</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 'bold', color: 'var(--primary)' }}>R. Jagadeesan</td>
                  <td>Supervisor</td>
                  <td>South Zone Wards</td>
                  <td style={{ fontWeight: 'bold', color: 'var(--warning)' }}>2 Active</td>
                  <td>16.8 Hours</td>
                  <td style={{ fontWeight: 'bold', color: 'var(--warning)' }}>88.5%</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 'bold', color: 'var(--primary)' }}>V. Ramanathan</td>
                  <td>Supervisor</td>
                  <td>North Zone Wards</td>
                  <td style={{ fontWeight: 'bold', color: 'var(--success)' }}>1 Active</td>
                  <td>12.4 Hours</td>
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
