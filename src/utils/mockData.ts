export const defaultCategories = [
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

export const defaultWards = [
  { id: 'ward-61', zone: 'South Zone', name: 'Ward 61 - Sundarapuram', supervisorId: 'super-1', crewId: 'crew-1', engineerId: 'eng-1' },
  { id: 'ward-62', zone: 'South Zone', name: 'Ward 62 - Kurichi', supervisorId: 'super-1', crewId: 'crew-2', engineerId: 'eng-1' },
  { id: 'ward-12', zone: 'North Zone', name: 'Ward 12 - Saravanampatti', supervisorId: 'super-2', crewId: 'crew-3', engineerId: 'eng-2' },
  { id: 'ward-15', zone: 'North Zone', name: 'Ward 15 - Ganapathy', supervisorId: 'super-2', crewId: 'crew-4', engineerId: 'eng-2' }
];

export const defaultUsers = [
  { id: 'admin-1', username: 'admin', role: 'Admin', name: 'Dr. G. Selvakumar', phone: '+91 94440 12345', email: 'admin.water@tn.gov.in' },
  { id: 'comm-1', username: 'collector', role: 'Commissioner', name: 'Thiru. Pavankumar G Giriyappanavar, I.A.S.', phone: '+91 94440 54321', email: 'collector.cbe@tn.gov.in' },
  { id: 'super-1', username: 'super1', role: 'Supervisor', name: 'R. Jagadeesan', phone: '+91 98765 43210', zone: 'South Zone', wards: ['ward-61', 'ward-62'] },
  { id: 'super-2', username: 'super2', role: 'Supervisor', name: 'V. Ramanathan', phone: '+91 98765 43211', zone: 'North Zone', wards: ['ward-12', 'ward-15'] },
  { id: 'crew-1', username: 'crew1', role: 'Crew', name: 'Crew Alpha (Lead: Murugan)', phone: '+91 98430 11111', ward: 'ward-61' },
  { id: 'crew-2', username: 'crew2', role: 'Crew', name: 'Crew Beta (Lead: Selvam)', phone: '+91 98430 22222', ward: 'ward-62' },
  { id: 'crew-3', username: 'crew3', role: 'Crew', name: 'Crew Gamma (Lead: Kathir)', phone: '+91 98430 33333', ward: 'ward-12' },
  { id: 'crew-4', username: 'crew4', role: 'Crew', name: 'Crew Delta (Lead: Palani)', phone: '+91 98430 44444', ward: 'ward-15' },
  { id: 'eng-1', username: 'eng1', role: 'JE', name: 'Er. K. Rajesh, M.E.', phone: '+91 94420 88888', email: 'je.south.water@tn.gov.in', level: 'Junior Engineer' },
  { id: 'eng-2', username: 'eng2', role: 'JE', name: 'Er. M. Preetha, B.E.', phone: '+91 94420 99999', email: 'je.north.water@tn.gov.in', level: 'Assistant Engineer' }
];

export const mockComplaints = [
  {
    id: 'AQ-1007',
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
    status: 'Assigned',
    citizenPhone: '+91 99887 76655',
    citizenName: 'K. Srinivasan',
    dateReported: new Date(Date.now() - 3600000).toISOString(),
    dateAssigned: new Date(Date.now() - 1800000).toISOString(),
    dateCompleted: '',
    dateVerified: '',
    assignedCrew: 'crew-2',
    supervisorId: 'super-1',
    engineerId: 'eng-1',
    slaHours: 12,
    slaDeadline: new Date(Date.now() + 10 * 3600000).toISOString(),
    escalationLevel: 0,
    isDuplicate: false,
    duplicateCount: 0,
    history: [
      {
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        action: 'Complaint Submitted',
        officerName: 'Citizen',
        notes: 'Reported via Web Portal. AI classified issue as Pipeline Burst, Severity: Critical. Routed to South Zone.'
      },
      {
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        action: 'Assigned to Crew',
        officerName: 'Supervisor',
        notes: 'Clean the rust also'
      }
    ]
  },
  {
    id: 'AQ-1008',
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
    status: 'In Progress',
    citizenPhone: '+91 94432 00987',
    citizenName: 'A. Rahim',
    dateReported: new Date(Date.now() - 5400000).toISOString(),
    dateAssigned: new Date(Date.now() - 2700000).toISOString(),
    dateCompleted: '',
    dateVerified: '',
    assignedCrew: 'crew-1',
    supervisorId: 'super-1',
    engineerId: 'eng-1',
    slaHours: 24,
    slaDeadline: new Date(Date.now() + 20 * 3600000).toISOString(),
    escalationLevel: 0,
    isDuplicate: false,
    duplicateCount: 0,
    history: [
      {
        timestamp: new Date(Date.now() - 5400000).toISOString(),
        action: 'Complaint Submitted',
        officerName: 'Citizen',
        notes: 'Reported via Web Portal.'
      },
      {
        timestamp: new Date(Date.now() - 2700000).toISOString(),
        action: 'Assigned to Crew',
        officerName: 'Supervisor R. Jagadeesan',
        notes: 'Assigned to Crew Alpha for immediate site inspection.'
      },
      {
        timestamp: new Date(Date.now() - 600000).toISOString(),
        action: 'Work Started',
        officerName: 'Repair Crew',
        notes: 'Crew arrived at location and initiated pipeline cutoff.'
      }
    ]
  },
  {
    id: 'AQ-1009',
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
    status: 'Reported',
    citizenPhone: '+91 98421 12345',
    citizenName: 'Anonymous Citizen',
    dateReported: new Date(Date.now() - 7200000).toISOString(),
    dateAssigned: '',
    dateCompleted: '',
    dateVerified: '',
    assignedCrew: '',
    supervisorId: 'super-2',
    engineerId: 'eng-2',
    slaHours: 24,
    slaDeadline: new Date(Date.now() + 18 * 3600000).toISOString(),
    escalationLevel: 0,
    isDuplicate: false,
    duplicateCount: 0,
    history: [
      {
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        action: 'Complaint Submitted',
        officerName: 'Citizen',
        notes: 'Reported anonymously. AI Severity: High.'
      }
    ]
  }
];
