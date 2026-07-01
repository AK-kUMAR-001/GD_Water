import { useState, useEffect } from 'react';
import { translations, type Language, type Role } from './utils/translations';
import { Citizen } from './views/Citizen';
import { ControlRoom } from './views/ControlRoom';
import { Supervisor } from './views/Supervisor';
import { RepairCrew } from './views/RepairCrew';
import { Collector } from './views/Collector';
import { WhatsAppSimulator } from './components/WhatsAppSimulator';
import { getBackendUrl } from './utils/api';

function App() {
  const [lang, setLang] = useState<Language>('en');
  const [role, setRole] = useState<Role>('Citizen');
  const [isMobileMode, setIsMobileMode] = useState(false);
  const [isRealMobile, setIsRealMobile] = useState(window.innerWidth < 1024);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [serverIp, setServerIp] = useState(localStorage.getItem('backend_server_ip') || '');
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
        fetch(getBackendUrl('/api/complaints')),
        fetch(getBackendUrl('/api/users'))
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
    if (!confirm('Are you sure you want to clear all grievances to 0 complaints?')) return;
    try {
      const res = await fetch(getBackendUrl('/api/reset-demo'), { method: 'POST' });
      if (res.ok) {
        alert('All complaints cleared! Ready to submit new complaints.');
        fetchAllData();
      } else {
        alert('Reset failed.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error during reset.');
    }
  };

  const handleInsertDemoData = async () => {
    try {
      const res = await fetch(getBackendUrl('/api/insert-demo'), { method: 'POST' });
      if (res.ok) {
        alert('Initial demo complaints injected successfully!');
        fetchAllData();
      } else {
        alert('Injection failed.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error during data injection.');
    }
  };

  useEffect(() => {
    fetchAllData();

    // Auto polling every 3 seconds to sync ticket state transitions instantly
    const interval = setInterval(fetchAllData, 3000);

    const handleResize = () => {
      setIsRealMobile(window.innerWidth < 1024);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const toggleLanguage = () => {
    setLang(prev => (prev === 'en' ? 'ta' : 'en'));
  };

  const getActiveView = () => {
    switch (role) {
      case 'Citizen':
        return <Citizen lang={lang} onRefresh={fetchAllData} onShowToast={triggerToast} isMobile={isMobileMode || isRealMobile} />;
      case 'ControlRoom':
        return <ControlRoom lang={lang} complaints={complaints} users={users} onRefresh={fetchAllData} onShowToast={triggerToast} isMobile={isMobileMode || isRealMobile} />;
      case 'Supervisor':
        return <Supervisor lang={lang} complaints={complaints} users={users} onRefresh={fetchAllData} onShowToast={triggerToast} isMobile={isMobileMode || isRealMobile} />;
      case 'Crew':
        return <RepairCrew lang={lang} complaints={complaints} onRefresh={fetchAllData} onShowToast={triggerToast} isMobile={isMobileMode || isRealMobile} />;
      case 'Collector':
        return <Collector lang={lang} complaints={complaints} users={users} isMobile={isMobileMode || isRealMobile} />;
      default:
        return <Citizen lang={lang} onRefresh={fetchAllData} onShowToast={triggerToast} isMobile={isMobileMode || isRealMobile} />;
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
      {/* Responsive Header Configuration */}
      {isRealMobile ? (
        <header className="app-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 1rem', background: 'var(--primary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'white',
                fontSize: '1.4rem',
                cursor: 'pointer',
                padding: '4px 8px',
                display: 'flex',
                alignItems: 'center'
              }}
              title="Open Navigation Menu"
            >
              ☰
            </button>
            <h1 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#FFFFFF', margin: 0, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              {lang === 'ta' ? 'நீர் யுகம்' : 'Neer Ugam'}
            </h1>
          </div>
          <button className="language-btn" onClick={toggleLanguage} style={{ padding: '0.35rem 0.7rem', fontSize: '0.72rem' }}>
            🌐 {lang === 'en' ? 'தமிழ்' : 'English'}
          </button>
        </header>
      ) : (
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
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px', minWidth: '450px' }}>
            <button 
              onClick={handleGlobalReset}
              style={{
                background: '#EF4444',
                border: 'none',
                color: 'white',
                padding: '0.4rem 0.8rem',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.72rem',
                fontWeight: '700',
                transition: 'var(--transition)'
              }}
              title="Clear all complaints in database to 0"
            >
              🧹 Clear Database
            </button>

            <button 
              onClick={handleInsertDemoData}
              style={{
                background: '#10B981',
                border: 'none',
                color: 'white',
                padding: '0.4rem 0.8rem',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.72rem',
                fontWeight: '700',
                transition: 'var(--transition)'
              }}
              title="Inject mock complaints into active database"
            >
              📥 Insert Demo Data
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
      )}

      {/* Main Layout Grid */}
      <div style={{ 
        display: 'flex', 
        gap: isRealMobile ? '0' : '25px', 
        padding: isRealMobile ? '10px' : '25px 30px', 
        minHeight: 'calc(100vh - 65px)', 
        background: 'var(--bg-main)',
        position: 'relative'
      }}>
        
        {/* Left Sidebar Layout */}
        <aside style={
          isRealMobile ? {
            position: 'fixed',
            top: 0,
            left: isSidebarOpen ? 0 : '-300px',
            width: '280px',
            height: '100vh',
            background: 'var(--bg-main)',
            zIndex: 1000,
            boxShadow: '5px 0 15px rgba(0,0,0,0.25)',
            transition: 'left 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            boxSizing: 'border-box',
            overflowY: 'auto'
          } : {
            width: '280px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            flexShrink: 0
          }
        }>
          {/* Drawer Close Button for mobile */}
          {isRealMobile && (
            <button 
              onClick={() => setIsSidebarOpen(false)}
              style={{
                alignSelf: 'flex-end',
                background: 'rgba(0, 0, 0, 0.05)',
                border: 'none',
                color: 'var(--primary)',
                padding: '4px 10px',
                borderRadius: '4px',
                fontSize: '0.72rem',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              ✕ Close Menu
            </button>
          )}

          {/* Container 1: Citizen Section */}
          <div className="glass-panel" style={{ padding: '15px', background: '#FFFFFF', borderTop: '4px solid var(--accent)' }}>
            <h3 style={{ fontSize: '0.78rem', fontWeight: '800', color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '10px', borderBottom: '1.5px solid var(--border-color)', paddingBottom: '6px' }}>
              👥 {lang === 'ta' ? 'பொதுமக்கள் பிரிவு' : 'Citizen Grievances'}
            </h3>
            <button 
              className={`dev-role-btn ${role === 'Citizen' ? 'active' : ''}`}
              onClick={() => { setRole('Citizen'); setIsSidebarOpen(false); }}
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

          {/* Container 2: Gov Section */}
          <div className="glass-panel" style={{ padding: '15px', background: '#FFFFFF', borderTop: '4px solid var(--primary)' }}>
            <h3 style={{ fontSize: '0.78rem', fontWeight: '800', color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '10px', borderBottom: '1.5px solid var(--border-color)', paddingBottom: '6px' }}>
              🏛 {lang === 'ta' ? 'அரசு அதிகாரிகள்' : 'Government Member'}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              
              <button
                className={`dev-role-btn ${role === 'Crew' ? 'active' : ''}`}
                onClick={() => { setRole('Crew'); setIsSidebarOpen(false); }}
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
                onClick={() => { setRole('Supervisor'); setIsSidebarOpen(false); }}
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
                onClick={() => { setRole('ControlRoom'); setIsSidebarOpen(false); }}
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
                onClick={() => { setRole('Collector'); setIsSidebarOpen(false); }}
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

          {/* Mobile Database Control Actions */}
          {isRealMobile && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto', marginBottom: '10px' }}>
              <button 
                onClick={() => { handleGlobalReset(); setIsSidebarOpen(false); }}
                style={{
                  background: '#EF4444',
                  border: 'none',
                  color: 'white',
                  padding: '10px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.78rem',
                  fontWeight: 'bold'
                }}
              >
                🧹 Clear Database (0)
              </button>

              <button 
                onClick={() => { handleInsertDemoData(); setIsSidebarOpen(false); }}
                style={{
                  background: '#10B981',
                  border: 'none',
                  color: 'white',
                  padding: '10px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.78rem',
                  fontWeight: 'bold'
                }}
              >
                📥 Insert Demo Data
              </button>
            </div>
          )}

          {/* Server Connection Settings for Both Desktop & Mobile */}
          <div className="glass-panel" style={{ padding: '12px', background: '#FFF3E0', borderTop: '4px solid #FF9800', marginTop: '10px', boxSizing: 'border-box' }}>
            <h3 style={{ fontSize: '0.75rem', fontWeight: '800', color: '#E65100', textTransform: 'uppercase', marginBottom: '6px', margin: 0 }}>
              🔗 Server IP Connection
            </h3>
            <p style={{ fontSize: '0.65rem', color: '#5D4037', marginBottom: '8px', marginTop: '4px', lineHeight: '1.3' }}>
              Enter your PC's IP address to sync data on your real phone.
            </p>
            <input 
              type="text" 
              placeholder="e.g. http://192.168.1.15:5000"
              value={serverIp}
              onChange={(e) => setServerIp(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 8px',
                fontSize: '0.75rem',
                borderRadius: '4px',
                border: '1px solid #FFB74D',
                marginBottom: '8px',
                boxSizing: 'border-box',
                background: '#FFFFFF'
              }}
            />
            <button
              onClick={() => {
                localStorage.setItem('backend_server_ip', serverIp);
                alert(`Server IP saved: ${serverIp || 'Relative paths (Default)'}`);
                setIsSidebarOpen(false);
                fetchAllData();
              }}
              style={{
                width: '100%',
                background: '#E65100',
                color: 'white',
                border: 'none',
                padding: '6px',
                fontSize: '0.72rem',
                fontWeight: 'bold',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Save & Connect
            </button>
          </div>

        </aside>

        {/* Backdrop for mobile drawer */}
        {isRealMobile && isSidebarOpen && (
          <div 
            onClick={() => setIsSidebarOpen(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              background: 'rgba(0,0,0,0.5)',
              zIndex: 999,
              animation: 'fadeIn 0.2s ease-out'
            }}
          />
        )}

        {/* Right content workspace dashboard panel (Dynamic Frame) */}
        {isRealMobile ? (
          <div className="mobile-mode-active" style={{ flex: 1, minWidth: 0, width: '100%' }}>
            {getActiveView()}
          </div>
        ) : isMobileMode ? (
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
