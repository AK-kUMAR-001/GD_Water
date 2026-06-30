const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

/**
 * Generates an Excel spreadsheet containing a detailed list of complaints and summary metrics
 * @param {Array} complaints 
 * @returns {Buffer} Excel file buffer
 */
function generateComplaintsReport(complaints) {
  // Sheet 1: Active & History of Complaints
  const dataRows = complaints.map(c => ({
    'Incident ID': c.id,
    'Issue Category': c.category,
    'Location Name': c.locationName,
    'Latitude': c.latitude,
    'Longitude': c.longitude,
    'Citizen Name': c.citizenName || 'Anonymous',
    'Citizen Mobile': c.citizenPhone || 'N/A',
    'Severity': c.severity,
    'Status': c.status,
    'Date Reported': c.dateReported ? new Date(c.dateReported).toLocaleString() : '',
    'SLA (Hours)': c.slaHours,
    'SLA Deadline': c.slaDeadline ? new Date(c.slaDeadline).toLocaleString() : '',
    'Assigned Crew': c.assignedCrew || 'Not Assigned',
    'Escalation State': c.escalationLevel === 0 ? 'None' : `Level ${c.escalationLevel}`,
    'Date Resolved': c.dateVerified ? new Date(c.dateVerified).toLocaleString() : (c.status === 'Resolved' ? 'Closed' : 'Pending')
  }));

  const wb = XLSX.utils.book_new();
  const wsComplaints = XLSX.utils.json_to_sheet(dataRows);
  
  // Apply a basic width auto-fit for readability
  const maxProps = [{ wch: 12 }, { wch: 20 }, { wch: 35 }, { wch: 10 }, { wch: 10 }, { wch: 18 }, { wch: 15 }, { wch: 10 }, { wch: 18 }, { wch: 22 }, { wch: 12 }, { wch: 22 }, { wch: 18 }, { wch: 16 }, { wch: 22 }];
  wsComplaints['!cols'] = maxProps;
  
  XLSX.utils.book_append_sheet(wb, wsComplaints, "AquaAlert Complaint Logs");

  // Sheet 2: Executive Summary statistics
  const total = complaints.length;
  const resolved = complaints.filter(c => c.status === 'Resolved').length;
  const pendingVerify = complaints.filter(c => c.status === 'Pending Verification').length;
  const assigned = complaints.filter(c => c.status === 'Assigned' || c.status === 'In Progress').length;
  const critical = complaints.filter(c => c.severity === 'Critical').length;
  const escalated = complaints.filter(c => c.escalationLevel > 0).length;

  const summaryRows = [
    { 'Metric Category': 'Total Incidents Registered', 'Value': total },
    { 'Metric Category': 'Successfully Closed / Resolved', 'Value': resolved },
    { 'Metric Category': 'Pending Field Verification (JE)', 'Value': pendingVerify },
    { 'Metric Category': 'Currently Active in Repair Cycle', 'Value': assigned },
    { 'Metric Category': 'Critical Pipeline/Contamination Incidents', 'Value': critical },
    { 'Metric Category': 'SLA Escalated Cases', 'Value': escalated },
    { 'Metric Category': 'Resolution Rate', 'Value': total > 0 ? `${((resolved / total) * 100).toFixed(1)}%` : '0%' }
  ];

  const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
  wsSummary['!cols'] = [{ wch: 35 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, "Executive Summary");

  // Generate buffer
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

/**
 * Parses an Excel file buffer containing Officer assignments and configures officers
 * @param {Buffer} fileBuffer 
 * @returns {Array} List of imported officers
 */
function parseOfficersImport(fileBuffer) {
  const wb = XLSX.read(fileBuffer, { type: 'buffer' });
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(ws);
  
  // Map spreadsheet columns to our DB User schemas
  return rows.map((r, idx) => ({
    id: r['ID'] || `import-user-${idx + Date.now()}`,
    username: r['Username'] || r['Name']?.toLowerCase().replace(/\s/g, '') || `user_${idx}`,
    role: r['Role'] || 'Crew',
    name: r['Name'] || 'Imported Worker',
    phone: r['Mobile'] || '+91 90000 00000',
    email: r['Email'] || '',
    zone: r['Zone'] || 'South Zone',
    wards: r['Wards'] ? String(r['Wards']).split(',').map(s => s.trim()) : []
  }));
}

module.exports = {
  generateComplaintsReport,
  parseOfficersImport
};
