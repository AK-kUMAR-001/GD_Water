import { useState, useEffect } from 'react';
import { translations, type Language, type Role } from './utils/translations';
import { Citizen } from './views/Citizen';
import { ControlRoom } from './views/ControlRoom';
import { Supervisor } from './views/Supervisor';
import { RepairCrew } from './views/RepairCrew';
import { Collector } from './views/Collector';
import { WhatsAppSimulator } from './components/WhatsAppSimulator';

function App() {
  const [lang, setLang] = useState<Language>('en');
  const [role, setRole] = useState<Role>('Citizen');
  const [isMobileMode, setIsMobileMode] = useState(false);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toastNotification, setToastNotification] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastNotification(msg);
    setTimeout(() => {
      setToastNotification(null);
    }, 6500);
  };

  const t = translations[lang];

  // Fetch all databases from Express APIs
  const fetchAllData = async () => {
    try {
      const [compRes, userRes] = await Promise.all([
        fetch('/api/complaints'),
        fetch('/api/users')
      ]);

      if (compRes.ok && userRes.ok) {
        const comps = await compRes.json();
        const usrs = await userRes.json();
        setComplaints(comps);
        setUsers(usrs);
      }
    } catch (err) {
      console.error('Error fetching data from local backend server:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGlobalReset = async () => {
    if (!confirm('Are you sure you want to reset all grievances to default mock records?')) return;
    try {
      const res = await fetch('/api/reset-demo', { method: 'POST' });
      if (res.ok) {
        alert('Database reset successful! Workflow is ready.');
        fetchAllData();
      } else {
        alert('Reset failed.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error during reset.');
    }
  };

  useEffect(() => {
    fetchAllData();

    // Auto polling every 3 seconds to sync ticket state transitions instantly
    const interval = setInterval(fetchAllData, 3000);
    return () => clearInterval(interval);
  }, []);

  const toggleLanguage = () => {
    setLang(prev => (prev === 'en' ? 'ta' : 'en'));
  };

  const getActiveView = () => {
    switch (role) {
      case 'Citizen':
        return <Citizen lang={lang} onRefresh={fetchAllData} onShowToast={triggerToast} isMobile={isMobileMode} />;
      case 'ControlRoom':
        return <ControlRoom lang={lang} complaints={complaints} users={users} onRefresh={fetchAllData} onShowToast={triggerToast} isMobile={isMobileMode} />;
      case 'Supervisor':
        return <Supervisor lang={lang} complaints={complaints} users={users} onRefresh={fetchAllData} onShowToast={triggerToast} isMobile={isMobileMode} />;
      case 'Crew':
        return <RepairCrew lang={lang} complaints={complaints} onRefresh={fetchAllData} onShowToast={triggerToast} isMobile={isMobileMode} />;
      case 'Collector':
        return <Collector lang={lang} complaints={complaints} users={users} isMobile={isMobileMode} />;
      default:
        return <Citizen lang={lang} onRefresh={fetchAllData} onShowToast={triggerToast} isMobile={isMobileMode} />;
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '15px' }}>
        <div style={{ width: '40px', height: '40px', border: '4px solid rgba(0, 33, 71, 0.2)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'pulse-glow 1s infinite' }}></div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', letterSpacing: '0.5px' }}>CONNECTING SECURE DATABASE REGISTRY...</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Official Header with Centered App Name and Localized Quote */}
      <header className="app-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 2rem' }}>
        
        {/* Left: Emblem logo mock section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '250px' }}>
          <div className="logo-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <div>
            <span style={{ fontSize: '0.62rem', color: '#ECEFF1', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 'bold', display: 'block', lineHeight: '1.2' }}>
              Tamil Nadu<br />Water Authority
            </span>
          </div>
        </div>

        {/* Middle: Centered App Name & Quotes */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', flex: 1 }}>
          <h1 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#FFFFFF', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            {lang === 'ta' ? 'நீர் யுகம்' : 'Neer Ugam'}
          </h1>
          <p style={{ fontSize: '0.68rem', color: '#ECEFF1', fontStyle: 'italic', marginTop: '2px', fontWeight: '600' }}>
            "{t.quote}"
          </p>
        </div>

        {/* Right: Reset, Language Toggle & Device Simulator switch buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '10px', width: '380px' }}>
          <button 
            onClick={handleGlobalReset}
            style={{
              background: '#FF9800',
              border: 'none',
              color: 'white',
              padding: '0.4rem 0.8rem',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontWeight: '700',
              transition: 'var(--transition)'
            }}
            title="Reset Database to initial template"
          >
            🔄 Reset Demo DB
          </button>

          <button 
            onClick={() => setIsMobileMode(!isMobileMode)}
            style={{
              background: isMobileMode ? 'var(--accent)' : 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: isMobileMode ? 'var(--primary-dark)' : 'white',
              padding: '0.4rem 0.8rem',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontWeight: '700',
              transition: 'var(--transition)'
            }}
          >
            📱 {isMobileMode ? 'Desktop View' : 'Mobile View'}
          </button>
          
          <button className="language-btn" onClick={toggleLanguage} style={{ padding: '0.4rem 0.8rem' }}>
            🌐 {lang === 'en' ? 'தமிழ்' : 'English'}
          </button>
        </div>
      </header>

      {/* Main Layout Grid: Persistent Side Navigation + Active Workspace content */}
      <div style={{ display: 'flex', gap: '25px', padding: '25px 30px', minHeight: 'calc(100vh - 75px)', background: 'var(--bg-main)' }}>
        
        {/* Left Sidebar Layout containing 2 Navigation Containers */}
        <aside style={{ width: '280px', display: 'flex', flexDirection: 'column', gap: '20px', flexShrink: 0 }}>
          
          {/* Container 1: Citizen Section */}
          <div className="glass-panel" style={{ padding: '15px', background: '#FFFFFF', borderTop: '4px solid var(--accent)' }}>
            <h3 style={{ fontSize: '0.78rem', fontWeight: '800', color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '10px', borderBottom: '1.5px solid var(--border-color)', paddingBottom: '6px' }}>
              👥 {lang === 'ta' ? 'பொதுமக்கள் பிரிவு' : 'Citizen Grievances'}
            </h3>
            <button
              className={`dev-role-btn ${role === 'Citizen' ? 'active' : ''}`}
              onClick={() => setRole('Citizen')}
              style={{
                width: '100%',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                fontSize: '0.8rem',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              🙋‍♂️ {lang === 'ta' ? 'புகார் செய்ய' : 'Report Water Issue'}
            </button>
          </div>

          {/* Container 2: Government Member Section */}
          <div className="glass-panel" style={{ padding: '15px', background: '#FFFFFF', borderTop: '4px solid var(--primary)' }}>
            <h3 style={{ fontSize: '0.78rem', fontWeight: '800', color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '10px', borderBottom: '1.5px solid var(--border-color)', paddingBottom: '6px' }}>
              🏛 {lang === 'ta' ? 'அரசு அதிகாரிகள்' : 'Government Member'}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              
              <button
                className={`dev-role-btn ${role === 'Crew' ? 'active' : ''}`}
                onClick={() => setRole('Crew')}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  fontSize: '0.8rem',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                🔧 {t.crew}
              </button>

              <button
                className={`dev-role-btn ${role === 'Supervisor' ? 'active' : ''}`}
                onClick={() => setRole('Supervisor')}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  fontSize: '0.8rem',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                👨‍💼 {t.supervisor}
              </button>

              <button
                className={`dev-role-btn ${role === 'ControlRoom' ? 'active' : ''}`}
                onClick={() => setRole('ControlRoom')}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  fontSize: '0.8rem',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                ⚙ {t.controlRoom}
              </button>

              <button
                className={`dev-role-btn ${role === 'Collector' ? 'active' : ''}`}
                onClick={() => setRole('Collector')}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  fontSize: '0.8rem',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                💼 {t.collector}
              </button>

            </div>
          </div>

        </aside>

        {/* Right content workspace dashboard panel (Dynamic Frame) */}
        {isMobileMode ? (
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '10px 0', minWidth: 0 }}>
            <div className="mobile-simulator" style={{ 
              width: '375px', 
              height: '780px', 
              border: '14px solid #1e293b', 
              borderRadius: '36px',
              background: '#F8FAFC', 
              position: 'relative',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}>
              {/* Notch */}
              <div style={{ 
                height: '24px', 
                width: '150px', 
                background: '#1e293b', 
                margin: '0 auto', 
                borderRadius: '0 0 16px 16px', 
                position: 'absolute', 
                left: '50%', 
                transform: 'translateX(-50%)', 
                top: 0, 
                zIndex: 100 
              }}></div>
              {/* Screen Content with mobile-mode-active class */}
              <div className="mobile-content mobile-mode-active" style={{ 
                flex: 1, 
                overflowY: 'auto', 
                padding: '36px 12px 16px 12px',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                boxSizing: 'border-box'
              }}>
                {getActiveView()}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, minWidth: 0 }}>
            {getActiveView()}
          </div>
        )}

      </div>

      {/* Floating Real-time SMS Toast Banner Overlay */}
      {toastNotification && (
        <div style={{
          position: 'fixed',
          top: '90px',
          right: '30px',
          zIndex: 9999,
          width: '350px',
          animation: 'slideDownIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) both',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.12)',
          borderLeft: '4px solid var(--accent)',
          background: '#FFFFFF',
          color: 'var(--text-dark)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 16px',
          borderRadius: '4px',
          border: '1px solid var(--border-color)',
          borderLeftWidth: '4px'
        }}>
          <span style={{ fontSize: '1.6rem' }}>💬</span>
          <div style={{ fontSize: '0.76rem', textAlign: 'left' }}>
            <strong style={{ color: 'var(--primary)', textTransform: 'uppercase', fontSize: '0.7rem', display: 'block', letterSpacing: '0.5px' }}>
              SMS Gateway Alert
            </strong>
            <p style={{ marginTop: '3px', color: 'var(--text-main)', lineHeight: '1.35', fontWeight: 'bold' }}>
              {toastNotification}
            </p>
          </div>
        </div>
      )}

      {/* Floating Interactive WhatsApp Chat Bot Simulator */}
      <WhatsAppSimulator onRefresh={fetchAllData} />

    </div>
  );
}

export default App;
