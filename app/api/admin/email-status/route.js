import db from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "25", 10);
  const offset = (page - 1) * limit;

  if (!from || !to) {
    return NextResponse.json(
      { error: "Missing 'from' or 'to' query parameters" },
      { status: 400 }
    );
  }

  try {
    // Get paginated records
    const [records] = await db.query(
      `SELECT SQL_CALC_FOUND_ROWS messageId, email, subject, status, link, ip, userAgent, eventTime
       FROM email_events
       WHERE DATE(eventTime) BETWEEN ? AND ?
       ORDER BY eventTime DESC
       LIMIT ? OFFSET ?`,
      [from, to, limit, offset]
    );

    // Get total number of matching rows
    const [totalResult] = await db.query(`SELECT FOUND_ROWS() AS total`);
    const total = totalResult[0].total;

    return NextResponse.json({
      records,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("DB query error:", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
