/**
 * Google Apps Script — Helper Registration Sheet
 *
 * Setup:
 *  1. Create a new Google Sheet
 *  2. Add these headers in row 1:
 *     Timestamp | Ref | First Name | Last Name | Age | Category | Skills | City | Area | Experience | Languages | Rate | Bio | WhatsApp | Has WhatsApp | Email | Source
 *  3. Go to Extensions → Apps Script
 *  4. Paste this code
 *  5. Click Deploy → New deployment → Web app
 *  6. Set "Execute as" = Me, "Who has access" = Anyone
 *  7. Click Deploy and copy the URL
 *  8. Add the URL to .env.local as HELPER_SHEET_URL
 *  9. Add the URL to Vercel: Settings > Environment Variables > HELPER_SHEET_URL
 */

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    sheet.appendRow([
      data.timestamp   || new Date().toISOString(),
      data.ref         || '',
      data.firstName   || '',
      data.lastName    || '',
      data.age         || '',
      data.category    || '',
      data.skills      || '',
      data.city        || '',
      data.area        || '',
      data.experience  || '',
      data.languages   || '',
      data.rate        || '',
      data.bio         || '',
      data.whatsapp    || '',
      data.hasWhatsApp || '',
      data.email       || '',
      data.source      || '',
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Test function — run manually to verify setup
function testDoPost() {
  const testEvent = {
    postData: {
      contents: JSON.stringify({
        timestamp: new Date().toISOString(),
        ref: 'TH-TEST-001',
        firstName: 'Test',
        lastName: 'Helper',
        age: '25-30',
        category: 'Nanny & Babysitter',
        skills: 'Cooking, Cleaning, Childcare',
        city: 'Bangkok',
        area: 'Sukhumvit',
        experience: '3-5 years',
        languages: 'Thai, English',
        rate: '15000-20000',
        bio: 'Test bio entry',
        whatsapp: '+66812345678',
        hasWhatsApp: 'Yes',
        email: 'test@example.com',
        source: 'test',
      })
    }
  };
  const result = doPost(testEvent);
  Logger.log(result.getContent());
}
