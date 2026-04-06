/**
 * Google Apps Script — Helper Registration Sheet (v2)
 * Now supports: register, lookup, update
 *
 * Setup:
 *  1. Create a new Google Sheet
 *  2. Add these headers in row 1:
 *     Timestamp | Ref | First Name | Last Name | Age | Category | Skills | City | Area | Experience | Languages | Rate | Education | Certificates | Bio | WhatsApp | Has WhatsApp | Email | Photo | Source
 *  3. Go to Extensions → Apps Script
 *  4. Paste this code (replaces old version)
 *  5. Click Deploy → New deployment → Web app
 *     OR: Deploy → Manage deployments → Edit → New version
 *  6. Set "Execute as" = Me, "Who has access" = Anyone
 *  7. Click Deploy and copy the URL
 *  8. Add the URL to .env.local and Vercel as GOOGLE_SHEETS_URL
 *
 * IMPORTANT: After updating, you must create a new deployment version
 * for the changes to take effect!
 */

// Column mapping (1-based index) — update if you add/remove columns
var COL = {
  timestamp:    1,
  ref:          2,
  firstName:    3,
  lastName:     4,
  age:          5,
  category:     6,
  skills:       7,
  city:         8,
  area:         9,
  experience:   10,
  languages:    11,
  rate:         12,
  education:    13,
  certificates: 14,
  bio:          15,
  whatsapp:     16,
  hasWhatsApp:  17,
  email:        18,
  photo:        19,
  source:       20,
};

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var action = data.action || 'register';

    if (action === 'register') {
      return handleRegister(data);
    } else if (action === 'lookup') {
      return handleLookup(data);
    } else if (action === 'update') {
      return handleUpdate(data);
    } else {
      return jsonResponse({ success: false, error: 'Unknown action: ' + action });
    }
  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() });
  }
}

// ─── REGISTER (append new row) ──────────────────────────────────────────────
// Helper: prefix with apostrophe so Google Sheets treats the value as plain text
// (prevents "1-2" being auto-formatted as a date, "3-5" as March 5, etc.)
function asText(val) {
  var s = (val || '').toString();
  return s ? "'" + s : '';
}

function handleRegister(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

  sheet.appendRow([
    data.timestamp    || new Date().toISOString(),
    data.ref          || '',
    data.firstName    || '',
    data.lastName     || '',
    asText(data.age),
    data.category     || '',
    data.skills       || '',
    data.city         || '',
    data.area         || '',
    asText(data.experience),
    data.languages    || '',
    asText(data.rate),
    data.education    || '',
    data.certificates || '',
    data.bio          || '',
    "'" + (data.whatsapp || ''),
    data.hasWhatsApp  || '',
    data.email        || '',
    data.photo        || '',
    data.source       || '',
  ]);

  return jsonResponse({ success: true });
}

// ─── LOOKUP (find by email + ref) ───────────────────────────────────────────
function handleLookup(data) {
  var email = (data.email || '').trim().toLowerCase();
  var ref   = (data.ref || '').trim().toUpperCase();

  if (!email || !ref) {
    return jsonResponse({ found: false, error: 'Email and ref are required' });
  }

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var rows  = sheet.getDataRange().getValues();

  // Skip header row (index 0)
  for (var i = 1; i < rows.length; i++) {
    var rowRef   = (rows[i][COL.ref - 1] || '').toString().replace(/^'+/, '').trim().toUpperCase();
    var rowEmail = (rows[i][COL.email - 1] || '').toString().replace(/^'+/, '').trim().toLowerCase();

    if (rowRef === ref && rowEmail === email) {
      var profile = {};
      var keys = Object.keys(COL);
      for (var k = 0; k < keys.length; k++) {
        var key = keys[k];
        profile[key] = (rows[i][COL[key] - 1] || '').toString().replace(/^'+/, '');
      }
      return jsonResponse({ found: true, data: profile, row: i + 1 });
    }
  }

  return jsonResponse({ found: false });
}

// ─── UPDATE (find by ref + email, update fields) ────────────────────────────
function handleUpdate(data) {
  var email   = (data.email || '').trim().toLowerCase();
  var ref     = (data.ref || '').trim().toUpperCase();
  var updates = data.updates || {};

  if (!email || !ref) {
    return jsonResponse({ success: false, error: 'Email and ref are required' });
  }

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var rows  = sheet.getDataRange().getValues();

  // Find the row
  var rowIndex = -1;
  for (var i = 1; i < rows.length; i++) {
    var rowRef   = (rows[i][COL.ref - 1] || '').toString().replace(/^'+/, '').trim().toUpperCase();
    var rowEmail = (rows[i][COL.email - 1] || '').toString().replace(/^'+/, '').trim().toLowerCase();
    if (rowRef === ref && rowEmail === email) {
      rowIndex = i + 1; // 1-based for Sheet API
      break;
    }
  }

  if (rowIndex === -1) {
    return jsonResponse({ success: false, error: 'Profile not found' });
  }

  // Update each provided field
  var updateKeys = Object.keys(updates);
  for (var j = 0; j < updateKeys.length; j++) {
    var field = updateKeys[j];
    if (COL[field] && field !== 'ref' && field !== 'email' && field !== 'timestamp') {
      sheet.getRange(rowIndex, COL[field]).setValue(updates[field]);
    }
  }

  return jsonResponse({ success: true });
}

// ─── HELPER ─────────────────────────────────────────────────────────────────
function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ─── TEST FUNCTIONS ─────────────────────────────────────────────────────────
function testRegister() {
  var result = doPost({
    postData: {
      contents: JSON.stringify({
        action: 'register',
        timestamp: new Date().toISOString(),
        ref: 'TH-TEST01',
        firstName: 'Test',
        lastName: 'Helper',
        age: '25-30',
        category: 'Nanny',
        skills: 'Childcare, Cooking',
        city: 'Bangkok',
        area: 'Sukhumvit',
        experience: '3-5',
        languages: 'Thai, English',
        rate: '200-300',
        education: 'Bachelor',
        certificates: 'First Aid',
        bio: 'Test bio',
        whatsapp: '+66812345678',
        hasWhatsApp: 'Yes',
        email: 'test@example.com',
        source: 'test',
      })
    }
  });
  Logger.log(result.getContent());
}

function testLookup() {
  var result = doPost({
    postData: {
      contents: JSON.stringify({
        action: 'lookup',
        email: 'test@example.com',
        ref: 'TH-TEST01',
      })
    }
  });
  Logger.log(result.getContent());
}

function testUpdate() {
  var result = doPost({
    postData: {
      contents: JSON.stringify({
        action: 'update',
        email: 'test@example.com',
        ref: 'TH-TEST01',
        updates: {
          bio: 'Updated bio text!',
          education: 'Master Degree',
        },
      })
    }
  });
  Logger.log(result.getContent());
}
