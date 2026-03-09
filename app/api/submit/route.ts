import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    await pool.query(
      `INSERT INTO submissions (
        email, input_path, product_type, industry, buying_department,
        company_size, deal_size, deal_stage, contact_level, deal_summary, results
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        body.email,
        body.input_path,
        body.product_type || null,
        body.industry || null,
        body.buying_department || null,
        body.company_size || null,
        body.deal_size || null,
        body.deal_stage || null,
        body.contact_level || null,
        body.deal_summary || null,
        JSON.stringify(body.results),
      ]
    );

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("submit error:", e);
    return NextResponse.json({ error: "Failed to save submission" }, { status: 500 });
  }
}
