import { Resend } from 'resend';
import { JOB_DESCRIPTION_HINTS } from './constants/employer.js';

const resend = new Resend(process.env.RESEND_API_KEY);

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'support@thaihelper.app';

// HTML-escape user-controlled strings before interpolating them into
// email templates. Without this, a user can set their first_name to
// `<a href="http://evil.com">click</a>` and inject phishing links into
// emails sent from our verified domain — Gmail/Outlook strip <script>
// but anchor tags and inline styles survive, so the link looks
// legitimate.
//
// Apply to EVERY user-controlled value: names, bio snippets, message
// previews, free-text city/area. URLs we build server-side from tokens
// or DB primary keys do NOT need escaping — they're trusted.
function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[c]));
}

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
          <td style="padding:6px 0;font-size:14px;color:#1a1a1a;font-weight:600;">${esc(firstName)} ${esc(lastName || '')}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-size:13px;color:#999;">Email</td>
          <td style="padding:6px 0;font-size:14px;color:#1a1a1a;">${esc(email)}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-size:13px;color:#999;">City</td>
          <td style="padding:6px 0;font-size:14px;color:#1a1a1a;">${esc(city)}${area ? ` — ${esc(area)}` : ''}</td>
        </tr>
        ${isHelper ? `
        <tr>
          <td style="padding:6px 0;font-size:13px;color:#999;">Category</td>
          <td style="padding:6px 0;font-size:14px;color:#1a1a1a;">${esc(category)}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-size:13px;color:#999;">Reference</td>
          <td style="padding:6px 0;font-size:14px;color:#1a1a1a;">${esc(ref)}</td>
        </tr>
        ` : `
        <tr>
          <td style="padding:6px 0;font-size:13px;color:#999;">Looking for</td>
          <td style="padding:6px 0;font-size:14px;color:#1a1a1a;">${esc(helperTypes)}</td>
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
  // IMPORTANT: this email must read as "one more step required", NOT
  // "all done". The old version led with "Congratulations, you're
  // registered!" + a big green ✓ — recipients felt finished and never
  // clicked the verify button, so ~all new helpers stayed unverified and
  // had to be flipped manually. Now the framing is "almost done, confirm
  // your email", and every key line is bilingual EN + TH because a large
  // share of helpers read Thai, not English.
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
        <span style="display:inline-block;width:56px;height:56px;background:#fff4e5;border-radius:50%;line-height:56px;font-size:28px;">✉️</span>
      </div>

      <h1 style="font-size:22px;font-weight:700;color:#1a1a1a;text-align:center;margin:0 0 6px;">
        Almost done, ${esc(firstName)}!
      </h1>
      <p style="font-size:17px;font-weight:600;color:#006a62;text-align:center;margin:0 0 6px;">
        เกือบเสร็จแล้ว ${esc(firstName)}!
      </p>
      <p style="font-size:15px;color:#666;text-align:center;margin:0 0 4px;line-height:1.5;">
        One last step — confirm your email to activate your profile.
      </p>
      <p style="font-size:14px;color:#888;text-align:center;margin:0 0 28px;line-height:1.5;">
        อีกหนึ่งขั้นตอนสุดท้าย — ยืนยันอีเมลเพื่อเปิดใช้งานโปรไฟล์ของคุณ
      </p>

      <!-- Details -->
      <div style="background:#f8faf9;border-radius:12px;padding:20px 24px;margin-bottom:28px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:6px 0;font-size:13px;color:#999;">Reference / รหัสอ้างอิง</td>
            <td style="padding:6px 0;font-size:13px;color:#1a1a1a;font-weight:600;text-align:right;">${esc(ref)}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-size:13px;color:#999;">Category / ประเภทงาน</td>
            <td style="padding:6px 0;font-size:13px;color:#1a1a1a;text-align:right;">${esc(category)}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-size:13px;color:#999;">City / เมือง</td>
            <td style="padding:6px 0;font-size:13px;color:#1a1a1a;text-align:right;">${esc(city)}</td>
          </tr>
        </table>
      </div>

      <!-- Verify Email Button -->
      <div style="text-align:center;margin-bottom:28px;">
        <a href="${verifyUrl}" style="display:inline-block;padding:16px 40px;background:#006a62;color:#fff;font-size:17px;font-weight:700;text-decoration:none;border-radius:10px;">
          Confirm My Email · ยืนยันอีเมล
        </a>
        <p style="font-size:12px;color:#999;margin-top:12px;">
          Your profile stays hidden until you confirm.<br>
          โปรไฟล์ของคุณจะยังไม่แสดงจนกว่าจะยืนยัน
        </p>
      </div>

      <h2 style="font-size:16px;font-weight:700;color:#1a1a1a;margin:0 0 12px;">What happens next? / ขั้นตอนต่อไป</h2>
      <ol style="font-size:14px;color:#555;line-height:1.7;margin:0 0 28px;padding-left:20px;">
        <li>Confirm your email — click the button above<br><span style="color:#888;">ยืนยันอีเมล — คลิกปุ่มด้านบน</span></li>
        <li>Your profile goes live on ThaiHelper<br><span style="color:#888;">โปรไฟล์ของคุณจะแสดงบน ThaiHelper</span></li>
        <li>Families across Thailand can find and contact you<br><span style="color:#888;">ครอบครัวทั่วประเทศไทยจะค้นหาและติดต่อคุณได้</span></li>
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
    subject: `One last step, ${firstName} — confirm your email · ยืนยันอีเมลของคุณ`,
    html,
  });
}

// ─── MAGIC-LINK LOGIN EMAIL ─────────────────────────────────────────────────
// Single big button — click to log in, no password / ref-number needed.
// Used by POST /api/auth/magic-link. Link expires after 15 minutes
// (see scripts/supabase-magic-login.sql) and is single-use.
export async function sendMagicLoginEmail({ firstName, email, role, token }) {
  const loginUrl = `https://thaihelper.app/api/auth/magic-login?token=${token}`;
  const roleLabel = role === 'employer' ? 'Family Account' : 'Helper Account';
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
      <h1 style="font-size:22px;font-weight:700;color:#1a1a1a;text-align:center;margin:0 0 8px;">
        Log in to ThaiHelper
      </h1>
      <p style="font-size:15px;color:#666;text-align:center;margin:0 0 28px;line-height:1.5;">
        Hi ${esc(firstName || 'there')}, click the button below to sign in to your <strong>${roleLabel}</strong>:
      </p>

      <div style="text-align:center;margin-bottom:24px;">
        <a href="${loginUrl}" style="display:inline-block;padding:16px 40px;background:#006a62;color:#fff;font-size:16px;font-weight:700;text-decoration:none;border-radius:10px;">
          Log In Now
        </a>
      </div>

      <div style="background:#fff8e1;border-left:3px solid #f5a623;border-radius:8px;padding:14px 18px;margin-bottom:20px;">
        <div style="font-size:13px;color:#555;line-height:1.5;">
          This link works for <strong>15 minutes</strong> and can only be used once. If you didn't request it, you can safely ignore this email — your account is not affected.
        </div>
      </div>

      <p style="font-size:12px;color:#999;line-height:1.5;text-align:center;margin:0;">
        Button not working? Copy and paste this link into your browser:<br>
        <span style="color:#666;word-break:break-all;">${loginUrl}</span>
      </p>
    </div>
    <div style="text-align:center;margin-top:32px;">
      <p style="font-size:12px;color:#aaa;margin:0;">
        ThaiHelper — Connecting families with trusted household staff in Thailand
      </p>
    </div>
  </div>
</body>
</html>`;

  return resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || 'ThaiHelper <onboarding@resend.dev>',
    to: email,
    subject: 'Your ThaiHelper login link',
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
        You're on the waitlist, ${esc(firstName)}!
      </h1>
      <p style="font-size:15px;color:#666;text-align:center;margin:0 0 28px;line-height:1.5;">
        Thank you for registering as an employer on ThaiHelper.
      </p>

      <!-- Details -->
      <div style="background:#f0f2f5;border-radius:12px;padding:20px 24px;margin-bottom:28px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:6px 0;font-size:13px;color:#999;">Location</td>
            <td style="padding:6px 0;font-size:13px;color:#1a1a1a;font-weight:600;text-align:right;">${esc(city)}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-size:13px;color:#999;">Looking for</td>
            <td style="padding:6px 0;font-size:13px;color:#1a1a1a;text-align:right;">${esc(helperTypes)}</td>
          </tr>
        </table>
      </div>

      <h2 style="font-size:16px;font-weight:700;color:#1a1a1a;margin:0 0 12px;">What happens next?</h2>
      <ol style="font-size:14px;color:#555;line-height:1.8;margin:0 0 28px;padding-left:20px;">
        <li>We're building the largest network of helpers in Thailand</li>
        <li>As helpers register in ${esc(city)}, we'll notify you by email</li>
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
        New message from ${esc(senderName)}
      </h1>
      <p style="font-size:15px;color:#666;text-align:center;margin:0 0 28px;line-height:1.5;">
        You have a new message from a ${senderLabel} on ThaiHelper.
      </p>

      <!-- Message Preview -->
      <div style="background:#f8faf9;border-radius:12px;padding:20px 24px;margin-bottom:28px;border-left:3px solid #006a62;">
        <p style="font-size:14px;color:#333;line-height:1.6;margin:0;font-style:italic;">
          "${esc(previewText)}"
        </p>
        <p style="font-size:12px;color:#999;margin:8px 0 0;">— ${esc(senderName)}</p>
      </div>

      <div style="text-align:center;">
        <a href="https://thaihelper.app/profile" style="display:inline-block;padding:16px 36px;background:#006a62;color:#fff;font-size:16px;font-weight:700;text-decoration:none;border-radius:10px;">
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
        ${esc(senderName)} (${senderLabel}) sent you a message on ThaiHelper${recipientName ? ', ' + esc(recipientName) : ''} about a day ago and it's still unread.
      </p>
      ${previewText ? `
      <div style="background:#f8faf9;border-radius:12px;padding:20px 24px;margin-bottom:28px;border-left:3px solid #006a62;">
        <p style="font-size:14px;color:#333;line-height:1.6;margin:0;font-style:italic;">"${esc(previewText)}"</p>
        <p style="font-size:12px;color:#999;margin:8px 0 0;">— ${esc(senderName)}</p>
      </div>
      ` : ''}
      <div style="text-align:center;">
        <a href="https://thaihelper.app/profile" style="display:inline-block;padding:16px 36px;background:#006a62;color:#fff;font-size:16px;font-weight:700;text-decoration:none;border-radius:10px;">
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
        Welcome to ThaiHelper, ${esc(firstName)}!
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
          ${esc(ref)}
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
          and enter your email (<strong>${esc(email)}</strong>) together with the reference number above.
        </div>
      </div>

      <h2 style="font-size:16px;font-weight:700;color:#1a1a1a;margin:0 0 12px;">What you can do now</h2>
      <ol style="font-size:14px;color:#555;line-height:1.8;margin:0 0 28px;padding-left:20px;">
        <li>Browse trusted helpers in ${esc(city)}</li>
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

// ─── MATCH NOTIFICATIONS ────────────────────────────────────────────────────
// Sent when a new registration on the opposite side matches an existing user's
// city + category. Bilingual EN/TH so both audiences understand.

const CATEGORY_LABELS = {
  nanny:       { en: 'Nanny & Babysitter',    th: 'พี่เลี้ยงเด็ก' },
  housekeeper: { en: 'Housekeeper & Cleaner', th: 'แม่บ้าน' },
  chef:        { en: 'Private Chef & Cook',   th: 'พ่อครัว / แม่ครัว' },
  driver:      { en: 'Driver & Chauffeur',    th: 'คนขับรถ' },
  gardener:    { en: 'Gardener & Pool Care',  th: 'คนสวน / ดูแลสระ' },
  elder_care:  { en: 'Elder Care',            th: 'ดูแลผู้สูงอายุ' },
  tutor:       { en: 'Tutor & Teacher',       th: 'ติวเตอร์' },
  petsitter:   { en: 'Pet Sitter & Dog Walker', th: 'ดูแลสัตว์เลี้ยง / พาสุนัขเดินเล่น' },
  multiple:    { en: 'Multiple Services',     th: 'หลายบริการ' },
};

const CITY_LABELS = {
  bangkok:    'Bangkok',
  phuket:     'Phuket',
  chiang_mai: 'Chiang Mai',
  pattaya:    'Pattaya',
  koh_samui:  'Koh Samui',
  hua_hin:    'Hua Hin',
  other:      'Thailand',
};

export function formatCategory(slug, lang = 'en') {
  const label = CATEGORY_LABELS[slug];
  if (!label) return slug || '';
  return label[lang] || label.en;
}

export function formatCity(slug) {
  return CITY_LABELS[slug] || (slug ? slug.charAt(0).toUpperCase() + slug.slice(1).replace(/_/g, ' ') : '');
}

// Sent to existing EMPLOYERS when a new helper in their city + category registers.
export async function sendNewHelperMatchEmail({
  recipientName,
  recipientEmail,
  helperFirstName,
  helperCity,
  helperCategory,
  unsubscribeUrl,
}) {
  const cityLabel = formatCity(helperCity);
  const catEn = formatCategory(helperCategory, 'en');
  const catTh = formatCategory(helperCategory, 'th');
  const browseUrl = 'https://thaihelper.app/helpers';

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
        <span style="display:inline-block;width:56px;height:56px;background:#e6f5f3;border-radius:50%;line-height:56px;font-size:28px;">✨</span>
      </div>

      <h1 style="font-size:22px;font-weight:700;color:#1a1a1a;text-align:center;margin:0 0 8px;">
        A new match for you${recipientName ? ', ' + esc(recipientName) : ''}!
      </h1>
      <p style="font-size:15px;color:#666;text-align:center;margin:0 0 24px;line-height:1.5;">
        <strong>${esc(helperFirstName)}</strong> just registered as a <strong>${esc(catEn)}</strong> in <strong>${esc(cityLabel)}</strong> — exactly what you're looking for.
      </p>

      <div style="background:#f8faf9;border-radius:12px;padding:20px 24px;margin-bottom:24px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:6px 0;font-size:13px;color:#999;width:100px;">Category</td>
            <td style="padding:6px 0;font-size:14px;color:#1a1a1a;font-weight:600;">${esc(catEn)}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-size:13px;color:#999;">Location</td>
            <td style="padding:6px 0;font-size:14px;color:#1a1a1a;">${esc(cityLabel)}</td>
          </tr>
        </table>
      </div>

      <div style="text-align:center;margin-bottom:24px;">
        <a href="${browseUrl}" style="display:inline-block;padding:16px 36px;background:#006a62;color:#fff;font-size:16px;font-weight:700;text-decoration:none;border-radius:10px;">
          View helper profile
        </a>
        <p style="font-size:12px;color:#999;margin-top:12px;">Log in to browse and message directly</p>
      </div>

      <!-- Thai version -->
      <div style="border-top:1px solid #eee;padding-top:20px;margin-top:8px;">
        <p style="font-size:14px;color:#555;line-height:1.6;margin:0;">
          <strong>มีผู้ให้บริการใหม่ตรงกับที่คุณต้องการ!</strong><br>
          ${esc(helperFirstName)} เพิ่งลงทะเบียนเป็น ${esc(catTh)} ใน ${esc(cityLabel)} เข้าเว็บไซต์เพื่อดูโปรไฟล์และส่งข้อความได้เลย
        </p>
      </div>
    </div>

    <div style="text-align:center;margin-top:32px;">
      <p style="font-size:12px;color:#aaa;margin:0;">
        ThaiHelper — Connecting families with trusted household staff in Thailand
      </p>
      <p style="font-size:11px;color:#ccc;margin:8px 0 0;">
        <a href="https://thaihelper.app/privacy" style="color:#aaa;text-decoration:underline;">Privacy</a>
        &nbsp;·&nbsp;
        <a href="https://thaihelper.app/terms" style="color:#aaa;text-decoration:underline;">Terms</a>
      </p>
      ${unsubscribeUrl ? `
      <p style="font-size:11px;color:#ccc;margin:12px 0 0;">
        Don't want match notifications?
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
    subject: `New ${catEn} in ${cityLabel} — matches what you're looking for`,
    html,
    headers,
  });
}

// Sent to existing HELPERS when a new employer in their city looking for their category registers.
export async function sendNewEmployerMatchEmail({
  recipientName,
  recipientEmail,
  employerFirstName,
  employerCity,
  lookingForCategory,
  unsubscribeUrl,
}) {
  const cityLabel = formatCity(employerCity);
  const catEn = formatCategory(lookingForCategory, 'en');
  const catTh = formatCategory(lookingForCategory, 'th');
  const profileUrl = 'https://thaihelper.app/profile';

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
        <span style="display:inline-block;width:56px;height:56px;background:#e6f5f3;border-radius:50%;line-height:56px;font-size:28px;">🎯</span>
      </div>

      <h1 style="font-size:22px;font-weight:700;color:#1a1a1a;text-align:center;margin:0 0 8px;">
        A new job match for you${recipientName ? ', ' + esc(recipientName) : ''}!
      </h1>
      <p style="font-size:15px;color:#666;text-align:center;margin:0 0 24px;line-height:1.5;">
        <strong>${esc(employerFirstName)}</strong> is looking for a <strong>${esc(catEn)}</strong> in <strong>${esc(cityLabel)}</strong> — that matches your profile.
      </p>

      <div style="background:#f8faf9;border-radius:12px;padding:20px 24px;margin-bottom:24px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:6px 0;font-size:13px;color:#999;width:100px;">Looking for</td>
            <td style="padding:6px 0;font-size:14px;color:#1a1a1a;font-weight:600;">${esc(catEn)}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-size:13px;color:#999;">Location</td>
            <td style="padding:6px 0;font-size:14px;color:#1a1a1a;">${esc(cityLabel)}</td>
          </tr>
        </table>
      </div>

      <div style="text-align:center;margin-bottom:24px;">
        <a href="${profileUrl}" style="display:inline-block;padding:16px 36px;background:#006a62;color:#fff;font-size:16px;font-weight:700;text-decoration:none;border-radius:10px;">
          Open ThaiHelper
        </a>
        <p style="font-size:12px;color:#999;margin-top:12px;">Log in and make sure your profile is up to date so families can find you</p>
      </div>

      <!-- Thai version -->
      <div style="border-top:1px solid #eee;padding-top:20px;margin-top:8px;">
        <p style="font-size:14px;color:#555;line-height:1.6;margin:0;">
          <strong>มีงานใหม่ตรงกับโปรไฟล์ของคุณ!</strong><br>
          ${esc(employerFirstName)} กำลังมองหา ${esc(catTh)} ใน ${esc(cityLabel)} เข้าสู่ระบบเพื่อให้ครอบครัวค้นพบโปรไฟล์ของคุณได้
        </p>
      </div>
    </div>

    <div style="text-align:center;margin-top:32px;">
      <p style="font-size:12px;color:#aaa;margin:0;">
        ThaiHelper — Connecting families with trusted household staff in Thailand
      </p>
      <p style="font-size:11px;color:#ccc;margin:8px 0 0;">
        <a href="https://thaihelper.app/privacy" style="color:#aaa;text-decoration:underline;">Privacy</a>
        &nbsp;·&nbsp;
        <a href="https://thaihelper.app/terms" style="color:#aaa;text-decoration:underline;">Terms</a>
      </p>
      ${unsubscribeUrl ? `
      <p style="font-size:11px;color:#ccc;margin:12px 0 0;">
        Don't want match notifications?
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
    subject: `New ${catEn} job in ${cityLabel} — might be a match`,
    html,
    headers,
  });
}

// ─── DIGEST EMAILS ──────────────────────────────────────────────────────────
// Sent by the /api/cron/match-digest job every few days, batching all new
// matches accumulated for one recipient since the last notification.

// helpers param: array of { firstName, category, city }
export async function sendHelperMatchDigestEmail({
  recipientName,
  recipientEmail,
  helpers,
  unsubscribeUrl,
}) {
  if (!helpers || helpers.length === 0) return null;
  const browseUrl = 'https://thaihelper.app/helpers';
  const count = helpers.length;

  const rowsHtml = helpers.map((h) => {
    const cityLabel = formatCity(h.city);
    const catEn = formatCategory(h.category, 'en');
    return `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #eee;">
          <div style="font-size:15px;color:#1a1a1a;font-weight:600;">${esc(h.firstName || 'New helper')}</div>
          <div style="font-size:13px;color:#666;margin-top:2px;">${esc(catEn)} · ${esc(cityLabel)}</div>
        </td>
      </tr>`;
  }).join('');

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
        <span style="display:inline-block;width:56px;height:56px;background:#e6f5f3;border-radius:50%;line-height:56px;font-size:28px;">✨</span>
      </div>
      <h1 style="font-size:22px;font-weight:700;color:#1a1a1a;text-align:center;margin:0 0 8px;">
        ${count} new ${count === 1 ? 'match' : 'matches'} for you${recipientName ? ', ' + esc(recipientName) : ''}!
      </h1>
      <p style="font-size:15px;color:#666;text-align:center;margin:0 0 24px;line-height:1.5;">
        Helpers who registered recently and match what you're looking for. Check their profiles to see if any could be a fit.
      </p>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">${rowsHtml}</table>
      <div style="text-align:center;margin-bottom:24px;">
        <a href="${browseUrl}" style="display:inline-block;padding:16px 36px;background:#006a62;color:#fff;font-size:16px;font-weight:700;text-decoration:none;border-radius:10px;">
          Browse helpers
        </a>
      </div>
      <div style="border-top:1px solid #eee;padding-top:20px;margin-top:8px;">
        <p style="font-size:14px;color:#555;line-height:1.6;margin:0;">
          <strong>มีผู้ช่วยใหม่ ${count} คนที่ตรงกับที่คุณต้องการ</strong><br>
          เข้าเว็บไซต์เพื่อดูโปรไฟล์และส่งข้อความได้เลย
        </p>
      </div>
    </div>
    <div style="text-align:center;margin-top:32px;">
      <p style="font-size:12px;color:#aaa;margin:0;">
        ThaiHelper — Connecting families with trusted household staff in Thailand
      </p>
      <p style="font-size:11px;color:#ccc;margin:8px 0 0;">
        <a href="https://thaihelper.app/privacy" style="color:#aaa;text-decoration:underline;">Privacy</a>
        &nbsp;·&nbsp;
        <a href="https://thaihelper.app/terms" style="color:#aaa;text-decoration:underline;">Terms</a>
      </p>
      ${unsubscribeUrl ? `
      <p style="font-size:11px;color:#ccc;margin:12px 0 0;">
        Don't want match notifications?
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
    subject: `${count} new ${count === 1 ? 'helper' : 'helpers'} matching what you're looking for`,
    html,
    headers,
  });
}

// employers param: array of { firstName, lookingForCategory, city }
export async function sendEmployerMatchDigestEmail({
  recipientName,
  recipientEmail,
  employers,
  unsubscribeUrl,
}) {
  if (!employers || employers.length === 0) return null;
  const browseUrl = 'https://thaihelper.app/employers-browse';
  const count = employers.length;

  const rowsHtml = employers.map((e) => {
    const cityLabel = formatCity(e.city);
    const catEn = formatCategory(e.lookingForCategory, 'en');
    return `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #eee;">
          <div style="font-size:15px;color:#1a1a1a;font-weight:600;">${esc(e.firstName || 'New family')}</div>
          <div style="font-size:13px;color:#666;margin-top:2px;">Looking for ${esc(catEn)} · ${esc(cityLabel)}</div>
        </td>
      </tr>`;
  }).join('');

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
        <span style="display:inline-block;width:56px;height:56px;background:#e6f5f3;border-radius:50%;line-height:56px;font-size:28px;">✨</span>
      </div>
      <h1 style="font-size:22px;font-weight:700;color:#1a1a1a;text-align:center;margin:0 0 8px;">
        ${count} new ${count === 1 ? 'job' : 'jobs'} for you${recipientName ? ', ' + esc(recipientName) : ''}!
      </h1>
      <p style="font-size:15px;color:#666;text-align:center;margin:0 0 24px;line-height:1.5;">
        Families who registered recently and are looking for someone like you. Check their listings to see if any could be a fit.
      </p>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">${rowsHtml}</table>
      <div style="text-align:center;margin-bottom:24px;">
        <a href="${browseUrl}" style="display:inline-block;padding:16px 36px;background:#006a62;color:#fff;font-size:16px;font-weight:700;text-decoration:none;border-radius:10px;">
          Browse jobs
        </a>
      </div>
      <div style="border-top:1px solid #eee;padding-top:20px;margin-top:8px;">
        <p style="font-size:14px;color:#555;line-height:1.6;margin:0;">
          <strong>มีงานใหม่ ${count} งานที่ตรงกับคุณ</strong><br>
          เข้าเว็บไซต์เพื่อดูประกาศและสมัครได้เลย
        </p>
      </div>
    </div>
    <div style="text-align:center;margin-top:32px;">
      <p style="font-size:12px;color:#aaa;margin:0;">
        ThaiHelper — Connecting families with trusted household staff in Thailand
      </p>
      <p style="font-size:11px;color:#ccc;margin:8px 0 0;">
        <a href="https://thaihelper.app/privacy" style="color:#aaa;text-decoration:underline;">Privacy</a>
        &nbsp;·&nbsp;
        <a href="https://thaihelper.app/terms" style="color:#aaa;text-decoration:underline;">Terms</a>
      </p>
      ${unsubscribeUrl ? `
      <p style="font-size:11px;color:#ccc;margin:12px 0 0;">
        Don't want match notifications?
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
    subject: `${count} new ${count === 1 ? 'job' : 'jobs'} for you on ThaiHelper`,
    html,
    headers,
  });
}

// ─── NEW RATING: TELL THE HELPER ───────────────────────────────────────────
// Sent when a family posts or edits a rating. Added 2026-09-12: before this,
// a helper had no way of knowing a review about her existed. A suspended
// family had accused one of theft, and she only found out because she went
// looking — then had to hunt down a support address and write to us in a
// second language.
//
// Reply-to is the admin inbox on purpose. A report button in the app would
// reach the helpers who open the app; a reply reaches everyone, including
// someone reading this on a phone in Burmese who will simply hit "reply".
//
// Bilingual EN + TH in one mail — we do not reliably know which she reads.
export async function sendNewRatingNotification({
  recipientName, recipientEmail, employerName, stars, comment, isPublic, minPublicReviews,
}) {
  const name = recipientName || 'there';
  const from = employerName || 'A family';
  const filled = '★'.repeat(stars) + '☆'.repeat(5 - stars);

  const visibility = isPublic
    ? 'This review is visible on your profile.'
    : `This review is NOT on your profile yet. Reviews only become visible once you have ${minPublicReviews}, so that no single family decides how you look to everyone else.`;
  const visibilityTh = isPublic
    ? 'รีวิวนี้แสดงอยู่บนโปรไฟล์ของคุณแล้ว'
    : `รีวิวนี้ยังไม่แสดงบนโปรไฟล์ของคุณ รีวิวจะแสดงเมื่อคุณมีครบ ${minPublicReviews} รายการ เพื่อไม่ให้ครอบครัวเดียวตัดสินภาพลักษณ์ของคุณ`;

  const text = `Hi ${name},

${from} left you a rating on ThaiHelper: ${stars} out of 5.

${comment ? `"${comment}"\n\n` : ''}${visibility}

If this rating is unfair, untrue, or comes from someone you never worked with, reply to this email and tell us. We read every reply, and we do remove reviews that turn out to be false — we have done it before.

You do not need to explain yourself or be polite about it. Just tell us what happened.

Jelena
thaihelper.app

─────────────────────────

สวัสดีค่ะ ${name}

${from} ได้ให้คะแนนคุณใน ThaiHelper: ${stars} จาก 5 คะแนน

${comment ? `"${comment}"\n\n` : ''}${visibilityTh}

หากคะแนนนี้ไม่เป็นธรรม ไม่เป็นความจริง หรือมาจากคนที่คุณไม่เคยทำงานด้วย กรุณาตอบกลับอีเมลนี้และแจ้งเราได้เลย เราอ่านทุกฉบับ และเราลบรีวิวที่พิสูจน์ได้ว่าเป็นเท็จจริง ๆ

ไม่ต้องอธิบายยืดยาวหรือเกรงใจ แค่เล่าให้เราฟังว่าเกิดอะไรขึ้น

เจเลน่า
thaihelper.app
`;

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

      <h1 style="font-size:22px;font-weight:700;color:#1a1a1a;margin:0 0 8px;">
        ${esc(from)} rated you
      </h1>
      <div style="font-size:24px;color:#F4A261;letter-spacing:2px;margin:0 0 20px;">${filled}</div>

      ${comment ? `<blockquote style="margin:0 0 20px;padding:12px 16px;border-left:3px solid #e5e7eb;background:#f9fafb;border-radius:8px;font-size:15px;color:#374151;">${esc(comment)}</blockquote>` : ''}

      <p style="font-size:14px;color:#666;line-height:1.6;margin:0 0 24px;">${esc(visibility)}</p>

      <div style="border-left:4px solid #F4A261;background:#fff8f0;padding:14px 16px;border-radius:8px;">
        <p style="margin:0;font-size:14px;color:#7a5330;line-height:1.6;">
          <strong style="color:#8a4b12;">Is this rating unfair or untrue?</strong><br>
          Reply to this email and tell us — especially if it comes from someone you never worked with. We read every reply, and we do remove reviews that turn out to be false.
        </p>
      </div>

      <hr style="border:none;border-top:1px solid #e5e7eb;margin:28px 0;">

      <h2 style="font-size:17px;font-weight:700;color:#1a1a1a;margin:0 0 12px;">${esc(from)} ให้คะแนนคุณ</h2>
      ${comment ? `<blockquote style="margin:0 0 16px;padding:12px 16px;border-left:3px solid #e5e7eb;background:#f9fafb;border-radius:8px;font-size:15px;color:#374151;">${esc(comment)}</blockquote>` : ''}
      <p style="font-size:14px;color:#666;line-height:1.7;margin:0 0 20px;">${esc(visibilityTh)}</p>
      <div style="border-left:4px solid #F4A261;background:#fff8f0;padding:14px 16px;border-radius:8px;">
        <p style="margin:0;font-size:14px;color:#7a5330;line-height:1.7;">
          <strong style="color:#8a4b12;">คะแนนนี้ไม่เป็นธรรมหรือไม่จริงใช่ไหม?</strong><br>
          กรุณาตอบกลับอีเมลนี้และแจ้งเรา โดยเฉพาะหากมาจากคนที่คุณไม่เคยทำงานด้วย เราอ่านทุกฉบับ และเราลบรีวิวที่เป็นเท็จจริง ๆ
        </p>
      </div>

      <p style="font-size:14px;color:#666;margin:24px 0 0;">Jelena<br>thaihelper.app</p>
    </div>
  </div>
</body>
</html>`;

  return resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || 'ThaiHelper <onboarding@resend.dev>',
    to: recipientEmail,
    replyTo: ADMIN_EMAIL,
    subject: `${from} rated you on ThaiHelper / ${from} ให้คะแนนคุณใน ThaiHelper`,
    text,
    html,
  });
}

// ─── JOB DESCRIPTION REMINDER ───────────────────────────────────────────────
// Sent to families whose live job post has categories ticked but no (or an
// unusably short) description. Helpers see such a post and can't tell what
// the job is — the hours, the children's ages, how big the dogs are — so they
// either don't apply or apply blind. Transactional: it's about their own
// listing being incomplete, so there's no unsubscribe link, and it links
// straight to the boxes that need filling.
export async function sendJobDescriptionReminderEmail({
  firstName,
  email,
  ref,
  missingCategories = [],
}) {
  const editUrl = 'https://thaihelper.app/employer-profile#job';

  // A card per missing job, listing the same prompts the form shows, so the
  // email and the page ask for exactly the same details.
  function checklistCard(title, items) {
    return `
      <div style="background:#f4faf9;border:1px solid #d9ece8;border-radius:12px;padding:14px 18px;margin-bottom:12px;">
        <div style="font-size:15px;font-weight:700;color:#0a4a44;">${title}</div>
        ${items.length ? `<ul style="margin:6px 0 0;padding-left:20px;font-size:14px;color:#555;line-height:1.7;">${
          items.map((h) => `<li>${esc(h)}</li>`).join('')
        }</ul>` : ''}
      </div>`;
  }

  const blocksHtml = missingCategories.length === 0
    // Accounts that never picked a category get the generic ask.
    ? checklistCard('Which helpers you need, and what the job is', [
        'Which helper types you are looking for',
        'The days and hours you need help',
        'Who or what the helper looks after (children and their ages, pets and their size, the home)',
        'Languages or experience you need',
      ])
    : missingCategories.map((cat) => {
        const labelEn = formatCategory(cat, 'en');
        const labelTh = formatCategory(cat, 'th');
        const title = labelTh && labelTh !== labelEn
          ? `${esc(labelEn)} <span style="font-weight:500;color:#3d6b65;">· ${esc(labelTh)}</span>`
          : esc(labelEn);
        return checklistCard(title, JOB_DESCRIPTION_HINTS[cat]?.en || []);
      }).join('');

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
        <span style="display:inline-block;width:56px;height:56px;background:#fdeaea;border-radius:50%;line-height:56px;font-size:28px;">📝</span>
      </div>

      <h1 style="font-size:22px;font-weight:700;color:#1a1a1a;text-align:center;margin:0 0 8px;">
        Your job post is missing its description
      </h1>
      <p style="font-size:15px;color:#666;text-align:center;margin:0 0 24px;line-height:1.6;">
        Hi ${esc(firstName || 'there')} — your profile is live on ThaiHelper, but the job description is still empty.
        Helpers only see which boxes you ticked, not what the work actually is, so most of them skip the post
        instead of applying.
      </p>

      <p style="font-size:15px;color:#1a1a1a;font-weight:700;margin:0 0 12px;">
        Please add a few lines for ${missingCategories.length > 1 ? 'each of these jobs' : 'this job'}:
      </p>
      ${blocksHtml}

      <div style="text-align:center;margin:28px 0 8px;">
        <a href="${editUrl}" style="display:inline-block;padding:16px 36px;background:#001b3d;color:#fff;font-size:16px;font-weight:700;text-decoration:none;border-radius:10px;">
          Add my job description
        </a>
        <p style="font-size:12px;color:#999;margin-top:12px;">
          Takes two minutes. Log in with ${esc(email)} and your reference ${esc(ref)}.
        </p>
      </div>

      <div style="border-top:1px solid #eee;padding-top:20px;margin-top:20px;">
        <p style="font-size:14px;color:#555;line-height:1.7;margin:0;">
          <strong>ประกาศงานของคุณยังไม่มีคำอธิบาย</strong><br>
          โปรไฟล์ของคุณแสดงอยู่บน ThaiHelper แล้ว แต่ยังไม่มีรายละเอียดงาน ผู้ช่วยจึงไม่รู้ว่างานคืออะไร
          — เวลาทำงาน อายุเด็ก จำนวนและขนาดของสัตว์เลี้ยง หรือขนาดบ้าน
          กรุณาเพิ่มคำอธิบายสั้น ๆ ของแต่ละงาน เพื่อให้ผู้ช่วยรู้ว่ากำลังสมัครงานอะไร
        </p>
        <p style="font-size:14px;margin:12px 0 0;">
          <a href="${editUrl}" style="color:#001b3d;font-weight:700;">เพิ่มคำอธิบายงาน →</a>
        </p>
      </div>

      <p style="font-size:14px;color:#666;margin:24px 0 0;">Jelena<br>thaihelper.app</p>
    </div>

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
    replyTo: ADMIN_EMAIL,
    subject: 'Please add your job description — helpers can’t see what the job is / กรุณาเพิ่มรายละเอียดงาน',
    html,
  });
}
