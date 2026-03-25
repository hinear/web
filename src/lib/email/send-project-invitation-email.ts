import "server-only";

import nodemailer from "nodemailer";

interface SendProjectInvitationEmailInput {
  expiresAt: string;
  inviteLink: string;
  invitedBy: string;
  projectName: string;
  to: string;
}

function readGmailConfig() {
  const user = process.env.GMAIL_SMTP_USER?.trim();
  const pass = process.env.GMAIL_SMTP_APP_PASSWORD?.trim();
  const from = process.env.EMAIL_FROM?.trim() || user;

  if (!user || !pass || !from) {
    return null;
  }

  return { from, pass, user };
}

function formatExpiryLabel(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "7 days";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export async function sendProjectInvitationEmail(
  input: SendProjectInvitationEmailInput
) {
  const config = readGmailConfig();

  if (!config) {
    console.warn(
      "Skipping invitation email because Gmail SMTP is not configured."
    );
    return false;
  }

  const transporter = nodemailer.createTransport({
    auth: {
      pass: config.pass,
      user: config.user,
    },
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
  });

  const expiryLabel = formatExpiryLabel(input.expiresAt);
  const subject = `You're invited to join ${input.projectName} on Hinear`;

  await transporter.sendMail({
    from: config.from,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <h2 style="margin-bottom: 12px;">Project invitation</h2>
        <p><strong>${input.invitedBy}</strong> invited you to join <strong>${input.projectName}</strong>.</p>
        <p>This invitation link expires on <strong>${expiryLabel}</strong>.</p>
        <p style="margin: 24px 0;">
          <a href="${input.inviteLink}" style="display: inline-block; padding: 12px 16px; border-radius: 10px; background: #4338CA; color: white; text-decoration: none; font-weight: 600;">Accept invitation</a>
        </p>
        <p>If the button does not work, open this link:</p>
        <p><a href="${input.inviteLink}">${input.inviteLink}</a></p>
      </div>
    `,
    subject,
    text: [
      `${input.invitedBy} invited you to join ${input.projectName} on Hinear.`,
      `This invitation link expires on ${expiryLabel}.`,
      "",
      `Accept invitation: ${input.inviteLink}`,
    ].join("\n"),
    to: input.to,
  });

  return true;
}
