/**
 * ThaiHelper – Employer Registration Google Apps Script
 *
 * SETUP:
 * 1. Create a new Google Sheet
 * 2. Add these headers in row 1:
 *    A: Timestamp | B: First Name | C: Last Name | D: Email | E: City | F: Helper Types | G: Job Description | H: Source
 * 3. Go to Extensions > Apps Script
 * 4. Delete any existing code and paste this entire file
 * 5. Save (Ctrl+S)
 * 6. Click Deploy > New Deployment
 * 7. Type: Web App
 * 8. Execute as: Me
 * 9. Who has access: Anyone
 * 10. Click Deploy and copy the URL
 * 11. Add the URL to Vercel: Settings > Environment Variables > EMPLOYER_SHEET_URL
 */

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);

    sheet.appendRow([
      data.timestamp || new Date().toISOString(),
      data.firstName || '',
      data.lastName || '',
      data.email || '',
      data.city || '',
      data.helperTypes || '',
      data.jobDescription || '',
      data.source || 'thaihelper.app'
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Optional: Test function to verify the script works
function testDoPost() {
  var testEvent = {
    postData: {
      contents: JSON.stringify({
        timestamp: new Date().toISOString(),
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        city: 'bangkok',
        helperTypes: 'nanny, housekeeper',
        jobDescription: 'This is a test registration',
        source: 'test'
      })
    }
  };

  var result = doPost(testEvent);
  Logger.log(result.getContent());
}
