import React, { useState } from 'react';
import { translations, type Language } from '../utils/translations';
import { GisMap } from '../components/GisMap';

interface Complaint {
  id: string;
  category: string;
  locationName: string;
  latitude: number;
  longitude: number;
  severity: string;
  status: string;
  citizenName: string;
  citizenPhone: string;
  dateReported: string;
  description: string;
  assignedCrew: string;
  history: any[];
}

interface ControlRoomProps {
  lang: Language;
  complaints: Complaint[];
  users: any[];
  onRefresh: () => void;
  onShowToast?: (msg: string) => void;
  isMobile?: boolean;
}

export const ControlRoom: React.FC<ControlRoomProps> = ({ lang, complaints, users, onRefresh, onShowToast, isMobile }) => {
  const t = translations[lang];

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<string>('All');
  const [emergencyText, setEmergencyText] = useState('');
  const [dispatchAlerts, setDispatchAlerts] = useState<string[]>([]);
  const [reassignTarget, setReassignTarget] = useState('');
  const [reassignNotes, setReassignNotes] = useState('');
  const [isActioning, setIsActioning] = useState(false);

  // Dynamic Operations KPI calculations
  const totalPending = complaints.filter(c => c.status !== 'Resolved').length;
  const criticalCount = complaints.filter(c => c.severity === 'Critical' && c.status !== 'Resolved').length;
  const activeCrewsCount = users.filter(u => u.role === 'Crew').length;
  const busyCrewsCount = users.filter(u => u.role === 'Crew' && complaints.some(c => c.assignedCrew === u.id && c.status !== 'Resolved')).length;
  const dispatchRate = activeCrewsCount > 0 ? ((busyCrewsCount / activeCrewsCount) * 100).toFixed(0) : '0';

  // Filter complaints
  const filtered = complaints.filter(c => {
    if (filterSeverity === 'All') return true;
    if (filterSeverity === 'Critical') return c.severity === 'Critical';
    if (filterSeverity === 'Active') return c.status !== 'Resolved';
    return true;
  });

  const selected = complaints.find(c => c.id === selectedId);

  // Filter crews
  const crews = users.filter(u => u.role === 'Crew');

  const handleReassign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId || !reassignTarget) return;

    setIsActioning(true);
    try {
      const res = await fetch(`/api/complaints/${selectedId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          crewId: reassignTarget,
          notes: reassignNotes || 'Junior Engineer dispatched crew via manual override.'
        })
      });
      if (res.ok) {
        if (onShowToast) {
          const crewName = crews.find(cr => cr.id === reassignTarget)?.name || 'Crew Alpha';
          onShowToast(`📩 Sent to crew lead Murugan (8925081899): "Neer Ugam: Grievance ${selectedId} assigned to ${crewName}. Proceed to site immediately."`);
        }
        setReassignNotes('');
        setReassignTarget('');
        onRefresh();
      } else {
        alert('Reassignment failed.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsActioning(false);
    }
  };

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emergencyText.trim()) return;

    setDispatchAlerts(prev => [
      `📢 [RADIO BROADCAST] (${new Date().toLocaleTimeString()}): ${emergencyText}`,
      ...prev
    ]);
    setEmergencyText('');
  };

  return (
    <div className="dashboard-grid col-12" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(12, 1fr)', gap: '20px' }}>
      
      {/* Header Info */}
      <div className="col-12 glass-panel" style={{ padding: '15px 20px', background: '#F8FAFC', display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between', gap: isMobile ? '12px' : '0', borderLeft: '4px solid var(--primary)' }}>
        <div>
          <h2 style={{ color: 'var(--primary)', fontSize: '1.2rem', fontWeight: 800 }}>
            {lang === 'ta' ? 'இளநிலைப் பொறியாளர் செயல்பாட்டு கன்சோல்' : 'Junior Engineer (JE) Operations Desk'}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '2px' }}>
            Live GIS Grievance Tracker Mapping | Manual Crew Allocation & Overrides | Radio Notices Transmissions.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
          <button className={`btn ${filterSeverity === 'All' ? 'btn-primary' : 'btn-secondary'}`} style={{ fontSize: '0.75rem', padding: '4px 10px' }} onClick={() => setFilterSeverity('All')}>All Grievances</button>
          <button className={`btn ${filterSeverity === 'Critical' ? 'btn-primary' : 'btn-secondary'}`} style={{ fontSize: '0.75rem', padding: '4px 10px' }} onClick={() => setFilterSeverity('Critical')}>🔥 Critical</button>
          <button className={`btn ${filterSeverity === 'Active' ? 'btn-primary' : 'btn-secondary'}`} style={{ fontSize: '0.75rem', padding: '4px 10px' }} onClick={() => setFilterSeverity('Active')}>⚙ Active</button>
        </div>
      </div>

      {/* Live Operations KPI Bar */}
      <div className="col-12" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap: '15px' }}>
        <div className="glass-panel" style={{ padding: '12px 16px', background: '#FFFFFF', borderLeft: '3px solid var(--accent)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px', fontWeight: 'bold' }}>Active Backlog</span>
            <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--primary)', marginTop: '2px' }}>{totalPending} Tickets</div>
          </div>
          <span style={{ fontSize: '1.5rem' }}>📋</span>
        </div>

        <div className="glass-panel" style={{ padding: '12px 16px', background: '#FFFFFF', borderLeft: '3px solid var(--danger)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px', fontWeight: 'bold' }}>🔥 Urgent Repairs</span>
            <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--danger)', marginTop: '2px' }}>{criticalCount} Critical</div>
          </div>
          <span style={{ fontSize: '1.5rem' }}>⚡</span>
        </div>

        <div className="glass-panel" style={{ padding: '12px 16px', background: '#FFFFFF', borderLeft: '3px solid var(--success)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px', fontWeight: 'bold' }}>Crews Deployed</span>
            <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--success)', marginTop: '2px' }}>{busyCrewsCount} / {activeCrewsCount}</div>
          </div>
          <span style={{ fontSize: '1.5rem' }}>👷‍♂️</span>
        </div>

        <div className="glass-panel" style={{ padding: '12px 16px', background: '#FFFFFF', borderLeft: '3px solid var(--secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px', fontWeight: 'bold' }}>Dispatch Rate</span>
            <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--secondary)', marginTop: '2px' }}>{dispatchRate}%</div>
          </div>
          <span style={{ fontSize: '1.5rem' }}>📊</span>
        </div>
      </div>

      {/* Row 2: Old Master GIS Map (Plots all incident pins) */}
      <div className="col-8 glass-panel" style={{ height: 'fit-content' }}>
        <div className="card-header">
          <h3>🗺 Master GIS Incident Map (All Ward Grievances)</h3>
        </div>
        <GisMap
          complaints={complaints}
          selectedComplaintId={selectedId || undefined}
          onSelectComplaint={(id) => setSelectedId(id)}
          height="300px"
        />
      </div>

      {/* Row 2 Right: Emergency Radio Panel */}
      <div className="col-4 glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
        <div className="card-header">
          <h3>📢 Radio Broadcast Transmitter</h3>
        </div>
        <div className="card-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <form onSubmit={handleBroadcast}>
            <div className="form-group" style={{ marginBottom: '6px' }}>
              <textarea
                className="form-textarea"
                placeholder="Broadcast instant audio notice to all crew radios..."
                value={emergencyText}
                onChange={e => setEmergencyText(e.target.value)}
                style={{ minHeight: '50px', fontSize: '0.8rem' }}
              />
            </div>
            <button type="submit" className="btn btn-danger" style={{ width: '100%', fontSize: '0.72rem', padding: '6px' }}>
              Send Radio Alert
            </button>
          </form>

          <div style={{ flex: 1, minHeight: '110px', maxHeight: '130px', overflowY: 'auto', background: '#F8FAFC', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '8px' }}>
            <p style={{ fontSize: '0.68rem', color: 'var(--primary)', fontWeight: 'bold', marginBottom: '4px', borderBottom: '1px solid var(--border-color)', paddingBottom: '2px' }}>
              Active Radio Feed Logs
            </p>
            {dispatchAlerts.length === 0 ? (
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '20px' }}>No active radio broadcasts.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {dispatchAlerts.map((a, i) => (
                  <div key={i} style={{ fontSize: '0.68rem', color: 'var(--danger)', borderLeft: '2px solid var(--danger)', paddingLeft: '6px', lineHeight: '1.2' }}>
                    {a}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 3: New Full Width Grievance Registry Table (JE style) */}
      <div className="col-12 glass-panel">
        <div className="card-header">
          <h3>📋 Incoming Municipal Grievance Registry ({filtered.length})</h3>
        </div>
        <div className="card-body">
          {filtered.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '30px' }}>{t.noComplaints}</p>
          ) : (
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ minWidth: '100px', whiteSpace: 'nowrap' }}>Grievance ID</th>
                    <th style={{ minWidth: '130px', whiteSpace: 'nowrap' }}>Category</th>
                    <th style={{ minWidth: '240px' }}>Site Location</th>
                    <th style={{ minWidth: '130px', whiteSpace: 'nowrap' }}>Assigned Crew</th>
                    <th style={{ minWidth: '100px', whiteSpace: 'nowrap' }}>Severity</th>
                    <th style={{ minWidth: '100px', whiteSpace: 'nowrap' }}>Status</th>
                    <th style={{ minWidth: '120px', whiteSpace: 'nowrap' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(c => {
                    const crewObj = crews.find(cr => cr.id === c.assignedCrew) || { name: 'Unassigned' };
                    return (
                      <tr key={c.id} style={{ background: selectedId === c.id ? '#F1F5F9' : 'transparent' }}>
                        <td style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{c.id}</td>
                        <td style={{ fontWeight: 'bold' }}>{c.category}</td>
                        <td style={{ fontSize: '0.78rem' }}>{c.locationName}</td>
                        <td style={{ fontSize: '0.78rem', color: c.assignedCrew ? 'var(--text-dark)' : 'var(--danger)', fontWeight: c.assignedCrew ? 'bold' : 'normal' }}>
                          👷‍♂️ {crewObj.name}
                        </td>
                        <td>
                          <span className={`severity-indicator sev-${c.severity.toLowerCase()}`}>
                            {c.severity}
                          </span>
                        </td>
                        <td>
                          <span className={`status-pill status-${c.status.toLowerCase().replace(/\s/g, '')}`} style={{ fontSize: '0.65rem' }}>
                            {c.status}
                          </span>
                        </td>
                        <td>
                          <button
                            className={`btn ${selectedId === c.id ? 'btn-primary' : 'btn-accent'}`}
                            style={{ padding: '4px 10px', fontSize: '0.7rem' }}
                            onClick={() => setSelectedId(c.id)}
                          >
                            {selectedId === c.id ? 'Inspecting' : 'Track / Dispatch'}
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

      {/* Row 4: New Split-Pane Dispatch Workbench (Centers the selected coordinate pin) */}
      {selected && (
        <div className="col-12 glass-panel" style={{ animation: 'fadeIn 0.3s ease-out', border: '1.5px solid var(--accent)' }}>
          <div className="card-header" style={{ background: 'var(--accent-light)' }}>
            <h3 style={{ color: 'var(--primary-dark)' }}>🎛 Live Dispatch Workbench: {selected.id}</h3>
            <button 
              onClick={() => setSelectedId(null)}
              style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '1.25rem', fontWeight: 'bold' }}
            >
              &times;
            </button>
          </div>
          <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            
            {/* Split Left: Focused Coordinate location map */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderRight: '1px solid var(--border-color)', paddingRight: '24px' }}>
              <h4 style={{ fontSize: '0.82rem', fontWeight: '800', color: 'var(--primary)', textTransform: 'uppercase' }}>
                📍 Local Ward GPS Pinpoint Mapping
              </h4>
              <GisMap
                complaints={[selected]}
                selectedComplaintId={selected.id}
                onSelectComplaint={() => {}}
                height="220px"
              />
              <div style={{ background: '#F8FAFC', padding: '10px', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '0.78rem', marginTop: '10px' }}>
                <strong style={{ color: 'var(--primary)' }}>Citizen Grievance Description:</strong>
                <p style={{ color: 'var(--text-dark)', marginTop: '4px' }}>"{selected.description}"</p>
                <p style={{ color: 'var(--warning)', fontSize: '0.72rem', marginTop: '6px', fontWeight: 'bold' }}>
                  Reporter: {selected.citizenName} ({selected.citizenPhone})
                </p>
              </div>
            </div>

            {/* Split Right: Dispatch Override Allocation controls */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <h4 style={{ fontSize: '0.82rem', fontWeight: '800', color: 'var(--primary)', textTransform: 'uppercase' }}>
                Dispatch Allocating & Override Orders
              </h4>
              
              {selected.status !== 'Resolved' ? (
                <form onSubmit={handleReassign} style={{ background: '#F8FAFC', padding: '15px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                  <div className="form-group">
                    <label>Assign/Reassign Field Crew</label>
                    <select
                      className="form-select"
                      value={reassignTarget}
                      onChange={e => setReassignTarget(e.target.value)}
                      required
                      style={{ fontSize: '0.8rem', background: '#FFFFFF' }}
                    >
                      <option value="">-- Choose Crew Team --</option>
                      {crews.map(cr => (
                        <option key={cr.id} value={cr.id}>{cr.name} ({cr.ward})</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Manual Dispatch Instructions</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Operator dispatch notes or special priority override logs..."
                      value={reassignNotes}
                      onChange={e => setReassignNotes(e.target.value)}
                      style={{ fontSize: '0.8rem', background: '#FFFFFF' }}
                    />
                  </div>

                  <button type="submit" className="btn btn-accent" style={{ width: '100%', fontSize: '0.78rem', padding: '8px' }} disabled={isActioning}>
                    {selected.assignedCrew ? 'Confirm Reassignment Override' : 'Dispatch Field Crew'}
                  </button>
                </form>
              ) : (
                <div className="alert-banner success">
                  <span>✓ Complaint resolved. No further crew dispatch modifications allowed.</span>
                </div>
              )}

              <div>
                <h5 style={{ fontSize: '0.75rem', color: 'var(--primary)', marginBottom: '6px', fontWeight: 'bold' }}>Lifecycle Audit History</h5>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '120px', overflowY: 'auto' }}>
                  {selected.history.map((h, i) => (
                    <div key={i} style={{ fontSize: '0.7rem', borderLeft: '2px solid var(--primary-light)', paddingLeft: '6px' }}>
                      <div style={{ color: 'var(--primary-dark)', fontWeight: 'bold' }}>{h.action} - <span style={{ color: 'var(--warning)' }}>{h.officerName}</span></div>
                      <div style={{ color: 'var(--text-muted)' }}>{h.notes}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
