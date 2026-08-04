// Netlify fires this automatically after it accepts a form submission. The
// filename is the trigger: it has to be exactly "submission-created".
//
// Sends over Google Workspace SMTP with an app password, so the mail comes
// from our real mailbox and replies land where a human will see them.
//
// Nothing here can fail loudly. The registration is already saved by the time
// this runs, so a bounced email must never look like a failed sign-up.
//
// Netlify only reads `handler`. The other exports are there so the link and
// copy builders can be checked against the browser's output without sending.

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

const escapeHtml = value =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

// Rebuilt to match inviteLink() in main.js exactly. The link is generated in
// the browser and never stored, so this email is the only durable copy the
// registrant gets. Any drift between the two breaks team grouping silently:
// teammates would submit a different team_key and land on separate rosters.
export function inviteLinkFor(data) {
  const team = String(data.team_name || "").replace(/\s+/g, " ").trim();
  const key = String(data.team_key || "").trim();
  if (!team || !key) return "";

  const url = new URL("https://frontiercascadia.org/");
  url.searchParams.set("team", team);
  url.searchParams.set("key", key);
  const first = String(data.full_name || "").trim().split(/\s+/)[0];
  if (first) url.searchParams.set("from", first);
  return `${url.toString()}#apply`;
}

// Three cases: has a link, said they have a team but never named it, or is
// solo. Solo registrants get no team copy at all rather than advice that
// doesn't apply to them.
function teamTextBlock(link, hasTeam) {
  if (link) {
    return `Your team invite link:

${link}

Send this to your teammates. They aren't on your roster until they register through it, and teams cap at four people, so you plus three. Keep this email, it is your copy of the link.

`;
  }
  if (hasTeam) {
    return `You told us you're on a team but didn't name it, so we couldn't generate your invite link. Reply to this thread and we'll get it sorted out for you.

`;
  }
  return "";
}

function teamHtmlBlock(link, hasTeam) {
  if (link) {
    const safe = escapeHtml(link);
    return `  <p style="margin-bottom:8px"><strong>Your team invite link</strong></p>
  <p style="margin:0 0 16px;padding:12px 14px;background:#f4f6f8;border-left:3px solid #34d399;word-break:break-all;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:14px"><a href="${safe}" style="color:#0b7a55">${safe}</a></p>
  <p>Send this to your teammates. They aren't on your roster until they register through it, and teams cap at four people, so you plus three. Keep this email, it is your copy of the link.</p>
`;
  }
  if (hasTeam) {
    return `  <p>You told us you're on a team but didn't name it, so we couldn't generate your invite link. Reply to this thread and we'll get it sorted out for you.</p>
`;
  }
  return "";
}

// Rebuilt to match referralLink() in ambassador.js exactly. Same reasoning as
// inviteLinkFor above: the link is minted in the browser and never stored, so
// this email is the ambassador's only durable copy of it.
export function referralLinkFor(data) {
  const code = String(data.amb_code || "").trim();
  if (!code) return "";
  const url = new URL("https://frontiercascadia.org/");
  url.searchParams.set("amb", code);
  return `${url.toString()}#apply`;
}

export function buildAmbassadorText(first, link) {
  return `Hi ${first},

Thanks for applying to be a Frontier Cascadia School Ambassador. We've got your application and we'll be in touch shortly with what happens next.

${link ? `Your personal referral link:

${link}

Every student who registers through this link is credited to you. It is how we measure your work, so use this one rather than sending people to the plain site address. Keep this email, it is your copy of the link.

` : ""}Questions about anything, just reply to this email.

Nikhil Mahesh
Frontier Cascadia
https://frontiercascadia.org`;
}

export function buildAmbassadorHtml(first, link) {
  const safe = escapeHtml(link);
  return `<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:16px;line-height:1.6;color:#1a1a1a;max-width:560px">
  <p>Hi ${escapeHtml(first)},</p>
  <p>Thanks for applying to be a <strong>Frontier Cascadia School Ambassador</strong>. We've got your application and we'll be in touch shortly with what happens next.</p>
${link ? `  <p style="margin-bottom:8px"><strong>Your personal referral link</strong></p>
  <p style="margin:0 0 16px;padding:12px 14px;background:#f4f6f8;border-left:3px solid #34d399;word-break:break-all;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:14px"><a href="${safe}" style="color:#0b7a55">${safe}</a></p>
  <p>Every student who registers through this link is credited to you. It is how we measure your work, so use this one rather than sending people to the plain site address. Keep this email, it is your copy of the link.</p>
` : ""}  <p>Questions about anything, just reply to this email.</p>
  <p style="margin-bottom:0">Nikhil Mahesh<br>
  <a href="https://frontiercascadia.org">Frontier Cascadia</a></p>
</div>`;
}

export function buildText(first, link, hasTeam) {
  return `Hi ${first},

We've received your registration for Frontier Cascadia, Saturday, September 12, 2026, at PACCAR Hall, UW Foster School of Business in Seattle.

Nothing else for you to do right now. We're going through registrations and will email you to confirm your spot, along with the waiver your parent or guardian needs to sign before the event.

${teamTextBlock(link, hasTeam)}Read the code of conduct before the event: https://frontiercascadia.org/code-of-conduct

Questions about anything, just reply to this email.

Nikhil Mahesh
Frontier Cascadia
https://frontiercascadia.org`;
}

export function buildHtml(first, link, hasTeam) {
  return `<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:16px;line-height:1.6;color:#1a1a1a;max-width:560px">
  <p>Hi ${escapeHtml(first)},</p>
  <p>We've received your registration for <strong>Frontier Cascadia</strong>, Saturday, September 12, 2026, at PACCAR Hall, UW Foster School of Business in Seattle.</p>
  <p>Nothing else for you to do right now. We're going through registrations and will email you to confirm your spot, along with the waiver your parent or guardian needs to sign before the event.</p>
${teamHtmlBlock(link, hasTeam)}  <p>Read the <a href="https://frontiercascadia.org/code-of-conduct">code of conduct</a> before the event.</p>
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

  // Only registrations and ambassador applications get an autoresponder. The
  // notify and contact forms would confuse people who are expecting a human.
  const kind = payload?.form_name;
  if (kind !== "register" && kind !== "ambassador") return { statusCode: 200 };

  const data = payload.data || {};
  const to = String(data.email || "").trim();
  if (!to) {
    console.error("[confirm-email] submission had no email address");
    return { statusCode: 200 };
  }

  const first = firstNameOf(data.full_name);

  let subject, text, html;
  if (kind === "ambassador") {
    const link = referralLinkFor(data);
    subject = "Your Frontier Cascadia ambassador referral link";
    text = buildAmbassadorText(first, link);
    html = buildAmbassadorHtml(first, link);
  } else {
    const link = inviteLinkFor(data);
    const hasTeam = String(data.team_status || "").startsWith("Have or assembling");
    subject = "We've got your Frontier Cascadia registration";
    text = buildText(first, link, hasTeam);
    html = buildHtml(first, link, hasTeam);
  }

  try {
    // Gmail only lets us send as the authenticated mailbox or one of its
    // verified aliases, so From is always USER.
    await getTransporter().sendMail({
      from: `"Frontier Cascadia" <${USER}>`,
      to,
      replyTo: USER,
      subject,
      text,
      html,
    });
  } catch (err) {
    console.error("[confirm-email] send failed for", to, err?.message || err);
  }

  return { statusCode: 200 };
};
