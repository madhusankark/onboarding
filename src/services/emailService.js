const nodemailer = require('nodemailer');
const env = require('../config/env');

let transporter = null;

/**
 * Nodemailer transport. If SMTP credentials are missing, a console-based
 * "logger" transport is used so development keeps working without a server.
 */
function getTransporter() {
  if (transporter) return transporter;
  if (env.smtp.host && env.smtp.user && env.smtp.pass) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.secure,
      auth: { user: env.smtp.user, pass: env.smtp.pass }
    });
  } else {
    transporter = {
      sendMail: async (opts) => {
        console.log(`\n[DEV MAIL] To: ${opts.to}\nSubject: ${opts.subject}\nHTML: ${opts.html}\n`);
        return { messageId: `dev-${Date.now()}@onboard.local` };
      }
    };
  }
  return transporter;
}

const sendEmail = async ({ to, subject, html }) => {
  try {
    const t = getTransporter();
    const info = await t.sendMail({ from: env.smtp.from, to, subject, html });
    console.log(`Email queued: ${subject} -> ${to} (${info.messageId})`);
    return { sent: true, messageId: info.messageId };
  } catch (err) {
    console.error('Email send failed:', err.message);
    return { sent: false, error: err.message };
  }
};

// Reusable templates
const statusEmailTemplate = (name, status, remarks, isAdminMail = false) => `
  <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
    <div style="background:#4f46e5;padding:20px 28px">
      <h2 style="margin:0;color:#fff;font-size:20px">${isAdminMail ? 'New Application Submission' : 'Application Status Update'}</h2>
    </div>
    <div style="padding:28px">
      <p style="color:#374151;font-size:15px;line-height:1.6">
        Hi <strong>${name}</strong>,
      </p>
      <p style="color:#374151;font-size:15px;line-height:1.6">
        ${isAdminMail
          ? 'A service provider has submitted a new onboarding application and is awaiting review.'
          : `Your onboarding application has been <strong style="text-transform:uppercase">${status}</strong>.`}
      </p>
      ${
        status === 'approved'
          ? '<p style="color:#059669;font-size:15px;line-height:1.6">🎉 Congratulations! You can now start accepting service requests through the portal.</p>'
          : ''
      }
      ${
        remarks
          ? `<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:14px 18px;margin:16px 0">
               <p style="margin:0 0 6px;color:#991b1b;font-size:13px;font-weight:bold">${isAdminMail ? 'Remarks from provider:' : 'Reviewer remarks:'}</p>
               <p style="margin:0;color:#7f1d1d;font-size:14px">${remarks}</p>
             </div>`
          : ''
      }
      <a href="${env.clientUrl}/login" style="display:inline-block;margin-top:18px;background:#4f46e5;color:#fff;text-decoration:none;padding:10px 22px;border-radius:8px;font-size:14px">
        Open Portal
      </a>
      <p style="color:#9ca3af;font-size:12px;margin-top:24px">This is an automated email from the Service Provider Onboarding Portal.</p>
    </div>
  </div>
`;

module.exports = { sendEmail, statusEmailTemplate };