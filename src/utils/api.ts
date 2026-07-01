import { defaultCategories, defaultUsers, mockComplaints } from './mockData';

// Standalone mode is enabled by default on mobile containers to ensure zero network risk
const initLocalStorageDB = () => {
  if (!localStorage.getItem('local_db_initialized')) {
    localStorage.setItem('local_db_complaints', JSON.stringify(mockComplaints));
    localStorage.setItem('local_db_users', JSON.stringify(defaultUsers));
    localStorage.setItem('local_db_audit_logs', JSON.stringify([
      { timestamp: new Date().toISOString(), user: 'System', action: 'DB Seeding', notes: 'Local database seeded with mock data.' }
    ]));
    localStorage.setItem('local_db_initialized', 'true');
  }
};

// Initialize DB immediately
initLocalStorageDB();

export const isStandalone = (): boolean => {
  const saved = localStorage.getItem('standalone_mode');
  // Default to Standalone mode if not explicitly set to 'false'
  return saved !== 'false';
};

export const setStandaloneMode = (enabled: boolean) => {
  localStorage.setItem('standalone_mode', enabled ? 'true' : 'false');
};

export const getBackendUrl = (path: string): string => {
  let base = localStorage.getItem('backend_server_ip') || '';
  if (base) {
    base = base.trim();
    if (!/^https?:\/\//i.test(base)) {
      base = `http://${base}`;
    }
  }
  const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base;
  return `${cleanBase}${path}`;
};

// Unified fetch interceptor to support completely offline standalone mode
export const appFetch = async (url: string, options?: RequestInit): Promise<Response> => {
  if (!isStandalone()) {
    // Standard server sync mode
    return window.fetch(url, options);
  }

  // Standalone Offline Local Mode Interception
  return new Promise((resolve) => {
    setTimeout(() => {
      try {
        const parsedUrl = new URL(url, window.location.origin);
        const path = parsedUrl.pathname;
        const method = options?.method?.toUpperCase() || 'GET';

        // Read Local Database
        const complaints: any[] = JSON.parse(localStorage.getItem('local_db_complaints') || '[]');
        const users: any[] = JSON.parse(localStorage.getItem('local_db_users') || '[]');
        const logs: any[] = JSON.parse(localStorage.getItem('local_db_audit_logs') || '[]');

        const writeDB = (c: any[], u: any[], l: any[]) => {
          localStorage.setItem('local_db_complaints', JSON.stringify(c));
          localStorage.setItem('local_db_users', JSON.stringify(u));
          localStorage.setItem('local_db_audit_logs', JSON.stringify(l));
        };

        const createResponse = (body: any, status = 200) => {
          return resolve(new Response(JSON.stringify(body), {
            status,
            headers: { 'Content-Type': 'application/json' }
          }));
        };

        // 1. GET /api/complaints
        if (path === '/api/complaints' && method === 'GET') {
          return createResponse(complaints);
        }

        // 2. GET /api/users
        if (path === '/api/users' && method === 'GET') {
          return createResponse(users);
        }

        // 3. POST /api/reset-demo
        if (path === '/api/reset-demo' && method === 'POST') {
          const emptyComplaints: any[] = [];
          const newLogs = [
            { timestamp: new Date().toISOString(), user: 'Admin', action: 'Reset Database', notes: 'Cleared all complaints and logs to zero.' }
          ];
          writeDB(emptyComplaints, users, newLogs);
          return createResponse({ success: true, message: 'Database cleared successfully to 0 complaints.' });
        }

        // 4. POST /api/insert-demo
        if (path === '/api/insert-demo' && method === 'POST') {
          let maxIdNum = 1000;
          complaints.forEach(c => {
            const match = c.id.match(/AQ-(\d+)/);
            if (match) {
              const num = parseInt(match[1], 10);
              if (num > maxIdNum) maxIdNum = num;
            }
          });

          const complaintsToInsert = JSON.parse(JSON.stringify(mockComplaints)).map((c: any, index: number) => {
            maxIdNum += 1;
            const newC = { ...c };
            newC.id = `AQ-${maxIdNum}`;
            newC.dateReported = new Date(Date.now() - index * 600000).toISOString();
            newC.dateAssigned = '';
            newC.dateCompleted = '';
            newC.dateVerified = '';
            newC.status = 'Reported';
            newC.assignedCrew = '';
            return newC;
          });

          const updated = [...complaintsToInsert, ...complaints];
          logs.push({
            timestamp: new Date().toISOString(),
            user: 'Admin',
            action: 'Insert Demo Data',
            notes: `Injected ${complaintsToInsert.length} mock complaints.`
          });
          writeDB(updated, users, logs);
          return createResponse({ success: true, message: `Successfully injected ${complaintsToInsert.length} complaints.` });
        }

        // 5. POST /api/complaints (Create Grievance)
        if (path === '/api/complaints' && method === 'POST') {
          const body = options?.body;
          let newComplaint: any = {};

          if (body instanceof FormData) {
            const category = body.get('category') as string;
            const description = body.get('description') as string;
            const latitude = parseFloat(body.get('latitude') as string || '10.9575');
            const longitude = parseFloat(body.get('longitude') as string || '76.9735');
            const locationName = body.get('locationName') as string || 'Sundarapuram Bypass Road';
            const detectedAddress = body.get('detectedAddress') as string || locationName;
            const voiceDescription = body.get('voiceDescription') as string || '';
            const citizenPhone = body.get('citizenPhone') as string || '+91 99887 76655';
            const citizenName = body.get('citizenName') as string || 'Citizen';

            let maxIdNum = 1000;
            complaints.forEach(c => {
              const match = c.id.match(/AQ-(\d+)/);
              if (match) {
                const num = parseInt(match[1], 10);
                if (num > maxIdNum) maxIdNum = num;
              }
            });
            const newId = `AQ-${maxIdNum + 1}`;

            // Image mock placeholder
            const photoFile = body.get('photo');
            let imageUrl = '';
            if (photoFile && photoFile instanceof File) {
              imageUrl = URL.createObjectURL(photoFile); // Local Blob representation
            }

            // Route dynamically based on location/wards
            let supervisorId = 'super-1';
            let engineerId = 'eng-1';
            let slaHours = 24;

            const categoryMatch = defaultCategories.find(c => c.name === category);
            if (categoryMatch) {
              slaHours = categoryMatch.defaultSla;
            }

            if (locationName.includes('Saravanampatti') || locationName.includes('Ganapathy') || longitude > 76.98) {
              supervisorId = 'super-2';
              engineerId = 'eng-2';
            }

            newComplaint = {
              id: newId,
              category,
              latitude,
              longitude,
              locationName,
              detectedAddress,
              description,
              voiceDescription,
              imageUrl,
              afterImageUrl: '',
              verificationImageUrl: '',
              severity: categoryMatch?.defaultSeverity || 'Medium',
              status: 'Reported',
              citizenPhone,
              citizenName,
              dateReported: new Date().toISOString(),
              dateAssigned: '',
              dateCompleted: '',
              dateVerified: '',
              assignedCrew: '',
              supervisorId,
              engineerId,
              slaHours,
              slaDeadline: new Date(Date.now() + slaHours * 3600000).toISOString(),
              escalationLevel: 0,
              isDuplicate: false,
              duplicateCount: 0,
              history: [
                {
                  timestamp: new Date().toISOString(),
                  action: 'Complaint Submitted',
                  officerName: 'Citizen',
                  notes: 'Reported via Local Mobile Interface.'
                }
              ]
            };
          }

          complaints.unshift(newComplaint);
          logs.push({
            timestamp: new Date().toISOString(),
            user: newComplaint.citizenName,
            action: 'Submit Grievance',
            notes: `Submitted local complaint ${newComplaint.id}.`
          });
          writeDB(complaints, users, logs);
          return createResponse({ success: true, data: newComplaint });
        }

        // 6. POST /api/complaints/:id/assign
        const assignMatch = path.match(/^\/api\/complaints\/([^/]+)\/assign$/);
        if (assignMatch && method === 'POST') {
          const compId = assignMatch[1];
          const payload = JSON.parse(options?.body as string || '{}');
          const { crewName, supervisorId, engineerId } = payload;

          const target = complaints.find(c => c.id === compId);
          if (target) {
            target.status = 'Assigned';
            target.assignedCrew = crewName || 'crew-1';
            if (supervisorId) target.supervisorId = supervisorId;
            if (engineerId) target.engineerId = engineerId;
            target.dateAssigned = new Date().toISOString();
            target.history.push({
              timestamp: new Date().toISOString(),
              action: 'Assigned to Crew',
              officerName: 'Supervisor',
              notes: `Dispatched ${crewName || 'repair team'}`
            });

            writeDB(complaints, users, logs);
            return createResponse({ success: true, message: 'Local assignment completed.' });
          }
        }

        // 7. POST /api/complaints/:id/crew-update
        const crewUpdateMatch = path.match(/^\/api\/complaints\/([^/]+)\/crew-update$/);
        if (crewUpdateMatch && method === 'POST') {
          const compId = crewUpdateMatch[1];
          const target = complaints.find(c => c.id === compId);

          if (target) {
            let startWork = 'false';
            let notes = '';

            const body = options?.body;
            if (body instanceof FormData) {
              startWork = body.get('startWork') as string || 'false';
              notes = body.get('notes') as string || '';
              const beforePhoto = body.get('beforePhoto');
              const afterPhoto = body.get('afterPhoto');
              if (beforePhoto && beforePhoto instanceof File) {
                target.imageUrl = URL.createObjectURL(beforePhoto);
              }
              if (afterPhoto && afterPhoto instanceof File) {
                target.afterImageUrl = URL.createObjectURL(afterPhoto);
              }
            } else if (typeof body === 'string') {
              const payload = JSON.parse(body || '{}');
              startWork = payload.startWork || 'false';
              notes = payload.notes || '';
              if (payload.beforePhotoUrl) target.imageUrl = payload.beforePhotoUrl;
              if (payload.afterPhotoUrl) target.afterImageUrl = payload.afterPhotoUrl;
            }

            if (startWork === 'true') {
              target.status = 'In Progress';
              target.history.push({
                timestamp: new Date().toISOString(),
                action: 'Work Started',
                officerName: 'Repair Crew',
                notes: notes || 'Crew arrived on site. Commencing repair works.'
              });
              logs.push({
                timestamp: new Date().toISOString(),
                user: target.assignedCrew || 'Crew',
                action: 'Work Started',
                notes: `Initiated repair at site for ${compId}`
              });
            } else {
              target.status = 'Pending Verification';
              target.dateCompleted = new Date().toISOString();
              target.history.push({
                timestamp: new Date().toISOString(),
                action: 'Repair Completed',
                officerName: 'Repair Crew',
                notes: notes || 'Work done. Swapped gasket and verified seal.'
              });
              logs.push({
                timestamp: new Date().toISOString(),
                user: target.assignedCrew || 'Crew',
                action: 'Repair Finished',
                notes: `Completed repair details for ${compId}. Awaiting JE audit.`
              });
            }

            writeDB(complaints, users, logs);
            return createResponse({ success: true });
          }
        }

        // 8. POST /api/complaints/:id/verify
        const verifyMatch = path.match(/^\/api\/complaints\/([^/]+)\/verify$/);
        if (verifyMatch && method === 'POST') {
          const compId = verifyMatch[1];
          const payload = JSON.parse(options?.body as string || '{}');
          const target = complaints.find(c => c.id === compId);

          if (target) {
            target.status = 'Resolved';
            target.dateVerified = new Date().toISOString();
            target.history.push({
              timestamp: new Date().toISOString(),
              action: 'Work Verified',
              officerName: 'Supervisor',
              notes: payload.notes || 'Repairs audited and verified.'
            });

            writeDB(complaints, users, logs);
            return createResponse({ success: true });
          }
        }

        // 9. POST /api/whatsapp/emulator
        if (path === '/api/whatsapp/emulator' && method === 'POST') {
          const payload = JSON.parse(options?.body as string || '{}');
          const msg = payload.message || '';
          
          let reply = `வணக்கம்! Neer Ugam Helpdesk here. 💧\nWe received: "${msg}".\nAI routed your request successfully!`;
          
          if (/burst|broken|leak/i.test(msg)) {
            reply = `💧 Neer Ugam Ticket Alert:\nGrievance created successfully!\nCategory: Water Leakage\nLocation: Sundarapuram\nrouted to Crew Alpha.`;
          } else if (/status|track/i.test(msg)) {
            reply = `🔍 Neer Ugam Tracker:\nEnter your AQ grievance ID (e.g. "AQ-1008") to get live resolution status.`;
          }
          
          return createResponse({ success: true, reply });
        }

        return createResponse({ error: 'Route not found locally' }, 404);
      } catch (err: any) {
        return resolve(new Response(JSON.stringify({ error: err.message }), { status: 500 }));
      }
    }, 150);
  });
};
