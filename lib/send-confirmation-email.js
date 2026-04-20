import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'support@thaihelper.app';

// ─── ADMIN NOTIFICATION ─────────────────────────────────────────────────────
export async function sendAdminNotification({ type, firstName, lastName, email, city, area, category, helperTypes, ref }) {
  const isHelper = type === 'helper';
  const label = isHelper ? 'Helper' : 'Employer';
  const color = isHelper ? '#006a62' : '#001b3d';

  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
    <div style="background:#ffffff;border-radius:12px;padding:32px;border-left:4px solid ${color};">
      <h2 style="font-size:18px;font-weight:700;color:${color};margin:0 0 16px;">
        New ${label} Registration
      </h2>
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:6px 0;font-size:13px;color:#999;width:120px;">Name</td>
          <td style="padding:6px 0;font-size:14px;color:#1a1a1a;font-weight:600;">${firstName} ${lastName || ''}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-size:13px;color:#999;">Email</td>
          <td style="padding:6px 0;font-size:14px;color:#1a1a1a;">${email}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-size:13px;color:#999;">City</td>
          <td style="padding:6px 0;font-size:14px;color:#1a1a1a;">${city}${area ? ` — ${area}` : ''}</td>
        </tr>
        ${isHelper ? `
        <tr>
          <td style="padding:6px 0;font-size:13px;color:#999;">Category</td>
          <td style="padding:6px 0;font-size:14px;color:#1a1a1a;">${category}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-size:13px;color:#999;">Reference</td>
          <td style="padding:6px 0;font-size:14px;color:#1a1a1a;">${ref}</td>
        </tr>
        ` : `
        <tr>
          <td style="padding:6px 0;font-size:13px;color:#999;">Looking for</td>
          <td style="padding:6px 0;font-size:14px;color:#1a1a1a;">${helperTypes}</td>
        </tr>
        `}
      </table>
    </div>
  </div>
</body>
</html>`;

  return resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || 'ThaiHelper <onboarding@resend.dev>',
    to: ADMIN_EMAIL,
    subject: `New ${label}: ${firstName} ${lastName || ''} — ${city}`,
    html,
  });
}

// ─── HELPER CONFIRMATION EMAIL ──────────────────────────────────────────────
export async function sendHelperConfirmation({ firstName, email, ref, category, city, verificationToken }) {
  const verifyUrl = `https://thaihelper.app/api/verify-email?token=${verificationToken}`;
  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f8faf9;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px;">

    <!-- Logo -->
    <div style="text-align:center;margin-bottom:32px;">
      <span style="font-size:24px;font-weight:800;color:#1a1a1a;">Thai<span style="color:#006a62;">Helper</span></span>
    </div>

    <!-- Card -->
    <div style="background:#ffffff;border-radius:16px;padding:40px 32px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">

      <div style="text-align:center;margin-bottom:24px;">
        <span style="display:inline-block;width:56px;height:56px;background:#e6f5f3;border-radius:50%;line-height:56px;font-size:28px;">✓</span>
      </div>

      <h1 style="font-size:22px;font-weight:700;color:#1a1a1a;text-align:center;margin:0 0 8px;">
        Congratulations, ${firstName}!
      </h1>
      <p style="font-size:15px;color:#666;text-align:center;margin:0 0 28px;line-height:1.5;">
        You are now registered as a helper on ThaiHelper!
      </p>

      <!-- Details -->
      <div style="background:#f8faf9;border-radius:12px;padding:20px 24px;margin-bottom:28px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:6px 0;font-size:13px;color:#999;">Reference</td>
            <td style="padding:6px 0;font-size:13px;color:#1a1a1a;font-weight:600;text-align:right;">${ref}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-size:13px;color:#999;">Category</td>
            <td style="padding:6px 0;font-size:13px;color:#1a1a1a;text-align:right;">${category}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-size:13px;color:#999;">City</td>
            <td style="padding:6px 0;font-size:13px;color:#1a1a1a;text-align:right;">${city}</td>
          </tr>
        </table>
      </div>

      <!-- Verify Email Button -->
      <div style="text-align:center;margin-bottom:28px;">
        <a href="${verifyUrl}" style="display:inline-block;padding:16px 36px;background:#006a62;color:#fff;font-size:16px;font-weight:700;text-decoration:none;border-radius:10px;">
          Verify My Email
        </a>
        <p style="font-size:12px;color:#999;margin-top:12px;">Click the button to activate your profile</p>
      </div>

      <h2 style="font-size:16px;font-weight:700;color:#1a1a1a;margin:0 0 12px;">What happens next?</h2>
      <ol style="font-size:14px;color:#555;line-height:1.8;margin:0 0 28px;padding-left:20px;">
        <li>Verify your email (click the button above)</li>
        <li>Your profile goes live on ThaiHelper</li>
        <li>Families in ${city} can discover and contact you</li>
      </ol>
    </div>

    <!-- Footer -->
    <div style="text-align:center;margin-top:32px;">
      <p style="font-size:12px;color:#aaa;margin:0;">
        ThaiHelper — Connecting families with trusted household staff in Thailand
      </p>
      <p style="font-size:11px;color:#ccc;margin:8px 0 0;">
        <a href="https://thaihelper.app/privacy" style="color:#aaa;text-decoration:underline;">Privacy Policy</a>
        &nbsp;·&nbsp;
        <a href="https://thaihelper.app/terms" style="color:#aaa;text-decoration:underline;">Terms of Service</a>
      </p>
    </div>

  </div>
</body>
</html>`;

  return resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || 'ThaiHelper <onboarding@resend.dev>',
    to: email,
    subject: `Congratulations ${firstName} — You're registered on ThaiHelper!`,
    html,
  });
}

// ─── EMPLOYER CONFIRMATION EMAIL ────────────────────────────────────────────
export async function sendEmployerConfirmation({ firstName, email, city, helperTypes }) {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px;">

    <!-- Logo -->
    <div style="text-align:center;margin-bottom:32px;">
      <span style="font-size:24px;font-weight:800;color:#1a1a1a;">Thai<span style="color:#006a62;">Helper</span></span>
    </div>

    <!-- Card -->
    <div style="background:#ffffff;border-radius:16px;padding:40px 32px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">

      <div style="text-align:center;margin-bottom:24px;">
        <span style="display:inline-block;width:56px;height:56px;background:#e8edf5;border-radius:50%;line-height:56px;font-size:28px;">🎉</span>
      </div>

      <h1 style="font-size:22px;font-weight:700;color:#1a1a1a;text-align:center;margin:0 0 8px;">
        You're on the waitlist, ${firstName}!
      </h1>
      <p style="font-size:15px;color:#666;text-align:center;margin:0 0 28px;line-height:1.5;">
        Thank you for registering as an employer on ThaiHelper.
      </p>

      <!-- Details -->
      <div style="background:#f0f2f5;border-radius:12px;padding:20px 24px;margin-bottom:28px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:6px 0;font-size:13px;color:#999;">Location</td>
            <td style="padding:6px 0;font-size:13px;color:#1a1a1a;font-weight:600;text-align:right;">${city}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-size:13px;color:#999;">Looking for</td>
            <td style="padding:6px 0;font-size:13px;color:#1a1a1a;text-align:right;">${helperTypes}</td>
          </tr>
        </table>
      </div>

      <h2 style="font-size:16px;font-weight:700;color:#1a1a1a;margin:0 0 12px;">What happens next?</h2>
      <ol style="font-size:14px;color:#555;line-height:1.8;margin:0 0 28px;padding-left:20px;">
        <li>We're building the largest network of helpers in Thailand</li>
        <li>As helpers register in ${city}, we'll notify you by email</li>
        <li>You can then browse profiles and contact them directly</li>
      </ol>

      <div style="text-align:center;">
        <a href="https://thaihelper.app/employers" style="display:inline-block;padding:14px 32px;background:#001b3d;color:#fff;font-size:15px;font-weight:700;text-decoration:none;border-radius:10px;">
          Visit ThaiHelper
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align:center;margin-top:32px;">
      <p style="font-size:12px;color:#aaa;margin:0;">
        ThaiHelper — Connecting families with trusted household staff in Thailand
      </p>
      <p style="font-size:11px;color:#ccc;margin:8px 0 0;">
        <a href="https://thaihelper.app/privacy" style="color:#aaa;text-decoration:underline;">Privacy Policy</a>
        &nbsp;·&nbsp;
        <a href="https://thaihelper.app/terms" style="color:#aaa;text-decoration:underline;">Terms of Service</a>
      </p>
    </div>

  </div>
</body>
</html>`;

  return resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || 'ThaiHelper <onboarding@resend.dev>',
    to: email,
    subject: `You're on the waitlist, ${firstName}! 🎉`,
    html,
  });
}

// ─── NEW MESSAGE NOTIFICATION ───────────────────────────────────────────────
// Sent when a helper or employer receives a new message on the platform.
// Keeps it simple: tells them who wrote, shows a short preview, links to inbox.
export async function sendNewMessageNotification({ recipientName, recipientEmail, senderName, senderRole, messagePreview, unsubscribeUrl }) {
  const senderLabel = senderRole === 'helper' ? 'helper' : 'employer';
  const previewText = messagePreview.length > 120
    ? messagePreview.slice(0, 120) + '…'
    : messagePreview;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f8faf9;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px;">

    <!-- Logo -->
    <div style="text-align:center;margin-bottom:32px;">
      <span style="font-size:24px;font-weight:800;color:#1a1a1a;">Thai<span style="color:#006a62;">Helper</span></span>
    </div>

    <!-- Card -->
    <div style="background:#ffffff;border-radius:16px;padding:40px 32px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">

      <div style="text-align:center;margin-bottom:24px;">
        <span style="display:inline-block;width:56px;height:56px;background:#e6f5f3;border-radius:50%;line-height:56px;font-size:28px;">💬</span>
      </div>

      <h1 style="font-size:22px;font-weight:700;color:#1a1a1a;text-align:center;margin:0 0 8px;">
        New message from ${senderName}
      </h1>
      <p style="font-size:15px;color:#666;text-align:center;margin:0 0 28px;line-height:1.5;">
        You have a new message from a ${senderLabel} on ThaiHelper.
      </p>

      <!-- Message Preview -->
      <div style="background:#f8faf9;border-radius:12px;padding:20px 24px;margin-bottom:28px;border-left:3px solid #006a62;">
        <p style="font-size:14px;color:#333;line-height:1.6;margin:0;font-style:italic;">
          "${previewText}"
        </p>
        <p style="font-size:12px;color:#999;margin:8px 0 0;">— ${senderName}</p>
      </div>

      <div style="text-align:center;">
        <a href="https://thaihelper.app/inbox" style="display:inline-block;padding:16px 36px;background:#006a62;color:#fff;font-size:16px;font-weight:700;text-decoration:none;border-radius:10px;">
          Open Inbox
        </a>
        <p style="font-size:12px;color:#999;margin-top:12px;">Log in to read the full message and reply</p>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align:center;margin-top:32px;">
      <p style="font-size:12px;color:#aaa;margin:0;">
        ThaiHelper — Connecting families with trusted household staff in Thailand
      </p>
      <p style="font-size:11px;color:#ccc;margin:8px 0 0;">
        <a href="https://thaihelper.app/privacy" style="color:#aaa;text-decoration:underline;">Privacy Policy</a>
        &nbsp;·&nbsp;
        <a href="https://thaihelper.app/terms" style="color:#aaa;text-decoration:underline;">Terms of Service</a>
      </p>
      ${unsubscribeUrl ? `
      <p style="font-size:11px;color:#ccc;margin:12px 0 0;">
        Don't want these notifications?
        <a href="${unsubscribeUrl}" style="color:#aaa;text-decoration:underline;">Unsubscribe with one click</a>
      </p>
      ` : ''}
    </div>

  </div>
</body>
</html>`;

  // List-Unsubscribe headers (RFC 8058) so Gmail/Outlook show a native
  // "Unsubscribe" button at the top of the email and one-click works.
  const headers = unsubscribeUrl
    ? {
        'List-Unsubscribe': `<${unsubscribeUrl}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      }
    : undefined;

  return resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || 'ThaiHelper <onboarding@resend.dev>',
    to: recipientEmail,
    subject: `New message from ${senderName} on ThaiHelper`,
    html,
    headers,
  });
}

// ─── 24-HOUR REMINDER FOR UNREAD MESSAGES ──────────────────────────────────
// Sent by the /api/cron/message-reminders cron when a message has been sitting
// in someone's inbox unread for 24+ hours and we haven't already pinged them.
// The unsubscribe link uses the same token system as the new-message email.
export async function sendMessageReminderEmail({ recipientName, recipientEmail, senderName, senderRole, messagePreview, unsubscribeUrl }) {
  const senderLabel = senderRole === 'helper' ? 'helper' : 'employer';
  const previewText = messagePreview && messagePreview.length > 120
    ? messagePreview.slice(0, 120) + '…'
    : (messagePreview || '');

  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f8faf9;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
    <div style="text-align:center;margin-bottom:32px;">
      <span style="font-size:24px;font-weight:800;color:#1a1a1a;">Thai<span style="color:#006a62;">Helper</span></span>
    </div>
    <div style="background:#ffffff;border-radius:16px;padding:40px 32px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
      <div style="text-align:center;margin-bottom:24px;">
        <span style="display:inline-block;width:56px;height:56px;background:#fef3c7;border-radius:50%;line-height:56px;font-size:28px;">⏰</span>
      </div>
      <h1 style="font-size:22px;font-weight:700;color:#1a1a1a;text-align:center;margin:0 0 8px;">
        Reminder: a message is waiting for you
      </h1>
      <p style="font-size:15px;color:#666;text-align:center;margin:0 0 28px;line-height:1.5;">
        ${senderName} (${senderLabel}) sent you a message on ThaiHelper${recipientName ? ', ' + recipientName : ''} about a day ago and it's still unread.
      </p>
      ${previewText ? `
      <div style="background:#f8faf9;border-radius:12px;padding:20px 24px;margin-bottom:28px;border-left:3px solid #006a62;">
        <p style="font-size:14px;color:#333;line-height:1.6;margin:0;font-style:italic;">"${previewText}"</p>
        <p style="font-size:12px;color:#999;margin:8px 0 0;">— ${senderName}</p>
      </div>
      ` : ''}
      <div style="text-align:center;">
        <a href="https://thaihelper.app/inbox" style="display:inline-block;padding:16px 36px;background:#006a62;color:#fff;font-size:16px;font-weight:700;text-decoration:none;border-radius:10px;">
          Read & Reply
        </a>
        <p style="font-size:12px;color:#999;margin-top:12px;">We won't send another reminder for this message.</p>
      </div>
    </div>
    <div style="text-align:center;margin-top:32px;">
      <p style="font-size:12px;color:#aaa;margin:0;">ThaiHelper — Connecting families with trusted household staff in Thailand</p>
      <p style="font-size:11px;color:#ccc;margin:8px 0 0;">
        <a href="https://thaihelper.app/privacy" style="color:#aaa;text-decoration:underline;">Privacy</a>
        &nbsp;·&nbsp;
        <a href="https://thaihelper.app/terms" style="color:#aaa;text-decoration:underline;">Terms</a>
      </p>
      ${unsubscribeUrl ? `
      <p style="font-size:11px;color:#ccc;margin:12px 0 0;">
        Don't want these notifications?
        <a href="${unsubscribeUrl}" style="color:#aaa;text-decoration:underline;">Unsubscribe with one click</a>
      </p>
      ` : ''}
    </div>
  </div>
</body>
</html>`;

  const headers = unsubscribeUrl
    ? {
        'List-Unsubscribe': `<${unsubscribeUrl}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      }
    : undefined;

  return resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || 'ThaiHelper <onboarding@resend.dev>',
    to: recipientEmail,
    subject: `Reminder: ${senderName} is waiting for your reply on ThaiHelper`,
    html,
    headers,
  });
}

// ─── EMPLOYER ACCOUNT CONFIRMATION EMAIL ────────────────────────────────────
// Sent when an employer creates a full account (not just the lead form).
// Includes the employer_ref number that they'll use to log in.
export async function sendEmployerAccountConfirmation({ firstName, email, ref, city, verificationToken }) {
  const verifyUrl = `https://thaihelper.app/api/verify-email?token=${verificationToken}`;
  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f8faf9;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px;">

    <!-- Logo -->
    <div style="text-align:center;margin-bottom:32px;">
      <span style="font-size:24px;font-weight:800;color:#1a1a1a;">Thai<span style="color:#006a62;">Helper</span></span>
    </div>

    <!-- Card -->
    <div style="background:#ffffff;border-radius:16px;padding:40px 32px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">

      <div style="text-align:center;margin-bottom:24px;">
        <span style="display:inline-block;width:56px;height:56px;background:#e8edf5;border-radius:50%;line-height:56px;font-size:28px;">✓</span>
      </div>

      <h1 style="font-size:22px;font-weight:700;color:#1a1a1a;text-align:center;margin:0 0 8px;">
        Welcome to ThaiHelper, ${firstName}!
      </h1>
      <p style="font-size:15px;color:#666;text-align:center;margin:0 0 28px;line-height:1.5;">
        Your employer account is ready. You can now browse helpers and message them directly.
      </p>

      <!-- Reference Number (important — used for login) -->
      <div style="background:#f0f2f5;border-radius:12px;padding:20px 24px;margin-bottom:20px;text-align:center;">
        <div style="font-size:12px;color:#999;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">
          Your Reference Number
        </div>
        <div style="font-size:22px;font-weight:700;color:#001b3d;font-family:monospace;letter-spacing:1px;">
          ${ref}
        </div>
        <div style="font-size:12px;color:#999;margin-top:8px;">
          Save this — you'll need it to log in
        </div>
      </div>

      <!-- Verify Email Button -->
      <div style="text-align:center;margin-bottom:20px;">
        <a href="${verifyUrl}" style="display:inline-block;padding:16px 36px;background:#001b3d;color:#fff;font-size:16px;font-weight:700;text-decoration:none;border-radius:10px;">
          Verify My Email
        </a>
        <p style="font-size:12px;color:#999;margin-top:12px;">Click the button to activate your account</p>
      </div>

      <!-- How to log in -->
      <div style="background:#fff8e1;border-left:3px solid #f5a623;border-radius:8px;padding:14px 18px;margin-bottom:28px;">
        <div style="font-size:13px;color:#1a1a1a;font-weight:600;margin-bottom:4px;">How to log in</div>
        <div style="font-size:13px;color:#555;line-height:1.5;">
          Go to <a href="https://thaihelper.app/login" style="color:#001b3d;">thaihelper.app/login</a>
          and enter your email (<strong>${email}</strong>) together with the reference number above.
        </div>
      </div>

      <h2 style="font-size:16px;font-weight:700;color:#1a1a1a;margin:0 0 12px;">What you can do now</h2>
      <ol style="font-size:14px;color:#555;line-height:1.8;margin:0 0 28px;padding-left:20px;">
        <li>Browse trusted helpers in ${city}</li>
        <li>Save your favourites to your shortlist</li>
        <li>Send messages — we'll auto-translate between Thai and your language</li>
      </ol>

      <div style="text-align:center;">
        <a href="https://thaihelper.app/helpers" style="display:inline-block;padding:14px 32px;background:#001b3d;color:#fff;font-size:15px;font-weight:700;text-decoration:none;border-radius:10px;">
          Browse Helpers
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align:center;margin-top:32px;">
      <p style="font-size:12px;color:#aaa;margin:0;">
        ThaiHelper — Connecting families with trusted household staff in Thailand
      </p>
      <p style="font-size:11px;color:#ccc;margin:8px 0 0;">
        <a href="https://thaihelper.app/privacy" style="color:#aaa;text-decoration:underline;">Privacy Policy</a>
        &nbsp;·&nbsp;
        <a href="https://thaihelper.app/terms" style="color:#aaa;text-decoration:underline;">Terms of Service</a>
      </p>
    </div>

  </div>
</body>
</html>`;

  return resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || 'ThaiHelper <onboarding@resend.dev>',
    to: email,
    subject: `Welcome to ThaiHelper, ${firstName} — your account is ready`,
    html,
  });
}
