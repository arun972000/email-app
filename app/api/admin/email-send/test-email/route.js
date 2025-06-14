import { sendBulkEmails } from "@/lib/awsclient";
import { NextResponse } from "next/server";

// import db from "@/lib/db"; // COMMENTED OUT FOR TESTING

export async function POST(req) {
  try {
    const body = await req.json();
    const { recipient, subject, message } = body;

    if (!recipient || !subject || !message) {
      return NextResponse.json(
        { success: false, error: "Subject and message are required." },
        { status: 400 }
      );
    }
    
    const result = await sendBulkEmails(recipient, subject, message);

    return NextResponse.json({ success: true, result }, { status: 200 });
  } catch (err) {
    console.error("Email sending error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
