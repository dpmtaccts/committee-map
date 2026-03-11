import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}
const NOTIFICATION_EMAIL = process.env.NOTIFICATION_EMAIL || "hello@eracx.com";
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

// Brand colors
const TEAL = "#1FA7A2";
const CHARCOAL = "#383838";
const OXIDE = "#B85C4A";
const SAND = "#D6B26D";
const MAGENTA = "#D43D8D";
const SECONDARY = "#5B6670";
const DIVIDER = "#D7DADD";
const OFF_WHITE = "#F6F5F2";

const ROLE_COLORS: Record<string, string> = {
  "Economic Buyer": OXIDE,
  "Champion": TEAL,
  "Technical Evaluator": SAND,
  "Coach": MAGENTA,
  "End User": SECONDARY,
  "Blocker": OXIDE,
};

function getStatusBadge(status: string) {
  const colors: Record<string, { bg: string; text: string; label: string }> = {
    covered: { bg: "#E8F5F4", text: TEAL, label: "Covered" },
    gap: { bg: "#FEF3EC", text: OXIDE, label: "Gap" },
    risk: { bg: "#FDE8E8", text: "#C4484E", label: "Risk" },
  };
  const c = colors[status] || colors.gap;
  return `<span style="display:inline-block;padding:2px 10px;border-radius:99px;font-size:11px;font-weight:600;background:${c.bg};color:${c.text};">${c.label}</span>`;
}

function buildUserEmailHtml(results: Record<string, unknown>, companyDomain: string) {
  const company = results.company as Record<string, unknown> || {};
  const roles = (results.roles as Array<Record<string, unknown>>) || [];
  const riskScore = (results.deal_risk_score as number) || 50;
  const biggestRisk = (results.biggest_risk as string) || "";
  const nextMoves = (results.next_moves as string[]) || [];
  const pattern = (results.pattern as string) || "";
  const companyName = (company.name as string) || companyDomain;

  const scoreColor = riskScore > 70 ? "#C4484E" : riskScore > 40 ? OXIDE : TEAL;

  const roleCards = roles.map((role) => {
    const roleName = (role.role as string) || "Role";
    const borderColor = ROLE_COLORS[roleName] || SECONDARY;
    const name = role.name as string | null;
    const title = (role.title as string) || (role.likely_title as string) || "";
    const status = (role.status as string) || "gap";
    const careAbout = (role.what_they_care_about as string) || "";
    const evaluate = (role.how_they_evaluate as string) || "";

    return `
      <div style="border-left:3px solid ${borderColor};background:#FFFFFF;border-radius:8px;padding:20px;margin-bottom:12px;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:16px;font-weight:700;color:${CHARCOAL};">${roleName}</span>
          ${getStatusBadge(status)}
        </div>
        <p style="font-size:14px;font-weight:600;color:${CHARCOAL};margin:6px 0 2px;">${name || "Unidentified"}</p>
        <p style="font-size:13px;color:${SECONDARY};margin:0 0 12px;">${title}</p>
        <p style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:${SECONDARY};margin:0 0 4px;">What they care about</p>
        <p style="font-size:13px;font-weight:300;color:${CHARCOAL};margin:0 0 10px;line-height:1.5;">${careAbout}</p>
        <p style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:${SECONDARY};margin:0 0 4px;">How they evaluate</p>
        <p style="font-size:13px;font-weight:300;color:${CHARCOAL};margin:0;line-height:1.5;">${evaluate}</p>
      </div>`;
  }).join("");

  const movesHtml = nextMoves.map((move, i) => `
    <div style="background:#FFFFFF;border-radius:8px;padding:16px;margin-bottom:8px;display:flex;gap:12px;">
      <span style="font-size:22px;font-weight:700;color:${TEAL};flex-shrink:0;">${i + 1}.</span>
      <p style="font-size:14px;font-weight:300;color:${CHARCOAL};margin:4px 0;line-height:1.5;">${move}</p>
    </div>`).join("");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin:0; padding:0; background:${OFF_WHITE}; font-family:'Source Sans 3',Arial,Helvetica,sans-serif; }
    a { color:${TEAL}; }
  </style>
</head>
<body>
  <div style="max-width:600px;margin:0 auto;padding:32px 20px;">
    <!-- Header -->
    <div style="margin-bottom:28px;">
      <a href="https://eracx.com" style="text-decoration:none;font-size:16px;font-weight:900;color:${CHARCOAL};">
        &#9632; ERA
      </a>
    </div>

    <!-- Company Card -->
    <div style="background:#FFFFFF;border-radius:12px;padding:24px;margin-bottom:20px;border:1px solid ${DIVIDER};">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;">
        <div>
          <h1 style="font-size:22px;font-weight:800;color:${CHARCOAL};margin:0 0 4px;">${companyName}</h1>
          <p style="font-size:13px;color:${SECONDARY};margin:0;">
            ${companyDomain}${company.industry ? ` &middot; ${company.industry}` : ""}${company.employeeCount ? ` &middot; ~${(company.employeeCount as number).toLocaleString()} employees` : ""}
          </p>
        </div>
        <div style="text-align:center;">
          <div style="width:52px;height:52px;border-radius:50%;border:3px solid ${scoreColor};display:flex;align-items:center;justify-content:center;">
            <span style="font-size:18px;font-weight:900;color:${scoreColor};">${riskScore}</span>
          </div>
          <p style="font-size:9px;font-weight:600;color:${SECONDARY};letter-spacing:0.5px;margin:4px 0 0;">DEAL RISK</p>
        </div>
      </div>
    </div>

    <!-- Role Cards -->
    ${roleCards}

    <!-- Biggest Gap -->
    <div style="background:rgba(184,92,74,0.06);border-left:3px solid ${OXIDE};border-radius:8px;padding:20px;margin:20px 0;">
      <h3 style="font-size:16px;font-weight:700;color:${OXIDE};margin:0 0 8px;">Your biggest relationship gap</h3>
      <p style="font-size:14px;font-weight:300;color:${CHARCOAL};margin:0;line-height:1.6;">${biggestRisk}</p>
    </div>

    <!-- Next Moves -->
    <h3 style="font-size:18px;font-weight:700;color:${CHARCOAL};margin:24px 0 12px;">Your next three moves</h3>
    ${movesHtml}

    <!-- Pattern -->
    <h3 style="font-size:18px;font-weight:700;color:${CHARCOAL};margin:24px 0 8px;">The pattern to watch</h3>
    <p style="font-size:14px;font-weight:300;color:${SECONDARY};line-height:1.6;margin:0 0 32px;">${pattern}</p>

    <!-- Footer -->
    <div style="border-top:1px solid ${DIVIDER};padding-top:24px;text-align:center;">
      <p style="font-size:13px;color:${SECONDARY};margin:0 0 8px;">
        Built by <a href="https://eracx.com" style="color:${TEAL};text-decoration:none;">Era</a> &middot;
        <a href="https://eracx.com" style="color:${TEAL};text-decoration:none;">eracx.com</a>
      </p>
      <p style="margin:12px 0 0;">
        <a href="https://map.eracx.com" style="display:inline-block;padding:10px 24px;background:${CHARCOAL};color:#FFFFFF;text-decoration:none;border-radius:6px;font-size:14px;font-weight:600;">
          Map another deal
        </a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, companyDomain, roleContext, enriched, results } = body;

    if (!email || !results) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const companyName = results.company?.name || companyDomain || "Unknown Company";

    // Send all three notifications concurrently
    const promises: Promise<unknown>[] = [];

    // 1. User confirmation email
    if (process.env.RESEND_API_KEY) {
      const resend = getResend();
      const fromAddress = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
      promises.push(
        resend.emails.send({
          from: `Era <${fromAddress}>`,
          to: [email],
          subject: `Your Relationship Map: ${companyName}`,
          html: buildUserEmailHtml(results, companyDomain || ""),
        }).catch((e) => console.error("User email failed:", e))
      );

      // 2. Internal notification email
      promises.push(
        resend.emails.send({
          from: `Era Maps <${fromAddress}>`,
          to: [NOTIFICATION_EMAIL],
          subject: `New Relationship Map: ${companyDomain || "unknown"}`,
          html: `<div style="font-family:Arial,sans-serif;padding:20px;">
            <h2>New Relationship Map Submission</h2>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Company:</strong> ${companyDomain || "N/A"}</p>
            <p><strong>Role:</strong> ${roleContext || "N/A"}</p>
            <p><strong>Enriched:</strong> ${enriched ? "Yes" : "No"}</p>
            <p><strong>Time:</strong> ${new Date().toISOString()}</p>
          </div>`,
        }).catch((e) => console.error("Internal email failed:", e))
      );
    }

    // 3. Slack webhook
    if (SLACK_WEBHOOK_URL) {
      promises.push(
        fetch(SLACK_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            blocks: [
              {
                type: "header",
                text: { type: "plain_text", text: "New Relationship Map Submission" },
              },
              {
                type: "section",
                fields: [
                  { type: "mrkdwn", text: `*Email:*\n${email}` },
                  { type: "mrkdwn", text: `*Company:*\n${companyDomain || "N/A"}` },
                  { type: "mrkdwn", text: `*Role:*\n${roleContext || "N/A"}` },
                  { type: "mrkdwn", text: `*Enriched:*\n${enriched ? "Yes" : "No"}` },
                ],
              },
            ],
          }),
        }).catch((e) => console.error("Slack webhook failed:", e))
      );
    }

    await Promise.all(promises);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("submit error:", e);
    return NextResponse.json({ error: "Failed to process submission" }, { status: 500 });
  }
}
