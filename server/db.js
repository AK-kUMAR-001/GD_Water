const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, '../data/db.json');

const defaultCategories = [
  { id: 'cat-1', name: 'Pipeline Burst', nameTa: 'குழாய் வெடிப்பு', defaultSla: 12, defaultSeverity: 'Critical' },
  { id: 'cat-2', name: 'Water Leakage', nameTa: 'தண்ணீர் கசிவு', defaultSla: 24, defaultSeverity: 'Medium' },
  { id: 'cat-3', name: 'Water Theft', nameTa: 'தண்ணீர் திருட்டு', defaultSla: 24, defaultSeverity: 'High' },
  { id: 'cat-4', name: 'Illegal Connection', nameTa: 'சட்டவிரோத இணைப்பு', defaultSla: 48, defaultSeverity: 'High' },
  { id: 'cat-5', name: 'Pump Failure', nameTa: 'மின்சார பம்ப் பழுது', defaultSla: 24, defaultSeverity: 'High' },
  { id: 'cat-6', name: 'No Water Supply', nameTa: 'தண்ணீர் விநியோகம் இல்லை', defaultSla: 24, defaultSeverity: 'High' },
  { id: 'cat-7', name: 'Low Water Pressure', nameTa: 'குறைந்த நீர் அழுத்தம்', defaultSla: 48, defaultSeverity: 'Low' },
  { id: 'cat-8', name: 'Contaminated Water', nameTa: 'மாசுபட்ட தண்ணீர்', defaultSla: 12, defaultSeverity: 'Critical' },
  { id: 'cat-9', name: 'Overflowing Tank', nameTa: 'தொட்டி நிரம்பி வழிதல்', defaultSla: 12, defaultSeverity: 'Medium' },
  { id: 'cat-10', name: 'Broken Public Tap', nameTa: 'பொது குழாய் உடைப்பு', defaultSla: 24, defaultSeverity: 'Medium' },
  { id: 'cat-11', name: 'Sewer Mixing', nameTa: 'சாக்கடை நீர் கலத்தல்', defaultSla: 12, defaultSeverity: 'Critical' },
  { id: 'cat-12', name: 'Water Meter Damage', nameTa: 'தண்ணீர் மீட்டர் சேதம்', defaultSla: 48, defaultSeverity: 'Low' }
];

const defaultWards = [
  { id: 'ward-61', zone: 'South Zone', name: 'Ward 61 - Sundarapuram', supervisorId: 'super-1', crewId: 'crew-1', engineerId: 'eng-1' },
  { id: 'ward-62', zone: 'South Zone', name: 'Ward 62 - Kurichi', supervisorId: 'super-1', crewId: 'crew-2', engineerId: 'eng-1' },
  { id: 'ward-12', zone: 'North Zone', name: 'Ward 12 - Saravanampatti', supervisorId: 'super-2', crewId: 'crew-3', engineerId: 'eng-2' },
  { id: 'ward-15', zone: 'North Zone', name: 'Ward 15 - Ganapathy', supervisorId: 'super-2', crewId: 'crew-4', engineerId: 'eng-2' }
];

const defaultUsers = [
  { id: 'admin-1', username: 'admin', role: 'Admin', name: 'Dr. G. Selvakumar', phone: '+91 94440 12345', email: 'admin.water@tn.gov.in' },
  { id: 'comm-1', username: 'collector', role: 'Commissioner', name: 'S. Kranthi Kumar Pati, IAS', phone: '+91 94440 54321', email: 'collector.cbe@tn.gov.in' },
  { id: 'super-1', username: 'super1', role: 'Supervisor', name: 'R. Jagadeesan', phone: '+91 98765 43210', zone: 'South Zone', wards: ['ward-61', 'ward-62'] },
  { id: 'super-2', username: 'super2', role: 'Supervisor', name: 'V. Ramanathan', phone: '+91 98765 43211', zone: 'North Zone', wards: ['ward-12', 'ward-15'] },
  { id: 'crew-1', username: 'crew1', role: 'Crew', name: 'Crew Alpha (Lead: Murugan)', phone: '+91 98430 11111', ward: 'ward-61' },
  { id: 'crew-2', username: 'crew2', role: 'Crew', name: 'Crew Beta (Lead: Selvam)', phone: '+91 98430 22222', ward: 'ward-62' },
  { id: 'crew-3', username: 'crew3', role: 'Crew', name: 'Crew Gamma (Lead: Kathir)', phone: '+91 98430 33333', ward: 'ward-12' },
  { id: 'crew-4', username: 'crew4', role: 'Crew', name: 'Crew Delta (Lead: Palani)', phone: '+91 98430 44444', ward: 'ward-15' },
  { id: 'eng-1', username: 'eng1', role: 'JE', name: 'Er. K. Rajesh, M.E.', phone: '+91 94420 88888', email: 'je.south.water@tn.gov.in', level: 'Junior Engineer' },
  { id: 'eng-2', username: 'eng2', role: 'JE', name: 'Er. M. Preetha, B.E.', phone: '+91 94420 99999', email: 'je.north.water@tn.gov.in', level: 'Assistant Engineer' }
];

const mockComplaints = [
  {
    id: 'AQ-1001',
    category: 'Pipeline Burst',
    latitude: 10.9582,
    longitude: 76.9741,
    locationName: 'Sundarapuram Bus Stand, Coimbatore',
    description: 'Major drinking water pipeline burst near the bus shelter. Water shooting up to 10 feet. Flooding the main road and disrupting traffic.',
    voiceDescription: 'Sundarapuram bus stand kitta water pipe burst aayi flow aaguthu.',
    imageUrl: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=600',
    afterImageUrl: '',
    verificationImageUrl: '',
    severity: 'Critical',
    status: 'Reported',
    citizenPhone: '+91 99887 76655',
    citizenName: 'K. Srinivasan',
    dateReported: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    dateAssigned: '',
    dateCompleted: '',
    dateVerified: '',
    assignedCrew: '',
    supervisorId: 'super-1',
    engineerId: 'eng-1',
    slaHours: 12,
    slaDeadline: new Date(Date.now() + 11 * 3600000).toISOString(),
    escalationLevel: 0,
    isDuplicate: false,
    duplicateCount: 0,
    history: [
      { timestamp: new Date(Date.now() - 3600000).toISOString(), action: 'Complaint Submitted', officerName: 'Citizen', notes: 'Reported via Web Portal. AI classified issue as Pipeline Burst, Severity: Critical. Routed to South Zone.' }
    ]
  },
  {
    id: 'AQ-1002',
    category: 'Water Leakage',
    latitude: 10.9612,
    longitude: 76.9702,
    locationName: 'Lichy Road, Near Kurichi lake road, Coimbatore',
    description: 'Minor water leakage from the public pipeline connection. Constant flow of water from under the pavement.',
    voiceDescription: '',
    imageUrl: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&q=80&w=600',
    afterImageUrl: '',
    verificationImageUrl: '',
    severity: 'Medium',
    status: 'Assigned',
    citizenPhone: '+91 94432 00987',
    citizenName: 'A. Rahim',
    dateReported: new Date(Date.now() - 5 * 3600000).toISOString(), // 5 hours ago
    dateAssigned: new Date(Date.now() - 4.5 * 3600000).toISOString(),
    dateCompleted: '',
    dateVerified: '',
    assignedCrew: 'crew-2',
    supervisorId: 'super-1',
    engineerId: 'eng-1',
    slaHours: 24,
    slaDeadline: new Date(Date.now() + 19 * 3600000).toISOString(),
    escalationLevel: 0,
    isDuplicate: false,
    duplicateCount: 0,
    history: [
      { timestamp: new Date(Date.now() - 5 * 3600000).toISOString(), action: 'Complaint Submitted', officerName: 'Citizen', notes: 'Reported via Web Portal.' },
      { timestamp: new Date(Date.now() - 4.5 * 3600000).toISOString(), action: 'Assigned to Crew', officerName: 'Supervisor R. Jagadeesan', notes: 'Assigned to Crew Beta for immediate site inspection.' }
    ]
  },
  {
    id: 'AQ-1003',
    category: 'Water Theft',
    latitude: 11.0289,
    longitude: 76.9928,
    locationName: 'Ward 12, Saravanampatti, Coimbatore',
    description: 'A commercial establishment has tapped directly into the municipal supply line illegally using an electric pump.',
    voiceDescription: '',
    imageUrl: '',
    afterImageUrl: '',
    verificationImageUrl: '',
    severity: 'High',
    status: 'In Progress',
    citizenPhone: '+91 98421 12345',
    citizenName: 'Anonymous Citizen',
    dateReported: new Date(Date.now() - 20 * 3600000).toISOString(), // 20 hours ago
    dateAssigned: new Date(Date.now() - 19 * 3600000).toISOString(),
    dateCompleted: '',
    dateVerified: '',
    assignedCrew: 'crew-3',
    supervisorId: 'super-2',
    engineerId: 'eng-2',
    slaHours: 24,
    slaDeadline: new Date(Date.now() + 4 * 3600000).toISOString(), // 4 hours left
    escalationLevel: 0,
    isDuplicate: false,
    duplicateCount: 0,
    history: [
      { timestamp: new Date(Date.now() - 20 * 3600000).toISOString(), action: 'Complaint Submitted', officerName: 'Citizen', notes: 'Reported anonymously. AI Severity: High.' },
      { timestamp: new Date(Date.now() - 19 * 3600000).toISOString(), action: 'Assigned to Crew', officerName: 'Supervisor V. Ramanathan', notes: 'Crew Gamma dispatched to confiscate unauthorized pumping equipment.' },
      { timestamp: new Date(Date.now() - 10 * 3600000).toISOString(), action: 'Work Started', officerName: 'Crew Gamma (Lead: Kathir)', notes: 'Arrived at location. Confirming illegal connection valve. Initiating cutoff.' }
    ]
  },
  {
    id: 'AQ-1004',
    category: 'Contaminated Water',
    latitude: 10.9575,
    longitude: 76.9735,
    locationName: 'Phase 2 Housing Board, Kurichi',
    description: 'Tap water received has a foul drainage smell and is yellowish brown in color. High risk of waterborne diseases. Sewer mixing suspected.',
    voiceDescription: 'Thanni romba contamination ah varuthu, smell adikkuthu.',
    imageUrl: 'https://images.unsplash.com/photo-1576089172869-4f5f6f315620?auto=format&fit=crop&q=80&w=600',
    afterImageUrl: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=600',
    verificationImageUrl: '',
    severity: 'Critical',
    status: 'Pending Verification',
    citizenPhone: '+91 97766 55443',
    citizenName: 'M. Karpagam',
    dateReported: new Date(Date.now() - 18 * 3600000).toISOString(), // 18 hours ago
    dateAssigned: new Date(Date.now() - 17.5 * 3600000).toISOString(),
    dateCompleted: new Date(Date.now() - 2 * 3600000).toISOString(),
    dateVerified: '',
    assignedCrew: 'crew-1',
    supervisorId: 'super-1',
    engineerId: 'eng-1',
    slaHours: 12,
    slaDeadline: new Date(Date.now() - 6 * 3600000).toISOString(), // SLA missed by 6 hours
    escalationLevel: 2, // Escalated to JE/AE level
    isDuplicate: false,
    duplicateCount: 0,
    history: [
      { timestamp: new Date(Date.now() - 18 * 3600000).toISOString(), action: 'Complaint Submitted', officerName: 'Citizen', notes: 'Reported via Web Portal.' },
      { timestamp: new Date(Date.now() - 17.5 * 3600000).toISOString(), action: 'Assigned to Crew', officerName: 'Supervisor R. Jagadeesan', notes: 'Assigned to Crew Alpha. Urgently trace contamination sources.' },
      { timestamp: new Date(Date.now() - 6 * 3600000).toISOString(), action: 'SLA Escalation (Level 1)', officerName: 'System', notes: 'SLA of 12 Hours exceeded. Escalated to Supervisor R. Jagadeesan.' },
      { timestamp: new Date(Date.now() - 2 * 3600000).toISOString(), action: 'Repair Completed', officerName: 'Crew Alpha (Lead: Murugan)', notes: 'Identified a minor leak near the drainage crossing. Replaced the gasket and sealed the pipeline. Disinfected. Water is clear now. Awaiting JE verification.' }
    ]
  },
  {
    id: 'AQ-1005',
    category: 'Pump Failure',
    latitude: 11.0265,
    longitude: 76.9954,
    locationName: 'Sathy Road, Ganapathy, Coimbatore',
    description: 'The overhead water tank pump has burned out. No supply for the last 3 days. Thousands of families are suffering.',
    voiceDescription: '',
    imageUrl: '',
    afterImageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&q=80&w=600',
    verificationImageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&q=80&w=600',
    severity: 'High',
    status: 'Resolved',
    citizenPhone: '+91 90033 44556',
    citizenName: 'J. Ronald',
    dateReported: new Date(Date.now() - 48 * 3600000).toISOString(),
    dateAssigned: new Date(Date.now() - 47 * 3600000).toISOString(),
    dateCompleted: new Date(Date.now() - 24 * 3600000).toISOString(),
    dateVerified: new Date(Date.now() - 22 * 3600000).toISOString(),
    assignedCrew: 'crew-4',
    supervisorId: 'super-2',
    engineerId: 'eng-2',
    slaHours: 24,
    slaDeadline: new Date(Date.now() - 24 * 3600000).toISOString(),
    escalationLevel: 0,
    isDuplicate: false,
    duplicateCount: 0,
    history: [
      { timestamp: new Date(Date.now() - 48 * 3600000).toISOString(), action: 'Complaint Submitted', officerName: 'Citizen', notes: 'Reported.' },
      { timestamp: new Date(Date.now() - 47 * 3600000).toISOString(), action: 'Assigned to Crew', officerName: 'Supervisor V. Ramanathan', notes: 'Assigned Crew Delta.' },
      { timestamp: new Date(Date.now() - 24 * 3600000).toISOString(), action: 'Repair Completed', officerName: 'Crew Delta (Lead: Palani)', notes: 'Motor coil rewound and replaced. Operational now. Tank filled.' },
      { timestamp: new Date(Date.now() - 22 * 3600000).toISOString(), action: 'Site Verified and Closed', officerName: 'Engineer Er. M. Preetha', notes: 'Visited site. Checked motor load and water pressure. Work is perfect. Closed complaint.' }
    ]
  },
  {
    id: 'AQ-1006',
    category: 'Pipeline Burst',
    latitude: 10.9580,
    longitude: 76.9740,
    locationName: 'Sundarapuram bus shelter, Kurichi Ward 61',
    description: 'Massive burst of main pipeline. Water is flooding the shops.',
    voiceDescription: '',
    imageUrl: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=600',
    afterImageUrl: '',
    verificationImageUrl: '',
    severity: 'Critical',
    status: 'Reported',
    citizenPhone: '+91 94444 88888',
    citizenName: 'Pranesh Kumar',
    dateReported: new Date(Date.now() - 1800000).toISOString(), // 30 mins ago
    dateAssigned: '',
    dateCompleted: '',
    dateVerified: '',
    assignedCrew: '',
    supervisorId: 'super-1',
    engineerId: 'eng-1',
    slaHours: 12,
    slaDeadline: new Date(Date.now() + 11.5 * 3600000).toISOString(),
    escalationLevel: 0,
    isDuplicate: true,
    masterComplaintId: 'AQ-1001', // Smart Duplicate Detection links it here
    duplicateCount: 0,
    history: [
      { timestamp: new Date(Date.now() - 1800000).toISOString(), action: 'Complaint Submitted', officerName: 'Citizen', notes: 'Reported via Web Portal. Auto-flagged as Duplicate of AQ-1001. Merged under master complaint.' }
    ]
  }
];

const defaultAuditLogs = [
  { timestamp: new Date(Date.now() - 48 * 3600000).toISOString(), user: 'System', action: 'Initialize Database', notes: 'AquaAlert AI system DB successfully configured and launched.' },
  { timestamp: new Date(Date.now() - 24 * 3600000).toISOString(), user: 'eng2', action: 'Verify Repair', notes: 'Verified and closed AQ-1005 (Pump Failure Sathy Road).' },
  { timestamp: new Date(Date.now() - 6 * 3600000).toISOString(), user: 'System', action: 'Auto-Escalation Engine', notes: 'Complaint AQ-1004 SLA deadline exceeded. System escalated target to Level 2 (JE/AE Rajesh).' }
];

function initDB() {
  const dataDir = path.dirname(DB_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  const exportsDir = path.join(dataDir, 'exports');
  if (!fs.existsSync(exportsDir)) {
    fs.mkdirSync(exportsDir, { recursive: true });
  }
  const uploadsDir = path.join(__dirname, '../uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    const seedData = {
      categories: defaultCategories,
      wards: defaultWards,
      users: defaultUsers,
      complaints: mockComplaints,
      auditLogs: defaultAuditLogs
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(seedData, null, 2), 'utf8');
    console.log('AquaAlert AI Database initialized with seed data.');
  }
}

function readData() {
  initDB();
  try {
    const content = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(content);
  } catch (err) {
    console.error('Error reading database file:', err);
    return {
      categories: defaultCategories,
      wards: defaultWards,
      users: defaultUsers,
      complaints: [],
      auditLogs: []
    };
  }
}

function writeData(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing to database file:', err);
    return false;
  }
}

function logAudit(user, action, notes) {
  const data = readData();
  data.auditLogs.unshift({
    timestamp: new Date().toISOString(),
    user,
    action,
    notes
  });
  // Cap at 200 logs to preserve storage
  if (data.auditLogs.length > 200) {
    data.auditLogs = data.auditLogs.slice(0, 200);
  }
  writeData(data);
}

function resetDB() {
  const seedData = {
    categories: defaultCategories,
    wards: defaultWards,
    users: defaultUsers,
    complaints: mockComplaints,
    auditLogs: defaultAuditLogs
  };
  fs.writeFileSync(DB_FILE, JSON.stringify(seedData, null, 2), 'utf8');
  console.log('Database reset to initial mock template.');
}

module.exports = {
  readData,
  writeData,
  logAudit,
  initDB,
  resetDB
};
