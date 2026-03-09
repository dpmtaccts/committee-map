import { NextRequest, NextResponse } from "next/server";
import PDFDocument from "pdfkit";

const TEAL = "#2A9D8F";
const CHARCOAL = "#383838";
const RISK_RED = "#C4484E";
const GAP_ORANGE = "#C4713B";
const SUBTITLE_GRAY = "#5B6670";
const LIGHT_GRAY = "#888888";

const STATUS_COLORS: Record<string, { color: string; label: string }> = {
  covered: { color: TEAL, label: "Covered" },
  gap: { color: GAP_ORANGE, label: "Gap" },
  risk: { color: RISK_RED, label: "Risk" },
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { result, enrichedResult, inputs } = body;
    const data = enrichedResult || result;

    if (!data?.roles) {
      return NextResponse.json({ error: "Missing result data" }, { status: 400 });
    }

    const isEnriched = !!enrichedResult?.company;
    const company = enrichedResult?.company;
    const companyName = company?.name || null;

    const margin = 60;
    const doc = new PDFDocument({
      size: "LETTER",
      margins: { top: margin, bottom: margin, left: margin, right: margin },
      bufferPages: true,
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    const pdfReady = new Promise<Buffer>((resolve) => {
      doc.on("end", () => resolve(Buffer.concat(chunks)));
    });

    const pageWidth = 612 - margin * 2; // Letter width minus margins
    const pageBottom = 792 - margin; // Letter height minus bottom margin

    // ─── HEADER ───
    // "era." logo left
    doc.fontSize(22).font("Helvetica-Bold");
    doc.fillColor(CHARCOAL).text("era", margin, margin, { continued: true });
    doc.fillColor(TEAL).text(".", { continued: false });

    // "Buying Committee Map" right-aligned
    doc.fontSize(24).font("Helvetica-Bold").fillColor(CHARCOAL);
    doc.text("Buying Committee Map", margin, margin, { width: pageWidth, align: "right" });

    // Teal divider line
    doc.moveDown(0.3);
    const divY = doc.y;
    doc.moveTo(margin, divY).lineTo(margin + pageWidth, divY).strokeColor(TEAL).lineWidth(1).stroke();
    doc.moveDown(0.5);

    // ─── CONTEXT LINE ───
    if (isEnriched && companyName) {
      doc.fontSize(11).font("Helvetica-Bold").fillColor(CHARCOAL);
      doc.text(companyName, { continued: true });
      doc.font("Helvetica").fillColor(LIGHT_GRAY);
      const details: string[] = [];
      if (company.industry) details.push(company.industry);
      if (company.employeeCount) details.push(`${company.employeeCount.toLocaleString()} employees`);
      if (details.length > 0) doc.text(`  —  ${details.join("  ·  ")}`);
      else doc.text("");

      if (enrichedResult?.deal_risk_score != null) {
        const score = enrichedResult.deal_risk_score;
        const scoreColor = score > 70 ? RISK_RED : score > 40 ? GAP_ORANGE : TEAL;
        doc.fontSize(10).font("Helvetica-Bold").fillColor(CHARCOAL);
        doc.text("Deal Risk: ", { continued: true });
        doc.fillColor(scoreColor).text(`${score}/100`);
      }
    } else {
      const summaryLine = inputs?.path === "quick_map"
        ? `${inputs.productType} → ${inputs.industry} → ${inputs.dealSize} deal → ${inputs.dealStage}`
        : data.deal_summary || "Discovery call analysis";
      doc.fontSize(10).font("Helvetica").fillColor(LIGHT_GRAY);
      doc.text(summaryLine);
    }

    doc.moveDown(0.6);

    // ─── ROLE BLOCKS ───
    for (const role of data.roles) {
      if (doc.y > pageBottom - 80) doc.addPage();

      const status = STATUS_COLORS[role.status] || { color: LIGHT_GRAY, label: role.status };

      // Role name + status badge
      doc.fontSize(11).font("Helvetica-Bold").fillColor(CHARCOAL);
      doc.text(role.role, margin, doc.y, { continued: true, width: pageWidth });
      doc.font("Helvetica").fillColor(status.color);
      doc.text(`  [${status.label}]`, { continued: false });

      // Name and title
      const name = role.name || "Unidentified";
      const title = role.title || role.likely_title || "";
      doc.fontSize(9).font("Helvetica").fillColor(CHARCOAL);
      doc.text(`${name}${title ? `  —  ${title}` : ""}`);

      // What they care about
      if (role.what_they_care_about) {
        doc.fontSize(8).font("Helvetica").fillColor(LIGHT_GRAY);
        doc.text("What they care about: ", { continued: true });
        doc.fillColor(CHARCOAL).text(role.what_they_care_about);
      }

      // How they evaluate
      if (role.how_they_evaluate) {
        doc.fontSize(8).font("Helvetica").fillColor(LIGHT_GRAY);
        doc.text("How they evaluate: ", { continued: true });
        doc.fillColor(CHARCOAL).text(role.how_they_evaluate);
      }

      // Ways In (enriched only)
      if (role.waysIn && role.waysIn.length > 0) {
        doc.fontSize(8).font("Helvetica-Bold").fillColor(SUBTITLE_GRAY);
        doc.text("Ways In:");
        for (const way of role.waysIn) {
          if (doc.y > pageBottom - 30) doc.addPage();
          doc.fontSize(8).font("Helvetica").fillColor(CHARCOAL);
          doc.text(`  •  ${way.text}`, { width: pageWidth - 12 });
        }
      }

      // Separator
      doc.moveDown(0.3);
      const sepY = doc.y;
      doc.moveTo(margin, sepY).lineTo(margin + pageWidth, sepY).strokeColor("#E8E7E4").lineWidth(0.5).stroke();
      doc.moveDown(0.4);
    }

    // ─── BIGGEST RISK ───
    if (doc.y > pageBottom - 60) doc.addPage();
    doc.moveDown(0.3);
    doc.fontSize(12).font("Helvetica-Bold").fillColor(RISK_RED);
    doc.text("Your Biggest Risk");
    doc.moveDown(0.2);
    doc.fontSize(9).font("Helvetica").fillColor(CHARCOAL);
    doc.text(data.biggest_risk, { width: pageWidth, lineGap: 2 });

    // ─── NEXT MOVES ───
    if (doc.y > pageBottom - 60) doc.addPage();
    doc.moveDown(0.5);
    doc.fontSize(12).font("Helvetica-Bold").fillColor(CHARCOAL);
    doc.text("Your Next Three Moves");
    doc.moveDown(0.2);

    if (data.next_moves) {
      for (let i = 0; i < data.next_moves.length; i++) {
        if (doc.y > pageBottom - 20) doc.addPage();
        doc.fontSize(9).font("Helvetica-Bold").fillColor(TEAL);
        doc.text(`${i + 1}. `, margin, doc.y, { continued: true });
        doc.font("Helvetica").fillColor(CHARCOAL);
        doc.text(data.next_moves[i], { width: pageWidth - 16, lineGap: 2 });
        doc.moveDown(0.15);
      }
    }

    // ─── PATTERN ───
    if (doc.y > pageBottom - 60) doc.addPage();
    doc.moveDown(0.5);
    doc.fontSize(12).font("Helvetica-Bold").fillColor(SUBTITLE_GRAY);
    doc.text("The Pattern to Watch");
    doc.moveDown(0.2);
    doc.fontSize(9).font("Helvetica").fillColor(CHARCOAL);
    doc.text(data.pattern, { width: pageWidth, lineGap: 2 });

    // ─── FOOTER on every page ───
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      const footerY = 792 - 40;

      doc.moveTo(margin, footerY - 6).lineTo(margin + pageWidth, footerY - 6)
        .strokeColor("#E8E7E4").lineWidth(0.5).stroke();

      doc.fontSize(10).font("Helvetica").fillColor(SUBTITLE_GRAY);
      doc.text("Built by Era | eracx.com", margin, footerY, { width: pageWidth, align: "center" });

      doc.fontSize(8).font("Helvetica").fillColor(LIGHT_GRAY);
      doc.text(
        "All data sourced from public business information. Point-in-time snapshot.",
        margin,
        footerY + 14,
        { width: pageWidth, align: "center" }
      );
    }

    doc.end();
    const pdfBuffer = await pdfReady;

    const filename = companyName
      ? `committee-map-${companyName.toLowerCase().replace(/\s+/g, "-")}.pdf`
      : "committee-map-deal.pdf";

    return new Response(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (e) {
    console.error("generate-pdf error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "PDF generation failed" },
      { status: 500 }
    );
  }
}
