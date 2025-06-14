import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import db from "@/lib/db";

const CHUNK_SIZE = 1000;

const chunkArray = (arr, size) => {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
};

export async function GET() {
  try {
    const [data] = await db.query("SELECT * FROM emails");

    if (data.length == 0) {
      return NextResponse.json({ message: "no data found" }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.log(err);
    return NextResponse.json(
      { message: "internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "Invalid file" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, {
      type: "buffer",
      dense: true,
    });

    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);

    const seen = new Set();
    const validEmails = [];

    for (const row of rows) {
      const email = (row.email || row.Email || "")
        .toString()
        .trim()
        .toLowerCase();
      if (
        email &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
        !seen.has(email)
      ) {
        seen.add(email);
        validEmails.push(email);
      }
    }

    if (validEmails.length === 0) {
      return NextResponse.json(
        { error: "No valid emails found" },
        { status: 400 }
      );
    }

    // Step 2: Check for duplicates in DB
    const existingEmailsSet = new Set();
    const chunks = chunkArray(validEmails, CHUNK_SIZE);

    for (const chunk of chunks) {
      const placeholders = chunk.map(() => "?").join(",");
      const [rows] = await db.execute(
        `SELECT email FROM emails WHERE email IN (${placeholders})`,
        chunk
      );
      rows.forEach((r) => existingEmailsSet.add(r.email));
    }

    // Step 3: Separate new vs existing emails
    const newEmails = validEmails.filter(
      (email) => !existingEmailsSet.has(email)
    );
    const skippedEmails = validEmails.filter((email) =>
      existingEmailsSet.has(email)
    );

    // If all are duplicates
    if (newEmails.length === 0) {
      const duplicateCount = skippedEmails.length;
      const errorMessage =
        duplicateCount <= 200
          ? `All ${duplicateCount} emails are already subscribed: ${skippedEmails.join(
              ", "
            )}`
          : `All ${duplicateCount} emails are already subscribed.`;

      return NextResponse.json(
        {
          error: errorMessage,
          duplicates: duplicateCount <= 200 ? skippedEmails : undefined,
          duplicateCount,
        },
        { status: 409 }
      );
    }

    // Step 4: Insert only new emails
    for (const chunk of chunkArray(newEmails, CHUNK_SIZE)) {
      const values = chunk.map((email) => [email, 1]);
      await db.query(`INSERT INTO emails (email, subscribe) VALUES ?`, [
        values,
      ]);
    }

    return NextResponse.json({
      success: true,
      totalUploaded: validEmails.length,
      inserted: newEmails.length,
      skipped: skippedEmails.length,
      duplicates: skippedEmails,
    });
  } catch (error) {
    console.error("Excel upload error:", error);
    return NextResponse.json(
      { error: "Upload failed. Please try again later." },
      { status: 500 }
    );
  }
}
