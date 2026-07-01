import React, { useState, useEffect, useRef } from 'react';
import { translations, type Language } from '../utils/translations';
import { SlaTimer } from '../components/SlaTimer';
import { getBackendUrl } from '../utils/api';

interface CitizenProps {
  lang: Language;
  onRefresh: () => void;
  onShowToast?: (msg: string) => void;
  isMobile?: boolean;
}

export const Citizen: React.FC<CitizenProps> = ({ lang, onRefresh, onShowToast, isMobile }) => {
  const t = translations[lang];

  // Reporting Form States
  const [category, setCategory] = useState('Water Leakage');
  const [gps, setGps] = useState<{ lat: number; lng: number } | null>(null);
  const [detectedAddress, setDetectedAddress] = useState('');
  const [description, setDescription] = useState('');
  const [citizenName, setCitizenName] = useState('');
  const [citizenPhone, setCitizenPhone] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isVerifyingImage, setIsVerifyingImage] = useState(false);
  const [imageVerificationError, setImageVerificationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  
  // Speech Recognition States
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Tracking States
  const [searchId, setSearchId] = useState('');
  const [trackedComplaint, setTrackedComplaint] = useState<any>(null);
  const [trackError, setTrackError] = useState('');

  // Setup Web Speech API
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = false;
      rec.lang = lang === 'ta' ? 'ta-IN' : 'en-US';

      rec.onresult = (event: any) => {
        const transcript = event.results[event.results.length - 1][0].transcript;
        setDescription(prev => prev + (prev ? ' ' : '') + transcript);
      };

      rec.onerror = (event: any) => {
        console.error('Speech error:', event.error);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, [lang]);

  const toggleSpeech = () => {
    if (!recognitionRef.current) {
      alert('Speech-to-Text is not fully supported in this browser. Try Google Chrome.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const captureGps = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const latitude = pos.coords.latitude;
          const longitude = pos.coords.longitude;
          setGps({ lat: latitude, lng: longitude });
          
          // Call free reverse geocoder
          try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18`);
            if (response.ok) {
              const data = await response.json();
              if (data && data.display_name) {
                setDetectedAddress(data.display_name);
                return;
              }
            }
          } catch (e) {
            console.error('Error reverse geocoding:', e);
          }

          // Mock fallback geocoding details based on coimbatore zones
          if (latitude > 11.0) {
            setDetectedAddress(longitude > 76.993 
              ? 'Sathy Road, Saravanampatti, Coimbatore Ward 12, Tamil Nadu'
              : 'Ganapathy Main Street, Coimbatore Ward 15, Tamil Nadu'
            );
          } else {
            setDetectedAddress(longitude > 76.972
              ? 'Sundarapuram Bypass Road, Coimbatore Ward 61, Tamil Nadu'
              : 'Kurichi Lake Road, Coimbatore Ward 62, Tamil Nadu'
            );
          }
        },
        (err) => {
          console.error(err);
          // Set mock location and address
          setGps({ lat: 10.9578, lng: 76.9740 });
          setDetectedAddress('Sundarapuram Bypass Road, Coimbatore Ward 61, Tamil Nadu');
        }
      );
    } else {
      setGps({ lat: 10.9578, lng: 76.9740 });
      setDetectedAddress('Sundarapuram Bypass Road, Coimbatore Ward 61, Tamil Nadu');
    }
  };

  const verifyImageWithModel = async (file: File) => {
    setIsVerifyingImage(true);
    setImageVerificationError(null);
    try {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      if (typeof (window as any).mobilenet === 'undefined') {
        console.warn('MobileNet script not loaded. Bypassing check.');
        setIsVerifyingImage(false);
        return;
      }

      console.log('[AI Vision] Loading Neural Net...');
      const model = await (window as any).mobilenet.load();
      console.log('[AI Vision] Running classification...');
      const predictions = await model.classify(img);
      console.log('[AI Vision] Predictions:', predictions);

      // Water infrastructure keywords
      const waterKeywords = [
        'water', 'pipe', 'pump', 'well', 'faucet', 'leak', 'spout', 'conduit',
        'hose', 'fountain', 'gutter', 'drain', 'river', 'mud', 'ditch',
        'excavation', 'valve', 'plumbing', 'tubing', 'washbasin', 'sink',
        'puddle', 'pond', 'soil', 'earth', 'ground', 'trench', 'tile', 'mason',
        'spout', 'potter', 'bucket', 'tank', 'reservoir', 'hydrant', 'faucet'
      ];

      const matches = predictions.some((p: any) =>
        waterKeywords.some(keyword => p.className.toLowerCase().includes(keyword))
      );

      if (!matches) {
        const topClasses = predictions.map((p: any) => p.className.split(',')[0]).join(' / ');
        setImageVerificationError(
          lang === 'ta'
            ? `⚠️ பட சரிபார்ப்பு தோல்வி: பதிவேற்றிய படம் "${topClasses}" ஐக் குறிக்கிறது. இது நகராட்சி நீர் சிக்கல்களுடன் பொருந்தவில்லை. சரியான புகைப்படத்தை பதிவேற்றவும்.`
            : `⚠️ Image Verification Failed: Uploaded image detected as "${topClasses}". It does not match municipal water issues (leaks, pipes, pumps, excavation). Please upload a valid site photo.`
        );
        setPhoto(null);
        setPhotoPreview(null);
      } else {
        console.log('[AI Vision] Success: image verified.');
      }
    } catch (err) {
      console.error('[AI Vision] Error running verification:', err);
    } finally {
      setIsVerifyingImage(false);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
      verifyImageWithModel(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gps) {
      alert('Please capture your GPS Location first to route your complaint.');
      return;
    }
    
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('category', category);
    formData.append('latitude', gps.lat.toString());
    formData.append('longitude', gps.lng.toString());
    formData.append('detectedAddress', detectedAddress);
    formData.append('description', description);
    formData.append('citizenName', citizenName || 'K. Srinivasan');
    formData.append('citizenPhone', citizenPhone || '+91 99887 76655');
    if (photo) {
      formData.append('photo', photo);
    }

    try {
      const res = await fetch(getBackendUrl('/api/complaints'), {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setSubmittedId(data.id);
        
        if (onShowToast) {
          onShowToast(`📩 Sent to citizen (${citizenPhone || '8925081899'}): "Neer Ugam: Grievance ${data.id} (${category}) registered. AI auto-routed to Ward 61."`);
        }
        
        // Reset Form
        setDescription('');
        setPhoto(null);
        setPhotoPreview(null);
        setGps(null);
        setDetectedAddress('');
        onRefresh();
      } else {
        alert('Error submitting complaint.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error submitting complaint.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchId) return;

    setTrackError('');
    setTrackedComplaint(null);
    try {
      const res = await fetch(getBackendUrl('/api/complaints'));
      const complaints = await res.json();
      const match = complaints.find((c: any) => c.id.toUpperCase() === searchId.toUpperCase().trim());
      if (match) {
        setTrackedComplaint(match);
      } else {
        setTrackError(lang === 'ta' ? 'அத்தகைய புகார் குறிப்பு எண் எதுவும் இல்லை.' : 'No grievance matching this ID found.');
      }
    } catch (err) {
      console.error(err);
      setTrackError('Failed to fetch tracking data.');
    }
  };

  return (
    <div className="dashboard-grid col-12" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(12, 1fr)', gap: '20px' }}>
      
      {/* Citizens Info Banner */}
      <div className="col-12 glass-panel" style={{ padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ECEFF1', borderLeft: '4px solid var(--accent)' }}>
        <div>
          <h2 style={{ color: 'var(--primary)', fontSize: '1.25rem', fontWeight: 800 }}>{t.citizen} Portal</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '2px' }}>{t.tagline}</p>
        </div>
      </div>

      {/* Column 1: Submit Form */}
      <div className="col-6 glass-panel" style={{ animation: 'fadeIn 0.3s ease-out' }}>
        <div className="card-header" style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? '4px' : '0', justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0 }}>✍️ {t.reportIssue}</h3>
          <span style={{ fontSize: '0.72rem', color: 'var(--warning)', fontWeight: 'bold' }}>⚡ 30s Quick Report</span>
        </div>
        <div className="card-body">
          {submittedId ? (
            <div style={{ textAlign: 'center', padding: '20px 10px' }}>
              <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'var(--success-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px', border: '1.5px solid var(--success)' }}>
                <span style={{ fontSize: '1.5rem', color: 'var(--success)' }}>✓</span>
              </div>
              <h4 style={{ fontSize: '1.15rem', marginBottom: '8px', color: 'var(--primary-dark)' }}>
                {lang === 'ta' ? 'புகார் வெற்றிகரமாக சமர்ப்பிக்கப்பட்டது!' : 'Grievance Registered Successfully!'}
              </h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '15px' }}>
                {lang === 'ta' ? 'உங்களின் புகார் எண்:' : 'Your Ticket ID:'}{' '}
                <strong style={{ color: 'var(--primary)', fontSize: '1.1rem', padding: '4px 10px', background: '#F0F4F8', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                  {submittedId}
                </strong>
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginBottom: '20px' }}>
                {lang === 'ta' ? 'செயற்கை நுண்ணறிவு தானாகவே இந்த இடத்தின் வார்டை ஆராய்ந்து உரிய அதிகாரிகளுக்கு அனுப்பியுள்ளது.' : 'The NLP classifier processed your description and automatically routed it to the Ward Engineer.'}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center', marginBottom: '15px' }}>
                <a
                  href={`https://api.whatsapp.com/send?phone=918925081899&text=${encodeURIComponent(`Neer Ugam: Grievance ${submittedId} registered. AI auto-routed to Ward 61 - Sundarapuram.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn"
                  style={{ background: '#25D366', color: 'white', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'none', width: '100%', justifyContent: 'center', borderRadius: '4px' }}
                >
                  💬 Send WhatsApp Alert (8925081899)
                </a>
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button className="btn btn-primary" onClick={() => {
                  setSearchId(submittedId);
                  setTrackedComplaint(null);
                  setSubmittedId(null);
                  setTimeout(() => {
                    const searchBox = document.getElementById('search-input');
                    if (searchBox) (searchBox as HTMLInputElement).value = submittedId;
                    setSearchId(submittedId);
                  }, 50);
                }}>
                  {t.trackIssue}
                </button>
                <button className="btn btn-secondary" onClick={() => setSubmittedId(null)}>
                  {lang === 'ta' ? 'புதிய புகார் செய்க' : 'Report Another'}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>{t.category} *</label>
                <select className="form-select" value={category} onChange={e => setCategory(e.target.value)}>
                  <option value="Pipeline Burst">Pipeline Burst / குழாய் வெடிப்பு</option>
                  <option value="Water Leakage">Water Leakage / தண்ணீர் கசிவு</option>
                  <option value="Water Theft">Water Theft / தண்ணீர் திருட்டு</option>
                  <option value="Illegal Connection">Illegal Connection / சட்டவிரோத இணைப்பு</option>
                  <option value="Pump Failure">Pump Failure / பம்ப் பழுது</option>
                  <option value="No Water Supply">No Water Supply / தண்ணீர் விநியோகம் இல்லை</option>
                  <option value="Low Water Pressure">Low Water Pressure / குறைந்த நீர் அழுத்தம்</option>
                  <option value="Contaminated Water">Contaminated Water / மாசுபட்ட தண்ணீர்</option>
                  <option value="Overflowing Tank">Overflowing Tank / தொட்டி நிரம்பி வழிதல்</option>
                  <option value="Broken Public Tap">Broken Public Tap / பொது குழாய் உடைப்பு</option>
                  <option value="Sewer Mixing">Sewer Mixing / சாக்கடை நீர் கலத்தல்</option>
                  <option value="Water Meter Damage">Water Meter Damage / தண்ணீர் மீட்டர் சேதம்</option>
                  <option value="Others">Others / இதர</option>
                </select>
              </div>

              <div className="form-group">
                <label>{t.gpsLoc} *</label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <button type="button" className={`btn ${gps ? 'btn-secondary' : 'btn-accent'}`} onClick={captureGps} style={{ flex: 1 }}>
                    📍 {gps ? t.gpsFetched : t.fetchGps}
                  </button>
                  {gps && (
                    <span style={{ fontSize: '0.78rem', color: 'var(--success)', fontWeight: 'bold' }}>
                      {gps.lat.toFixed(4)}, {gps.lng.toFixed(4)}
                    </span>
                  )}
                </div>
              </div>

              {/* Detected Text Address Input */}
              <div className="form-group">
                <label>{lang === 'ta' ? 'கண்டறியப்பட்ட முகவரி (தேடுதல்)' : 'Detected Address (Geocoded Text)'} *</label>
                <input
                  type="text"
                  className="form-input"
                  value={detectedAddress}
                  onChange={e => setDetectedAddress(e.target.value)}
                  placeholder={lang === 'ta' ? 'ஜி.பி.எஸ் முகவரி தானாகவே இங்கே வரும்...' : 'Fetching address automatically via GPS reverse geocoding...'}
                  required
                />
              </div>

              <div className="form-group">
                <label>{lang === 'ta' ? 'விளக்கம்' : 'Grievance Description'} *</label>
                <textarea
                  className="form-textarea"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder={t.description}
                  required
                />
              </div>

              {/* Speech-to-Text Button */}
              <div className="form-group" style={{ background: '#F8FAFC', padding: '10px', borderRadius: '4px', border: '1px dashed var(--border-color)' }}>
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                  <span>🎤 {lang === 'ta' ? 'குரல் மூலம் விளக்கம் அளிக்கவும்' : 'Voice Input (AI Translation)'}</span>
                  {isListening && <span className="live-pulse" style={{ backgroundColor: 'var(--danger)' }}></span>}
                </label>
                <button type="button" className={`btn ${isListening ? 'btn-danger' : 'btn-secondary'}`} onClick={toggleSpeech} style={{ width: '100%', marginTop: '4px', fontSize: '0.75rem', padding: '6px' }}>
                  {isListening ? t.stopSpeech : t.startSpeech}
                </button>
              </div>

              <div className="form-group" style={{ textAlign: 'center' }}>
                <label style={{ display: 'block', textAlign: 'center', width: '100%', marginBottom: '6px' }}>
                  {lang === 'ta' ? 'புகைப்படம் (கட்டாயமில்லை)' : 'Upload Grievance Photo'} (Verification Active)
                </label>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', justifyContent: 'center' }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    style={{ display: 'none' }}
                    id="citizen-upload"
                  />
                  <label htmlFor="citizen-upload" className="btn btn-secondary" style={{ cursor: 'pointer', padding: '6px 20px', fontSize: '0.78rem' }}>
                    📷 Choose Photo File
                  </label>
                  {photoPreview && (
                    <img
                      src={photoPreview}
                      alt="Preview"
                      style={{ width: '45px', height: '45px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--accent)' }}
                    />
                  )}
                </div>
                {isVerifyingImage && (
                  <div style={{ fontSize: '0.72rem', color: 'var(--primary)', fontWeight: 'bold', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.9rem', animation: 'pulse-glow 1s infinite' }}>🔍</span>
                    <span>AI neural net scanning image contents...</span>
                  </div>
                )}
                {imageVerificationError && (
                  <div className="alert-banner critical" style={{ marginTop: '8px', padding: '8px 12px', fontSize: '0.72rem', color: '#B91C1C', background: '#FEF2F2', borderLeft: '3px solid #EF4444' }}>
                    {imageVerificationError}
                  </div>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>{t.citizenName}</label>
                  <input type="text" className="form-input" placeholder="e.g. Srinivasan" value={citizenName} onChange={e => setCitizenName(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>{t.citizenPhone}</label>
                  <input type="text" className="form-input" placeholder="e.g. +91 99887 76655" value={citizenPhone} onChange={e => setCitizenPhone(e.target.value)} />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '10px' }} disabled={isSubmitting}>
                {isSubmitting ? t.submitting : t.submit}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Column 2: Track & Notifications */}
      <div className="col-6" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Track complaint Panel */}
        <div className="glass-panel">
          <div className="card-header">
            <h3>🔍 {t.trackIssue}</h3>
          </div>
          <div className="card-body">
            <form onSubmit={handleTrack} style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
              <input
                type="text"
                id="search-input"
                className="form-input"
                placeholder="e.g. AQ-1001"
                value={searchId}
                onChange={e => setSearchId(e.target.value)}
                style={{ flex: 1 }}
              />
              <button type="submit" className="btn btn-accent">
                Search Registry
              </button>
            </form>

            {trackError && (
              <div className="alert-banner critical">
                <span>⚠️ {trackError}</span>
              </div>
            )}

            {trackedComplaint && (
              <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '10px' }}>
                  <div>
                    <h4 style={{ color: 'var(--primary)', fontSize: '1rem', fontWeight: 'bold' }}>{trackedComplaint.id} - {trackedComplaint.category}</h4>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '2px' }}>📍 {trackedComplaint.locationName}</p>
                  </div>
                  <span className={`status-pill status-${trackedComplaint.status.toLowerCase().replace(/\s/g, '')}`}>
                    {trackedComplaint.status}
                  </span>
                </div>

                {trackedComplaint.isDuplicate && (
                  <div className="alert-banner info" style={{ marginBottom: '10px', padding: '8px 12px' }}>
                    <p style={{ fontSize: '0.75rem' }}>
                      💡 <strong>Smart AI Merge:</strong> {t.duplicateMsg}{trackedComplaint.masterComplaintId}. {t.duplicateNote}
                    </p>
                  </div>
                )}

                {/* SLA Timer */}
                {trackedComplaint.status !== 'Resolved' && (
                  <div className={`alert-banner ${trackedComplaint.escalationLevel > 0 ? 'critical' : 'warning'}`} style={{ marginBottom: '12px', padding: '8px 12px' }}>
                    <div style={{ width: '100%', fontSize: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                        <span>⏱ SLA CountDown Limit ({trackedComplaint.slaHours}h)</span>
                        <span>{trackedComplaint.escalationLevel > 0 ? 'Breached / Escalated' : 'On Schedule'}</span>
                      </div>
                      <p style={{ fontSize: '0.7rem', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        Deadline: <SlaTimer deadline={trackedComplaint.slaDeadline} /> ({new Date(trackedComplaint.slaDeadline).toLocaleString()})
                      </p>
                      {trackedComplaint.escalationLevel > 0 && (
                        <p style={{ fontSize: '0.75rem', marginTop: '4px', fontWeight: 'bold' }}>
                          🚨 Auto-Escalated to: {
                            ['Crews representative', 'Supervisor R. Jagadeesan', 'Assistant Engineer', 'Executive Engineer', 'Municipal Commissioner', 'District Collector', 'State Water Department'][trackedComplaint.escalationLevel]
                          }
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Timeline */}
                <div style={{ margin: '15px 0' }}>
                  <h5 style={{ fontSize: '0.75rem', color: 'var(--primary)', marginBottom: '8px', fontWeight: 'bold' }}>Incident Resolution Timeline</h5>
                  <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', padding: '0 5px' }}>
                    <div style={{ position: 'absolute', top: '10px', left: '10px', right: '10px', height: '2.5px', background: '#E2E8F0', zIndex: 1 }}></div>
                    
                    {['Reported', 'Assigned', 'In Progress', 'Pending Verification', 'Resolved'].map((st, idx) => {
                      const stages = ['Reported', 'Assigned', 'In Progress', 'Pending Verification', 'Resolved'];
                      const currentIdx = stages.indexOf(trackedComplaint.status);
                      const isDone = stages.indexOf(st) <= currentIdx && trackedComplaint.status !== 'Rejected';
                      const isActive = st === trackedComplaint.status;

                      return (
                        <div key={st} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, width: '50px', textAlign: 'center' }}>
                          <div style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            background: isDone ? 'var(--primary)' : '#FFFFFF',
                            border: `2px solid ${isActive ? 'var(--accent)' : '#C1C7D0'}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.65rem',
                            color: isDone ? 'white' : 'var(--text-muted)',
                            fontWeight: 'bold',
                          }}>
                            {idx + 1}
                          </div>
                          <span style={{ fontSize: '0.6rem', color: isActive ? 'var(--warning)' : 'var(--text-muted)', marginTop: '4px', display: 'block', fontWeight: isActive ? 'bold' : 'normal' }}>
                            {st}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Photos */}
                <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                  {trackedComplaint.imageUrl && (
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '2px', fontWeight: 'bold' }}>Before Repair</p>
                      <img src={trackedComplaint.imageUrl} alt="Before" style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border-color)' }} />
                    </div>
                  )}
                  {trackedComplaint.afterImageUrl && (
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '2px', fontWeight: 'bold' }}>After Repair</p>
                      <img src={trackedComplaint.afterImageUrl} alt="After" style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--success)' }} />
                    </div>
                  )}
                  {trackedComplaint.verificationImageUrl && (
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '2px', fontWeight: 'bold' }}>Audit Verified</p>
                      <img src={trackedComplaint.verificationImageUrl} alt="Verified" style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--info)' }} />
                    </div>
                  )}
                </div>

                {/* History log */}
                <div style={{ marginTop: '15px', background: '#F8FAFC', padding: '10px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                  <h5 style={{ fontSize: '0.75rem', color: 'var(--primary)', marginBottom: '6px', fontWeight: 'bold' }}>Grievance Lifecycle Logs</h5>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {trackedComplaint.history.map((h: any, i: number) => (
                      <div key={i} style={{ fontSize: '0.7rem', display: 'flex', gap: '6px', borderLeft: '2px solid var(--primary-light)', paddingLeft: '6px' }}>
                        <div>
                          <div style={{ color: 'var(--primary-dark)', fontWeight: 'bold' }}>{h.action} - <span style={{ color: 'var(--warning)' }}>{h.officerName}</span></div>
                          <div style={{ color: 'var(--text-muted)' }}>{h.notes}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Alerts notification center */}
        <div className="glass-panel">
          <div className="card-header">
            <h3>🔔 {t.notifTitle}</h3>
          </div>
          <div className="card-body" style={{ maxHeight: '160px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', padding: '10px' }}>
            <div style={{ padding: '8px 10px', borderLeft: '3px solid var(--info)', background: '#F9FBFD', borderRadius: '2px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 'bold' }}>
                <span style={{ color: 'var(--primary)' }}>🔧 Crew Dispatched (AQ-1002)</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>Just now</span>
              </div>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>Crew Beta has been assigned to investigate the leak on Kurichi lake road.</p>
            </div>
            
            <div style={{ padding: '8px 10px', borderLeft: '3px solid var(--success)', background: '#F9FBFD', borderRadius: '2px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 'bold' }}>
                <span style={{ color: 'var(--primary)' }}>✅ Closed Complaint (AQ-1005)</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>2 hours ago</span>
              </div>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>Junior Engineer pre-approved and closed Pump Failure at Sathy Road. Water supply restored.</p>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
};
