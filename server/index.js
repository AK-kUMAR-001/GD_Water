const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const db = require('./db');
const excel = require('./excel');
const nlp = require('./nlp');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Initialize database file and folders
db.initDB();

// Expose uploaded photos statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Configure Multer for local uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads');
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${Date.now()}${ext}`);
  }
});
const upload = multer({ storage });

// --- UTILITY FOR DUPLICATE DETECTION ---
function checkDuplicate(newLat, newLng, category, existingComplaints) {
  const DISTANCE_THRESHOLD = 0.001; // ~100 meters in coordinates
  return existingComplaints.find(c => {
    if (c.category !== category) return false;
    if (c.status === 'Resolved') return false;
    if (c.isDuplicate) return false; // Match only with master complaints

    const latDiff = Math.abs(c.latitude - newLat);
    const lngDiff = Math.abs(c.longitude - newLng);
    return latDiff < DISTANCE_THRESHOLD && lngDiff < DISTANCE_THRESHOLD;
  });
}

// --- BACKGROUND SLA & ESCALATION RUNNER ---
setInterval(() => {
  try {
    const data = db.readData();
    let updated = false;
    const now = new Date();

    data.complaints.forEach(c => {
      // Check if ticket is still active (not resolved)
      if (c.status !== 'Resolved' && c.slaDeadline) {
        const deadline = new Date(c.slaDeadline);
        if (now > deadline) {
          // Determine target escalation level based on time missed
          // Escalates every 1 hour past the deadline for demo demonstration purposes (usually 12-24h)
          const msPast = now - deadline;
          const hoursPast = Math.floor(msPast / 3600000) + 1;
          const targetLevel = Math.min(hoursPast, 6); // Max out at Level 6 (State Department)

          if (c.escalationLevel < targetLevel) {
            c.escalationLevel = targetLevel;
            updated = true;

            const escalationPartners = [
              'Crew & Field Team',
              'Supervisor R. Jagadeesan',
              'Assistant Engineer',
              'Executive Engineer',
              'Municipal Commissioner',
              'District Collector',
              'State Water Department'
            ];
            const escalationTarget = escalationPartners[c.escalationLevel] || 'High Authority';
            
            c.history.push({
              timestamp: now.toISOString(),
              action: `SLA Escalated (Level ${c.escalationLevel})`,
              officerName: 'System SLA Guard',
              notes: `SLA breached by ${hoursPast} hour(s). Complaint escalated automatically to: ${escalationTarget}.`
            });

            db.logAudit('System', 'Auto-Escalation', `Complaint ${c.id} escalated to Level ${c.escalationLevel} (${escalationTarget})`);
          }
        }
      }
    });

    if (updated) {
      db.writeData(data);
    }
  } catch (err) {
    console.error('Error running SLA escalation interval:', err);
  }
}, 30000); // Check every 30 seconds

// --- API ENDPOINTS ---

// Get active / all complaints
app.get('/api/complaints', (req, res) => {
  const data = db.readData();
  res.json(data.complaints);
});

// Create a complaint (Citizen portal)
app.post('/api/complaints', upload.single('photo'), (req, res) => {
  try {
    const data = db.readData();
    const { category, latitude, longitude, description, citizenName, citizenPhone, voiceText, detectedAddress } = req.body;
    
    const lat = parseFloat(latitude) || 10.9578;
    const lng = parseFloat(longitude) || 76.9740;
    
    // 1. Real AI Processing via NLP Vector Matcher
    const descriptionText = description || voiceText || '';
    const nlpResult = nlp.classifyComplaint(descriptionText);
    
    // Auto-select category if NLP matches with confidence > 20%
    let finalCategory = category;
    if (nlpResult.predictedCategory !== 'Others' && nlpResult.confidence > 20) {
      finalCategory = nlpResult.predictedCategory;
    }
    
    const categoryConfig = data.categories.find(cat => cat.name === finalCategory) || data.categories[0];
    const severity = categoryConfig.defaultSeverity;
    const slaHours = categoryConfig.defaultSla;
    const slaDeadline = new Date(Date.now() + slaHours * 3600000).toISOString();

    // 2. GIS Mapping - Map coordinates to Ward
    let assignedWard = 'ward-61'; // Default Fallback
    let locationName = detectedAddress || req.body.locationName || 'Unknown Location';
    
    // Very simple coordinate box mapping for mock demonstration
    if (lat > 11.0) {
      assignedWard = lng > 76.993 ? 'ward-12' : 'ward-15';
    } else {
      assignedWard = lng > 76.972 ? 'ward-61' : 'ward-62';
    }
    
    const wardObj = data.wards.find(w => w.id === assignedWard);
    if (wardObj && !detectedAddress && !req.body.locationName) {
      locationName = `${wardObj.name}, ${wardObj.zone}, Coimbatore`;
    }

    // 3. Smart Duplicate Detection
    const duplicateMatch = checkDuplicate(lat, lng, finalCategory, data.complaints);
    
    const newId = `AQ-${1000 + data.complaints.length + 1}`;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : '';

    const newComplaint = {
      id: newId,
      category: finalCategory,
      latitude: lat,
      longitude: lng,
      locationName,
      detectedAddress: detectedAddress || locationName,
      description: descriptionText || 'No description provided.',
      voiceDescription: voiceText || '',
      imageUrl,
      afterImageUrl: '',
      verificationImageUrl: '',
      severity,
      status: 'Reported',
      citizenPhone: citizenPhone || '+91 99999 99999',
      citizenName: citizenName || 'Anonymous',
      dateReported: new Date().toISOString(),
      dateAssigned: '',
      dateCompleted: '',
      dateVerified: '',
      assignedCrew: '',
      supervisorId: wardObj ? wardObj.supervisorId : 'super-1',
      engineerId: wardObj ? wardObj.engineerId : 'eng-1',
      slaHours,
      slaDeadline,
      escalationLevel: 0,
      isDuplicate: !!duplicateMatch,
      masterComplaintId: duplicateMatch ? duplicateMatch.id : '',
      duplicateCount: 0,
      aiModelDetails: {
        predictedCategory: nlpResult.predictedCategory,
        confidence: nlpResult.confidence,
        matchLogs: nlpResult.matchLogs,
        matchedTokens: nlpResult.matchedTokens,
        inputText: descriptionText
      },
      history: [
        {
          timestamp: new Date().toISOString(),
          action: 'Complaint Registered',
          officerName: 'Citizen',
          notes: duplicateMatch 
            ? `Report logged. AI duplicate sensor matched with active incident ${duplicateMatch.id}. Linked.`
            : `AI NLP classification complete. Category: ${finalCategory} (${nlpResult.confidence}% confidence). Severity: ${severity}. SLA Set: ${slaHours} Hours. Routed to ${wardObj?.name}.`
        }
      ]
    };

    if (duplicateMatch) {
      duplicateMatch.duplicateCount = (duplicateMatch.duplicateCount || 0) + 1;
      duplicateMatch.history.push({
        timestamp: new Date().toISOString(),
        action: 'Duplicate Incident Logged',
        officerName: 'AI Engine',
        notes: `Additional report received from ${newComplaint.citizenName} (${newComplaint.citizenPhone}). Automatically merged into master report.`
      });
      db.logAudit('AI Engine', 'Duplicate Merged', `Citizen report merged into master incident ${duplicateMatch.id}`);
    } else {
      db.logAudit('AI Engine', 'Complaint Categorized', `Assigned ID ${newComplaint.id} for category ${category}. Routed to Ward ${assignedWard}`);
    }

    data.complaints.unshift(newComplaint);
    db.writeData(data);

    // Live SMS transmission to citizen phone (e.g. 8925081899)
    const smsMessage = `Neer Ugam: Grievance ${newComplaint.id} (${newComplaint.category}) registered. AI auto-routed to ${wardObj?.name || 'Ward 61'}.`;
    sendSmsNotification(newComplaint.citizenPhone, smsMessage);

    res.status(201).json(newComplaint);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to process complaint registration.' });
  }
});

// Helper for SMS notification transmission
async function sendSmsNotification(toPhone, message) {
  try {
    let cleanPhone = toPhone.replace(/[\s-()]/g, '');
    if (!cleanPhone.startsWith('+')) {
      if (cleanPhone.startsWith('91') && cleanPhone.length === 12) {
        cleanPhone = '+' + cleanPhone;
      } else {
        cleanPhone = '+91' + cleanPhone;
      }
    }
    console.log(`[SMS Engine] Attempting SMS transfer to ${cleanPhone}: "${message}"`);
    const smsRes = await fetch('https://textbelt.com/text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        number: cleanPhone,
        message: message,
        key: 'textbelt'
      })
    });
    const smsData = await smsRes.json();
    console.log('[SMS Engine] Response data:', smsData);
  } catch (err) {
    console.error('[SMS Engine] Transport failure:', err.message);
  }
}

// Assign complaint to crew (Supervisor dashboard)
app.post('/api/complaints/:id/assign', (req, res) => {
  const { id } = req.params;
  const { crewId, notes } = req.body;
  
  const data = db.readData();
  const complaint = data.complaints.find(c => c.id === id);
  const crew = data.users.find(u => u.id === crewId);

  if (!complaint) return res.status(404).json({ error: 'Complaint not found.' });
  if (!crew) return res.status(404).json({ error: 'Crew not found.' });

  complaint.status = 'Assigned';
  complaint.assignedCrew = crewId;
  complaint.dateAssigned = new Date().toISOString();
  complaint.history.push({
    timestamp: new Date().toISOString(),
    action: 'Assigned to Crew',
    officerName: 'Supervisor',
    notes: notes || `Dispatched crew: ${crew.name}`
  });

  db.logAudit('Supervisor', 'Assign Task', `Complaint ${id} dispatched to ${crew.name}`);
  db.writeData(data);

  // Live SMS transmission to dispatched crew (e.g. 8925081899 for Murugan)
  const targetPhone = crewId === 'crew-1' ? '8925081899' : (crew.phone || '8925081899');
  const dispatchMessage = `Neer Ugam: Grievance ${id} assigned to ${crew.name}. Proceed to site immediately.`;
  sendSmsNotification(targetPhone, dispatchMessage);

  res.json(complaint);
});

// TWILIO WHATSAPP WEBHOOK ENDPOINT
app.post('/api/whatsapp/webhook', express.urlencoded({ extended: true }), (req, res) => {
  try {
    const bodyText = req.body.Body || '';
    const fromSender = req.body.From || '';
    const citizenPhone = fromSender.replace('whatsapp:', '').trim() || '+91 8925081899';

    console.log(`[WhatsApp Bot] Inbound msg from ${citizenPhone}: "${bodyText}"`);

    // 1. Run Jaccard NLP Engine to categorize
    const nlpResult = nlp.classifyComplaint(bodyText);
    const finalCategory = nlpResult.predictedCategory;
    const severity = ['Pipeline Burst', 'Sewer Mixing', 'Water Contamination'].includes(finalCategory) ? 'Critical' : 'Medium';

    // Determine Ward routing (Default Ward 61)
    let assignedWard = '61';
    let locationName = 'Sundarapuram Bypass Road, Coimbatore';
    if (bodyText.toLowerCase().includes('kurichi') || bodyText.toLowerCase().includes('lake')) {
      assignedWard = '62';
      locationName = 'Kurichi Lake Road, Coimbatore';
    }

    const data = db.readData();
    const newId = `AQ-${1000 + data.complaints.length + 1}`;

    const wardObj = data.wards.find(w => w.id === assignedWard);
    const slaHours = finalCategory === 'Pipeline Burst' ? 12 : 24;
    const slaDeadline = new Date(Date.now() + slaHours * 3600000).toISOString();

    const newComplaint = {
      id: newId,
      category: finalCategory,
      latitude: assignedWard === '61' ? 10.9578 : 10.9530,
      longitude: assignedWard === '61' ? 76.9740 : 76.9810,
      locationName,
      description: bodyText,
      voiceDescription: '',
      imageUrl: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=600',
      afterImageUrl: '',
      verificationImageUrl: '',
      severity,
      status: 'Reported',
      citizenPhone,
      citizenName: 'WhatsApp Citizen',
      dateReported: new Date().toISOString(),
      dateAssigned: '',
      dateCompleted: '',
      dateVerified: '',
      assignedCrew: '',
      supervisorId: wardObj ? wardObj.supervisorId : 'super-1',
      engineerId: wardObj ? wardObj.engineerId : 'eng-1',
      slaHours,
      slaDeadline,
      escalationLevel: 0,
      isDuplicate: false,
      masterComplaintId: '',
      duplicateCount: 0,
      aiModelDetails: {
        predictedCategory: nlpResult.predictedCategory,
        confidence: nlpResult.confidence,
        matchLogs: nlpResult.matchLogs,
        matchedTokens: nlpResult.matchedTokens,
        inputText: bodyText
      },
      history: [
        {
          timestamp: new Date().toISOString(),
          action: 'Complaint Registered',
          officerName: 'WhatsApp Bot',
          notes: `Grievance registered automatically via WhatsApp bot text stream. AI classified category as ${finalCategory}. Routed to Ward ${assignedWard}.`
        }
      ]
    };

    data.complaints.unshift(newComplaint);
    db.writeData(data);
    db.logAudit('WhatsApp Bot', 'Register Complaint', `Registered ticket ${newId} for ${citizenPhone}`);

    // Return TwiML XML response for Twilio
    res.type('text/xml');
    res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>Neer Ugam (நீர் யுகம்) Alert: Grievance registered successfully!

Ticket ID: ${newId}
Category: ${finalCategory}
Routed to: Ward ${assignedWard} (${locationName})
SLA Target: ${slaHours} Hours

Track status anytime on: http://localhost:5173/</Message>
</Response>`);
  } catch (err) {
    console.error('[WhatsApp Bot] Webhook error:', err);
    res.type('text/xml').send('<Response><Message>Failed to process grievance registration.</Message></Response>');
  }
});

// WHATSAPP CHAT EMULATOR API ENDPOINT (For in-browser Simulator UI)
app.post('/api/whatsapp/emulator', express.json(), (req, res) => {
  try {
    const { phone, message } = req.body;
    const bodyText = message || '';
    const citizenPhone = phone || '+91 8925081899';

    console.log(`[WhatsApp Emulator] Inbound msg from ${citizenPhone}: "${bodyText}"`);

    // Run NLP classifier
    const nlpResult = nlp.classifyComplaint(bodyText);
    const finalCategory = nlpResult.predictedCategory;
    const severity = ['Pipeline Burst', 'Sewer Mixing', 'Water Contamination'].includes(finalCategory) ? 'Critical' : 'Medium';

    let assignedWard = '61';
    let locationName = 'Sundarapuram Bypass Road, Coimbatore';
    if (bodyText.toLowerCase().includes('kurichi') || bodyText.toLowerCase().includes('lake')) {
      assignedWard = '62';
      locationName = 'Kurichi Lake Road, Coimbatore';
    }

    const data = db.readData();
    const newId = `AQ-${1000 + data.complaints.length + 1}`;

    const wardObj = data.wards.find(w => w.id === assignedWard);
    const slaHours = finalCategory === 'Pipeline Burst' ? 12 : 24;
    const slaDeadline = new Date(Date.now() + slaHours * 3600000).toISOString();

    const newComplaint = {
      id: newId,
      category: finalCategory,
      latitude: assignedWard === '61' ? 10.9578 : 10.9530,
      longitude: assignedWard === '61' ? 76.9740 : 76.9810,
      locationName,
      description: bodyText,
      voiceDescription: '',
      imageUrl: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=600',
      afterImageUrl: '',
      verificationImageUrl: '',
      severity,
      status: 'Reported',
      citizenPhone,
      citizenName: 'WhatsApp Citizen',
      dateReported: new Date().toISOString(),
      dateAssigned: '',
      dateCompleted: '',
      dateVerified: '',
      assignedCrew: '',
      supervisorId: wardObj ? wardObj.supervisorId : 'super-1',
      engineerId: wardObj ? wardObj.engineerId : 'eng-1',
      slaHours,
      slaDeadline,
      escalationLevel: 0,
      isDuplicate: false,
      masterComplaintId: '',
      duplicateCount: 0,
      aiModelDetails: {
        predictedCategory: nlpResult.predictedCategory,
        confidence: nlpResult.confidence,
        matchLogs: nlpResult.matchLogs,
        matchedTokens: nlpResult.matchedTokens,
        inputText: bodyText
      },
      history: [
        {
          timestamp: new Date().toISOString(),
          action: 'Complaint Registered',
          officerName: 'WhatsApp Bot',
          notes: `Grievance registered automatically via WhatsApp bot emulator. AI classified category as ${finalCategory}. Routed to Ward ${assignedWard}.`
        }
      ]
    };

    data.complaints.unshift(newComplaint);
    db.writeData(data);
    db.logAudit('WhatsApp Bot', 'Emulator Register', `Registered ticket ${newId} for ${citizenPhone}`);

    res.json({
      success: true,
      reply: `Neer Ugam (நீர் யுகம்) Alert: Grievance registered successfully!\n\nTicket ID: ${newId}\nCategory: ${finalCategory}\nRouted to: Ward ${assignedWard} (${locationName})\nSLA Target: ${slaHours} Hours\n\nTrack status anytime on: http://localhost:5173/`
    });
  } catch (err) {
    console.error('[WhatsApp Emulator] Error:', err);
    res.status(500).json({ error: 'Failed to process emulator message.' });
  }
});

// Update repair progress (Repair crew interface)
app.post('/api/complaints/:id/crew-update', upload.fields([{ name: 'beforePhoto' }, { name: 'afterPhoto' }]), (req, res) => {
  const { id } = req.params;
  const { notes, startWork } = req.body;
  
  const data = db.readData();
  const complaint = data.complaints.find(c => c.id === id);

  if (!complaint) return res.status(404).json({ error: 'Complaint not found.' });

  if (startWork === 'true') {
    complaint.status = 'In Progress';
    complaint.history.push({
      timestamp: new Date().toISOString(),
      action: 'Work Started',
      officerName: 'Repair Crew',
      notes: notes || 'Crew arrived on site. Commencing repair works.'
    });
    db.logAudit(complaint.assignedCrew || 'Crew', 'Work Started', `Initiated repair at site for ${id}`);
  } else {
    // Complete repair
    complaint.status = 'Pending Verification';
    complaint.dateCompleted = new Date().toISOString();
    
    if (req.files) {
      if (req.files.beforePhoto) {
        complaint.imageUrl = `/uploads/${req.files.beforePhoto[0].filename}`;
      }
      if (req.files.afterPhoto) {
        complaint.afterImageUrl = `/uploads/${req.files.afterPhoto[0].filename}`;
      }
    }

    complaint.history.push({
      timestamp: new Date().toISOString(),
      action: 'Repair Completed',
      officerName: 'Repair Crew',
      notes: notes || 'Work done. Water flow restored and joints sealed. Uploaded verification photographs.'
    });
    db.logAudit(complaint.assignedCrew || 'Crew', 'Repair Finished', `Completed repair details for ${id}. Awaiting JE audit.`);
  }

  db.writeData(data);
  res.json(complaint);
});

// Approve or Reject complaint verification (JE/AE view)
app.post('/api/complaints/:id/verify', upload.single('verificationPhoto'), (req, res) => {
  const { id } = req.params;
  const { status, notes, engineerName } = req.body; // status: 'Resolved' or 'Rejected'
  
  const data = db.readData();
  const complaint = data.complaints.find(c => c.id === id);

  if (!complaint) return res.status(404).json({ error: 'Complaint not found.' });

  if (status === 'Resolved') {
    complaint.status = 'Resolved';
    complaint.dateVerified = new Date().toISOString();
    if (req.file) {
      complaint.verificationImageUrl = `/uploads/${req.file.filename}`;
    }
    complaint.history.push({
      timestamp: new Date().toISOString(),
      action: 'Site Verified and Closed',
      officerName: engineerName || 'JE',
      notes: notes || 'Work quality inspected and approved. Leak verified closed. Restored area.'
    });
    db.logAudit(complaint.engineerId || 'JE', 'Close Complaint', `Approved and resolved complaint ${id}`);

    // If it is a master complaint, mark all duplicates as resolved too!
    data.complaints.forEach(dup => {
      if (dup.masterComplaintId === id) {
        dup.status = 'Resolved';
        dup.dateVerified = new Date().toISOString();
        dup.history.push({
          timestamp: new Date().toISOString(),
          action: 'Site Verified and Closed',
          officerName: 'System (Linked)',
          notes: `Linked master complaint ${id} has been verified and resolved by ${engineerName || 'JE'}.`
        });
      }
    });

  } else if (status === 'Rejected') {
    complaint.status = 'Rejected';
    complaint.history.push({
      timestamp: new Date().toISOString(),
      action: 'Repair Rejected',
      officerName: engineerName || 'JE',
      notes: notes || 'Verification failed. Seal quality is insufficient. Dispatching crew for rework.'
    });
    db.logAudit(complaint.engineerId || 'JE', 'Reject Repair', `Rejected repair quality of ${id}`);
  }

  db.writeData(data);
  res.json(complaint);
});

// Export Excel report
app.get('/api/reports/excel', (req, res) => {
  try {
    const data = db.readData();
    const excelBuffer = excel.generateComplaintsReport(data.complaints);
    
    // Set headers for download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=AquaAlert_Complaints_Report.xlsx');
    res.send(excelBuffer);
  } catch (err) {
    console.error('Excel export error:', err);
    res.status(500).json({ error: 'Failed to generate Excel sheet.' });
  }
});

// Import Officers from Excel Spreadsheet
app.post('/api/admin/import-officers', upload.single('excelFile'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No excel file uploaded.' });
    
    const filePath = req.file.path;
    const fileBuffer = fs.readFileSync(filePath);
    const importedOfficers = excel.parseOfficersImport(fileBuffer);
    
    // Remove the temp file
    fs.unlinkSync(filePath);

    // Merge into DB
    const data = db.readData();
    importedOfficers.forEach(io => {
      const existsIdx = data.users.findIndex(u => u.username === io.username || u.id === io.id);
      if (existsIdx !== -1) {
        data.users[existsIdx] = io; // Overwrite
      } else {
        data.users.push(io); // Add new
      }
    });

    db.writeData(data);
    db.logAudit('Admin', 'Bulk Import', `Imported ${importedOfficers.length} staff roles from spreadsheet.`);

    res.json({ message: `Successfully imported/updated ${importedOfficers.length} staff members.`, officers: importedOfficers });
  } catch (err) {
    console.error('Excel Import Error:', err);
    res.status(500).json({ error: 'Failed to parse Excel import sheet.' });
  }
});

// Fetch system users (officers / citizens list)
app.get('/api/users', (req, res) => {
  const data = db.readData();
  res.json(data.users);
});

// Fetch categories
app.get('/api/categories', (req, res) => {
  const data = db.readData();
  res.json(data.categories);
});

// Fetch audit logs
app.get('/api/admin/audit-logs', (req, res) => {
  const data = db.readData();
  res.json(data.auditLogs);
});

// Developers helper: Force SLA breach to demonstrate escalations in seconds
app.post('/api/admin/escalate-force', (req, res) => {
  const { id } = req.body;
  const data = db.readData();
  const complaint = data.complaints.find(c => c.id === id);

  if (!complaint) return res.status(404).json({ error: 'Complaint not found.' });

  // Retrospectively adjust SLA deadline to 2 hours ago
  complaint.slaDeadline = new Date(Date.now() - 7200000).toISOString();
  db.writeData(data);
  res.json({ message: `SLA deadline for ${id} set to past. Auto-escalation will fire on next check.` });
});

// Update settings or categories config
app.post('/api/admin/categories', (req, res) => {
  const { categories } = req.body;
  const data = db.readData();
  data.categories = categories;
  db.writeData(data);
  db.logAudit('Admin', 'Update Categories', 'Modified default SLA thresholds and category parameters.');
  res.json({ message: 'Categories updated successfully.' });
});

// Demo database reset endpoint
app.post('/api/reset-demo', (req, res) => {
  try {
    db.resetDB();
    res.json({ success: true, message: 'Database reset successfully to mock template.' });
  } catch (err) {
    console.error('Error resetting database:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Start Express server
app.listen(PORT, () => {
  console.log(`AquaAlert AI Backend running on port ${PORT}`);
});
