import React, { useState } from 'react';
import { type Language } from '../utils/translations';
import { GisMap } from '../components/GisMap';
import { getBackendUrl } from '../utils/api';

interface Complaint {
  id: string;
  category: string;
  locationName: string;
  latitude: number;
  longitude: number;
  severity: string;
  status: string;
  description: string;
  imageUrl: string;
  afterImageUrl: string;
  assignedCrew: string;
  slaDeadline: string;
  history: any[];
}

interface RepairCrewProps {
  lang: Language;
  complaints: Complaint[];
  onRefresh: () => void;
  onShowToast?: (msg: string) => void;
  isMobile?: boolean;
}

export const RepairCrew: React.FC<RepairCrewProps> = ({ lang, complaints, onRefresh, onShowToast, isMobile }) => {
  // Assume crew-1 is logged in (Crew Alpha - Murugan)
  const crewId = 'crew-1';
  const myTasks = complaints.filter(c => c.assignedCrew === crewId && c.status !== 'Resolved');

  const [activeTaskId, setActiveTaskId] = useState<string | null>(myTasks[0]?.id || null);
  const [workNotes, setWorkNotes] = useState('');
  const [beforeFile, setBeforeFile] = useState<File | null>(null);
  const [afterFile, setAfterFile] = useState<File | null>(null);
  const [beforePreview, setBeforePreview] = useState<string | null>(null);
  const [afterPreview, setAfterPreview] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const activeTask = complaints.find(c => c.id === activeTaskId);



  // Set mock photos to make testing easy without needing local files
  const applyMockPhotos = () => {
    setBeforePreview('https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=600'); // construction leak site
    setAfterPreview('https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=600');  // repaired pipeline joint
  };

  const handleStartWork = async () => {
    if (!activeTaskId) return;
    setIsUpdating(true);
    try {
      const res = await fetch(getBackendUrl(`/api/complaints/${activeTaskId}/crew-update`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startWork: 'true',
          notes: 'Crew arrived at location and initiated pipeline cutoff.'
        })
      });
      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCompleteRepair = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTaskId) return;

    setIsUpdating(true);
    const formData = new FormData();
    formData.append('notes', workNotes || 'Repair complete. Swapped gasket and verified seal.');
    formData.append('startWork', 'false');

    // If actual files were selected, append them.
    if (beforeFile) formData.append('beforePhoto', beforeFile);
    if (afterFile) formData.append('afterPhoto', afterFile);

    try {
      const bodyPayload = beforeFile || afterFile 
        ? formData 
        : JSON.stringify({
            notes: workNotes || 'Repair complete. Leak sealed.',
            startWork: 'false',
            beforePhotoUrl: beforePreview,
            afterPhotoUrl: afterPreview
          });
          
      const headers: HeadersInit = beforeFile || afterFile 
        ? {} 
        : { 'Content-Type': 'application/json' };

      const res = await fetch(getBackendUrl(`/api/complaints/${activeTaskId}/crew-update`), {
        method: 'POST',
        headers,
        body: beforeFile || afterFile ? formData : bodyPayload
      });

      if (res.ok) {
        if (onShowToast) {
          onShowToast(`📩 Sent to JE (Assistant Engineer): "Neer Ugam: Grievance ${activeTaskId} repair completed by Crew Alpha. Awaiting audit sign-off."`);
        }
        setWorkNotes('');
        setBeforeFile(null);
        setAfterFile(null);
        setBeforePreview(null);
        setAfterPreview(null);
        setActiveTaskId(null);
        onRefresh();
      } else {
        alert('Complete repair failed.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="dashboard-grid col-12" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(12, 1fr)', gap: '20px' }}>
      
      {/* Header Profile Banner */}
      <div className="col-12 glass-panel" style={{ padding: '15px 20px', background: '#F8FAFC', display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between', gap: isMobile ? '12px' : '0', borderLeft: '4px solid var(--accent)' }}>
        <div>
          <h2 style={{ color: 'var(--primary)', fontSize: '1.2rem', fontWeight: 800 }}>{lang === 'ta' ? 'களப்பணி பழுதுநீக்குதல் பிரிவு' : 'Field Crew Action Terminal'}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '2px' }}>
            Crew Assigned: <strong style={{ color: 'var(--primary)' }}>Crew Alpha (Murugan)</strong> | Area Assignment: <strong style={{ color: 'var(--primary)' }}>Ward 61 (South Zone)</strong>
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ textAlign: isMobile ? 'left' : 'right' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>BSNL FIELD CONNECTED</span>
            <p style={{ color: 'var(--accent)', fontWeight: 'bold', fontSize: '0.9rem' }}>Reparation Desk</p>
          </div>
        </div>
      </div>

      {/* Left panel: Work List */}
      <div className="col-4 glass-panel">
        <div className="card-header">
          <h3>📋 Assigned Grievance Tasks ({myTasks.length})</h3>
        </div>
        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {myTasks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 10px', background: '#F8FAFC', border: '1.5px dashed var(--border-color)', borderRadius: '4px' }}>
              <span style={{ fontSize: '1.85rem', color: 'var(--success)' }}>🎉</span>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>No active tasks! All assigned repairs are complete.</p>
            </div>
          ) : (
            myTasks.map(t => (
              <div
                key={t.id}
                onClick={() => setActiveTaskId(t.id)}
                style={{
                  background: activeTaskId === t.id ? '#ECEFF1' : '#FFFFFF',
                  border: activeTaskId === t.id ? '1.5px solid var(--primary)' : '1px solid var(--border-color)',
                  padding: '12px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  transition: 'var(--transition)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontWeight: '800', color: 'var(--primary)' }}>{t.id}</span>
                  <span className={`status-pill status-${t.status.toLowerCase().replace(/\s/g, '')}`} style={{ fontSize: '0.62rem' }}>
                    {t.status}
                  </span>
                </div>
                <p style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>{t.category}</p>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  📍 {t.locationName}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right panel: Focused Workbench */}
      <div className="col-8 glass-panel">
        <div className="card-header">
          <h3>🔧 Active Job Worksite</h3>
        </div>
        <div className="card-body">
          {activeTask ? (
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '20px' }}>
              
              {/* Left Pane of details: Map navigation & text details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderRight: isMobile ? 'none' : '1px solid var(--border-color)', paddingRight: isMobile ? '0' : '20px' }}>
                <h4 style={{ fontSize: '0.82rem', fontWeight: '800', color: 'var(--primary)', textTransform: 'uppercase' }}>
                  📍 Worksite Routing & Info
                </h4>
                
                <div style={{ background: '#F8FAFC', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '10px', fontSize: '0.78rem' }}>
                  <p style={{ fontWeight: 'bold', color: 'var(--text-muted)' }}>Location Details:</p>
                  <p style={{ color: 'var(--text-dark)', marginTop: '2px', fontWeight: '700' }}>{activeTask.locationName}</p>
                  
                  <p style={{ fontWeight: 'bold', color: 'var(--text-muted)', marginTop: '8px' }}>Description:</p>
                  <p style={{ color: 'var(--text-dark)', marginTop: '2px' }}>{activeTask.description}</p>
                </div>

                <GisMap
                  complaints={[activeTask]}
                  selectedComplaintId={activeTask.id}
                  onSelectComplaint={() => {}}
                  height="160px"
                />
              </div>

              {/* Right Pane of details: Job Action Complete forms */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <h4 style={{ fontSize: '0.82rem', fontWeight: '800', color: 'var(--primary)', textTransform: 'uppercase' }}>
                  Job Status Update Console
                </h4>
                
                {activeTask.status === 'Assigned' && (
                  <div style={{ textAlign: 'center', padding: '30px 10px', background: '#F8FAFC', border: '1px solid var(--border-color)', borderRadius: '4px' }}>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '15px' }}>You have arrived at the designated leak location coordinates.</p>
                    <button
                      type="button"
                      className="btn btn-accent"
                      style={{ width: '100%', padding: '10px' }}
                      onClick={handleStartWork}
                      disabled={isUpdating}
                    >
                      📍 Confirm Arrival & Start Work
                    </button>
                  </div>
                )}

                {activeTask.status === 'In Progress' && (
                  <form onSubmit={handleCompleteRepair} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    
                    {/* Media Attachments Container */}
                    <div style={{ background: '#F8FAFC', border: '1px dashed var(--border-color)', borderRadius: '4px', padding: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-dark)', fontWeight: 'bold' }}>Verification Media</span>
                        <button
                          type="button"
                          onClick={applyMockPhotos}
                          className="btn btn-secondary"
                          style={{ padding: '2px 8px', fontSize: '0.65rem', textTransform: 'none' }}
                        >
                          📷 Autofill Verification Photos
                        </button>
                      </div>

                      <div style={{ display: 'flex', gap: '10px' }}>
                        <div style={{ flex: 1, textAlign: 'center' }}>
                          <div style={{ height: '40px', background: '#FFFFFF', borderRadius: '4px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.62rem', color: 'var(--text-muted)' }}>
                            Before Work
                          </div>
                          {beforePreview && <img src={beforePreview} alt="Before" style={{ width: '100%', height: '50px', objectFit: 'cover', borderRadius: '4px', marginTop: '4px', border: '1px solid var(--border-color)' }} />}
                        </div>
                        <div style={{ flex: 1, textAlign: 'center' }}>
                          <div style={{ height: '40px', background: '#FFFFFF', borderRadius: '4px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.62rem', color: 'var(--text-muted)' }}>
                            After Work
                          </div>
                          {afterPreview && <img src={afterPreview} alt="After" style={{ width: '100%', height: '50px', objectFit: 'cover', borderRadius: '4px', marginTop: '4px', border: '1px solid var(--success)' }} />}
                        </div>
                      </div>
                    </div>

                    <div className="form-group">
                      <label style={{ fontSize: '0.72rem' }}>Field Repair Completion Notes</label>
                      <textarea
                        className="form-textarea"
                        placeholder="Provide details of repair works (e.g. Swapped burst 6-inch pipe segment, replaced gasket flange, verified seal)..."
                        value={workNotes}
                        onChange={e => setWorkNotes(e.target.value)}
                        style={{ minHeight: '60px', fontSize: '0.8rem', background: '#FFFFFF' }}
                      />
                    </div>

                    <button
                      type="submit"
                      className="btn btn-primary"
                      style={{ width: '100%', padding: '10px' }}
                      disabled={isUpdating}
                    >
                      ✓ Submit for JE Verification
                    </button>
                  </form>
                )}

                {activeTask.status === 'Pending Verification' && (
                  <div className="alert-banner info">
                    <span>⏳ Repair submitted successfully. Awaiting Junior Engineer verification and sign-off.</span>
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              <span style={{ fontSize: '2.5rem' }}>🔧</span>
              <p style={{ marginTop: '10px', fontSize: '0.82rem' }}>Select an active ticket from the task list on the left to begin repair routing or file complete details.</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
