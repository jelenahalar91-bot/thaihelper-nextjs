import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// ─── HELPER CONFIRMATION EMAIL ──────────────────────────────────────────────
export async function sendHelperConfirmation({ firstName, email, ref, category, city }) {
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

      <h2 style="font-size:16px;font-weight:700;color:#1a1a1a;margin:0 0 12px;">What happens next?</h2>
      <ol style="font-size:14px;color:#555;line-height:1.8;margin:0 0 28px;padding-left:20px;">
        <li>We review your profile (usually within 24 hours)</li>
        <li>Your profile goes live on ThaiHelper</li>
        <li>Families in ${city} can discover and contact you</li>
      </ol>

      <div style="text-align:center;">
        <a href="https://thaihelper.app" style="display:inline-block;padding:14px 32px;background:#006a62;color:#fff;font-size:15px;font-weight:700;text-decoration:none;border-radius:10px;">
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
