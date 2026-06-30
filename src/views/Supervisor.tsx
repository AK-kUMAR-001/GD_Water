import React, { useState } from 'react';
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
  citizenName: string;
  citizenPhone: string;
  dateReported: string;
  description: string;
  assignedCrew: string;
  supervisorId: string;
  slaHours: number;
  slaDeadline: string;
  history: any[];
}

interface SupervisorProps {
  lang: Language;
  complaints: Complaint[];
  users: any[];
  onRefresh: () => void;
  onShowToast?: (msg: string) => void;
}

export const Supervisor: React.FC<SupervisorProps> = ({ lang, complaints, users, onRefresh, onShowToast }) => {
  const t = translations[lang];

  // Assume supervisor logged in is super-1 (R. Jagadeesan - South Zone)
  const supervisorId = 'super-1';
  const supervisorUser = users.find(u => u.id === supervisorId) || { name: 'R. Jagadeesan', zone: 'South Zone' };

  // Filter complaints assigned to this supervisor
  const myComplaints = complaints.filter(c => c.supervisorId === supervisorId);
  const unassigned = myComplaints.filter(c => c.status === 'Reported');
  const active = myComplaints.filter(c => c.status === 'Assigned' || c.status === 'In Progress' || c.status === 'Pending Verification' || c.status === 'Rejected');

  // Filter crews
  const crews = users.filter(u => u.role === 'Crew');

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dispatchCrewId, setDispatchCrewId] = useState('');
  const [dispatchNotes, setDispatchNotes] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  const selected = complaints.find(c => c.id === selectedId);

  const handleResetDemo = async () => {
    if (!confirm('Are you sure you want to reset all grievances to default mock records?')) return;
    try {
      const res = await fetch('/api/reset-demo', { method: 'POST' });
      if (res.ok) {
        onRefresh();
        alert('Database reset successful! Workflow is ready.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId || !dispatchCrewId) return;

    setIsAssigning(true);
    try {
      const res = await fetch(`/api/complaints/${selectedId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          crewId: dispatchCrewId,
          notes: dispatchNotes || 'Field Supervisor dispatched crew for urgent remediation.'
        })
      });
      if (res.ok) {
        if (onShowToast) {
          const crewName = crews.find(cr => cr.id === dispatchCrewId)?.name || 'Crew Alpha';
          onShowToast(`📩 Sent to crew lead Murugan (8925081899): "Neer Ugam: Grievance ${selectedId} assigned to ${crewName}. Proceed to site immediately."`);
        }
        setSelectedId(null);
        setDispatchCrewId('');
        setDispatchNotes('');
        onRefresh();
      } else {
        alert('Crew dispatch failed.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAssigning(false);
    }
  };

  // Find crew workload count
  const getCrewWorkload = (crewId: string) => {
    return complaints.filter(c => c.assignedCrew === crewId && c.status !== 'Resolved').length;
  };

  // Check if ticket is close to SLA breach (less than 4 hours remaining)
  const isSlaBreaching = (deadlineStr: string) => {
    const remainMs = new Date(deadlineStr).getTime() - Date.now();
    return remainMs > 0 && remainMs < 4 * 3600000;
  };

  return (
    <div className="dashboard-grid col-12" style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '20px' }}>
      
      {/* Header Profile Info */}
      <div className="col-12 glass-panel" style={{ padding: '15px 20px', background: '#F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: '4px solid var(--accent)' }}>
        <div>
          <h2 style={{ color: 'var(--primary)', fontSize: '1.2rem', fontWeight: 800 }}>Welcome back, {supervisorUser.name}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '2px' }}>
            Zone: <strong style={{ color: 'var(--primary)' }}>{supervisorUser.zone}</strong> | Jurisdiction: <strong style={{ color: 'var(--primary)' }}>Ward 61 & Ward 62 (South Division)</strong>
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button
            type="button"
            onClick={handleResetDemo}
            className="btn btn-danger"
            style={{ padding: '6px 12px', fontSize: '0.7rem', textTransform: 'none' }}
          >
            🔄 Reset Demo DB
          </button>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>MUNICIPAL ACTIONS DESK</span>
            <p style={{ color: 'var(--accent)', fontWeight: 'bold', fontSize: '0.9rem' }}>{t.supervisor} Dashboard</p>
          </div>
        </div>
      </div>

      {/* SLA Risk Warnings */}
      <div className="col-12" style={{ display: 'flex', gap: '15px' }}>
        <div className="glass-panel stat-card col-4" style={{ flex: 1 }}>
          <div>
            <span className="stat-label">Pending Dispatch</span>
            <div className="stat-val">{unassigned.length}</div>
            <span className="stat-change" style={{ background: 'var(--warning-bg)', color: 'var(--warning)' }}>Requires Crew Allocating</span>
          </div>
          <div className="stat-icon-wrapper">⚠️</div>
        </div>

        <div className="glass-panel stat-card col-4" style={{ flex: 1 }}>
          <div>
            <span className="stat-label">Active Reparation Tickets</span>
            <div className="stat-val" style={{ color: 'var(--secondary)' }}>{active.length}</div>
            <span className="stat-change" style={{ background: 'var(--info-bg)', color: 'var(--info)' }}>Field Crews Engaged</span>
          </div>
          <div className="stat-icon-wrapper">🔧</div>
        </div>

        <div className="glass-panel stat-card col-4" style={{ flex: 1 }}>
          <div>
            <span className="stat-label">Critical SLA Warnings</span>
            <div className="stat-val" style={{ color: 'var(--danger)' }}>
              {myComplaints.filter(c => c.status !== 'Resolved' && isSlaBreaching(c.slaDeadline)).length}
            </div>
            <span className="stat-change" style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}>Less than 4 Hours Left</span>
          </div>
          <div className="stat-icon-wrapper">🚨</div>
        </div>
      </div>

      {/* Left panel: Unassigned complaints queue */}
      <div className="col-8 glass-panel">
        <div className="card-header">
          <h3>📋 Grievance Dispatching Queue</h3>
        </div>
        <div className="card-body">
          {unassigned.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '30px 0' }}>
              ✓ All incoming grievances are successfully dispatched to field teams.
            </p>
          ) : (
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Category</th>
                    <th>Ward / Site</th>
                    <th>Time Filed</th>
                    <th>Severity</th>
                    <th>Dispatch</th>
                  </tr>
                </thead>
                <tbody>
                  {unassigned.map(c => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 'bold' }}>{c.id}</td>
                      <td style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{c.category}</td>
                      <td style={{ fontSize: '0.78rem' }}>{c.locationName}</td>
                      <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {new Date(c.dateReported).toLocaleTimeString()}
                      </td>
                      <td>
                        <span className={`severity-indicator sev-${c.severity.toLowerCase()}`}>
                          {c.severity}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-accent"
                          style={{ padding: '4px 10px', fontSize: '0.7rem' }}
                          onClick={() => setSelectedId(c.id)}
                        >
                          Dispatch Crew
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Right side: Dispatching dialog form */}
      <div className="col-4 glass-panel">
        <div className="card-header">
          <h3>👷‍♂️ Crew Allocation Panel</h3>
        </div>
        <div className="card-body">
          {selected ? (
            <form onSubmit={handleDispatch} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <h4 style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '0.9rem' }}>Ticket: {selected.id}</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{selected.category}</p>
                <p style={{ fontSize: '0.72rem', background: '#F8FAFC', padding: '8px', border: '1px solid var(--border-color)', borderRadius: '4px', marginTop: '6px', color: 'var(--text-dark)' }}>
                  "{selected.description}"
                </p>
              </div>

              <div className="form-group">
                <label>Select Field Crew Team</label>
                <select
                  className="form-select"
                  value={dispatchCrewId}
                  onChange={e => setDispatchCrewId(e.target.value)}
                  required
                  style={{ fontSize: '0.8rem' }}
                >
                  <option value="">-- Choose Crew --</option>
                  {crews.map(cr => (
                    <option key={cr.id} value={cr.id}>
                      {cr.name} (Active: {getCrewWorkload(cr.id)} jobs)
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Supervisor Orders & Notes</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Check pump connections, swap gasket..."
                  value={dispatchNotes}
                  onChange={e => setDispatchNotes(e.target.value)}
                  style={{ fontSize: '0.8rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setSelectedId(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={isAssigning}>
                  {isAssigning ? 'Dispatching...' : 'Assign Job'}
                </button>
              </div>
            </form>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 10px', color: 'var(--text-muted)' }}>
              <span style={{ fontSize: '2rem' }}>👷‍♂️</span>
              <p style={{ marginTop: '6px', fontSize: '0.78rem' }}>Select an active ticket from the dispatching queue on the left to allocate a repair crew and issue order guidelines.</p>
            </div>
          )}
        </div>
      </div>

      {/* Field progress tracking registry */}
      <div className="col-12 glass-panel">
        <div className="card-header">
          <h3>📊 Active Field Repairs Progress Tracker</h3>
        </div>
        <div className="card-body">
          {active.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', textAlign: 'center' }}>No active repairs in progress for this zone division.</p>
          ) : (
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Category</th>
                    <th>Site Location</th>
                    <th>Assigned Crew</th>
                    <th>SLA Deadline Countdown</th>
                    <th>Status Status</th>
                    <th>Action Contact</th>
                  </tr>
                </thead>
                <tbody>
                  {active.map(c => {
                    const crewObj = crews.find(cr => cr.id === c.assignedCrew) || { name: 'Unassigned' };
                    const isBreached = new Date(c.slaDeadline).getTime() < Date.now();
                    return (
                      <tr key={c.id}>
                        <td style={{ fontWeight: 'bold' }}>{c.id}</td>
                        <td style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{c.category}</td>
                        <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{c.locationName}</td>
                        <td style={{ fontWeight: 'bold' }}>👷‍♂️ {crewObj.name}</td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            <SlaTimer deadline={c.slaDeadline} />
                            <div className="sla-countdown">
                              <div
                                className={`sla-fill ${isBreached ? 'danger' : (isSlaBreaching(c.slaDeadline) ? 'warning' : 'safe')}`}
                                style={{ width: isBreached ? '100%' : '50%' }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`status-pill status-${c.status.toLowerCase().replace(/\s/g, '')}`}>
                            {c.status}
                          </span>
                        </td>
                        <td>
                          <a
                            href={`https://api.whatsapp.com/send?phone=918925081899&text=${encodeURIComponent(`Neer Ugam: Crew Alpha, please update supervisor on progress of ticket ${c.id} (${c.category}) at ${c.locationName}.`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn"
                            style={{ background: '#25D366', color: 'white', padding: '4px 10px', fontSize: '0.65rem', textTransform: 'none', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
                          >
                            💬 WhatsApp
                          </a>
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

    </div>
  );
};
