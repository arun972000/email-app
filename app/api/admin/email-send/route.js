import { sendBulkEmails } from "@/lib/awsclient";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const body = await req.json();
    const { subject, message } = body;

    if (!subject || !message) {
      return NextResponse.json({ success: false, error: "Missing fields" }, { status: 400 });
    }

    // 👇 You can replace this with your actual subscriber list
    const recipients = ["arunpandian972000@gmail.com"];

    for (const email of recipients) {
      const encoded = encodeURIComponent(email);
      const html = message
        .replace("{{unsubscribe_link}}", `http://localhost:5000/unsubscribe?email=${encoded}`)
        .replace("{{visible_email}}", email);

      await sendBulkEmails([email], subject, html);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Bulk send failed", err);
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}
