// Netlify fires this automatically after it accepts a form submission. The
// filename is the trigger: it has to be exactly "submission-created".
//
// Sends over Google Workspace SMTP with an app password, so the mail comes
// from our real mailbox and replies land where a human will see them.
//
// Nothing here can fail loudly. The registration is already saved by the time
// this runs, so a bounced email must never look like a failed sign-up.

import nodemailer from "nodemailer";

const USER = process.env.GMAIL_USER;
// Google displays app passwords in four spaced blocks. People paste them that
// way, and SMTP auth fails on the spaces, so strip them.
const PASS = String(process.env.GMAIL_APP_PASSWORD || "").replace(/\s+/g, "");

// Built once and reused while the container stays warm, so a burst of
// registrations doesn't reopen a TLS connection every time.
let transporter;
function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user: USER, pass: PASS },
    });
  }
  return transporter;
}

function firstNameOf(fullName) {
  const first = String(fullName || "").trim().split(/\s+/)[0];
  return first || "there";
}

function buildText(first) {
  return `Hi ${first},

We've received your registration for Frontier Cascadia, Saturday, September 12, 2026, at PACCAR Hall, UW Foster School of Business in Seattle.

Nothing else for you to do right now. We're going through registrations and will email you to confirm your spot, along with the waiver your parent or guardian needs to sign before the event.

Two things worth doing while you wait:

Read the code of conduct: https://frontiercascadia.org/code-of-conduct

If you registered with a team, send your teammates your invite link. They aren't on your roster until they register through it.

Questions about anything, just reply to this email.

Nikhil Mahesh
Frontier Cascadia
https://frontiercascadia.org`;
}

function buildHtml(first) {
  return `<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:16px;line-height:1.6;color:#1a1a1a;max-width:560px">
  <p>Hi ${first},</p>
  <p>We've received your registration for <strong>Frontier Cascadia</strong>, Saturday, September 12, 2026, at PACCAR Hall, UW Foster School of Business in Seattle.</p>
  <p>Nothing else for you to do right now. We're going through registrations and will email you to confirm your spot, along with the waiver your parent or guardian needs to sign before the event.</p>
  <p>Two things worth doing while you wait:</p>
  <ul>
    <li>Read the <a href="https://frontiercascadia.org/code-of-conduct">code of conduct</a>.</li>
    <li>If you registered with a team, send your teammates your invite link. They aren't on your roster until they register through it.</li>
  </ul>
  <p>Questions about anything, just reply to this email.</p>
  <p style="margin-bottom:0">Nikhil Mahesh<br>
  <a href="https://frontiercascadia.org">Frontier Cascadia</a></p>
</div>`;
}

export const handler = async (event) => {
  if (!USER || !PASS) {
    console.error("[confirm-email] GMAIL_USER or GMAIL_APP_PASSWORD is not set, skipping");
    return { statusCode: 200 };
  }

  let payload;
  try {
    ({ payload } = JSON.parse(event.body || "{}"));
  } catch {
    console.error("[confirm-email] could not parse submission body");
    return { statusCode: 200 };
  }

  // Only registrations get an autoresponder. The notify and contact forms
  // would confuse people who are expecting a human.
  if (payload?.form_name !== "register") return { statusCode: 200 };

  const data = payload.data || {};
  const to = String(data.email || "").trim();
  if (!to) {
    console.error("[confirm-email] submission had no email address");
    return { statusCode: 200 };
  }

  const first = firstNameOf(data.full_name);

  try {
    // Gmail only lets us send as the authenticated mailbox or one of its
    // verified aliases, so From is always USER.
    await getTransporter().sendMail({
      from: `"Frontier Cascadia" <${USER}>`,
      to,
      replyTo: USER,
      subject: "We've got your Frontier Cascadia registration",
      text: buildText(first),
      html: buildHtml(first),
    });
  } catch (err) {
    console.error("[confirm-email] send failed for", to, err?.message || err);
  }

  return { statusCode: 200 };
};
